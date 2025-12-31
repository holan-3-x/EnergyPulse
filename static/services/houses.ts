import api from './api';
import { Household } from '../types';

export const housesService = {
    async getHouses(): Promise<Household[]> {
        const response = await api.get('/api/houses');
        return response.data; // The handler returns the list directly or {houses: []}?
        // main.go: houseGroup.GET("", handlers.GetHouses)
        // houses.go: c.JSON(http.StatusOK, gin.H{"houses": houses}) -> so response.data.houses
    },

    async getHouse(id: string): Promise<Household> {
        const response = await api.get(`/api/houses/${id}`);
        return response.data;
    },

    async createHouse(houseData: any): Promise<Household> {
        const response = await api.post('/api/houses', houseData);
        return response.data;
    },

    async updateHouse(id: string, houseData: any): Promise<Household> {
        const response = await api.put(`/api/houses/${id}`, houseData);
        return response.data;
    },

    async deleteHouse(id: string): Promise<void> {
        await api.delete(`/api/houses/${id}`);
    }
};
