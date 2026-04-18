import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { searchCities, Location } from '../services/weatherService';
import { useWeatherStore } from '../store/useWeatherStore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function SearchComponent() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  
  const { setLocation } = useWeatherStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length > 2) {
        setIsSearching(true);
        const data = await searchCities(query);
        setResults(data);
        setIsSearching(false);
        setIsOpen(true);
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (loc: Location) => {
    setLocation(loc);
    setQuery('');
    setIsOpen(false);
  };

  const handleCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        // In a real app we'd reverse-geocode here. For now we create a custom location object.
        const loc: Location = {
          id: Date.now(),
          name: "Current Location",
          latitude,
          longitude,
          country: "Auto",
          timezone: "auto"
        };
        setLocation(loc);
      });
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md mx-auto z-50">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-white/50 group-focus-within:text-white transition-colors">
          {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 2 && setIsOpen(true)}
          placeholder="Search City (e.g. Reykjavik)"
          className="w-full bg-white/[0.06] backdrop-blur-md border border-white/[0.12] text-white rounded-full py-[10px] pl-[40px] pr-[50px] outline-none focus:bg-white/[0.1] focus:border-[#4a90e2] transition-all placeholder:text-white/50 text-[14px]"
        />
        <div className="absolute inset-y-0 right-0 pr-[20px] flex items-center pointer-events-none text-white/50 text-[12px] font-bold">
          ⌘K
        </div>
      </div>

      <AnimatePresence>
        {isOpen && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#0a0a20] border border-white/[0.12] rounded-[20px] overflow-hidden shadow-2xl"
          >
            {results.map((loc, i) => (
              <button
                key={loc.id}
                onClick={() => handleSelect(loc)}
                className={cn(
                  "w-full text-left px-5 py-3 hover:bg-white/10 transition-colors flex items-center gap-3",
                  i !== results.length - 1 && "border-b border-white/5"
                )}
              >
                <MapPin className="w-4 h-4 text-white/40" />
                <div>
                  <div className="text-white font-medium">{loc.name}</div>
                  <div className="text-xs text-white/50">{loc.admin1 ? `${loc.admin1}, ` : ''}{loc.country}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
