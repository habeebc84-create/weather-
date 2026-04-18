import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Location, WeatherData, getWeatherData } from '../services/weatherService';

interface WeatherState {
  currentLocation: Location | null;
  weatherData: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  favorites: Location[];
  compareCities: Location[];
  
  setLocation: (location: Location) => Promise<void>;
  addFavorite: (location: Location) => void;
  removeFavorite: (id: number) => void;
  addCompareCity: (location: Location) => void;
  removeCompareCity: (id: number) => void;
  refreshWeather: () => Promise<void>;
  setLoading: (loading: boolean) => void;
}

export const useWeatherStore = create<WeatherState>()(
  persist(
    (set, get) => ({
      currentLocation: null,
      weatherData: null,
      isLoading: false,
      error: null,
      favorites: [],
      compareCities: [],

      setLocation: async (location: Location) => {
        set({ currentLocation: location, isLoading: true, error: null });
        try {
          const data = await getWeatherData(location.latitude, location.longitude, location.timezone);
          set({ weatherData: data, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to fetch weather data', isLoading: false });
        }
      },

      refreshWeather: async () => {
        const { currentLocation } = get();
        if (currentLocation) {
          set({ isLoading: true, error: null });
          try {
            const data = await getWeatherData(currentLocation.latitude, currentLocation.longitude, currentLocation.timezone);
            set({ weatherData: data, isLoading: false });
          } catch (error) {
            set({ error: 'Failed to refresh weather data', isLoading: false });
          }
        }
      },

      addFavorite: (location: Location) => {
        const { favorites } = get();
        if (!favorites.find((fav) => fav.id === location.id)) {
          // Keep max 8 favorites
          const newFavorites = [location, ...favorites].slice(0, 8);
          set({ favorites: newFavorites });
        }
      },

      removeFavorite: (id: number) => {
        set({ favorites: get().favorites.filter((fav) => fav.id !== id) });
      },

      addCompareCity: (location: Location) => {
        const { compareCities } = get();
        if (!compareCities.find((city) => city.id === location.id)) {
          const newCompare = [location, ...compareCities].slice(0, 3);
          set({ compareCities: newCompare });
        }
      },

      removeCompareCity: (id: number) => {
        set({ compareCities: get().compareCities.filter((city) => city.id !== id) });
      },

      setLoading: (loading: boolean) => set({ isLoading: loading }),
    }),
    {
      name: 'weather-storage',
      partialize: (state) => ({ favorites: state.favorites, currentLocation: state.currentLocation, compareCities: state.compareCities }),
    }
  )
);
