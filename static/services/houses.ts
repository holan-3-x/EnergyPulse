import api from './api';
import { Household } from '../types';

export const housesService = {
    async getHouses(): Promise<Household[]> {
        const response = await api.get('/houses');
        return response.data.houses || [];
    },

    async getHouse(id: string): Promise<Household> {
        const response = await api.get(`/houses/${id}`);
        return response.data;
    },

    async createHouse(houseData: any): Promise<Household> {
        const response = await api.post('/houses', houseData);
        return response.data;
    },

    async deleteHouse(id: string): Promise<void> {
        await api.delete(`/houses/${id}`);
    }
};
