// Package blockchain provides simulated blockchain logging for predictions.
// In a real implementation, this would connect to Ethereum via go-ethereum.
// For the course project, we simulate the blockchain to demonstrate the concept.
package blockchain

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"log"
	"sync"
	"time"

	"energy-prediction/internal/database"
	"energy-prediction/internal/models"
)

// SimulatedBlockchain represents our local blockchain simulation
type SimulatedBlockchain struct {
	mu          sync.Mutex
	blockNumber uint64
	blocks      []Block
}

// Block represents a simulated blockchain block
type Block struct {
	Number       uint64
	Timestamp    time.Time
	Transactions []Transaction
	PrevHash     string
	Hash         string
}

// Transaction represents a blockchain transaction
type Transaction struct {
	Hash         string
	PredictionID uint
	Data         string
	GasUsed      uint64
}

// Global blockchain instance
var chain *SimulatedBlockchain

// Init initializes the simulated blockchain
func Init() {
	chain = &SimulatedBlockchain{
		blockNumber: 15000000, // Start from a realistic block number
		blocks:      make([]Block, 0),
	}

	// Create genesis block
	genesis := Block{
		Number:    chain.blockNumber,
		Timestamp: time.Now(),
		PrevHash:  "0x0000000000000000000000000000000000000000000000000000000000000000",
	}
	genesis.Hash = calculateBlockHash(&genesis)
	chain.blocks = append(chain.blocks, genesis)

	log.Println("✓ Simulated blockchain initialized at block", chain.blockNumber)
}

// LogPrediction logs a prediction to the simulated blockchain.
// Returns the transaction hash.
func LogPrediction(prediction *models.Prediction) (string, error) {
	chain.mu.Lock()
	defer chain.mu.Unlock()

	// Create transaction data
	data := fmt.Sprintf("PREDICTION|%d|%s|%.4f|%d|%s",
		prediction.ID,
		prediction.MeterID,
		prediction.PredictedPrice,
		prediction.Confidence,
		prediction.Timestamp.Format(time.RFC3339),
	)

	// Generate transaction hash
	txHash := generateTxHash(data, prediction.ID)

	// Calculate gas (simulated)
	gasUsed := uint64(21000 + len(data)*68)

	// Create transaction
	tx := Transaction{
		Hash:         txHash,
		PredictionID: prediction.ID,
		Data:         data,
		GasUsed:      gasUsed,
	}

	// Add to current block or create new block
	chain.blockNumber++
	prevHash := chain.blocks[len(chain.blocks)-1].Hash

	newBlock := Block{
		Number:       chain.blockNumber,
		Timestamp:    time.Now(),
		Transactions: []Transaction{tx},
		PrevHash:     prevHash,
	}
	newBlock.Hash = calculateBlockHash(&newBlock)
	chain.blocks = append(chain.blocks, newBlock)

	// Create blockchain log entry
	confirmedAt := time.Now()
	blockchainLog := models.BlockchainLog{
		PredictionID:    prediction.ID,
		TransactionHash: txHash,
		BlockNumber:     chain.blockNumber,
		GasUsed:         gasUsed,
		Status:          "confirmed",
		ContractAddress: "0x742d35Cc6634C0532925a3b844Bc9e7595f4e2E1",
		ConfirmedAt:     &confirmedAt,
	}

	if err := database.DB.Create(&blockchainLog).Error; err != nil {
		return "", fmt.Errorf("failed to save blockchain log: %w", err)
	}

	return txHash, nil
}

// generateTxHash creates a transaction hash from the data
func generateTxHash(data string, predictionID uint) string {
	input := fmt.Sprintf("%s|%d|%d", data, predictionID, time.Now().UnixNano())
	hash := sha256.Sum256([]byte(input))
	return "0x" + hex.EncodeToString(hash[:])
}

// calculateBlockHash computes the hash of a block
func calculateBlockHash(block *Block) string {
	input := fmt.Sprintf("%d|%s|%s|%d",
		block.Number,
		block.PrevHash,
		block.Timestamp.Format(time.RFC3339Nano),
		len(block.Transactions),
	)
	hash := sha256.Sum256([]byte(input))
	return "0x" + hex.EncodeToString(hash[:])
}

// GetBlockNumber returns the current block number
func GetBlockNumber() uint64 {
	chain.mu.Lock()
	defer chain.mu.Unlock()
	return chain.blockNumber
}

// GetTransaction retrieves a transaction by hash
func GetTransaction(txHash string) (*Transaction, error) {
	chain.mu.Lock()
	defer chain.mu.Unlock()

	for _, block := range chain.blocks {
		for _, tx := range block.Transactions {
			if tx.Hash == txHash {
				return &tx, nil
			}
		}
	}
	return nil, fmt.Errorf("transaction not found: %s", txHash)
}

// VerifyTransaction checks if a transaction exists and is valid
func VerifyTransaction(txHash string) (bool, *models.BlockchainLog, error) {
	var log models.BlockchainLog
	if err := database.DB.Where("transaction_hash = ?", txHash).First(&log).Error; err != nil {
		return false, nil, fmt.Errorf("transaction not found")
	}
	return log.Status == "confirmed", &log, nil
}

// GetStats returns blockchain statistics
func GetStats() map[string]interface{} {
	chain.mu.Lock()
	defer chain.mu.Unlock()

	var totalTx int
	for _, block := range chain.blocks {
		totalTx += len(block.Transactions)
	}

	return map[string]interface{}{
		"currentBlock":      chain.blockNumber,
		"totalBlocks":       len(chain.blocks),
		"totalTransactions": totalTx,
		"contractAddress":   "0x742d35Cc6634C0532925a3b844Bc9e7595f4e2E1",
		"network":           "simulated",
	}
}
