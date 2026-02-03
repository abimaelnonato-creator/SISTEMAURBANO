import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { GeoService } from './geo.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { IsNumber, IsString, IsOptional, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';

class GeocodeDto {
  @IsString()
  address: string;
}

class ReverseGeocodeDto {
  @IsNumber()
  @Type(() => Number)
  latitude: number;

  @IsNumber()
  @Type(() => Number)
  longitude: number;
}

class MapBoundsDto {
  @IsNumber()
  @Type(() => Number)
  north: number;

  @IsNumber()
  @Type(() => Number)
  south: number;

  @IsNumber()
  @Type(() => Number)
  east: number;

  @IsNumber()
  @Type(() => Number)
  west: number;

  @IsOptional()
  @IsString()
  secretaryId?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  status?: string[];
}

class LocationFiltersDto {
  @IsOptional()
  @IsString()
  secretaryId?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  status?: string[];

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

@ApiTags('Geolocalização')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('geo')
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Post('geocode')
  @ApiOperation({ summary: 'Converter endereço em coordenadas' })
  @ApiResponse({ status: 200, description: 'Coordenadas retornadas com sucesso' })
  geocode(@Body() geocodeDto: GeocodeDto) {
    return this.geoService.geocodeAddress(geocodeDto.address);
  }

  @Get('reverse')
  @ApiOperation({ summary: 'Converter coordenadas em endereço' })
  @ApiResponse({ status: 200, description: 'Endereço retornado com sucesso' })
  @ApiQuery({ name: 'latitude', type: Number })
  @ApiQuery({ name: 'longitude', type: Number })
  reverseGeocode(@Query() query: ReverseGeocodeDto) {
    return this.geoService.reverseGeocode(query.latitude, query.longitude);
  }

  @Get('neighborhoods')
  @Public()
  @ApiOperation({ summary: 'Listar bairros' })
  @ApiResponse({ status: 200, description: 'Lista de bairros retornada' })
  getNeighborhoods() {
    return this.geoService.getNeighborhoods();
  }

  @Get('neighborhoods/stats')
  @ApiOperation({ summary: 'Estatísticas por bairro' })
  @ApiResponse({ status: 200, description: 'Estatísticas retornadas' })
  getNeighborhoodStats() {
    return this.geoService.getNeighborhoodStats();
  }

  @Get('locations')
  @ApiOperation({ summary: 'Obter localizações de demandas para o mapa' })
  @ApiResponse({ status: 200, description: 'Localizações retornadas' })
  getDemandLocations(@Query() filters: LocationFiltersDto) {
    return this.geoService.getDemandLocations({
      secretaryId: filters.secretaryId,
      categoryId: filters.categoryId,
      status: filters.status,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    });
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Dados para mapa de calor' })
  @ApiResponse({ status: 200, description: 'Dados do heatmap retornados' })
  getHeatmapData(@Query() filters: LocationFiltersDto) {
    return this.geoService.getHeatmapData({
      secretaryId: filters.secretaryId,
      categoryId: filters.categoryId,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    });
  }

  @Get('clusters')
  @ApiOperation({ summary: 'Dados para clusters no mapa' })
  @ApiResponse({ status: 200, description: 'Dados de clusters retornados' })
  getClusterData(@Query() bounds: MapBoundsDto) {
    return this.geoService.getClusterData(
      {
        north: bounds.north,
        south: bounds.south,
        east: bounds.east,
        west: bounds.west,
      },
      {
        secretaryId: bounds.secretaryId,
        status: bounds.status,
      },
    );
  }

  @Post('geocode-pending')
  @ApiOperation({ summary: 'Geocodificar todas as demandas pendentes (sem coordenadas)' })
  @ApiResponse({ status: 200, description: 'Demandas geocodificadas com sucesso' })
  async geocodePendingDemands() {
    return this.geoService.geocodePendingDemands();
  }
}
