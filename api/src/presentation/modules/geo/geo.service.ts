import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';
import { RedisService } from '@/infrastructure/cache/redis.service';

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface HeatmapPoint {
  latitude: number;
  longitude: number;
  weight: number;
}

@Injectable()
export class GeoService {
  private readonly CACHE_TTL = 86400; // 24 hours

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async geocodeAddress(address: string): Promise<GeocodingResult | null> {
    // Check cache first
    const cacheKey = `geocode:${address.toLowerCase().trim()}`;
    const cached = await this.redis.get<GeocodingResult>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Using Nominatim (OpenStreetMap) for geocoding - free and no API key required
      const query = encodeURIComponent(`${address}, Parnamirim, Rio Grande do Norte, Brasil`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&addressdetails=1&limit=1`,
        {
          headers: {
            'User-Agent': 'SistemaGestaoUrbana/1.0',
          },
        },
      );

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        const geocoded: GeocodingResult = {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          formattedAddress: result.display_name,
          neighborhood: result.address?.suburb || result.address?.neighbourhood,
          city: result.address?.city || result.address?.town,
          state: result.address?.state,
        };

        // Cache the result
        await this.redis.set(cacheKey, geocoded, this.CACHE_TTL);

        return geocoded;
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    const cacheKey = `reverse:${latitude.toFixed(6)}:${longitude.toFixed(6)}`;
    const cached = await this.redis.get<GeocodingResult>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'SistemaGestaoUrbana/1.0',
          },
        },
      );

      const data = await response.json();

      if (data && data.address) {
        const geocoded: GeocodingResult = {
          latitude,
          longitude,
          formattedAddress: data.display_name,
          neighborhood: data.address?.suburb || data.address?.neighbourhood,
          city: data.address?.city || data.address?.town,
          state: data.address?.state,
        };

        await this.redis.set(cacheKey, geocoded, this.CACHE_TTL);

        return geocoded;
      }

      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  }

  async getNeighborhoods(): Promise<string[]> {
    const cacheKey = 'neighborhoods:list';
    const cached = await this.redis.get<string[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.prisma.demand.groupBy({
      by: ['neighborhood'],
      where: { neighborhood: { not: null } },
      orderBy: { neighborhood: 'asc' },
    });

    const neighborhoods = result
      .map(r => r.neighborhood)
      .filter((n): n is string => n !== null);

    await this.redis.set(cacheKey, neighborhoods, 3600); // 1 hour

    return neighborhoods;
  }

  async getDemandLocations(filters?: {
    secretaryId?: string;
    categoryId?: string;
    status?: string[];
    startDate?: Date;
    endDate?: Date;
  }) {
    const where: any = {
      latitude: { not: null },
      longitude: { not: null },
    };

    if (filters?.secretaryId) where.secretaryId = filters.secretaryId;
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const demands = await this.prisma.demand.findMany({
      where,
      select: {
        id: true,
        protocol: true,
        title: true,
        status: true,
        priority: true,
        latitude: true,
        longitude: true,
        neighborhood: true,
        address: true,
        category: {
          select: { name: true, color: true },
        },
        secretary: {
          select: { name: true, acronym: true, color: true },
        },
        createdAt: true,
      },
    });

    return demands.map(d => ({
      id: d.id,
      protocol: d.protocol,
      title: d.title,
      status: d.status,
      priority: d.priority,
      position: {
        lat: d.latitude,
        lng: d.longitude,
      },
      neighborhood: d.neighborhood,
      address: d.address,
      category: d.category,
      secretary: d.secretary,
      createdAt: d.createdAt,
    }));
  }

  async getHeatmapData(filters?: {
    secretaryId?: string;
    categoryId?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<HeatmapPoint[]> {
    const where: any = {
      latitude: { not: null },
      longitude: { not: null },
    };

    if (filters?.secretaryId) where.secretaryId = filters.secretaryId;
    if (filters?.categoryId) where.categoryId = filters.categoryId;
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const demands = await this.prisma.demand.findMany({
      where,
      select: {
        latitude: true,
        longitude: true,
        priority: true,
      },
    });

    // Weight by priority
    const priorityWeights: Record<string, number> = {
      LOW: 1,
      MEDIUM: 2,
      HIGH: 3,
      CRITICAL: 5,
    };

    return demands.map(d => ({
      latitude: d.latitude!,
      longitude: d.longitude!,
      weight: priorityWeights[d.priority] || 1,
    }));
  }

  async getClusterData(
    bounds: {
      north: number;
      south: number;
      east: number;
      west: number;
    },
    filters?: {
      secretaryId?: string;
      status?: string[];
    },
  ) {
    const where: any = {
      latitude: {
        gte: bounds.south,
        lte: bounds.north,
      },
      longitude: {
        gte: bounds.west,
        lte: bounds.east,
      },
    };

    if (filters?.secretaryId) where.secretaryId = filters.secretaryId;
    if (filters?.status && filters.status.length > 0) {
      where.status = { in: filters.status };
    }

    const demands = await this.prisma.demand.findMany({
      where,
      select: {
        id: true,
        latitude: true,
        longitude: true,
        status: true,
        priority: true,
        category: {
          select: { color: true },
        },
      },
    });

    return demands.map(d => ({
      id: d.id,
      position: {
        lat: d.latitude,
        lng: d.longitude,
      },
      status: d.status,
      priority: d.priority,
      color: d.category?.color,
    }));
  }

  async getNeighborhoodStats() {
    const stats = await this.prisma.demand.groupBy({
      by: ['neighborhood'],
      where: { neighborhood: { not: null } },
      _count: true,
    });

    const statusByNeighborhood = await Promise.all(
      stats.slice(0, 30).map(async (s) => {
        const statusCounts = await this.prisma.demand.groupBy({
          by: ['status'],
          where: { neighborhood: s.neighborhood },
          _count: true,
        });

        return {
          neighborhood: s.neighborhood,
          total: s._count,
          byStatus: Object.fromEntries(
            statusCounts.map(sc => [sc.status, sc._count]),
          ),
        };
      }),
    );

    return statusByNeighborhood.sort((a, b) => b.total - a.total);
  }

  /**
   * Geocodifica todas as demandas que têm endereço mas não têm coordenadas
   */
  async geocodePendingDemands(): Promise<{ processed: number; success: number; failed: number }> {
    const demands = await this.prisma.demand.findMany({
      where: {
        latitude: null,
        address: { not: null },
      },
      select: {
        id: true,
        address: true,
        neighborhood: true,
      },
    });

    let success = 0;
    let failed = 0;

    for (const demand of demands) {
      try {
        const result = await this.geocodeAddress(demand.address!);
        if (result) {
          await this.prisma.demand.update({
            where: { id: demand.id },
            data: {
              latitude: result.latitude,
              longitude: result.longitude,
              neighborhood: demand.neighborhood || result.neighborhood,
            },
          });
          success++;
          console.log(`✅ Geocodificado: ${demand.address} -> ${result.latitude}, ${result.longitude}`);
        } else {
          failed++;
          console.log(`⚠️ Não encontrado: ${demand.address}`);
        }
        // Rate limiting - 1 request per second for Nominatim
        await new Promise(resolve => setTimeout(resolve, 1100));
      } catch (error) {
        failed++;
        console.error(`❌ Erro: ${demand.address} - ${error.message}`);
      }
    }

    return { processed: demands.length, success, failed };
  }
}
