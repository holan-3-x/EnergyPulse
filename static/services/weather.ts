import api from './api';

export const weatherService = {
    getWeather: async (city: string) => {
        const response = await api.get(`/api/weather/${encodeURIComponent(city)}`);
        return response.data;
    }
};
