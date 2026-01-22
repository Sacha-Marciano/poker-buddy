# LocationIQ API

**Service**: Location Services (Geocoding, Autocomplete, Reverse Geocoding)
**Website**: https://locationiq.com
**Documentation**: https://docs.locationiq.com/
**API Reference**: https://api-reference.locationiq.com/

**Last Updated**: 2025-12-30
**Compatibility**: Node.js 18+, TypeScript 5.x, Express.js 4.x

---

## Overview

LocationIQ is a geocoding and location services API built on OpenStreetMap data. It provides:

1. **Autocomplete API** - Predictive place search as users type
2. **Search API (Forward Geocoding)** - Convert addresses to coordinates
3. **Reverse Geocoding API** - Convert coordinates to addresses

**Why We Use It:**

- Free tier with 5,000 requests/day (commercial use allowed with attribution)
- Permissive data storage terms
- OpenStreetMap-based (no vendor lock-in)
- Comprehensive global coverage
- Compatible with Nominatim API format

---

## Installation

LocationIQ is a REST API - no package installation required. Just use `fetch`, `axios`, or native HTTP clients.

```bash
# Optional: Install axios for easier HTTP requests
npm install axios

# Types for axios
npm install -D @types/axios
```

**Environment Variable:**

```bash
LOCATIONIQ_API_KEY=your_access_token_here
```

---

## Rate Limits & Pricing

### Free Tier

- **Requests**: 5,000 per day
- **Rate Limit**: 2 requests per second
- **Commercial Use**: Allowed with attribution link to LocationIQ
- **Caching**: Up to 48 hours

### Paid Plans

- **Starting at**: $49/month (10,000 requests/day, ~$0.16/1000 requests)
- **Rate Limit**: 15-20 requests per second
- **Caching**: Unlimited while subscribed
- **Soft Limits**: Allow up to 100% overage for spikes (then 429 error)

### Caching Policy

**Important Distinction:**

- **Storage**: Storing API output permanently is ALLOWED
- **Caching**: Storing request-response pairs to avoid hitting API

**Allowed:**

- ✅ Store coordinates, place names, addresses in database forever
- ✅ Cache for 48 hours (free) or unlimited (paid)
- ✅ Use stored data for displaying trip locations

**Not Allowed:**

- ❌ Server-side caching of map tiles

**Source**: [LocationIQ Caching Policy](https://help.locationiq.com/support/solutions/articles/36000216111-can-i-save-addresses-from-api-output-)

---

## API Endpoints

### 1. Autocomplete API

**Purpose**: Predictive place search for typeahead/autocomplete functionality

**Endpoint:**

```
GET https://api.locationiq.com/v1/autocomplete
```

**Use Case**: Real-time place suggestions as users type location names

**Key Differences from Search API:**

- Optimized for partial/incomplete queries
- Returns only relevant suggestions (not all matches)
- Supports single language code only
- Not compatible with Search API format

#### Request Parameters

**Required:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | string | Your API access token |
| `q` | string | Search query (max 200 characters) |

**Optional:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Number of results (1-20) |
| `countrycodes` | string | - | Comma-separated country codes (e.g., "us,ca,mx") |
| `normalizecity` | 0\|1 | 0 | Normalize city field when absent (uses fallback hierarchy) |
| `accept-language` | string | en | 2-letter language code (en, es, fr, de, etc.) |
| `viewbox` | string | - | Preferred search area: `minLon,minLat,maxLon,maxLat` |
| `bounded` | 0\|1 | 0 | Restrict results to viewbox only |
| `tag` | string | - | Filter by OSM class:type (e.g., "place:city", "tourism:attraction") |

#### Response Schema

```typescript
interface AutocompleteResult {
  place_id: string; // LocationIQ unique identifier
  osm_id: string; // OpenStreetMap ID
  osm_type: string; // OSM type: "node", "way", "relation"
  licence: string; // Attribution URL
  lat: string; // Latitude (string format)
  lon: string; // Longitude (string format)
  boundingbox: [string, string, string, string]; // [minLat, maxLat, minLon, maxLon]
  class: string; // OSM class (e.g., "tourism", "place", "amenity")
  type: string; // OSM type (e.g., "attraction", "city", "restaurant")
  display_name: string; // Full address with place name
  display_place: string; // Place name only
  display_address: string; // Address without place name
  address: {
    name?: string; // Place/building name
    house_number?: string; // Street number
    road?: string; // Street name
    neighbourhood?: string; // Neighbourhood
    suburb?: string; // Suburb
    city?: string; // City
    county?: string; // County
    state?: string; // State/province
    postcode?: string; // Postal code
    country?: string; // Country name
    country_code?: string; // ISO country code
  };
  importance?: number; // Relevance score (0-1)
  icon?: string; // URL to map icon
}

type AutocompleteResponse = AutocompleteResult[];
```

#### Example Request

```typescript
import axios from "axios";

const searchPlace = async (query: string, limit: number = 5) => {
  const response = await axios.get(
    "https://api.locationiq.com/v1/autocomplete",
    {
      params: {
        key: process.env.LOCATIONIQ_API_KEY,
        q: query,
        limit: limit,
        format: "json",
        normalizecity: 1,
      },
    },
  );

  return response.data;
};

// Usage
const results = await searchPlace("Empire State");
```

#### Example Response

```json
[
  {
    "place_id": "0",
    "osm_id": "34633854",
    "osm_type": "way",
    "licence": "https://locationiq.com/attribution",
    "lat": "40.7484284",
    "lon": "-73.985654619873",
    "boundingbox": ["40.7479226", "40.7489422", "-73.9864855", "-73.9848259"],
    "class": "tourism",
    "type": "attraction",
    "display_name": "Empire State Building, 350, 5th Avenue, New York City, New York, 10018, United States of America",
    "display_place": "Empire State Building",
    "display_address": "350, 5th Avenue, New York City, New York, 10018, United States of America",
    "address": {
      "name": "Empire State Building",
      "house_number": "350",
      "road": "5th Avenue",
      "city": "New York City",
      "state": "New York",
      "postcode": "10018",
      "country": "United States of America"
    }
  }
]
```

**Source**: [Autocomplete API Documentation](https://docs.locationiq.com/docs/autocomplete)

---

### 2. Search API (Forward Geocoding)

**Purpose**: Convert addresses or place names to geographic coordinates

**Endpoint:**

```
GET https://us1.locationiq.com/v1/search
GET https://eu1.locationiq.com/v1/search (Europe region)
```

**Use Case**: When you have a complete address and need coordinates for mapping

#### Request Parameters

**Required:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | string | Your API access token |
| `q` | string | Address or place name to geocode |
| `format` | string | Response format: "json" or "xml" (use "json") |

**Optional:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 10 | Maximum results to return |
| `addressdetails` | 0\|1 | 0 | Include structured address breakdown |
| `namedetails` | 0\|1 | 0 | Include alternative names |
| `countrycodes` | string | - | Limit to specific countries |
| `viewbox` | string | - | Preferred search area |
| `bounded` | 0\|1 | 0 | Restrict to viewbox |

#### Response Schema

```typescript
interface SearchResult {
  place_id: string;
  licence: string;
  osm_type: string; // "node", "way", "relation"
  osm_id: string;
  boundingbox: [string, string, string, string];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
  address?: {
    // Only if addressdetails=1
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

type SearchResponse = SearchResult[];
```

#### Example Request

```typescript
const geocodeAddress = async (address: string) => {
  const response = await axios.get("https://us1.locationiq.com/v1/search", {
    params: {
      key: process.env.LOCATIONIQ_API_KEY,
      q: address,
      format: "json",
      addressdetails: 1,
      limit: 1,
    },
  });

  return response.data[0]; // Return first result
};

// Usage
const location = await geocodeAddress(
  "1600 Amphitheatre Parkway, Mountain View, CA",
);
console.log(location.lat, location.lon);
```

**Compatibility Note**: This API is compatible with OpenStreetMap's Nominatim format, making migration easy.

**Source**: [Search/Forward Geocoding Documentation](https://docs.locationiq.com/docs/search-forward-geocoding)

---

### 3. Reverse Geocoding API

**Purpose**: Convert coordinates to human-readable addresses

**Endpoint:**

```
GET https://us1.locationiq.com/v1/reverse
```

**Use Case**: Getting address from GPS coordinates, map clicks, or stored lat/lon

#### Request Parameters

**Required:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `key` | string | Your API access token |
| `lat` | number | Latitude (-90 to 90) |
| `lon` | number | Longitude (-180 to 180) |
| `format` | string | Response format: "json" or "xml" |

**Optional:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `addressdetails` | 0\|1 | 1 | Include address component breakdown |
| `namedetails` | 0\|1 | 0 | Include alternative names |
| `statecode` | 0\|1 | 0 | Add state/province code (USA, Canada, Australia) |
| `showdistance` | 0\|1 | 0 | Return distance in meters from input |
| `postaladdress` | 0\|1 | 0 | Country-specific formatted address (Germany) |
| `accept-language` | string | en | Language preference (comma-separated list) |

#### Response Schema

```typescript
interface ReverseGeocodeResult {
  place_id: string;
  licence: string;
  osm_type: string;
  osm_id: string;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    state_code?: string; // Only if statecode=1
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox: [string, string, string, string];
  distance?: string; // Only if showdistance=1 (meters)
}
```

#### Example Request

```typescript
const reverseGeocode = async (lat: number, lon: number) => {
  const response = await axios.get("https://us1.locationiq.com/v1/reverse", {
    params: {
      key: process.env.LOCATIONIQ_API_KEY,
      lat: lat,
      lon: lon,
      format: "json",
      addressdetails: 1,
    },
  });

  return response.data;
};

// Usage
const address = await reverseGeocode(40.7484284, -73.9856546);
console.log(address.display_name);
```

**Source**: [Reverse Geocoding Documentation](https://docs.locationiq.com/docs/reverse-geocoding)

---

## Backend Storage Recommendations

### Minimal Storage Strategy (Recommended)

**For Trip Locations, Store:**

```typescript
interface TripLocation {
  // MUST store (immutable identifiers)
  placeId: string; // LocationIQ place_id
  osmId: string; // OpenStreetMap ID
  osmType: string; // "node", "way", "relation"

  // MUST store (coordinates)
  latitude: number; // Parsed from lat string
  longitude: number; // Parsed from lon string

  // MUST store (display)
  displayName: string; // Full formatted address

  // RECOMMENDED (map viewport)
  boundingBox?: {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  };

  // OPTIONAL (structured address - only if needed for filtering/search)
  city?: string;
  state?: string;
  country?: string;
  countryCode?: string;

  // OPTIONAL (OSM classification)
  class?: string; // "tourism", "place", "amenity"
  type?: string; // "attraction", "city", "restaurant"

  // METADATA
  createdAt: Date; // When stored
  updatedAt: Date; // Last verified/updated
}
```

**Rationale:**

1. **Permanent Storage Allowed**: LocationIQ permits storing API output indefinitely
2. **Immutable Data**: Coordinates and OSM IDs don't change
3. **Reduced API Calls**: Display name sufficient for most UI needs
4. **Fetch On-Demand**: Full address details can be fetched when needed (e.g., trip detail view)
5. **Caching Strategy**: Cache full autocomplete responses for 48 hours in Redis/memory

### What NOT to Store

**Don't Store:**

- ❌ Full autocomplete response arrays (cache these temporarily)
- ❌ `importance` scores (ephemeral, changes with algorithm updates)
- ❌ `icon` URLs (may change or expire)
- ❌ `licence` field (static, reference from docs)
- ❌ Excessive address components you won't use

### Caching Strategy

**Autocomplete Responses:**

```typescript
// Redis or in-memory cache (48 hours for free tier)
const cacheKey = `locationiq:autocomplete:${query}:${limit}`;
const ttl = 48 * 60 * 60; // 48 hours in seconds

// Check cache first
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// Fetch from API
const results = await fetchAutocomplete(query, limit);

// Cache response
await redis.setex(cacheKey, ttl, JSON.stringify(results));
return results;
```

**Stored Locations:**

```typescript
// MongoDB model for trip locations
const locationSchema = new Schema(
  {
    placeId: { type: String, required: true, unique: true, index: true },
    osmId: { type: String, required: true },
    osmType: {
      type: String,
      required: true,
      enum: ["node", "way", "relation"],
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    displayName: { type: String, required: true },
    boundingBox: {
      minLat: Number,
      maxLat: Number,
      minLon: Number,
      maxLon: Number,
    },
    city: String,
    state: String,
    country: String,
    countryCode: String,
    class: String,
    type: String,
  },
  { timestamps: true },
);
```

---

## Usage in TripWiser Backend

### Use Case 1: Trip Destination Autocomplete

**Scenario**: User types "Paris" when creating a trip

```typescript
// Service: src/services/locationService.ts
import axios from "axios";

export class LocationService {
  private apiKey: string;
  private baseUrl = "https://api.locationiq.com/v1";

  constructor() {
    this.apiKey = process.env.LOCATIONIQ_API_KEY!;
  }

  async autocomplete(
    query: string,
    limit: number = 5,
  ): Promise<AutocompleteResult[]> {
    const response = await axios.get(`${this.baseUrl}/autocomplete`, {
      params: {
        key: this.apiKey,
        q: query,
        limit: limit,
        format: "json",
        normalizecity: 1,
        // Optionally filter to cities only
        tag: "place:city",
      },
    });

    return response.data;
  }
}
```

**Controller Usage:**

```typescript
// Controller: src/controllers/tripController.ts
const locationService = new LocationService();

router.get("/api/trips/locations/search", async (req, res) => {
  const { q, limit = 5 } = req.query;

  if (!q || typeof q !== "string") {
    return res.status(400).json({ error: "Query parameter required" });
  }

  const results = await locationService.autocomplete(q, Number(limit));

  res.json({
    success: true,
    data: results.map((r) => ({
      placeId: r.place_id,
      displayName: r.display_name,
      displayPlace: r.display_place,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      city: r.address?.city,
      country: r.address?.country,
    })),
  });
});
```

### Use Case 2: Store Selected Location

**Scenario**: User selects "Paris, France" from autocomplete results

```typescript
// Model: src/models/Trip.ts
import { Schema, model, Document } from "mongoose";

interface ITripLocation {
  placeId: string;
  osmId: string;
  osmType: string;
  latitude: number;
  longitude: number;
  displayName: string;
  city?: string;
  country?: string;
  countryCode?: string;
}

interface ITrip extends Document {
  userId: string;
  title: string;
  destination: ITripLocation;
  startDate: Date;
  endDate: Date;
}

const tripLocationSchema = new Schema(
  {
    placeId: { type: String, required: true },
    osmId: { type: String, required: true },
    osmType: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    displayName: { type: String, required: true },
    city: String,
    country: String,
    countryCode: String,
  },
  { _id: false },
);

const tripSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    destination: { type: tripLocationSchema, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
  },
  { timestamps: true },
);

export const Trip = model<ITrip>("Trip", tripSchema);
```

**Controller:**

```typescript
router.post("/api/trips", authMiddleware, async (req, res) => {
  const { title, destination, startDate, endDate } = req.body;

  const trip = new Trip({
    userId: req.user!.firebaseUid,
    title,
    destination: {
      placeId: destination.placeId,
      osmId: destination.osmId,
      osmType: destination.osmType,
      latitude: destination.lat,
      longitude: destination.lon,
      displayName: destination.displayName,
      city: destination.city,
      country: destination.country,
      countryCode: destination.countryCode,
    },
    startDate: new Date(startDate),
    endDate: new Date(endDate),
  });

  await trip.save();

  res.json({ success: true, data: trip });
});
```

### Use Case 3: Reverse Geocode User's Current Location

**Scenario**: Get address from GPS coordinates

```typescript
// Service method
async reverseGeocode(lat: number, lon: number): Promise<ReverseGeocodeResult> {
  const response = await axios.get(`${this.baseUrl}/reverse`, {
    params: {
      key: this.apiKey,
      lat: lat,
      lon: lon,
      format: 'json',
      addressdetails: 1,
    },
  });

  return response.data;
}

// Controller usage
router.post('/api/trips/location/reverse', authMiddleware, async (req, res) => {
  const { lat, lon } = req.body;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Latitude and longitude required' });
  }

  const location = await locationService.reverseGeocode(
    parseFloat(lat),
    parseFloat(lon)
  );

  res.json({
    success: true,
    data: {
      displayName: location.display_name,
      city: location.address.city,
      state: location.address.state,
      country: location.address.country,
    },
  });
});
```

---

## Error Handling

### Common Error Responses

**400 Bad Request** - Invalid parameters

```json
{
  "error": "Invalid key"
}
```

**401 Unauthorized** - Invalid or missing API key

```json
{
  "error": "Invalid API key"
}
```

**429 Rate Limited** - Exceeded rate limit

```json
{
  "error": "Rate Limited Day"
}
```

**500 Internal Server Error** - LocationIQ service issue

### Error Handling Pattern

```typescript
import axios, { AxiosError } from 'axios';

class LocationIQError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'LocationIQError';
  }
}

async autocomplete(query: string): Promise<AutocompleteResult[]> {
  try {
    const response = await axios.get(`${this.baseUrl}/autocomplete`, {
      params: { key: this.apiKey, q: query, format: 'json' },
    });

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      if (axiosError.response?.status === 429) {
        throw new LocationIQError(
          'LocationIQ rate limit exceeded',
          429,
          error
        );
      }

      if (axiosError.response?.status === 401) {
        throw new LocationIQError(
          'Invalid LocationIQ API key',
          401,
          error
        );
      }

      throw new LocationIQError(
        'LocationIQ API error',
        axiosError.response?.status,
        error
      );
    }

    throw new LocationIQError('Unknown error calling LocationIQ', undefined, error);
  }
}
```

---

## Best Practices

### 1. Use Autocomplete for User Input, Search for Exact Addresses

- **Autocomplete**: User typing "Eiffel T..." → suggest "Eiffel Tower"
- **Search**: You have "1600 Pennsylvania Ave NW, Washington DC" → get coordinates

### 2. Implement Caching to Reduce API Calls

```typescript
// Use Redis or in-memory cache for autocomplete results
// Free tier: 48-hour cache
// Paid tier: Cache while subscribed
```

### 3. Store Minimal Data, Fetch Full Details On-Demand

```typescript
// Store in database:
- placeId, lat, lon, displayName

// Fetch from API when needed:
- Full address components
- Alternative names
- Additional metadata
```

### 4. Filter Autocomplete by Country or Type

```typescript
// For US-only app
params: {
  countrycodes: 'us',
  tag: 'place:city', // Only cities
}
```

### 5. Handle Multiple Results Appropriately

```typescript
// Autocomplete returns array - present all to user
// Search can return multiple matches - use first or let user choose
```

### 6. Add Debouncing for Autocomplete

```typescript
// Frontend should debounce (300-500ms) before sending request
// Reduces API calls and improves UX
```

### 7. Secure Your API Key

```typescript
// NEVER expose API key in frontend code
// Always call LocationIQ from backend
// Use environment variables
// Consider IP restrictions for server-side usage
```

### 8. Respect Attribution Requirements (Free Tier)

If using free tier, add attribution link:

```html
<!-- In your app -->
<a href="https://locationiq.com">Powered by LocationIQ</a>
```

### 9. Monitor Rate Limits

```typescript
// Track API usage
// Implement exponential backoff for 429 errors
// Consider upgrading if consistently hitting limits
```

### 10. Parse Coordinates as Numbers

```typescript
// API returns strings - convert to numbers for database
const lat = parseFloat(result.lat);
const lon = parseFloat(result.lon);
```

---

## TypeScript Types Reference

```typescript
// Autocomplete
interface AutocompleteResult {
  place_id: string;
  osm_id: string;
  osm_type: "node" | "way" | "relation";
  licence: string;
  lat: string;
  lon: string;
  boundingbox: [string, string, string, string];
  class: string;
  type: string;
  display_name: string;
  display_place: string;
  display_address: string;
  address: {
    name?: string;
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  importance?: number;
  icon?: string;
}

// Search/Forward Geocoding
interface SearchResult {
  place_id: string;
  licence: string;
  osm_type: "node" | "way" | "relation";
  osm_id: string;
  boundingbox: [string, string, string, string];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

// Reverse Geocoding
interface ReverseGeocodeResult {
  place_id: string;
  licence: string;
  osm_type: "node" | "way" | "relation";
  osm_id: string;
  lat: string;
  lon: string;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    county?: string;
    state?: string;
    state_code?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox: [string, string, string, string];
  distance?: string;
}

// Request parameters
interface AutocompleteParams {
  key: string;
  q: string;
  limit?: number;
  countrycodes?: string;
  normalizecity?: 0 | 1;
  "accept-language"?: string;
  viewbox?: string;
  bounded?: 0 | 1;
  tag?: string;
}

interface SearchParams {
  key: string;
  q: string;
  format: "json" | "xml";
  limit?: number;
  addressdetails?: 0 | 1;
  namedetails?: 0 | 1;
  countrycodes?: string;
  viewbox?: string;
  bounded?: 0 | 1;
}

interface ReverseGeocodeParams {
  key: string;
  lat: number;
  lon: number;
  format: "json" | "xml";
  addressdetails?: 0 | 1;
  namedetails?: 0 | 1;
  statecode?: 0 | 1;
  showdistance?: 0 | 1;
  postaladdress?: 0 | 1;
  "accept-language"?: string;
}
```

---

## Resources

### Official Documentation

- **Main Website**: [LocationIQ](https://locationiq.com)
- **Documentation**: [LocationIQ Docs](https://docs.locationiq.com/)
- **API Reference**: [API Reference](https://api-reference.locationiq.com/)
- **Pricing**: [Pricing Plans](https://locationiq.com/pricing)
- **Caching Policy**: [Can I Save Addresses?](https://help.locationiq.com/support/solutions/articles/36000216111-can-i-save-addresses-from-api-output-)

### API Endpoints Documentation

- **Autocomplete**: [Autocomplete API](https://docs.locationiq.com/docs/autocomplete)
- **Search/Forward Geocoding**: [Search API](https://docs.locationiq.com/docs/search-forward-geocoding)
- **Reverse Geocoding**: [Reverse API](https://docs.locationiq.com/docs/reverse-geocoding)

### Tools

- **Autocomplete Sandbox**: [Test Autocomplete](https://us1.locationiq.com/sandbox/geocoding/autocomplete)
- **API Playground**: [Interactive API Testing](https://locationiq.com/sandbox)

### Related Services

- **OpenStreetMap**: [OSM](https://www.openstreetmap.org) - Underlying data source
- **Nominatim**: [Nominatim](https://nominatim.org) - Compatible API format

---

## Notes

### Why LocationIQ for TripWiser?

1. **Cost-Effective**: Free tier sufficient for development/MVP (5,000 req/day)
2. **Permissive Storage**: Can store location data permanently in database
3. **Flexible Caching**: 48-hour cache on free tier, unlimited on paid
4. **No Vendor Lock-in**: OpenStreetMap-based data, compatible with Nominatim
5. **Global Coverage**: Worldwide location data
6. **Commercial Use Allowed**: Free tier permits commercial use with attribution

### Gotchas

1. **String Coordinates**: API returns `lat` and `lon` as strings - convert to numbers for storage
2. **Single Language for Autocomplete**: Unlike Search API, Autocomplete only accepts single language code
3. **Rate Limiting**: Free tier limited to 2 req/sec - implement request queuing if needed
4. **Attribution Required**: Free tier requires link to LocationIQ in your app
5. **Multiple Results**: Always handle array responses (even Search can return multiple matches)
6. **OSM Data Updates**: Location data based on OpenStreetMap - quality varies by region

### Migration Considerations

If migrating from Google Places/Maps:

- LocationIQ uses different place identifiers (OSM IDs vs Google Place IDs)
- Address format differs slightly
- No guaranteed consistency in address components across all locations
- Quality depends on OpenStreetMap data completeness in that region

### Alternative APIs

If LocationIQ doesn't meet needs:

- **Nominatim**: Self-hosted OSM geocoding (free, unlimited)
- **Mapbox Geocoding**: Similar pricing, different data source
- **Google Geocoding**: More expensive, higher quality in some regions
- **HERE Geocoding**: Enterprise-focused

---

## Version History

**2025-12-30**: Initial documentation created

- Documented all 3 API endpoints (Autocomplete, Search, Reverse)
- Added TypeScript types and interfaces
- Included backend storage recommendations
- Documented rate limits, pricing, and caching policies
- Added TripWiser-specific usage examples
