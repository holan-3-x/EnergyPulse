import api from './api';
import { User, Prediction } from '../types';

export interface AdminDashboardData {
    totalUsers: number;
    totalHouseholds: number;
    totalPredictions: number;
    activeSessions: number;
    blockchainConfirmed: number;
    recentPredictions: Prediction[];
    systemHealth: string;
}

export const adminService = {
    async getDashboardData(): Promise<AdminDashboardData> {
        const response = await api.get('/admin/dashboard');
        return response.data;
    },

    async getUsers(): Promise<User[]> {
        const response = await api.get('/admin/users');
        return response.data;
    },

    async changeUserRole(userId: number, role: 'admin' | 'user'): Promise<void> {
        await api.put(`/admin/users/${userId}/role`, { role });
    }
};
