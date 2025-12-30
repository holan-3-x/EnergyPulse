
import { User, UserRole, Household, Prediction } from '../types';

export const mockUser: User = {
  id: 'u_001',
  username: 'holanomeed',
  email: 'holan.omeed@example.com',
  firstName: 'Holan',
  lastName: 'Omeed',
  phone: '+39 345 678 9012',
  role: UserRole.USER,
  avatar: 'https://picsum.photos/seed/user1/200'
};

export const mockAdmin: User = {
  id: 'a_001',
  username: 'admin_sys',
  email: 'admin@energypulse.ai',
  firstName: 'System',
  lastName: 'Administrator',
  phone: '+39 000 000 0000',
  role: UserRole.ADMIN,
  avatar: 'https://picsum.photos/seed/admin/200'
};

export const mockHouses: Household[] = [
  {
    id: 'h_001',
    userId: 'u_001',
    houseName: 'Main Residence',
    address: 'Via Roma 123',
    city: 'Florence',
    region: 'Tuscany',
    country: 'Italy',
    members: 4,
    heatingType: 'Heat Pump',
    areaSqm: 120,
    yearBuilt: 2018,
    meterId: 'meter_fl_102',
    status: 'active',
    createdAt: '2023-10-01T08:00:00Z'
  },
  {
    id: 'h_002',
    userId: 'u_001',
    houseName: 'Holiday Home',
    address: 'Via Marina 45',
    city: 'Naples',
    region: 'Campania',
    country: 'Italy',
    members: 2,
    heatingType: 'Electric',
    areaSqm: 65,
    yearBuilt: 1995,
    meterId: 'meter_na_055',
    status: 'active',
    createdAt: '2024-01-15T12:00:00Z'
  }
];

export const generatePredictions = (houseId: string, count: number): Prediction[] => {
  const predictions: Prediction[] = [];
  const now = new Date();
  
  for (let i = 0; i < count; i++) {
    const ts = new Date(now.getTime() + (i * 3600000));
    predictions.push({
      id: `pred_${houseId}_${i}`,
      userId: 'u_001',
      houseId: houseId,
      meterId: 'meter_fl_102',
      timestamp: ts.toISOString(),
      hour: ts.getHours(),
      temperature: 15 + Math.random() * 10,
      consumptionKwh: 1.2 + Math.random() * 2,
      predictedPrice: 0.22 + Math.random() * 0.1,
      confidence: 0.85 + Math.random() * 0.14,
      blockchainTx: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
      blockchainConfirmed: true
    });
  }
  return predictions;
};

export const mockPredictions = generatePredictions('h_001', 24);
