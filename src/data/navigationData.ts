import { RouteOption, IncidentAlert, POIItem, NavigationTelemetry } from '../types/navigation';

export interface LocationPreset {
  id: string;
  name: string;
  city: string;
  coordinates: [number, number];
  description: string;
}

export const ORIGIN_PRESETS: LocationPreset[] = [
  { id: 'orig_cbd', name: 'Nairobi Central Business District', city: 'Nairobi', coordinates: [-1.286389, 36.817223], description: 'Kenyatta Avenue / Moi Avenue junction' },
  { id: 'orig_jkia', name: 'Jomo Kenyatta International Airport (JKIA)', city: 'Nairobi', coordinates: [-1.3192, 36.9275], description: 'Terminal 1A Arrivals' },
  { id: 'orig_kilimani', name: 'Kilimani / Yaya Centre', city: 'Nairobi', coordinates: [-1.2931, 36.7865], description: 'Argwings Kodhek Road' },
  { id: 'orig_sf', name: 'Market St & 4th (Downtown)', city: 'San Francisco', coordinates: [37.7858, -122.4065], description: 'Powell St Station Transit Hub' },
];

export const DESTINATION_PRESETS: LocationPreset[] = [
  { id: 'dest_westlands', name: 'Westlands Commercial Hub', city: 'Nairobi', coordinates: [-1.2683, 36.8111], description: 'Waiyaki Way / Sarit Centre' },
  { id: 'dest_gigiri', name: 'UN Headquarters / Gigiri', city: 'Nairobi', coordinates: [-1.2335, 36.8142], description: 'United Nations Avenue' },
  { id: 'dest_gardencity', name: 'Garden City Mall & Tech Hub', city: 'Nairobi', coordinates: [-1.2297, 36.8833], description: 'Thika Superhighway Exit 7' },
  { id: 'dest_sf_presidio', name: 'Presidio & Golden Gate Bridge', city: 'San Francisco', coordinates: [37.7989, -122.4662], description: 'Main Post / Scenic Viewpoint' },
];

export const MOCK_ROUTES: RouteOption[] = [
  {
    id: 'route_drive_fastest',
    mode: 'drive',
    title: 'Via Expressway & Waiyaki Way',
    via: 'Nairobi Expressway + Museum Hill Flyover',
    durationMinutes: 16,
    distanceKm: 9.4,
    costKes: 260,
    co2Grams: 1420,
    trafficLevel: 'low',
    color: '#0284c7', // Sky-600
    aiRecommendationReason: 'AI Recommended: Bypasses 18-minute gridlock at University Way roundabout. Weather radar indicates clear skies on this elevated flyover.',
    segments: [
      { instruction: 'Depart Kenyatta Avenue towards Expressway entrance', distance: '0.8 km', duration: '2 min', mode: 'drive', icon: 'corner-up-right' },
      { instruction: 'Merge onto Nairobi Expressway (Electronic Toll tag active)', distance: '6.2 km', duration: '8 min', mode: 'drive', icon: 'arrow-up' },
      { instruction: 'Take Exit 4 towards Westlands / Museum Hill', distance: '1.4 km', duration: '3 min', mode: 'drive', icon: 'corner-up-right' },
      { instruction: 'Arrive at Westlands Commercial Centre on the right', distance: '1.0 km', duration: '3 min', mode: 'drive', icon: 'map-pin' },
    ]
  },
  {
    id: 'route_transit_multimodal',
    mode: 'transit',
    title: 'Metro Commuter Train + Express Bus',
    via: 'CBD Central Station -> Westlands Bus Rapidway',
    durationMinutes: 28,
    distanceKm: 8.8,
    costKes: 80,
    co2Grams: 310,
    trafficLevel: 'low',
    color: '#16a34a', // Emerald-600
    aiRecommendationReason: 'Lowest Carbon Footprint (-78% CO2) and zero risk from sudden surface traffic spikes. Scheduled train departs in 4 minutes.',
    transitLines: ['Commuter Line 2', 'Westlands Metro BRT 4A'],
    segments: [
      { instruction: 'Walk to Nairobi Central Station (Platform 2)', distance: '350 m', duration: '4 min', mode: 'transit', icon: 'footprints' },
      { instruction: 'Board Commuter Line 2 towards Westlands Terminus', distance: '6.5 km', duration: '14 min', mode: 'transit', icon: 'train' },
      { instruction: 'Transfer at Westlands Interchange to Bus Rapidway 4A', distance: '120 m', duration: '2 min', mode: 'transit', icon: 'bus' },
      { instruction: 'Short 2-minute walk to destination entrance', distance: '180 m', duration: '2 min', mode: 'transit', icon: 'map-pin' },
    ]
  },
  {
    id: 'route_ride_hail_comparison',
    mode: 'ride_hail',
    title: 'WAYNO Green EV Ride-Hailing',
    via: 'Direct Point-to-Point (Driver Evans - 3 min away)',
    durationMinutes: 19,
    distanceKm: 9.6,
    costKes: 520,
    co2Grams: 0,
    trafficLevel: 'moderate',
    color: '#0f172a', // Slate-900
    aiRecommendationReason: 'Zero-emission electric vehicle fleet. Guaranteed fixed upfront fare with no surge pricing. Driver is turning onto your corner.',
    rideHailDetails: {
      provider: 'WAYNO Green',
      driverEtaMinutes: 3,
      surgeMultiplier: 1.0,
    },
    segments: [
      { instruction: 'Driver Evans arriving in Toyota bZ4X (Plate KDF 412X)', distance: '0 m', duration: '3 min wait', mode: 'ride_hail', icon: 'car' },
      { instruction: 'In-vehicle transit via Ring Road Parklands', distance: '9.6 km', duration: '16 min', mode: 'ride_hail', icon: 'shield-check' },
      { instruction: 'Drop-off directly at main lobby reception', distance: '0 m', duration: '0 min', mode: 'ride_hail', icon: 'check-circle' },
    ]
  },
  {
    id: 'route_bike_micromobility',
    mode: 'bike',
    title: 'Protected Cycle Lane & Micro-mobility',
    via: 'Uhuru Park Green Greenway & Ring Road Cycle Path',
    durationMinutes: 24,
    distanceKm: 7.6,
    costKes: 120,
    co2Grams: 0,
    trafficLevel: 'low',
    color: '#eab308', // Yellow-500
    aiRecommendationReason: 'Fastest during peak rush hour (avoids 100% of motor vehicle congestion). Continuous protected bike lane with zero car conflict zones.',
    segments: [
      { instruction: 'Unlock e-Bike at CBD Hub Dock #14', distance: '50 m', duration: '1 min', mode: 'bike', icon: 'bike' },
      { instruction: 'Follow Uhuru Park segregated cycle track north', distance: '4.2 km', duration: '12 min', mode: 'bike', icon: 'navigation' },
      { instruction: 'Continue on Parklands dedicated bike avenue', distance: '3.1 km', duration: '10 min', mode: 'bike', icon: 'arrow-up' },
      { instruction: 'Dock at Westlands Station Rack #03', distance: '100 m', duration: '1 min', mode: 'bike', icon: 'lock' },
    ]
  }
];

export const MOCK_INCIDENTS: IncidentAlert[] = [
  {
    id: 'inc_01',
    type: 'traffic',
    title: 'Stalled Freight Truck Blocking 2 Lanes',
    location: 'Uhuru Highway near Nyayo Stadium Roundabout',
    impact: '+18 min delay',
    delayMinutes: 18,
    coordinates: [-1.2991, 36.8231],
    timestamp: '2 mins ago'
  },
  {
    id: 'inc_02',
    type: 'weather',
    title: 'Local Rainstorm & Reduced Road Grip',
    location: 'Southern Bypass Corridor',
    impact: 'Speed limit advisory 60 km/h',
    delayMinutes: 6,
    coordinates: [-1.3412, 36.7821],
    timestamp: '7 mins ago'
  },
  {
    id: 'inc_03',
    type: 'hazard',
    title: 'Road Surface Resurfacing & Cones',
    location: 'Forest Road Eastbound',
    impact: 'Single lane merge ahead',
    delayMinutes: 4,
    coordinates: [-1.2694, 36.8312],
    timestamp: '14 mins ago'
  },
  {
    id: 'inc_04',
    type: 'police',
    title: 'Speed Camera & Traffic Safety Checkpoint',
    location: 'Waiyaki Way Outer Lanes',
    impact: 'Strict 50 km/h enforcement',
    delayMinutes: 2,
    coordinates: [-1.2625, 36.7981],
    timestamp: '21 mins ago'
  }
];

export const MOCK_POIS: POIItem[] = [
  {
    id: 'poi_01',
    name: 'Java House Rooftop Barista & Lounge',
    category: 'restaurant',
    rating: 4.8,
    reviewCount: 382,
    address: 'Mpaka Road, Westlands',
    distanceKm: 0.4,
    detourMinutes: 2,
    coordinates: [-1.2642, 36.8091],
    tags: ['Fast WiFi', 'Underground Parking', 'Outdoor Seating', 'Specialty Coffee']
  },
  {
    id: 'poi_02',
    name: 'TotalEnergies 150kW Ultra-Fast EV Charger',
    category: 'charging',
    rating: 4.9,
    reviewCount: 147,
    address: 'Limuru Road Interchange',
    distanceKm: 0.9,
    detourMinutes: 3,
    coordinates: [-1.2581, 36.8194],
    tags: ['CCS2 / CHAdeMO', '3 Available Plugs', 'Coffee Shop on-site']
  },
  {
    id: 'poi_03',
    name: 'Villa Rosa Kempinski Luxury Hotel',
    category: 'hotel',
    rating: 4.7,
    reviewCount: 890,
    address: 'Chiromo Road, Westlands',
    distanceKm: 0.6,
    detourMinutes: 1,
    coordinates: [-1.2711, 36.8085],
    tags: ['Valet Parking', 'Concierge Desk', 'Conference Rooms']
  },
  {
    id: 'poi_04',
    name: 'Westlands Central Multimodal Transit Terminal',
    category: 'transit_hub',
    rating: 4.6,
    reviewCount: 512,
    address: 'Ring Road Parklands',
    distanceKm: 0.3,
    detourMinutes: 0,
    coordinates: [-1.2655, 36.8062],
    tags: ['Metro Train', 'Electric Bus Charging', 'Bike Lockers', 'ATM']
  }
];

export const INITIAL_TELEMETRY: NavigationTelemetry = {
  currentSpeedKmh: 48,
  speedLimitKmh: 60,
  altitudeM: 1684,
  gpsAccuracyM: 1.4,
  satellitesLocked: 14,
  currentStreet: 'Nairobi Expressway (Elevated Section)',
  nextManeuver: {
    action: 'In 650 meters, take Exit 4 towards Westlands / Museum Hill',
    distanceM: 650,
    icon: 'corner-up-right'
  },
  estimatedTimeArrival: '14:28',
  remainingDistanceKm: 4.2,
  remainingMinutes: 7
};
