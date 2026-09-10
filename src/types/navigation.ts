export type UserPersona = 'commuter' | 'traveler' | 'driver' | 'rider';
export type DeviceType = 'mobile' | 'web_pwa' | 'voice' | 'wearable';
export type TravelMode = 'drive' | 'transit' | 'ride_hail' | 'bike';

export interface RouteOption {
  id: string;
  mode: TravelMode;
  title: string;
  via: string;
  durationMinutes: number;
  distanceKm: number;
  costKes: number;
  co2Grams: number;
  trafficLevel: 'low' | 'moderate' | 'heavy';
  color: string;
  aiRecommendationReason: string;
  segments: {
    instruction: string;
    distance: string;
    duration: string;
    mode: TravelMode;
    icon: string;
  }[];
  rideHailDetails?: {
    provider: 'UberX' | 'WAYNO Green' | 'Bolt';
    driverEtaMinutes: number;
    surgeMultiplier: number;
  };
  transitLines?: string[];
}

export interface IncidentAlert {
  id: string;
  type: 'traffic' | 'weather' | 'hazard' | 'police';
  title: string;
  location: string;
  impact: string;
  delayMinutes: number;
  coordinates: [number, number];
  timestamp: string;
}

export interface POIItem {
  id: string;
  name: string;
  category: 'restaurant' | 'hotel' | 'charging' | 'transit_hub' | 'event';
  rating: number;
  reviewCount: number;
  address: string;
  distanceKm: number;
  detourMinutes: number;
  coordinates: [number, number];
  tags: string[];
}

export interface NavigationTelemetry {
  currentSpeedKmh: number;
  speedLimitKmh: number;
  altitudeM: number;
  gpsAccuracyM: number;
  satellitesLocked: number;
  currentStreet: string;
  nextManeuver: {
    action: string;
    distanceM: number;
    icon: string;
  };
  estimatedTimeArrival: string;
  remainingDistanceKm: number;
  remainingMinutes: number;
}
