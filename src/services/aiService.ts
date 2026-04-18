import { GoogleGenAI } from "@google/genai";
import { Location, WeatherData, weatherCodeMap } from "./weatherService";

// Initialize the Google Gen AI client with the key injected by Vite
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface DailyInsight {
  summary: string;
  bestOutdoorHours: string;
  outfitSuggestion: string;
  error?: string;
}

export interface PlaceRecommendation {
  placeName: string;
  placeType: string;
  bestTime: string;
  reason: string;
  score: number;
  tags: string[];
}

export interface PlacesResult {
  places: PlaceRecommendation[] | null;
  error?: string;
}

// Simple Cache implementation
const CACHE_PREFIX = "lumina_ai_cache_";
const CACHE_TTL = 3600 * 1000; // 1 hour

function getCache(key: string) {
  const cached = localStorage.getItem(CACHE_PREFIX + key);
  if (!cached) return null;
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_TTL) {
    localStorage.removeItem(CACHE_PREFIX + key);
    return null;
  }
  return data;
}

function setCache(key: string, data: any) {
  localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ data, timestamp: Date.now() }));
}

function isQuotaError(error: any) {
  const msg = error?.message || error?.toString() || "";
  return msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("quota");
}

export async function generateWeatherInsights(location: Location, weather: WeatherData): Promise<DailyInsight | null> {
  const cacheKey = `insight_${location.id}_${new Date().getHours()}_${weather.current.weatherCode}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const prompt = `Analyze this weather data for ${location.name}.
Current temp: ${weather.current.temperature2m}°C, Apparent: ${weather.current.apparentTemperature}°C
Condition: ${weatherCodeMap[weather.current.weatherCode]?.label || 'Unknown'}
Wind: ${weather.current.windSpeed10m}km/h
Date/Time: ${new Date().toLocaleString()}

Return a JSON object with:
1. "summary": A concise AI-style summary exactly like "Warm and breezy today, best outdoor time is early evening".
2. "bestOutdoorHours": The best block of hours today for outdoor activities.
3. "outfitSuggestion": A short outfit recommendation with emojis.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text) as DailyInsight;
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("AI Insight Error:", error);
    if (isQuotaError(error)) {
      return { 
        summary: "AI quota momentarily reached. Please check back in a few minutes.", 
        bestOutdoorHours: "Data available with limited AI analysis.", 
        outfitSuggestion: "Standard seasonal wear recommended.",
        error: "QUOTA_EXCEEDED"
      };
    }
    return null;
  }
}

export async function generatePlacesToVisit(location: Location, weather: WeatherData): Promise<PlacesResult> {
  const cacheKey = `places_${location.id}_${new Date().getHours()}_${weather.current.weatherCode}`;
  const cached = getCache(cacheKey);
  if (cached) return { places: cached };

  try {
    const prompt = `Act as an expert local travel concierge.
Suggest 3 highly specific types of places to visit right now in or around ${location.name} considering:
Local time: ${new Date().toLocaleString()}
Weather: ${weather.current.temperature2m}°C, ${weatherCodeMap[weather.current.weatherCode]?.label || 'Unknown'}

Rules:
1. Suggest precise categories or known spots if possible (e.g., "Rooftop cafes", "Indoor art museums", "Sunset promenades").
2. Return JSON as: { "places": [{ "placeName", "placeType", "bestTime", "reason", "score" (0-100), "tags": ["", ""] }] }
3. Tailor it exactly to the current weather condition (e.g., if raining, suggest indoors).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const parsed = JSON.parse(response.text);
    const places = parsed.places as PlaceRecommendation[];
    setCache(cacheKey, places);
    return { places };
  } catch (error) {
    console.error("Places AI Error:", error);
    if (isQuotaError(error)) {
      return { places: null, error: "QUOTA_EXCEEDED" };
    }
    return { places: null };
  }
}

