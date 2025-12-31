package handlers

import (
	"net/http"

	"energy-prediction/internal/auth"
	"energy-prediction/internal/blockchain"
	"energy-prediction/internal/database"
	"energy-prediction/internal/models"

	"github.com/gin-gonic/gin"
)

// BlockchainLogResponse represents a blockchain log entry for the API
type BlockchainLogResponse struct {
	ID              uint    `json:"id"`
	PredictionID    uint    `json:"predictionId"`
	TransactionHash string  `json:"transactionHash"`
	BlockNumber     uint64  `json:"blockNumber"`
	GasUsed         uint64  `json:"gasUsed"`
	Status          string  `json:"status"`
	ContractAddress string  `json:"contractAddress"`
	LoggedAt        string  `json:"loggedAt"`
	ConfirmedAt     *string `json:"confirmedAt"`
	// Additional prediction data for context
	MeterID        string  `json:"meterId"`
	PredictedPrice float64 `json:"predictedPrice"`
	ActualPrice    float64 `json:"actualPrice"`
	Confidence     int     `json:"confidence"`
	HouseID        string  `json:"houseId"`
}

// GetUserBlockchainLogs returns all blockchain logs for the current user's predictions.
// GET /api/blockchain/logs
func GetUserBlockchainLogs(c *gin.Context) {
	userID := auth.GetUserID(c)

	var logs []models.BlockchainLog
	// Join with predictions to filter by user and get prediction details
	err := database.DB.
		Joins("JOIN predictions ON predictions.id = blockchain_log.prediction_id").
		Where("predictions.user_id = ?", userID).
		Order("blockchain_log.logged_at DESC").
		Preload("Prediction").
		Find(&logs).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch blockchain logs"})
		return
	}

	// Convert to response format
	responses := make([]BlockchainLogResponse, len(logs))
	for i, log := range logs {
		var confirmedAt *string
		if log.ConfirmedAt != nil {
			formatted := log.ConfirmedAt.Format("2006-01-02T15:04:05Z")
			confirmedAt = &formatted
		}

		responses[i] = BlockchainLogResponse{
			ID:              log.ID,
			PredictionID:    log.PredictionID,
			TransactionHash: log.TransactionHash,
			BlockNumber:     log.BlockNumber,
			GasUsed:         log.GasUsed,
			Status:          log.Status,
			ContractAddress: log.ContractAddress,
			LoggedAt:        log.LoggedAt.Format("2006-01-02T15:04:05Z"),
			ConfirmedAt:     confirmedAt,
			MeterID:         log.Prediction.MeterID,
			PredictedPrice:  log.Prediction.PredictedPrice,
			ActualPrice:     log.Prediction.ActualPrice,
			Confidence:      log.Prediction.Confidence,
			HouseID:         log.Prediction.HouseID,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"logs":  responses,
		"total": len(responses),
	})
}

// GetBlockchainStats returns blockchain network statistics.
// GET /api/blockchain/stats
func GetBlockchainStats(c *gin.Context) {
	userID := auth.GetUserID(c)

	stats := blockchain.GetStats()

	// Add user-specific stats
	var userTxCount int64
	database.DB.Model(&models.BlockchainLog{}).
		Joins("JOIN predictions ON predictions.id = blockchain_log.prediction_id").
		Where("predictions.user_id = ?", userID).
		Count(&userTxCount)

	var userConfirmedCount int64
	database.DB.Model(&models.BlockchainLog{}).
		Joins("JOIN predictions ON predictions.id = blockchain_log.prediction_id").
		Where("predictions.user_id = ? AND blockchain_log.status = ?", userID, "confirmed").
		Count(&userConfirmedCount)

	var userPendingCount int64
	database.DB.Model(&models.BlockchainLog{}).
		Joins("JOIN predictions ON predictions.id = blockchain_log.prediction_id").
		Where("predictions.user_id = ? AND blockchain_log.status != ?", userID, "confirmed").
		Count(&userPendingCount)

	// Total gas used by user
	var totalGas struct {
		Total uint64
	}
	database.DB.Model(&models.BlockchainLog{}).
		Select("COALESCE(SUM(gas_used), 0) as total").
		Joins("JOIN predictions ON predictions.id = blockchain_log.prediction_id").
		Where("predictions.user_id = ?", userID).
		Scan(&totalGas)

	stats["userTransactions"] = userTxCount
	stats["userConfirmed"] = userConfirmedCount
	stats["userPending"] = userPendingCount
	stats["userTotalGas"] = totalGas.Total

	c.JSON(http.StatusOK, stats)
}

// VerifyTransaction verifies a specific blockchain transaction.
// GET /api/blockchain/verify/:tx_hash
func VerifyTransaction(c *gin.Context) {
	txHash := c.Param("tx_hash")

	if txHash == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Transaction hash is required"})
		return
	}

	valid, log, err := blockchain.VerifyTransaction(txHash)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"verified": false,
			"error":    "Transaction not found in blockchain",
		})
		return
	}

	// Get the associated prediction
	var prediction models.Prediction
	database.DB.First(&prediction, log.PredictionID)

	c.JSON(http.StatusOK, gin.H{
		"verified":        valid,
		"transactionHash": log.TransactionHash,
		"blockNumber":     log.BlockNumber,
		"status":          log.Status,
		"gasUsed":         log.GasUsed,
		"contractAddress": log.ContractAddress,
		"loggedAt":        log.LoggedAt.Format("2006-01-02T15:04:05Z"),
		"confirmedAt":     log.ConfirmedAt,
		"prediction": gin.H{
			"id":             prediction.ID,
			"meterId":        prediction.MeterID,
			"predictedPrice": prediction.PredictedPrice,
			"actualPrice":    prediction.ActualPrice,
			"confidence":     prediction.Confidence,
			"timestamp":      prediction.Timestamp.Format("2006-01-02T15:04:05Z"),
		},
	})
}

// GetBlockByNumber retrieves block information by block number.
// GET /api/blockchain/block/:number
func GetBlockByNumber(c *gin.Context) {
	blockNum := c.Param("number")

	var logs []models.BlockchainLog
	database.DB.Where("block_number = ?", blockNum).Preload("Prediction").Find(&logs)

	if len(logs) == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Block not found or empty"})
		return
	}

	// Build block info
	transactions := make([]gin.H, len(logs))
	for i, log := range logs {
		transactions[i] = gin.H{
			"hash":           log.TransactionHash,
			"predictionId":   log.PredictionID,
			"gasUsed":        log.GasUsed,
			"status":         log.Status,
			"meterId":        log.Prediction.MeterID,
			"predictedPrice": log.Prediction.PredictedPrice,
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"blockNumber":  blockNum,
		"timestamp":    logs[0].LoggedAt.Format("2006-01-02T15:04:05Z"),
		"transactions": transactions,
		"txCount":      len(logs),
	})
}
