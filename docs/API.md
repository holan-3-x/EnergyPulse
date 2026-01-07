# EnergyPulse API Documentation

## Base URL

```
http://localhost:8080
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### Register User

Creates a new user account with an initial house.

**Request:**
```http
POST /auth/register
Content-Type: application/json

{
  "username": "newuser",
  "password": "password123",
  "email": "user@example.com",
  "firstName": "Mario",
  "lastName": "Rossi",
  "phone": "+39 123 456 7890",
  "houseName": "Casa Principale",
  "address": "Via Roma 1",
  "city": "Milano",
  "region": "Lombardy",
  "country": "Italy",
  "members": 3,
  "heatingType": "natural_gas",
  "areaSqm": 85,
  "yearBuilt": 2010
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": 1735675200,
  "user": {
    "id": 1,
    "username": "newuser",
    "email": "user@example.com",
    "firstName": "Mario",
    "lastName": "Rossi",
    "phone": "+39 123 456 7890",
    "role": "user"
  }
}
```

### Login

Authenticates user and returns JWT token.

**Request:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "mario.rossi@email.it",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": 1735675200,
  "user": {
    "id": 2,
    "username": "mario",
    "email": "mario@example.it",
    "firstName": "Mario",
    "lastName": "Rossi",
    "role": "user"
  }
}
```

### Logout

Invalidates the current session.

**Request:**
```http
POST /auth/logout
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### Refresh Token

Generates a new token from an existing valid token.

**Request:**
```http
POST /auth/refresh
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": 1735761600
}
```

---

## User Endpoints

### Get Profile

Returns current user's profile.

**Request:**
```http
GET /api/user/profile
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 2,
  "username": "mario",
  "email": "mario@example.it",
  "firstName": "Mario",
  "lastName": "Rossi",
  "phone": "+39 123 456 7891",
  "avatar": "",
  "role": "user"
}
```

### Update Profile

Updates current user's profile fields.

**Request:**
```http
PUT /api/user/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "Mario",
  "lastName": "Rossi",
  "phone": "+39 123 456 7899"
}
```

**Response (200):**
```json
{
  "id": 2,
  "username": "mario",
  "email": "mario@example.it",
  "firstName": "Mario",
  "lastName": "Rossi",
  "phone": "+39 123 456 7899",
  "role": "user"
}
```

### Change Password

Changes user's password.

**Request:**
```http
PUT /api/user/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "password123",
  "newPassword": "newpassword456"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully. Please login again."
}
```

---

## House Endpoints

### Create House

Creates a new house for the current user.

**Request:**
```http
POST /api/houses
Authorization: Bearer <token>
Content-Type: application/json

{
  "houseName": "Casa Vacanze",
  "address": "Via Mare 10",
  "city": "Rimini",
  "region": "Emilia-Romagna",
  "country": "Italy",
  "members": 4,
  "heatingType": "electric",
  "areaSqm": 65,
  "yearBuilt": 2015
}
```

**Response (201):**
```json
{
  "id": "house_021",
  "userId": 2,
  "houseName": "Casa Vacanze",
  "address": "Via Mare 10",
  "city": "Rimini",
  "region": "Emilia-Romagna",
  "country": "Italy",
  "members": 4,
  "heatingType": "electric",
  "areaSqm": 65,
  "yearBuilt": 2015,
  "meterId": "household_21",
  "status": "active",
  "createdAt": "2024-12-30T15:00:00Z"
}
```

### Get Houses

Returns all houses for current user (or all for admin).

**Request:**
```http
GET /api/houses
Authorization: Bearer <token>
```

**Response (200):**
```json
[
  {
    "id": "house_004",
    "userId": 2,
    "houseName": "Casa Mario 1",
    "address": "Via Milano 10",
    "city": "Milano",
    "meterId": "household_4",
    "status": "active"
  },
  {
    "id": "house_005",
    "userId": 2,
    "houseName": "Casa Mario 2",
    "address": "Via Roma 20",
    "city": "Roma",
    "meterId": "household_5",
    "status": "active"
  }
]
```

### Get House by ID

Returns a specific house.

**Request:**
```http
GET /api/houses/house_004
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "house_004",
  "userId": 2,
  "houseName": "Casa Mario 1",
  "address": "Via Milano 10",
  "city": "Milano",
  "region": "Lombardy",
  "country": "Italy",
  "members": 3,
  "heatingType": "natural_gas",
  "areaSqm": 85,
  "yearBuilt": 2010,
  "meterId": "household_4",
  "status": "active",
  "createdAt": "2024-12-30T10:00:00Z"
}
```

### Update House

Updates house details.

**Request:**
```http
PUT /api/houses/house_004
Authorization: Bearer <token>
Content-Type: application/json

{
  "houseName": "Casa Principale",
  "members": 4
}
```

**Response (200):**
```json
{
  "id": "house_004",
  "houseName": "Casa Principale",
  "members": 4,
  "status": "active"
}
```

### Delete House

Archives a house (soft delete).

**Request:**
```http
DELETE /api/houses/house_004
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "message": "House archived successfully"
}
```

---

## Prediction Endpoints

### Get Predictions

Returns predictions with optional filters.

**Request:**
```http
GET /api/predictions?page=1&limit=20&houseId=house_004&startDate=2024-12-25&endDate=2024-12-30
Authorization: Bearer <token>
```

**Query Parameters:**
- `page` (int): Page number (default: 1)
- `limit` (int): Items per page (default: 20, max: 100)
- `houseId` (string): Filter by house
- `meterId` (string): Filter by meter
- `startDate` (string): Start date (YYYY-MM-DD)
- `endDate` (string): End date (YYYY-MM-DD)

**Response (200):**
```json
{
  "predictions": [
    {
      "id": 1,
      "userId": 2,
      "houseId": "house_004",
      "meterId": "household_4",
      "timestamp": "2024-12-30T14:00:00Z",
      "hour": 14,
      "temperature": 18.5,
      "consumptionKwh": 0.85,
      "predictedPrice": 0.1142,
      "confidence": 88,
      "blockchainTx": "0x1234...",
      "blockchainConfirmed": true
    }
  ],
  "total": 120,
  "page": 1,
  "limit": 20,
  "totalPages": 6
}
```

### Get Prediction by ID

Returns a single prediction.

**Request:**
```http
GET /api/predictions/1
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": 1,
  "userId": 2,
  "houseId": "house_004",
  "meterId": "household_4",
  "timestamp": "2024-12-30T14:00:00Z",
  "hour": 14,
  "temperature": 18.5,
  "consumptionKwh": 0.85,
  "predictedPrice": 0.1142,
  "confidence": 88,
  "blockchainTx": "0x1234567890abcdef...",
  "blockchainConfirmed": true
}
```

### Get Statistics

Returns aggregated statistics.

**Request:**
```http
GET /api/statistics
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "totalPredictions": 480,
  "totalHouseholds": 4,
  "averagePrice": 0.1056,
  "averageConsumption": 0.92,
  "blockchainConfirmed": 50,
  "lastPredictionAt": "2024-12-30T15:00:00Z"
}
```

---

## Admin Endpoints

Require `admin` role.

### Get All Users

**Request:**
```http
GET /admin/users
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@energypulse.it",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  },
  {
    "id": 2,
    "username": "mario",
    "email": "mario@example.it",
    "firstName": "Mario",
    "lastName": "Rossi",
    "role": "user"
  }
]
```

### Change User Role

**Request:**
```http
PUT /admin/users/2/role
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "role": "admin"
}
```

**Response (200):**
```json
{
  "message": "Role updated successfully",
  "userId": 2,
  "newRole": "admin"
}
```

### Admin Dashboard

Returns system-wide statistics.

**Request:**
```http
GET /admin/dashboard
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "totalUsers": 6,
  "totalHouseholds": 20,
  "totalPredictions": 2400,
  "activeSessions": 3,
  "blockchainConfirmed": 50,
  "recentPredictions": [...],
  "systemHealth": "healthy"
}
```

---

## Health Endpoints

### Health Check

**Request:**
```http
GET /health
```

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-30T15:30:00Z",
  "service": "api-gateway"
}
```

### System Status

**Request:**
```http
GET /status
```

**Response (200):**
```json
{
  "status": "running",
  "database": "connected",
  "mqtt": "connected",
  "blockchain": {
    "currentBlock": 15000050,
    "totalBlocks": 51,
    "totalTransactions": 50,
    "contractAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f4e2E1",
    "network": "simulated"
  },
  "timestamp": "2024-12-30T15:30:00Z"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": "Error message description"
}
```

### Common HTTP Status Codes

- `200` - OK
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

---

## 5. Simulation Endpoints

### Publish Meter Data (HTTP Fallback)
Allows the simulator to push data via HTTP when MQTT is unavailable.

**Request:**
```http
POST /api/simulate
Content-Type: application/json

{
  "meterId": "household_12",
  "timestamp": "2024-12-30T15:30:00Z",
  "temperature": 12.5,
  "consumptionKwh": 0.45
}
```

**Response (200):**
```json
{
  "status": "received",
  "meterId": "household_12"
}
```

---

## 6. Blockchain Endpoints

### Verify Transaction
Cryptographically verifies a transaction hash against the ledger.

**Request:**
```http
GET /api/blockchain/verify/0x53a7dd412a38782983fd24e8e09cde40c65583b059e9e4bfa5afb64b59abc26b
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "valid": true,
  "blockNumber": 15000046,
  "timestamp": "2026-01-01T21:22:41.176Z",
  "predictionId": 24286
}
```

