import React, { useEffect, useState } from 'react';
import { Location, WeatherData, getWeatherData, weatherCodeMap } from '../services/weatherService';
import { GlassCard } from './ui/GlassCard';
import { format } from 'date-fns';
import { Loader2, X } from 'lucide-react';

interface CompareCardProps {
  location: Location;
  onRemove: (id: number) => void;
}

export function CompareCard({ location, onRemove }: CompareCardProps) {
  const [data, setData] = useState<WeatherData | null>(null);

  useEffect(() => {
    let active = true;
    getWeatherData(location.latitude, location.longitude, location.timezone)
      .then(res => {
        if (active) setData(res);
      })
      .catch(err => console.error("Error fetching compare data", err));
    return () => { active = false; };
  }, [location]);

  if (!data) {
    return (
      <GlassCard className="flex-1 animate-pulse relative">
         <button onClick={() => onRemove(location.id)} className="absolute top-2 right-2 p-1 hover:bg-white/10 rounded-full text-white/50"><X size={14}/></button>
         <div className="h-4 bg-white/10 rounded w-1/2 mb-4"></div>
         <div className="h-10 bg-white/10 rounded w-1/3 mb-4"></div>
         <div className="h-3 bg-white/10 rounded w-full mb-2"></div>
         <div className="h-3 bg-white/10 rounded w-4/5"></div>
      </GlassCard>
    );
  }

  const current = data.current;
  const moodInfo = weatherCodeMap[current.weatherCode] || weatherCodeMap[0];

  return (
    <GlassCard className="flex-1 relative flex flex-col justify-between">
      <button onClick={() => onRemove(location.id)} className="absolute top-[10px] right-[10px] p-1.5 hover:bg-white/10 rounded-full text-white/50 transition-colors">
        <X className="w-4 h-4" />
      </button>
      <div>
        <h4 className="text-[16px] font-[600] truncate pr-[24px]">{location.name}</h4>
        <p className="text-[12px] opacity-60 truncate">{location.country}</p>
      </div>
      <div className="flex justify-between items-end mt-[15px]">
        <div>
          <div className="text-[32px] font-[800] leading-none mb-[4px]">{Math.round(current.temperature2m)}°</div>
          <div className="text-[13px] text-[#4a90e2]">{moodInfo.label}</div>
        </div>
        <div className="text-right text-[12px] opacity-70">
          <div>H: {data.daily.temperature2mMax?.[0] !== undefined ? Math.round(data.daily.temperature2mMax[0]) : '--'}°</div>
          <div>L: {data.daily.temperature2mMin?.[0] !== undefined ? Math.round(data.daily.temperature2mMin[0]) : '--'}°</div>
        </div>
      </div>
      <div className="mt-[15px] pt-[15px] border-t border-white/[0.12] grid grid-cols-2 gap-[10px] text-[11px]">
         <div>
            <span className="opacity-50 block">Wind</span>
            <span className="font-[500]">{current.windSpeed10m} km/h</span>
         </div>
         <div>
            <span className="opacity-50 block">Humidity</span>
            <span className="font-[500]">{current.relativeHumidity2m}%</span>
         </div>
      </div>
    </GlassCard>
  );
}
