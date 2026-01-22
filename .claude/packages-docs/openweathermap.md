# OpenWeatherMap API

**Version**: API 2.5 (Current/Forecast) | API 3.0 (One Call)
**Official Site**: https://openweathermap.org
**API Documentation**: https://openweathermap.org/api
**Pricing**: https://openweathermap.org/price

**Last Updated**: 2025-12-30
**Compatibility**: Node.js 18+, Express.js 4.x, Axios for HTTP requests

**Current API Key**: `OPENWEATHER_API_KEY` in `.env`
**Free Tier Limits**: 60 calls/min, 1M calls/month (API 2.5) | 1,000 calls/day (One Call 3.0)

---

## Overview

OpenWeatherMap provides comprehensive weather data for any location globally. For TripWiser, it enables:

- **Current weather conditions** for trip destinations
- **Weather forecasts** to help users plan activities
- **Historical weather patterns** (paid tiers only)
- **Air quality data** for health-conscious travelers

### Why We Use It

Trip planning heavily depends on weather. Users need to know:

- What to pack (temperature, precipitation)
- When to visit (seasonal patterns)
- Daily activity planning (hourly forecasts)
- Safety considerations (severe weather alerts)

### Architecture Decision: Frontend vs Backend

**RECOMMENDED APPROACH**: Frontend fetches weather data directly.

**Backend Responsibilities:**

- Store destination coordinates (lat, lon) in Trip/Destination models
- Provide coordinates to frontend via API
- Optionally cache weather data for performance (10-minute TTL)

**Frontend Responsibilities:**

- Fetch current weather when viewing trip details
- Display hourly/daily forecasts
- Handle loading states and errors
- Cache responses client-side

**Why This Approach?**

1. Reduces backend API call usage (free tier limits)
2. Weather data is user-specific and real-time
3. Frontend can refresh weather without backend calls
4. Backend doesn't need to manage weather cache invalidation

---

## Installation

OpenWeatherMap is a REST API - no npm package required. Use `axios` (already in project):

```bash
# Already installed in TripWiser
npm install axios
```

**Configuration:**

Add to `.env`:

```bash
OPENWEATHER_API_KEY=your_api_key_here
```

Get API key from: https://openweathermap.org/appid

---

## Available APIs

### 1. One Call API 3.0 (RECOMMENDED)

**Best for**: Comprehensive weather data in a single call

**Endpoint**:

```
https://api.openweathermap.org/data/3.0/onecall
```

**Features**:

- Current weather
- Minute forecast for 1 hour (precipitation)
- Hourly forecast for 48 hours
- Daily forecast for 8 days
- Government weather alerts
- AI-generated weather summary

**Free Tier**: 1,000 calls/day
**Cost**: $0 for 1,000 calls/day, then pay-per-call

**When to Use**: If you need hourly forecasts and alerts in one request.

---

### 2. Current Weather API 2.5 (FREE)

**Best for**: Real-time weather conditions

**Endpoint**:

```
https://api.openweathermap.org/data/2.5/weather
```

**Features**:

- Current temperature, feels-like temperature
- Weather conditions (clear, rain, snow, etc.)
- Humidity, pressure, visibility
- Wind speed and direction
- Sunrise/sunset times

**Free Tier**: 60 calls/minute, 1,000,000 calls/month
**Cost**: $0

**When to Use**: Simple current weather display, high-volume free tier.

---

### 3. 5-Day Forecast API 2.5 (FREE)

**Best for**: Multi-day forecasts

**Endpoint**:

```
https://api.openweathermap.org/data/2.5/forecast
```

**Features**:

- Weather data every 3 hours for 5 days (40 data points)
- Temperature, precipitation probability
- Weather conditions
- Wind and cloud coverage

**Free Tier**: 60 calls/minute, 1,000,000 calls/month
**Cost**: $0

**When to Use**: Need daily forecasts without hourly detail.

---

## API Parameters

### Required Parameters

| Parameter | Type   | Description             | Example                            |
| --------- | ------ | ----------------------- | ---------------------------------- |
| `lat`     | Float  | Latitude (-90 to 90)    | `40.7128`                          |
| `lon`     | Float  | Longitude (-180 to 180) | `-74.0060`                         |
| `appid`   | String | API key from account    | `95aff695e8a614fa3b287a0b2dd464e5` |

### Optional Parameters

| Parameter | Type    | Values                                 | Default    | Description                                   |
| --------- | ------- | -------------------------------------- | ---------- | --------------------------------------------- |
| `units`   | String  | `standard`, `metric`, `imperial`       | `standard` | Temperature units (Kelvin/Celsius/Fahrenheit) |
| `lang`    | String  | ISO 639-1 codes                        | `en`       | Language for descriptions (50+ languages)     |
| `exclude` | String  | `current,minutely,hourly,daily,alerts` | None       | Parts to exclude (One Call 3.0 only)          |
| `cnt`     | Integer | 1-40                                   | 40         | Number of timestamps (5-Day Forecast only)    |

**Units Conversion**:

- `standard`: Temperature in Kelvin (default)
- `metric`: Temperature in Celsius, wind in m/s
- `imperial`: Temperature in Fahrenheit, wind in mph

---

## Response Formats

### One Call API 3.0 Response

```typescript
interface OneCallResponse {
  lat: number; // Latitude
  lon: number; // Longitude
  timezone: string; // Timezone name (e.g., "America/New_York")
  timezone_offset: number; // UTC offset in seconds
  current: CurrentWeather;
  minutely?: MinutelyForecast[]; // Optional, 1-hour precipitation forecast
  hourly: HourlyForecast[]; // 48 hours
  daily: DailyForecast[]; // 8 days
  alerts?: WeatherAlert[]; // Government weather alerts
}

interface CurrentWeather {
  dt: number; // Unix timestamp (UTC)
  sunrise: number; // Unix timestamp
  sunset: number; // Unix timestamp
  temp: number; // Temperature
  feels_like: number; // Perceived temperature
  pressure: number; // Atmospheric pressure (hPa)
  humidity: number; // Humidity percentage
  dew_point: number; // Dew point temperature
  uvi: number; // UV index
  clouds: number; // Cloudiness percentage
  visibility: number; // Visibility in meters (max 10km)
  wind_speed: number; // Wind speed
  wind_deg: number; // Wind direction (degrees)
  wind_gust?: number; // Wind gust speed
  weather: WeatherCondition[]; // Weather conditions array
  rain?: { "1h": number }; // Rain volume (mm) in last hour
  snow?: { "1h": number }; // Snow volume (mm) in last hour
}

interface WeatherCondition {
  id: number; // Weather condition ID
  main: string; // Group (Rain, Snow, Clouds, Clear, etc.)
  description: string; // Detailed description
  icon: string; // Icon code (e.g., "10d")
}

interface HourlyForecast extends CurrentWeather {
  pop: number; // Probability of precipitation (0-1)
}

interface DailyForecast {
  dt: number; // Unix timestamp (UTC)
  sunrise: number;
  sunset: number;
  moonrise: number;
  moonset: number;
  moon_phase: number; // 0-1 (0/1 = new moon, 0.5 = full moon)
  summary: string; // Human-readable weather summary
  temp: {
    day: number; // Day temperature
    min: number; // Min daily temperature
    max: number; // Max daily temperature
    night: number; // Night temperature
    eve: number; // Evening temperature
    morn: number; // Morning temperature
  };
  feels_like: {
    day: number;
    night: number;
    eve: number;
    morn: number;
  };
  pressure: number;
  humidity: number;
  dew_point: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: WeatherCondition[];
  clouds: number;
  pop: number; // Probability of precipitation
  rain?: number; // Rain volume (mm)
  snow?: number; // Snow volume (mm)
  uvi: number;
}

interface WeatherAlert {
  sender_name: string; // Alert source
  event: string; // Event name
  start: number; // Unix timestamp
  end: number; // Unix timestamp
  description: string; // Alert description
  tags: string[]; // Alert tags
}

interface MinutelyForecast {
  dt: number; // Unix timestamp
  precipitation: number; // Precipitation volume (mm)
}
```

---

### Current Weather API 2.5 Response

```typescript
interface CurrentWeatherResponse {
  coord: {
    lon: number; // Longitude
    lat: number; // Latitude
  };
  weather: WeatherCondition[]; // Weather conditions array
  base: string; // Internal parameter
  main: {
    temp: number; // Temperature
    feels_like: number; // Perceived temperature
    temp_min: number; // Min temperature in city
    temp_max: number; // Max temperature in city
    pressure: number; // Atmospheric pressure (hPa)
    humidity: number; // Humidity percentage
    sea_level?: number; // Sea level pressure (hPa)
    grnd_level?: number; // Ground level pressure (hPa)
  };
  visibility: number; // Visibility in meters (max 10km)
  wind: {
    speed: number; // Wind speed
    deg: number; // Wind direction (degrees)
    gust?: number; // Wind gust speed
  };
  clouds: {
    all: number; // Cloudiness percentage
  };
  rain?: {
    "1h"?: number; // Rain volume (mm) in last 1 hour
    "3h"?: number; // Rain volume (mm) in last 3 hours
  };
  snow?: {
    "1h"?: number; // Snow volume (mm) in last 1 hour
    "3h"?: number; // Snow volume (mm) in last 3 hours
  };
  dt: number; // Unix timestamp (UTC)
  sys: {
    type?: number; // Internal parameter
    id?: number; // Internal parameter
    country: string; // Country code (e.g., "US")
    sunrise: number; // Unix timestamp
    sunset: number; // Unix timestamp
  };
  timezone: number; // UTC offset in seconds
  id: number; // City ID
  name: string; // City name
  cod: number; // HTTP status code (200 = success)
}
```

---

### 5-Day Forecast API 2.5 Response

```typescript
interface FiveDayForecastResponse {
  cod: string; // HTTP status code
  message: number; // Internal parameter
  cnt: number; // Number of timestamps returned
  list: ForecastItem[]; // Forecast data points (40 max)
  city: {
    id: number; // City ID
    name: string; // City name
    coord: {
      lat: number;
      lon: number;
    };
    country: string; // Country code
    population: number; // City population
    timezone: number; // UTC offset in seconds
    sunrise: number; // Unix timestamp
    sunset: number; // Unix timestamp
  };
}

interface ForecastItem {
  dt: number; // Unix timestamp (UTC)
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  weather: WeatherCondition[];
  clouds: {
    all: number; // Cloudiness percentage
  };
  wind: {
    speed: number;
    deg: number;
    gust?: number;
  };
  visibility: number; // Max 10km
  pop: number; // Probability of precipitation (0-1)
  rain?: {
    "3h": number; // Rain volume (mm) in 3-hour period
  };
  snow?: {
    "3h": number; // Snow volume (mm) in 3-hour period
  };
  sys: {
    pod: string; // Part of day (d = day, n = night)
  };
  dt_txt: string; // ISO 8601 timestamp (e.g., "2024-01-15 12:00:00")
}
```

---

## Example API Requests

### One Call API 3.0 (with axios)

```typescript
import axios from "axios";

interface OneCallParams {
  lat: number;
  lon: number;
  units?: "standard" | "metric" | "imperial";
  exclude?: string; // e.g., "minutely,alerts"
}

async function getWeatherOneCall(
  params: OneCallParams,
): Promise<OneCallResponse> {
  const response = await axios.get(
    "https://api.openweathermap.org/data/3.0/onecall",
    {
      params: {
        lat: params.lat,
        lon: params.lon,
        appid: process.env.OPENWEATHER_API_KEY,
        units: params.units || "metric",
        exclude: params.exclude,
      },
    },
  );

  return response.data;
}

// Example usage
const weather = await getWeatherOneCall({
  lat: 40.7128,
  lon: -74.006,
  units: "metric",
  exclude: "minutely,alerts", // Exclude unnecessary data
});

console.log(`Current temp: ${weather.current.temp}°C`);
console.log(`Tomorrow: ${weather.daily[1].temp.day}°C`);
```

---

### Current Weather API 2.5

```typescript
import axios from "axios";

interface CurrentWeatherParams {
  lat: number;
  lon: number;
  units?: "standard" | "metric" | "imperial";
  lang?: string;
}

async function getCurrentWeather(
  params: CurrentWeatherParams,
): Promise<CurrentWeatherResponse> {
  const response = await axios.get(
    "https://api.openweathermap.org/data/2.5/weather",
    {
      params: {
        lat: params.lat,
        lon: params.lon,
        appid: process.env.OPENWEATHER_API_KEY,
        units: params.units || "metric",
        lang: params.lang || "en",
      },
    },
  );

  return response.data;
}

// Example usage
const weather = await getCurrentWeather({
  lat: 48.8566, // Paris
  lon: 2.3522,
  units: "metric",
  lang: "en",
});

console.log(
  `${weather.name}: ${weather.main.temp}°C, ${weather.weather[0].description}`,
);
// Output: "Paris: 18°C, scattered clouds"
```

---

### 5-Day Forecast API 2.5

```typescript
import axios from "axios";

interface ForecastParams {
  lat: number;
  lon: number;
  units?: "standard" | "metric" | "imperial";
  cnt?: number; // Limit number of results (1-40)
}

async function getFiveDayForecast(
  params: ForecastParams,
): Promise<FiveDayForecastResponse> {
  const response = await axios.get(
    "https://api.openweathermap.org/data/2.5/forecast",
    {
      params: {
        lat: params.lat,
        lon: params.lon,
        appid: process.env.OPENWEATHER_API_KEY,
        units: params.units || "metric",
        cnt: params.cnt,
      },
    },
  );

  return response.data;
}

// Example usage
const forecast = await getFiveDayForecast({
  lat: 35.6762, // Tokyo
  lon: 139.6503,
  units: "metric",
  cnt: 8, // Only get next 24 hours (8 x 3-hour intervals)
});

forecast.list.forEach((item) => {
  console.log(
    `${item.dt_txt}: ${item.main.temp}°C, ${item.weather[0].description}`,
  );
});
```

---

## Usage in TripWiser

### Current State: No Direct Usage Yet

OpenWeatherMap is configured in `.env` but not yet integrated into the codebase.

**Environment Variable**:

```bash
OPENWEATHER_API_KEY=95aff695e8a614fa3b287a0b2dd464e5
```

---

### Recommended Integration Architecture

#### Backend Responsibilities

**1. Store Coordinates in Trip/Destination Models**

```typescript
// src/models/Trip.ts (example structure)
interface ITrip extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  destination: {
    name: string; // "Paris, France"
    coordinates: {
      lat: number; // 48.8566
      lon: number; // 2.3522
    };
  };
  startDate: Date;
  endDate: Date;
  // ... other fields
}
```

**2. Provide Coordinates to Frontend**

```typescript
// GET /api/trips/:id response
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Paris Vacation",
    "destination": {
      "name": "Paris, France",
      "coordinates": {
        "lat": 48.8566,
        "lon": 2.3522
      }
    },
    "startDate": "2024-06-01T00:00:00.000Z",
    "endDate": "2024-06-07T00:00:00.000Z"
  }
}
```

**3. Optional: Backend Weather Caching Service (Advanced)**

```typescript
// src/services/weatherService.ts
import axios from "axios";
import { redisClient } from "../config/redis"; // Hypothetical cache

interface WeatherCache {
  coordinates: string; // "lat,lon"
  data: OneCallResponse;
  expiresAt: number;
}

async function getWeatherWithCache(
  lat: number,
  lon: number,
): Promise<OneCallResponse> {
  const cacheKey = `weather:${lat},${lon}`;

  // Check cache (10-minute TTL)
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    const data: WeatherCache = JSON.parse(cached);
    if (Date.now() < data.expiresAt) {
      return data.data;
    }
  }

  // Fetch from API
  const response = await axios.get(
    "https://api.openweathermap.org/data/3.0/onecall",
    {
      params: {
        lat,
        lon,
        appid: process.env.OPENWEATHER_API_KEY,
        units: "metric",
      },
    },
  );

  // Cache for 10 minutes (OpenWeather update frequency)
  await redisClient.set(
    cacheKey,
    JSON.stringify({
      coordinates: `${lat},${lon}`,
      data: response.data,
      expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
    }),
    "EX",
    600, // 10 minutes in seconds
  );

  return response.data;
}
```

---

#### Frontend Responsibilities

**1. Fetch Weather When Displaying Trip**

```typescript
// Frontend: src/services/weatherService.ts
const API_KEY = "your_frontend_api_key"; // Or fetch from backend

async function fetchWeatherForTrip(lat: number, lon: number) {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch weather");
  }

  return response.json();
}

// Usage in component
const trip = await getTripDetails(tripId); // Backend API call
const weather = await fetchWeatherForTrip(
  trip.destination.coordinates.lat,
  trip.destination.coordinates.lon,
);

console.log(`Weather in ${trip.destination.name}: ${weather.main.temp}°C`);
```

**2. Display Current Weather + Forecast**

```typescript
// Fetch both current weather and forecast
const [currentWeather, forecast] = await Promise.all([
  fetchCurrentWeather(lat, lon),
  fetchFiveDayForecast(lat, lon),
]);

// Display in UI
<WeatherCard
  location={trip.destination.name}
  current={currentWeather}
  forecast={forecast}
/>
```

---

### What Backend MUST Store

For weather integration to work, backend MUST store:

**Required Fields**:

1. **Coordinates (lat, lon)** - CRITICAL for API calls
2. **Destination name** - For display purposes

**Optional but Recommended**: 3. **Timezone** - For correct time display (can also get from weather API) 4. **Country code** - For localization

**Example Destination Schema**:

```typescript
destination: {
  name: { type: String, required: true },           // "Paris, France"
  coordinates: {
    lat: { type: Number, required: true },          // 48.8566
    lon: { type: Number, required: true },          // 2.3522
  },
  country: { type: String },                        // "FR"
  timezone: { type: String },                       // "Europe/Paris"
}
```

**How to Get Coordinates**:

- Use Google Places API (already in project: `GOOGLE_PLACES_API_KEY`)
- Store coordinates when user selects destination
- Frontend can use Google Places Autocomplete, send place_id to backend
- Backend fetches place details including coordinates from Google Places API

---

## Rate Limits & Best Practices

### Free Tier Limits

| API                 | Calls/Minute | Calls/Month | Calls/Day |
| ------------------- | ------------ | ----------- | --------- |
| Current Weather 2.5 | 60           | 1,000,000   | ~33,333   |
| 5-Day Forecast 2.5  | 60           | 1,000,000   | ~33,333   |
| One Call 3.0        | N/A          | N/A         | 1,000     |

### Recommendations

**1. Update Frequency**

- OpenWeather model updates every **10 minutes**
- Don't call API more than once per 10 minutes per location
- Implement client-side or server-side caching (10-minute TTL)

**2. Optimize API Calls**

- Use One Call 3.0 if you need current + forecast + alerts (1 call instead of 2-3)
- Use `exclude` parameter to reduce response size
- Frontend should cache weather data, not refetch on every navigation

**3. Error Handling**

```typescript
async function fetchWeatherSafely(lat: number, lon: number) {
  try {
    const response = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      {
        params: {
          lat,
          lon,
          appid: process.env.OPENWEATHER_API_KEY,
          units: "metric",
        },
        timeout: 5000, // 5-second timeout
      },
    );

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new Error("Invalid API key");
      } else if (error.response?.status === 429) {
        throw new Error("Rate limit exceeded. Try again in 1 minute.");
      } else if (error.response?.status === 404) {
        throw new Error("Location not found");
      }
    }

    throw new Error("Failed to fetch weather data");
  }
}
```

**4. Rate Limit Handling**

If you hit the rate limit (429 error):

- Free tier users get email notification, not immediate suspension
- Implement exponential backoff retry logic
- Consider caching aggressively to reduce calls

**5. Cost Optimization**

To stay within free tier:

- Cache weather data (10-minute TTL minimum)
- Frontend fetches directly (reduces backend API usage)
- Use Current Weather + 5-Day Forecast (1M calls/month) instead of One Call 3.0 (1K calls/day) for high traffic
- Batch requests: If multiple users view same destination, cache and share response

---

## Weather Condition Codes

Weather condition IDs returned in `weather[].id`:

| Code Range | Condition                                                         |
| ---------- | ----------------------------------------------------------------- |
| 2xx        | Thunderstorm                                                      |
| 3xx        | Drizzle                                                           |
| 5xx        | Rain                                                              |
| 6xx        | Snow                                                              |
| 7xx        | Atmosphere (fog, haze, etc.)                                      |
| 800        | Clear sky                                                         |
| 80x        | Clouds (801 = few, 802 = scattered, 803 = broken, 804 = overcast) |

**Icon Codes** (`weather[].icon`):

- Format: `{code}{d|n}` (e.g., `10d` = rain day, `10n` = rain night)
- Get icon URL: `https://openweathermap.org/img/wn/{icon}@2x.png`

Example:

```typescript
const iconUrl = `https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`;
```

---

## Error Responses

### Common HTTP Status Codes

| Code | Error             | Description                   | Solution                             |
| ---- | ----------------- | ----------------------------- | ------------------------------------ |
| 400  | Bad Request       | Missing or invalid parameters | Check lat/lon/appid parameters       |
| 401  | Unauthorized      | Invalid or missing API key    | Verify `OPENWEATHER_API_KEY` in .env |
| 404  | Not Found         | Location not found            | Verify coordinates are valid         |
| 429  | Too Many Requests | Rate limit exceeded           | Wait 1 minute or implement caching   |
| 5xx  | Server Error      | OpenWeather service issue     | Retry with exponential backoff       |

### Error Response Format

```json
{
  "cod": "401",
  "message": "Invalid API key. Please see https://openweathermap.org/faq#error401 for more info."
}
```

---

## Migration Notes

### API 2.5 vs API 3.0

**One Call API 2.5** was deprecated in June 2024. Use **One Call API 3.0** instead.

**Key Changes**:

- Endpoint changed: `/data/2.5/onecall` → `/data/3.0/onecall`
- Free tier: 1,000 calls/day (new limit)
- Same response structure (mostly compatible)

**If migrating from 2.5 to 3.0**:

1. Update endpoint URL
2. Verify free tier limit (1K/day) fits your usage
3. No code changes needed (response format unchanged)

---

## Best Practices for TripWiser

### 1. Data Storage

- ✅ Store destination coordinates in Trip/Destination models
- ✅ Validate coordinates (-90 to 90 for lat, -180 to 180 for lon)
- ✅ Store timezone if available (for correct time display)
- ❌ Don't store weather data in database (stale quickly)

### 2. API Calls

- ✅ Frontend fetches weather directly (reduce backend load)
- ✅ Cache responses client-side (10-minute minimum)
- ✅ Use `units=metric` for Celsius (international users)
- ✅ Use `lang` parameter for localization
- ❌ Don't call API on every page load (use cache)
- ❌ Don't call API more than once per 10 minutes per location

### 3. User Experience

- ✅ Show loading state while fetching weather
- ✅ Display weather icon with description
- ✅ Show temperature in user's preferred units (Celsius/Fahrenheit)
- ✅ Highlight severe weather alerts prominently
- ✅ Show hourly forecast for today, daily for rest of trip
- ❌ Don't fail silently (show error message if weather unavailable)

### 4. Performance

- ✅ Fetch weather only when user views trip details
- ✅ Prefetch weather for trips visible on screen (optional)
- ✅ Use `exclude` parameter to reduce response size (One Call 3.0)
- ✅ Implement timeout (5 seconds max)
- ❌ Don't fetch weather for all trips on dashboard load
- ❌ Don't block trip display while waiting for weather

### 5. Error Handling

- ✅ Handle rate limits gracefully (show cached data or "unavailable")
- ✅ Retry on network errors (exponential backoff)
- ✅ Log errors for monitoring
- ✅ Fall back to default message if API fails
- ❌ Don't crash app if weather API is down

---

## Resources

**Official Documentation**:

- Main Docs: https://openweathermap.org/api
- One Call 3.0: https://openweathermap.org/api/one-call-3
- Current Weather: https://openweathermap.org/current
- 5-Day Forecast: https://openweathermap.org/forecast5
- Weather Conditions: https://openweathermap.org/weather-conditions
- API FAQ: https://openweathermap.org/faq

**Tools**:

- API Key Management: https://home.openweathermap.org/api_keys
- Usage Statistics: https://home.openweathermap.org/statistics
- Icon Library: https://openweathermap.org/weather-conditions#Icon-list

**Related APIs**:

- Geocoding API: https://openweathermap.org/api/geocoding-api (convert city names to coordinates)
- Air Pollution API: https://openweathermap.org/api/air-pollution (air quality data)

---

## Notes

### For Backend Developers

- Store destination coordinates when creating trips
- Use Google Places API to get coordinates from place names
- Provide coordinates to frontend in trip response
- Consider implementing weather cache service (Redis) for high traffic
- Monitor API usage to stay within free tier limits

### For Frontend Developers

- Fetch weather data directly from OpenWeatherMap
- Use coordinates provided by backend trip API
- Cache weather responses for 10 minutes minimum
- Handle errors gracefully (network issues, rate limits)
- Show loading states and fallback UI
- Use weather icons from OpenWeatherMap CDN

### Security Considerations

- **Backend**: Store API key in `.env`, never expose in frontend
- **Frontend**: Use a separate API key or proxy through backend
- **Rate Limiting**: Implement client-side rate limiting to prevent abuse
- **Validation**: Validate coordinates before API calls

### Cost Monitoring

- Free tier is generous (1M calls/month for 2.5, 1K/day for 3.0)
- Monitor usage at https://home.openweathermap.org/statistics
- Set up email alerts for approaching limits
- Consider upgrading if traffic exceeds free tier consistently

---

**Last Updated**: 2025-12-30
**Researched By**: Technical Researcher Agent
**API Key Status**: Configured in `.env` ✅
