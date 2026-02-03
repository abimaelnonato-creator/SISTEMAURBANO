import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique protocol number
 * Format: YYYY + 6 random digits
 */
export function generateProtocol(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, '0');
  return `${year}${random}`;
}

/**
 * Generate UUID
 */
export function generateUUID(): string {
  return uuidv4();
}

/**
 * Slugify a string
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Calculate SLA deadline based on days
 */
export function calculateSLADeadline(slaDays: number, createdAt: Date = new Date()): Date {
  const deadline = new Date(createdAt);
  
  // Add business days only (Mon-Fri)
  let daysToAdd = slaDays;
  
  while (daysToAdd > 0) {
    deadline.setDate(deadline.getDate() + 1);
    
    const day = deadline.getDay();
    
    // If it's a weekday (Mon-Fri)
    if (day >= 1 && day <= 5) {
      daysToAdd--;
    }
  }
  
  // Set deadline to end of business day (18:00)
  deadline.setHours(18, 0, 0, 0);
  
  return deadline;
}

/**
 * Check if SLA is expired
 */
export function isSLAExpired(deadline: Date): boolean {
  return new Date() > deadline;
}

/**
 * Calculate hours until SLA deadline
 */
export function hoursUntilSLADeadline(deadline: Date): number {
  const now = new Date();
  const diff = deadline.getTime() - now.getTime();
  return Math.floor(diff / (1000 * 60 * 60));
}

/**
 * Format phone number to standard format
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');
  
  // Add Brazil country code if not present
  if (digits.length === 11) {
    return `+55${digits}`;
  }
  if (digits.length === 13 && digits.startsWith('55')) {
    return `+${digits}`;
  }
  
  return `+${digits}`;
}

/**
 * Validate Brazilian phone number
 */
export function isValidBrazilianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 11 || digits.length === 13;
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: string, visibleChars: number = 4): string {
  if (data.length <= visibleChars) {
    return '*'.repeat(data.length);
  }
  return data.substring(0, visibleChars) + '*'.repeat(data.length - visibleChars);
}

/**
 * Parse coordinates from string
 */
export function parseCoordinates(coordString: string): { lat: number; lng: number } | null {
  // Try to match patterns like "-5.9116, -35.2625" or "-5.9116,-35.2625"
  const regex = /(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/;
  const match = coordString.match(regex);
  
  if (match) {
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    
    // Validate coordinates are within valid range
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }
  
  return null;
}

/**
 * Calculate distance between two points (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in km
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

/**
 * Get date range for queries
 */
export function getDateRange(period: 'today' | 'week' | 'month' | 'year'): {
  start: Date;
  end: Date;
} {
  const now = new Date();
  const start = new Date();
  const end = new Date();

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'week':
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'month':
      start.setMonth(now.getMonth() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
    case 'year':
      start.setFullYear(now.getFullYear() - 1);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      break;
  }

  return { start, end };
}
