import api from './api';
import { User } from '../types';

export interface UpdateProfileData {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    email?: string;
}

export const userService = {
    async getProfile(): Promise<User> {
        const response = await api.get('/api/user/profile');
        return response.data;
    },

    async updateProfile(data: UpdateProfileData): Promise<User> {
        const response = await api.put('/api/user/profile', data);
        return response.data;
    },

    async changePassword(currentPassword: string, newPassword: string): Promise<void> {
        await api.put('/api/user/password', { currentPassword, newPassword });
    }
};
