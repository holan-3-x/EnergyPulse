import api from './api';
import { User } from '../types';

export const authService = {
    async register(userData: any): Promise<void> {
        await api.post('/auth/register', userData);
    },

    async login(credentials: any): Promise<{ token: string; user: User }> {
        const response = await api.post('/auth/login', credentials);
        return response.data;
    },

    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser(): User | null {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
};
