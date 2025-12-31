
import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudLightning, Thermometer, Wind, Loader2 } from 'lucide-react';
import { weatherService } from '../services/weather';

interface WeatherWidgetProps {
    city?: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ city = "Milano" }) => {
    const [weather, setWeather] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                const data = await weatherService.getWeather(city);
                console.log("Weather Fetch Result:", data);
                if (data && typeof data === 'object' && !data.error && typeof data.temperature !== 'undefined') {
                    setWeather(data);
                } else {
                    console.warn("Invalid weather data received:", data);
                }
            } catch (err) {
                console.error("Weather fetch failed:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchWeather();
        const interval = setInterval(fetchWeather, 300000);
        return () => clearInterval(interval);
    }, [city]);

    const getWeatherIcon = (code: number) => {
        if (code === 0) return <Sun className="text-amber-500" size={20} />;
        if (code <= 3) return <Cloud className="text-slate-400" size={20} />;
        if (code >= 51 && code <= 67) return <CloudRain className="text-blue-500" size={20} />;
        if (code >= 95) return <CloudLightning className="text-indigo-600" size={20} />;
        return <Cloud className="text-slate-400" size={20} />;
    };

    if (loading) return (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-2xl animate-pulse">
            <div className="w-5 h-5 bg-gray-200 rounded-full" />
            <div className="w-10 h-3 bg-gray-200 rounded" />
        </div>
    );

    if (!weather || typeof weather.temperature === 'undefined') return null;

    return (
        <div className="flex items-center gap-4 bg-gray-50 px-4 py-2 rounded-2xl border border-gray-100 animate-in fade-in duration-500 shadow-sm">
            <div className="flex items-center gap-2">
                {getWeatherIcon(weather.weathercode)}
                <span className="text-xs font-black text-gray-800 tabular-nums">
                    {Number(weather.temperature).toFixed(1)}°C
                </span>
            </div>
            <div className="h-4 w-px bg-gray-200 hidden sm:block"></div>
            <div className="hidden sm:flex items-center gap-2 text-gray-500">
                <Wind size={14} className="opacity-50" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{weather.windspeed} km/h</span>
            </div>
            <div className="h-4 w-px bg-gray-200 hidden lg:block"></div>
            <div className="hidden lg:flex items-center gap-1.5">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{weather.city || city}</span>
            </div>
        </div>
    );
};

export default WeatherWidget;
