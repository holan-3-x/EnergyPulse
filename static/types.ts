
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export interface User {
  id: string;
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
  userId: string;
  houseName: string;
  address: string;
  city: string;
  region: string;
  country: string;
  members: number;
  heatingType: 'Electric' | 'Gas' | 'Heat Pump' | 'Biomass';
  areaSqm: number;
  yearBuilt: number;
  meterId: string;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface Prediction {
  id: string;
  userId: string;
  houseId: string;
  meterId: string;
  timestamp: string;
  hour: number;
  temperature: number;
  consumptionKwh: number;
  predictedPrice: number;
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
