
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export interface User {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  avatar?: string;
}

export interface Household {
  id: string;
  userId: number;
  houseName: string;
  address: string;
  city: string;
  region: string;
  country: string;
  members: number;
  heatingType: 'electric' | 'natural_gas' | 'heat_pump' | 'biomass';
  areaSqm: number;
  yearBuilt: number;
  meterId: string;
  status: 'active' | 'archived';
  createdAt: string;
  userEmail?: string;
  ownerName?: string;
}

export interface Prediction {
  id: number;
  userId: number;
  houseId: string;
  meterId: string;
  timestamp: string;
  hour: number;
  temperature: number;
  consumptionKwh: number;
  predictedPrice: number;
  actualPrice: number;
  accuracy: number;
  confidence: number;
  blockchainTx: string;
  blockchainConfirmed: boolean;
}

export interface AppState {
  user: User | null;
  token: string | null;
  houses: Household[];
  predictions: Prediction[];
}
