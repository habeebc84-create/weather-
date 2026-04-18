export interface Location {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  timezone: string;
}

export interface WeatherData {
  current: {
    time: string;
    temperature2m: number;
    apparentTemperature: number;
    relativeHumidity2m: number;
    precipitation: number;
    weatherCode: number;
    cloudCover: number;
    pressureMsl: number;
    surfacePressure: number;
    windSpeed10m: number;
    windDirection10m: number;
    windGusts10m: number;
    isDay: number;
  };
  daily: {
    time: string[];
    weatherCode: number[];
    temperature2mMax: number[];
    temperature2mMin: number[];
    sunrise: string[];
    sunset: string[];
    uvIndexMax: number[];
    precipitationProbabilityMax: number[];
  };
  hourly: {
    time: string[];
    temperature2m: number[];
    weatherCode: number[];
  };
  airQuality?: {
    current: {
      usAqi: number;
      uvIndex: number;
      pm10: number;
      pm2_5: number;
    };
  };
}

// Map WMO weather codes to conditions and icons
export const weatherCodeMap: Record<number, { label: string, icon: string, mood: string }> = {
  0: { label: 'Clear sky', icon: 'Sun', mood: 'sunny' },
  1: { label: 'Mainly clear', icon: 'CloudSun', mood: 'sunny' },
  2: { label: 'Partly cloudy', icon: 'CloudSun', mood: 'cloudy' },
  3: { label: 'Overcast', icon: 'Cloud', mood: 'cloudy' },
  45: { label: 'Fog', icon: 'CloudFog', mood: 'fog' },
  48: { label: 'Depositing rime fog', icon: 'CloudFog', mood: 'fog' },
  51: { label: 'Light drizzle', icon: 'CloudRain', mood: 'rain' },
  53: { label: 'Moderate drizzle', icon: 'CloudRain', mood: 'rain' },
  55: { label: 'Dense drizzle', icon: 'CloudRain', mood: 'rain' },
  61: { label: 'Slight rain', icon: 'CloudRain', mood: 'rain' },
  63: { label: 'Moderate rain', icon: 'CloudRain', mood: 'rain' },
  65: { label: 'Heavy rain', icon: 'CloudRain', mood: 'rain' },
  71: { label: 'Slight snow', icon: 'CloudSnow', mood: 'snow' },
  73: { label: 'Moderate snow', icon: 'CloudSnow', mood: 'snow' },
  75: { label: 'Heavy snow', icon: 'CloudSnow', mood: 'snow' },
  77: { label: 'Snow grains', icon: 'CloudSnow', mood: 'snow' },
  80: { label: 'Slight rain showers', icon: 'CloudRain', mood: 'rain' },
  81: { label: 'Moderate rain showers', icon: 'CloudRain', mood: 'rain' },
  82: { label: 'Violent rain showers', icon: 'CloudRain', mood: 'storm' },
  85: { label: 'Slight snow showers', icon: 'CloudSnow', mood: 'snow' },
  86: { label: 'Heavy snow showers', icon: 'CloudSnow', mood: 'snow' },
  95: { label: 'Thunderstorm', icon: 'CloudLightning', mood: 'storm' },
  96: { label: 'Thunderstorm with slight hail', icon: 'CloudLightning', mood: 'storm' },
  99: { label: 'Thunderstorm with heavy hail', icon: 'CloudLightning', mood: 'storm' },
};

export async function searchCities(query: string): Promise<Location[]> {
  if (!query || query.length < 2) return [];
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
  const data = await response.json();
  return (data.results as Location[]) || [];
}

export async function getWeatherData(lat: number, lon: number, timezone = 'auto'): Promise<WeatherData> {
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max&timezone=${timezone}&past_days=1`;
  const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,uv_index,pm10,pm2_5&timezone=${timezone}`;

  const [weatherRes, aqRes] = await Promise.all([
    fetch(weatherUrl),
    fetch(aqUrl).catch(() => null), // Air quality might not be available everywhere, catch silently
  ]);

  if (!weatherRes.ok) {
    throw new Error('Failed to fetch weather data');
  }

  const weatherJson = await weatherRes.json();
  let aqJson = null;

  if (aqRes && aqRes.ok) {
    aqJson = await aqRes.json();
  }

  return {
    current: {
      time: weatherJson.current.time,
      temperature2m: weatherJson.current.temperature_2m,
      apparentTemperature: weatherJson.current.apparent_temperature,
      relativeHumidity2m: weatherJson.current.relative_humidity_2m,
      precipitation: weatherJson.current.precipitation,
      weatherCode: weatherJson.current.weather_code,
      cloudCover: weatherJson.current.cloud_cover,
      pressureMsl: weatherJson.current.pressure_msl,
      surfacePressure: weatherJson.current.surface_pressure,
      windSpeed10m: weatherJson.current.wind_speed_10m,
      windDirection10m: weatherJson.current.wind_direction_10m,
      windGusts10m: weatherJson.current.wind_gusts_10m,
      isDay: weatherJson.current.is_day,
    },
    daily: {
      time: weatherJson.daily.time,
      weatherCode: weatherJson.daily.weather_code,
      temperature2mMax: weatherJson.daily.temperature_2m_max,
      temperature2mMin: weatherJson.daily.temperature_2m_min,
      sunrise: weatherJson.daily.sunrise,
      sunset: weatherJson.daily.sunset,
      uvIndexMax: weatherJson.daily.uv_index_max,
      precipitationProbabilityMax: weatherJson.daily.precipitation_probability_max,
    },
    hourly: {
      time: weatherJson.hourly.time,
      temperature2m: weatherJson.hourly.temperature_2m,
      weatherCode: weatherJson.hourly.weather_code,
    },
    airQuality: aqJson ? {
      current: {
        usAqi: aqJson.current.us_aqi,
        uvIndex: aqJson.current.uv_index,
        pm10: aqJson.current.pm10,
        pm2_5: aqJson.current.pm2_5,
      }
    } : undefined
  };
}

export function windDirectionToText(degrees: number): string {
  const val = Math.floor((degrees / 22.5) + 0.5);
  const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return arr[(val % 16)];
}

export function getDewPoint(temp: number, humidity: number): number {
  const a = 17.27;
  const b = 237.7;
  const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100.0);
  return (b * alpha) / (a - alpha);
}

export interface WeatherAlert {
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export function generateAlerts(weather: WeatherData): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const current = weather.current;

  if (current.windSpeed10m > 50) {
    alerts.push({
      title: 'High Wind Warning',
      severity: 'high',
      description: `Winds blowing at ${current.windSpeed10m} km/h. Secure loose objects and use caution if driving.`
    });
  } else if (current.windSpeed10m > 30) {
    alerts.push({
      title: 'Wind Advisory',
      severity: 'medium',
      description: `Gusty winds up to ${Math.round(current.windGusts10m)} km/h expected.`
    });
  }

  if (current.temperature2m > 35) {
    alerts.push({
      title: 'Extreme Heat Warning',
      severity: 'critical',
      description: `Temperatures reaching ${current.temperature2m}°C. Stay hydrated and avoid prolonged sun exposure.`
    });
  } else if (current.temperature2m > 30) {
    alerts.push({
      title: 'Heat Advisory',
      severity: 'medium',
      description: `High temperatures up to ${current.temperature2m}°C. Take cooling breaks.`
    });
  }

  if (current.temperature2m < -10) {
    alerts.push({
      title: 'Extreme Cold Warning',
      severity: 'critical',
      description: `Dangerously cold temperatures at ${current.temperature2m}°C. Risk of frostbite.`
    });
  }

  if (current.weatherCode === 95 || current.weatherCode === 96 || current.weatherCode === 99) {
    alerts.push({
      title: 'Severe Thunderstorm',
      severity: 'high',
      description: 'Thunderstorms detected in the area. Seek shelter indoors.'
    });
  } else if (current.weatherCode === 65 || current.weatherCode === 82) {
    alerts.push({
      title: 'Heavy Rain Warning',
      severity: 'high',
      description: 'Heavy rainfall in progress. Potential for localized flash flooding.'
    });
  }

  if (current.weatherCode === 75 || current.weatherCode === 86 || current.weatherCode === 77) {
    alerts.push({
      title: 'Heavy Snow Warning',
      severity: 'high',
      description: 'Heavy snowfall occurring. Travel conditions may become hazardous.'
    });
  }

  if (current.weatherCode === 45 || current.weatherCode === 48) {
    alerts.push({
      title: 'Dense Fog Advisory',
      severity: 'medium',
      description: 'Visibility is significantly reduced due to dense fog. Drive with caution.'
    });
  }

  return alerts;
}
