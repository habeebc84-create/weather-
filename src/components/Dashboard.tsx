import React, { useEffect, useState } from 'react';
import { useWeatherStore } from '../store/useWeatherStore';
import { SearchComponent } from './SearchComponent';
import WeatherScene from './WeatherScene';
import { Canvas } from '@react-three/fiber';
import { GlassCard, Metric, SectionLabel } from './ui/GlassCard';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { weatherCodeMap, windDirectionToText, getDewPoint, generateAlerts, WeatherAlert } from '../services/weatherService';
import { Wind, Droplets, Sun, Moon, Cloud, Gauge, Eye, ThermometerSun, AlertTriangle, Sparkles, MapPin, Map, ArrowUp, ArrowDown, Loader2, Star, StarOff, Volume2, VolumeX, GitCompare, RefreshCw, Sunrise, Sunset } from 'lucide-react';
import { generateWeatherInsights, generatePlacesToVisit, DailyInsight, PlaceRecommendation } from '../services/aiService';
import { ambientAudio } from '../services/audioService';
import { CompareCard } from './CompareCard';

export default function Dashboard() {
  const { currentLocation, weatherData, isLoading, error, setLocation, favorites, addFavorite, removeFavorite, compareCities, addCompareCity, removeCompareCity, refreshWeather } = useWeatherStore();
  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [places, setPlaces] = useState<PlaceRecommendation[] | null>(null);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<WeatherAlert[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMuted, setIsMuted] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Set default location to New York if empty
  useEffect(() => {
    if (!currentLocation) {
      setLocation({
        id: 5128581,
        name: "New York",
        latitude: 40.71427,
        longitude: -74.00597,
        country: "United States",
        admin1: "New York",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York"
      });
    }
  }, [currentLocation, setLocation]);

  useEffect(() => {
    if (currentLocation && weatherData) {
      setPlacesError(null);
      setAlerts(generateAlerts(weatherData));
      generateWeatherInsights(currentLocation, weatherData).then(setInsight);
      generatePlacesToVisit(currentLocation, weatherData).then(res => {
        setPlaces(res.places);
        if (res.error) setPlacesError(res.error);
      });
    }
  }, [currentLocation, weatherData]);

  if (!currentLocation || !weatherData) {
    return (
      <div className="min-h-screen bg-[#05060f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
      </div>
    );
  }

  const current = weatherData.current;
  const today = weatherData.daily;
  let moodInfo = weatherCodeMap[current.weatherCode] || weatherCodeMap[0];
  if (current.windSpeed10m > 30 && (moodInfo.mood === 'sunny' || moodInfo.mood === 'cloudy')) {
    moodInfo = { ...moodInfo, mood: 'wind' };
  }
  const isDay = current.isDay;

  useEffect(() => {
    if (!isMuted) {
      ambientAudio.playWeather(moodInfo.mood);
    }
    return () => ambientAudio.stop();
  }, [moodInfo.mood, isMuted]);

  const isFavorite = favorites.some((f) => f.id === currentLocation.id);

  const toggleFavorite = () => {
    if (isFavorite) {
      removeFavorite(currentLocation.id);
    } else {
      addFavorite(currentLocation);
    }
  };

  return (
    <div className={`relative min-h-screen bg-[#05060f] text-white overflow-hidden bg-[radial-gradient(circle_at_50%_100%,#1a1a4a_0%,#05060f_70%)]`}>
      <div className="z-10 relative grid grid-cols-1 md:grid-cols-[260px_1fr] lg:grid-cols-[260px_1fr_280px] lg:grid-rows-[80px_1fr_180px] h-screen p-[20px] gap-[20px]">
        
        {/* Header */}
        <header className="lg:col-span-3 md:col-span-2 flex flex-col md:flex-row justify-between items-center border-b border-white/[0.12] pb-[10px] gap-4">
          <div className="text-[24px] font-[800] tracking-[4px] uppercase bg-gradient-to-tr from-white to-[#4a90e2] bg-clip-text text-transparent">LUMINA</div>
          <div className="w-[400px] max-w-full">
            <SearchComponent />
          </div>
          <div className="hidden md:flex text-right flex-col items-end gap-1">
             <div className="flex items-center gap-3">
               <button 
                 onClick={() => setIsMuted(!isMuted)} 
                 className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-white/70 hover:text-white"
                 title={isMuted ? "Unmute aesthetic ambient sounds" : "Mute audio"}
               >
                 {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
               </button>
               <div className="text-[18px] font-[600]">{format(currentTime, 'HH:mm')}</div>
             </div>
             <div className="text-[12px] text-white/50">{format(currentTime, 'EEEE, dd MMMM')}</div>
          </div>
        </header>

        {/* Sidebar Left */}
        <aside className="flex flex-col gap-[20px] overflow-y-auto no-scrollbar pb-10 lg:pb-0">
           {alerts.length > 0 && (
             <GlassCard className="border-[#ef4444]/30 bg-[#ef4444]/10 flex flex-col gap-2">
               <SectionLabel className="text-[#ef4444] flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4" /> Active Alerts</SectionLabel>
               {alerts.map((alert, i) => (
                 <div key={i} className="text-[12px] bg-black/20 rounded-md p-2 border border-[#ef4444]/20">
                   <strong className="block text-[#fca5a5] mb-1">{alert.title}</strong>
                   <span className="opacity-80 text-white/90 leading-tight block">{alert.description}</span>
                 </div>
               ))}
             </GlassCard>
           )}

           {/* Insights */}
           <GlassCard>
             <SectionLabel>Atmosphere</SectionLabel>
             {insight ? (
               <div className="bg-[#4a90e2]/10 border border-[#4a90e2]/40 rounded-[15px] p-[12px] text-[13px] italic text-[#a0c4ff]">
                 “{insight.summary}”
               </div>
             ) : (
               <div className="animate-pulse bg-white/5 border border-white/10 rounded-[15px] p-[12px] space-y-2">
                 <div className="h-2 bg-white/10 rounded w-full"></div>
                 <div className="h-2 bg-white/10 rounded w-5/6"></div>
                 <div className="text-[10px] text-[#4a90e2]/70 mt-2 flex items-center justify-center gap-2">
                    <Loader2 className="w-3 h-3 animate-spin"/> Synthesizing local vibes...
                 </div>
               </div>
             )}
           </GlassCard>

           {/* Favorites */}
           <GlassCard>
             <SectionLabel>Saved Locations</SectionLabel>
             {favorites.length === 0 && <div className="text-[14px] opacity-80 text-center py-2">No saved locations</div>}
             {favorites.map((fav) => (
                <div key={fav.id} className="flex justify-between items-center mb-[12px] last:mb-0 cursor-pointer hover:text-[#4a90e2] transition-colors" onClick={() => setLocation(fav)}>
                  <h4 className="text-[14px] font-[500]">{fav.name}</h4>
                  <span className="text-[14px] opacity-80">
                    {/* Approximation: If same location, show temp, else just placeholder or missing */}
                    {fav.id === currentLocation.id ? `${Math.round(current.temperature2m)}°C` : fav.country}
                  </span>
                </div>
             ))}
           </GlassCard>

           {/* Plan Your Day */}
           <GlassCard className="flex-1">
             <SectionLabel>Plan Your Day</SectionLabel>
             {insight ? (
                <div className="text-[12px] leading-[1.6]">
                  {insight.bestOutdoorHours} <br/><br/>
                  {insight.outfitSuggestion}
                </div>
             ) : (
                <div className="animate-pulse space-y-3 mt-2">
                  <div className="h-3 bg-white/10 rounded w-3/4"></div>
                  <div className="h-3 bg-white/10 rounded w-1/2"></div>
                </div>
             )}
           </GlassCard>
        </aside>

        {/* Center / Hero */}
        <main className="flex flex-col items-center justify-center relative h-full min-h-[400px]">
           {/* Geometric Atmosphere Glow & Globe underlying structure */}
           <div className="absolute w-[450px] h-[450px] rounded-[50%] bg-[radial-gradient(circle_at_30%_30%,#2a3a7a_0%,#0a0a20_60%)] shadow-[inset_-20px_-20px_50px_rgba(0,0,0,0.8),0_0_80px_rgba(74,144,226,0.2)] z-[-1] opacity-80 scale-75 md:scale-100"></div>
           <div className="absolute w-[480px] h-[480px] rounded-[50%] border border-[#4a90e2]/30 shadow-[0_0_40px_rgba(74,144,226,0.1)] z-[-2] scale-75 md:scale-100"></div>
           
           <div className="absolute w-[450px] h-[450px] rounded-full z-0 opacity-100 pointer-events-none scale-75 md:scale-100">
             <Canvas camera={{ position: [0, 0, 5], fov: 45 }} className="w-full h-full">
               <WeatherScene weatherMood={moodInfo.mood} isDay={isDay} />
             </Canvas>
           </div>
           
           <div className="text-center mt-[-10px] z-10 relative">
              <div className="text-[20px] uppercase tracking-[4px] text-[#4a90e2] drop-shadow-md">{moodInfo.label}</div>
              <div className="text-[110px] font-[800] leading-[1] tracking-[-4px] mb-[5px] flex items-center justify-center drop-shadow-xl">
                {Math.round(current.temperature2m)}°
              </div>
              <div className="mt-[15px] flex flex-col items-center">
                 <h2 className="text-[28px] font-[300] flex items-center gap-2 drop-shadow-md">
                    {currentLocation.name}
                    <div className="flex gap-1 ml-2">
                      <button 
                        onClick={() => refreshWeather()} 
                        disabled={isLoading}
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors backdrop-blur-sm bg-black/20 text-white/50 hover:text-[#4a90e2] disabled:opacity-50"
                        title="Refresh Weather"
                      >
                        <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                      </button>
                      <button onClick={toggleFavorite} className="p-1.5 hover:bg-white/10 rounded-full transition-colors backdrop-blur-sm bg-black/20" title="Toggle Favorite">
                        {isFavorite ? <Star className="w-5 h-5 fill-[#4a90e2] text-[#4a90e2]" /> : <StarOff className="w-5 h-5 text-white/50" />}
                      </button>
                      <button 
                        onClick={() => addCompareCity(currentLocation)}
                        className="p-1.5 hover:bg-white/10 rounded-full transition-colors backdrop-blur-sm bg-black/20 text-white/50 hover:text-[#4a90e2]"
                        title="Add to Comparison"
                      >
                        <GitCompare className="w-5 h-5" />
                      </button>
                    </div>
                 </h2>
                 <p className="text-[14px] text-white/50 mt-1">
                   {currentLocation.timezone} • {currentLocation.latitude.toFixed(1)}° {currentLocation.latitude >= 0 ? 'N' : 'S'}, {Math.abs(currentLocation.longitude).toFixed(1)}° {currentLocation.longitude >= 0 ? 'E' : 'W'}
                 </p>
              </div>
           </div>
        </main>

        {/* Sidebar Right */}
        <aside className="flex flex-col gap-[20px] overflow-y-auto no-scrollbar lg:col-start-3 md:col-start-2">
           <GlassCard className="h-full flex flex-col justify-between">
             <div>
                <SectionLabel>Detailed Conditions</SectionLabel>
                <div className="grid grid-cols-2 gap-[12px]">
                  <Metric label="UV Index" value={`${weatherData.daily.uvIndexMax[0]} ${weatherData.daily.uvIndexMax[0] > 7 ? '(High)' : '(Med)'}`} />
                  <Metric label="Humidity" value={`${current.relativeHumidity2m}%`} />
                  <Metric label="Wind" value={`${current.windSpeed10m} km/h`} />
                  <Metric label="Visibility" value={`${current.cloudCover}%`} />
                  <Metric label="Pressure" value={`${current.pressureMsl} mb`} />
                  <Metric label="Dew Point" value={`${Math.round(getDewPoint(current.temperature2m, current.relativeHumidity2m))}°C`} />
                  {weatherData.airQuality?.current?.usAqi !== undefined && (
                     <Metric 
                       label="Air Quality" 
                       value={`${weatherData.airQuality.current.usAqi} AQI`} 
                       subtext={
                         weatherData.airQuality.current.usAqi <= 50 ? '(Good)' : 
                         weatherData.airQuality.current.usAqi <= 100 ? '(Moderate)' : 
                         weatherData.airQuality.current.usAqi <= 150 ? '(Poor)' : '(Unhealthy)'
                       } 
                     />
                  )}
                </div>
             </div>

             <div className="mt-[25px] border-t border-white/[0.12] pt-[15px]">
               <SectionLabel>Astronomy</SectionLabel>
               <div className="grid grid-cols-2 gap-[12px]">
                 <Metric label="Sunrise" value={weatherData.daily.sunrise?.[0] ? format(new Date(weatherData.daily.sunrise[0]), 'hh:mm a') : '--:--'} icon={Sunrise} />
                 <Metric label="Sunset" value={weatherData.daily.sunset?.[0] ? format(new Date(weatherData.daily.sunset[0]), 'hh:mm a') : '--:--'} icon={Sunset} />
                 <Metric label="Moon Phase" value="Waning Crescent" icon={Moon} />
               </div>
             </div>
           </GlassCard>
        </aside>

        {/* Bottom Panel */}
        <footer className="col-span-1 md:col-span-2 lg:col-span-3 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-[20px]">
           <GlassCard className="flex flex-col overflow-hidden">
             <SectionLabel>7-Day Forecast</SectionLabel>
             <div className="flex justify-between gap-[10px] flex-1">
               {weatherData.daily.time?.slice(0, 7).map((timeString, i) => {
                 const date = new Date(timeString);
                 const code = weatherData.daily.weatherCode?.[i] || 0;
                 const info = weatherCodeMap[code] || weatherCodeMap[0];
                 const maxT = weatherData.daily.temperature2mMax?.[i] !== undefined ? Math.round(weatherData.daily.temperature2mMax[i]) : '--';
                 const minT = weatherData.daily.temperature2mMin?.[i] !== undefined ? Math.round(weatherData.daily.temperature2mMin[i]) : '--';
                 
                 return (
                   <div key={i} className="flex-1 text-center bg-white/[0.03] rounded-[12px] p-[12px] flex flex-col justify-between items-center hover:bg-white/[0.06] transition-colors cursor-pointer">
                     <div className="text-[12px] opacity-60 uppercase">{i === 0 ? 'Today' : format(date, 'eee')}</div>
                     <div className="text-[20px] my-[8px]" title={info.label}>
                       {info.mood === 'sunny' ? '☀️' : info.mood === 'cloudy' ? '☁️' : info.mood === 'rain' ? '🌧️' : info.mood === 'snow' ? '❄️' : '🌩️'}
                     </div>
                     <div className="text-[14px] font-[600]">{maxT}° / <span className="opacity-70 font-normal">{minT}°</span></div>
                   </div>
                 )
               })}
             </div>
           </GlassCard>

           <GlassCard className="flex flex-col no-scrollbar">
             <SectionLabel>Best Places to Visit Now</SectionLabel>
             <div className="flex flex-col gap-[15px] flex-1 justify-center">
               {placesError ? (
                 <div className="text-[11px] text-[#a0c4ff] bg-[#4a90e2]/10 p-4 rounded-[12px] italic">
                   AI specialized recommendations are currently limited. Standard local categories are: Parks, Cafes, Museums.
                 </div>
               ) : places ? places.slice(0, 2).map((place, i) => (
                 <div key={i} className="flex-1 bg-gradient-to-br from-white/[0.08] to-white/[0.02] rounded-[15px] p-[15px] flex items-start gap-[10px] hover:bg-white/10 transition-colors cursor-pointer">
                   <div className="w-[32px] h-[32px] bg-[#4a90e2] rounded-[8px] flex items-center justify-center text-[14px] shrink-0 drop-shadow-md">
                     {place.placeType.toLowerCase().includes('cafe') || place.placeType.toLowerCase().includes('food') ? '☕' : 
                      place.placeType.toLowerCase().includes('museum') || place.placeType.toLowerCase().includes('indoor') ? '🏛️' :
                      place.placeType.toLowerCase().includes('park') || place.placeType.toLowerCase().includes('outdoor') ? '🌳' : '📍'}
                   </div>
                   <div className="flex-1 min-w-0">
                     <h5 className="text-[13px] mb-[2px] truncate">{place.placeName}</h5>
                     <p className="text-[11px] text-white/50 leading-[1.3] truncate">
                       {place.placeType} • {place.reason}
                     </p>
                   </div>
                 </div>
               )) : (
                 <div className="flex flex-col gap-[15px] flex-1 justify-center animate-pulse">
                   <div className="flex-1 bg-white/5 rounded-[15px] p-[15px] flex items-start gap-[10px]">
                     <div className="w-[32px] h-[32px] bg-white/10 rounded-[8px] shrink-0"></div>
                     <div className="flex-1 space-y-2 mt-1">
                       <div className="h-3 bg-white/10 rounded w-1/2"></div>
                       <div className="h-2 bg-white/10 rounded w-3/4"></div>
                     </div>
                   </div>
                   <div className="flex-1 bg-white/5 rounded-[15px] p-[15px] flex items-start gap-[10px]">
                     <div className="w-[32px] h-[32px] bg-white/10 rounded-[8px] shrink-0"></div>
                     <div className="flex-1 space-y-2 mt-1">
                       <div className="h-3 bg-white/10 rounded w-1/3"></div>
                       <div className="h-2 bg-white/10 rounded w-2/3"></div>
                     </div>
                   </div>
                 </div>
               )}
             </div>
           </GlassCard>

        </footer>

         {/* Compare Cities Block */}
         {compareCities.length > 0 && (
           <div className="lg:col-span-3 md:col-span-2 col-span-1 mt-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
             <SectionLabel>City Comparison <span className="opacity-50 text-[10px] ml-2">({compareCities.length}/3)</span></SectionLabel>
             <div className="flex flex-col md:flex-row gap-[20px] pb-4 mt-[10px]">
               {compareCities.map(city => (
                 <CompareCard key={city.id} location={city} onRemove={removeCompareCity} />
               ))}
               {compareCities.length < 3 && (
                 <div className="flex-1 min-h-[200px] border border-dashed border-white/20 rounded-[20px] flex items-center justify-center p-6 bg-white/5 text-[12px] uppercase tracking-wider text-center flex-col gap-2 opacity-50">
                   <GitCompare className="w-6 h-6 mb-2 opacity-50" />
                   Add City<br/>To Compare
                 </div>
               )}
             </div>
           </div>
         )}
      </div>
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
