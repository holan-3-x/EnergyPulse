import api from './api';

export interface BlockchainLog {
    id: number;
    predictionId: number;
    transactionHash: string;
    blockNumber: number;
    gasUsed: number;
    status: string;
    contractAddress: string;
    loggedAt: string;
    confirmedAt: string | null;
    meterId: string;
    predictedPrice: number;
    actualPrice: number;
    confidence: number;
    houseId: string;
}

export interface BlockchainStats {
    currentBlock: number;
    totalBlocks: number;
    totalTransactions: number;
    contractAddress: string;
    network: string;
    userTransactions: number;
    userConfirmed: number;
    userPending: number;
    userTotalGas: number;
}

export interface VerificationResult {
    verified: boolean;
    transactionHash?: string;
    blockNumber?: number;
    status?: string;
    gasUsed?: number;
    contractAddress?: string;
    loggedAt?: string;
    confirmedAt?: string;
    prediction?: {
        id: number;
        meterId: string;
        predictedPrice: number;
        actualPrice: number;
        confidence: number;
        timestamp: string;
    };
    error?: string;
}

export const blockchainService = {
    async getLogs(): Promise<{ logs: BlockchainLog[]; total: number }> {
        const response = await api.get('/api/blockchain/logs');
        return response.data;
    },

    async getStats(): Promise<BlockchainStats> {
        const response = await api.get('/api/blockchain/stats');
        return response.data;
    },

    async verifyTransaction(txHash: string): Promise<VerificationResult> {
        const response = await api.get(`/api/blockchain/verify/${encodeURIComponent(txHash)}`);
        return response.data;
    },

    async getBlock(blockNumber: number): Promise<any> {
        const response = await api.get(`/api/blockchain/block/${blockNumber}`);
        return response.data;
    }
};
