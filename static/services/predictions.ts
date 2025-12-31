import api from './api';
import { Prediction } from '../types';

export interface PredictionsResponse {
    predictions: Prediction[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export const predictionsService = {
    async getPredictions(filters?: {
        houseId?: string,
        meterId?: string,
        startDate?: string,
        endDate?: string,
        page?: number,
        limit?: number
    }): Promise<PredictionsResponse> {
        const response = await api.get('/api/predictions', { params: filters });
        return response.data;
    },

    async getPrediction(id: string): Promise<Prediction> {
        const response = await api.get(`/api/predictions/${id}`);
        return response.data;
    },

    async getStatistics(): Promise<any> {
        const response = await api.get('/api/statistics');
        return response.data;
    },

    exportToCSV(predictions: Prediction[]) {
        if (!predictions.length) return;

        const headers = ["ID", "Meter ID", "Timestamp", "Temperature", "Predicted Price", "Actual Price", "Confidence", "Blockchain TX", "Status"];
        const rows = predictions.map(p => [
            p.id,
            p.meterId,
            new Date(p.timestamp).toLocaleString(),
            p.temperature.toFixed(2),
            p.predictedPrice.toFixed(4),
            p.actualPrice.toFixed(4),
            p.confidence + "%",
            p.blockchainTx || "Pending",
            p.blockchainConfirmed ? "Verified" : "Syncing"
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `EnergyPulse_Export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};
