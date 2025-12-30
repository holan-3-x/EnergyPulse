import api from './api';
import { Prediction } from '../types';

export const predictionsService = {
    async getPredictions(): Promise<Prediction[]> {
        const response = await api.get('/predictions');
        return response.data.predictions || [];
    },

    async getPrediction(id: string): Promise<Prediction> {
        const response = await api.get(`/predictions/${id}`);
        return response.data;
    },

    async getStatistics(): Promise<any> {
        const response = await api.get('/statistics');
        return response.data;
    }
};
