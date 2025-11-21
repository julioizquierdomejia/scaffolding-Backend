# Scaffolding Management System - Backend Technical Documentation

**Version:** 1.0.0
**Framework:** Laravel 11
**Language:** PHP 8.2+
**Database:** MySQL 8.0
**Authentication:** Laravel Sanctum
**API Type:** RESTful API

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Database Schema](#database-schema)
4. [Models](#models)
5. [Controllers](#controllers)
6. [Services](#services)
7. [API Endpoints](#api-endpoints)
8. [Authentication & Authorization](#authentication--authorization)
9. [Geographic Queries](#geographic-queries)
10. [CSV Import System](#csv-import-system)
11. [Error Handling](#error-handling)
12. [Performance Optimization](#performance-optimization)
13. [Deployment](#deployment)
14. [Environment Configuration](#environment-configuration)

---

## 1. System Architecture

### Overview
The Scaffolding Management System follows a **Model-View-Controller (MVC)** architecture pattern with **Service Layer** separation for business logic.

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                            │
│  (React/Inertia.js SPA + External API Consumers)            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Layer (Laravel)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           Authentication Middleware                   │   │
│  │      (Laravel Sanctum - Tokens & Sessions)           │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Controllers                          │   │
│  │  - ApiAuthController                                  │   │
│  │  - ScaffoldingLocationController                      │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Service Layer                            │   │
│  │  - CsvProcessingService (Business Logic)             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Model Layer (ORM)                        │   │
│  │  - ScaffoldingLocation                                │   │
│  │  - User                                               │   │
│  │  - ImportLog                                          │   │
│  │  - UploadedFile                                       │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                             │
│                    MySQL 8.0                                 │
│  - scaffolding_locations (with spatial indexes)             │
│  - users                                                     │
│  - import_logs                                               │
│  - uploaded_files                                            │
│  - personal_access_tokens                                    │
└─────────────────────────────────────────────────────────────┘
```

### Key Design Principles
- **Separation of Concerns:** Controllers handle HTTP, Services handle business logic
- **RESTful Design:** Standard HTTP methods and status codes
- **Stateless API:** Token-based authentication for external clients
- **Stateful Web:** Session-based authentication for SPA (Inertia.js)
- **Bulk Processing:** Efficient CSV imports using chunked inserts
- **Geographic Optimization:** Haversine formula for distance calculations

---

## 2. Technology Stack

### Backend Framework
- **Laravel 11.x** - PHP framework with Eloquent ORM
- **PHP 8.2+** - Modern PHP with type safety

### Database
- **MySQL 8.0** - Relational database with spatial indexing support
- **Spatial Indexes** - Optimized for geographic queries

### Authentication
- **Laravel Sanctum** - API token authentication
- **Laravel Breeze** - Session-based authentication for web interface

### API Documentation
- **OpenAPI 3.0** - Standardized API specification
- **Swagger UI** - Interactive API documentation

### Development Tools
- **Composer** - PHP dependency management
- **Artisan** - Laravel command-line tool
- **PHPUnit** - Unit testing framework

---

## 3. Database Schema

### 3.1 scaffolding_locations

Primary table storing scaffolding site information with geographic coordinates.

```sql
CREATE TABLE scaffolding_locations (
    id              UUID PRIMARY KEY,
    name            TEXT NOT NULL,
    latitude        DECIMAL(10, 8) NOT NULL,
    longitude       DECIMAL(11, 8) NOT NULL,
    address         TEXT NULL,
    status          ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
    notes           TEXT NULL,
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,

    INDEX idx_status (status),
    INDEX idx_coordinates (latitude, longitude),
    INDEX idx_created_at (created_at)
);
```

**Field Descriptions:**
- `id`: UUID primary key (RFC 4122)
- `name`: Scaffolding location identifier (e.g., Job Number)
- `latitude`: Geographic latitude (-90 to 90)
- `longitude`: Geographic longitude (-180 to 180)
- `address`: Full street address (optional)
- `status`: Operational status
- `notes`: Additional information or comments
- `created_at`: Record creation timestamp
- `updated_at`: Last modification timestamp

**Indexes:**
- Composite index on `(latitude, longitude)` for geographic queries
- Single index on `status` for filtering
- Single index on `created_at` for temporal queries

### 3.2 users

Authentication and user management.

```sql
CREATE TABLE users (
    id                 BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name               VARCHAR(255) NOT NULL,
    email              VARCHAR(255) NOT NULL UNIQUE,
    email_verified_at  TIMESTAMP NULL,
    password           VARCHAR(255) NOT NULL,
    remember_token     VARCHAR(100) NULL,
    created_at         TIMESTAMP NULL,
    updated_at         TIMESTAMP NULL
);
```

### 3.3 personal_access_tokens

Sanctum API tokens for external authentication.

```sql
CREATE TABLE personal_access_tokens (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    tokenable_type  VARCHAR(255) NOT NULL,
    tokenable_id    BIGINT UNSIGNED NOT NULL,
    name            VARCHAR(255) NOT NULL,
    token           VARCHAR(64) NOT NULL UNIQUE,
    abilities       TEXT NULL,
    last_used_at    TIMESTAMP NULL,
    expires_at      TIMESTAMP NULL,
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,

    INDEX idx_tokenable (tokenable_type, tokenable_id)
);
```

### 3.4 import_logs

Audit trail for CSV import operations.

```sql
CREATE TABLE import_logs (
    id                   BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id              BIGINT UNSIGNED NULL,
    filename             VARCHAR(255) NOT NULL,
    status               ENUM('completed', 'failed') NOT NULL,
    total_records        INTEGER NOT NULL DEFAULT 0,
    processed_records    INTEGER NOT NULL DEFAULT 0,
    failed_records       INTEGER NOT NULL DEFAULT 0,
    errors               JSON NULL,
    started_at           TIMESTAMP NULL,
    completed_at         TIMESTAMP NULL,
    created_at           TIMESTAMP NULL,
    updated_at           TIMESTAMP NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
```

### 3.5 uploaded_files

Metadata for uploaded CSV files.

```sql
CREATE TABLE uploaded_files (
    id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    filename        VARCHAR(255) NOT NULL,
    total_records   INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL
);
```

---

## 4. Models

### 4.1 ScaffoldingLocation

**File:** `app/Models/ScaffoldingLocation.php`

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ScaffoldingLocation extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'latitude',
        'longitude',
        'address',
        'status',
        'notes'
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];
}
```

**Features:**
- Uses UUID as primary key for distributed systems compatibility
- Mass-assignable fields for bulk inserts
- Type casting for precise decimal coordinates
- Eloquent ORM for database interactions

**Usage Example:**
```php
// Create new location
$location = ScaffoldingLocation::create([
    'name' => 'Site 001',
    'latitude' => 40.7580,
    'longitude' => -73.9855,
    'address' => '123 Main St, New York, NY',
    'status' => 'active',
    'notes' => 'Primary construction site'
]);

// Query by status
$activeLocations = ScaffoldingLocation::where('status', 'active')->get();

// Update status
$location->update(['status' => 'maintenance']);
```

### 4.2 User

**File:** `app/Models/User.php`

Standard Laravel user model with Sanctum integration for API tokens.

**Features:**
- Email-based authentication
- Password hashing (bcrypt)
- API token generation via Sanctum
- Email verification support

### 4.3 ImportLog

**File:** `app/Models/ImportLog.php`

Tracks CSV import operations for audit and troubleshooting.

**Relationships:**
- Belongs to User (optional, nullable for system imports)

### 4.4 UploadedFile

**File:** `app/Models/UploadedFile.php`

Metadata storage for uploaded CSV files.

---

## 5. Controllers

### 5.1 ApiAuthController

**File:** `app/Http/Controllers/Api/ApiAuthController.php`

**Responsibility:** Handle user authentication and token management

**Methods:**

#### `register(Request $request): JsonResponse`
Creates new user account and issues API token.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Response (201):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "1|AbCdEfGhIjKlMnOpQrStUvWxYz..."
}
```

#### `login(Request $request): JsonResponse`
Authenticates user and issues API token.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "2|XyZaBcDeFgHiJkLmNoPqRsTuVw..."
}
```

#### `logout(Request $request): JsonResponse`
Revokes current API token.

**Response (200):**
```json
{
  "message": "Logout successful"
}
```

#### `me(Request $request): JsonResponse`
Returns authenticated user information.

**Response (200):**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "email_verified_at": "2025-01-17T10:00:00Z",
    "created_at": "2025-01-17T10:00:00Z"
  }
}
```

### 5.2 ScaffoldingLocationController

**File:** `app/Http/Controllers/Api/ScaffoldingLocationController.php`

**Responsibility:** CRUD operations, CSV import, statistics, and geographic queries

**Methods:**

#### `index(): JsonResponse`
Returns all scaffolding locations ordered by creation date.

**Response (200):**
```json
[
  {
    "id": "9c8e7f6a-5b4d-3c2a-1e0d-9f8e7d6c5b4a",
    "name": "Site 001",
    "latitude": "40.75800000",
    "longitude": "-73.98550000",
    "address": "123 Main St, New York, NY",
    "status": "active",
    "notes": "Primary site",
    "created_at": "2025-01-17T10:00:00Z",
    "updated_at": "2025-01-17T10:00:00Z"
  }
]
```

#### `scaffolds(Request $request): JsonResponse`
Advanced geographic filtering with radius or bounding box.

**Query Parameters:**

**Radius Filter:**
- `lat` (float): Center latitude
- `lng` (float): Center longitude
- `radius` (float): Search radius in kilometers

**Example Request:**
```
GET /api/v1/scaffolds?lat=40.7580&lng=-73.9855&radius=5
```

**Response (200):**
```json
[
  {
    "id": 1,
    "lat": 40.7580,
    "lng": -73.9855,
    "address": "123 Main St",
    "distance": 0.0
  },
  {
    "id": 2,
    "lat": 40.7600,
    "lng": -73.9800,
    "address": "456 Broadway",
    "distance": 0.52
  }
]
```

**Bounding Box Filter:**
- `minLat` (float): Minimum latitude
- `maxLat` (float): Maximum latitude
- `minLng` (float): Minimum longitude
- `maxLng` (float): Maximum longitude

**Example Request:**
```
GET /api/v1/scaffolds?minLat=40.70&maxLat=40.80&minLng=-74.02&maxLng=-73.93
```

#### `store(Request $request): JsonResponse`
Creates new scaffolding location.

**Request:**
```json
{
  "name": "New Site",
  "latitude": 40.7580,
  "longitude": -73.9855,
  "address": "789 Park Ave",
  "status": "active",
  "notes": "New construction"
}
```

**Response (201):**
Returns created location object.

#### `show($id): JsonResponse`
Retrieves single location by ID.

**Response (200):**
Returns location object.

**Response (404):**
```json
{
  "message": "No query results for model [App\\Models\\ScaffoldingLocation] {id}"
}
```

#### `update(Request $request, $id): JsonResponse`
Updates existing location.

**Request:**
```json
{
  "status": "maintenance",
  "notes": "Under repair"
}
```

**Response (200):**
Returns updated location object.

#### `destroy($id): JsonResponse`
Deletes location.

**Response (204):**
No content.

#### `stats(): JsonResponse`
Returns system statistics.

**Response (200):**
```json
{
  "total_locations": 8465,
  "active_sites": 8465,
  "inactive_sites": 0,
  "maintenance_sites": 0,
  "api_status": "online",
  "coverage": 100.0
}
```

#### `analyzeCsv(Request $request): JsonResponse`
Analyzes CSV file headers and suggests column mapping.

**Request:**
```
POST /api/v1/analyze-csv
Content-Type: multipart/form-data

file: [CSV file]
```

**Response (200):**
```json
{
  "csv_headers": ["Job Number", "Latitude Point", "Longitude Point"],
  "db_columns": [
    {"name": "name", "type": "text", "required": true},
    {"name": "latitude", "type": "decimal", "required": true},
    {"name": "longitude", "type": "decimal", "required": true}
  ],
  "auto_mapping": {
    "name": 0,
    "latitude": 1,
    "longitude": 2
  },
  "requires_manual_mapping": false
}
```

#### `uploadWithMapping(Request $request): JsonResponse`
Imports CSV with custom column mapping.

**Request:**
```
POST /api/v1/upload-with-mapping
Content-Type: multipart/form-data

file: [CSV file]
mapping: {"name": 0, "latitude": 1, "longitude": 2}
```

**Response (200):**
```json
{
  "message": "File uploaded successfully",
  "data": {
    "processed": 8465,
    "errors": [],
    "upload_id": 1
  }
}
```

#### `importLogs(): JsonResponse`
Returns last 50 import operations.

**Response (200):**
```json
[
  {
    "id": 1,
    "filename": "scaffolds.csv",
    "status": "completed",
    "total_records": 8500,
    "processed_records": 8465,
    "failed_records": 35,
    "started_at": "2025-01-17T10:00:00Z",
    "completed_at": "2025-01-17T10:00:15Z"
  }
]
```

---

## 6. Services

### 6.1 CsvProcessingService

**File:** `app/Services/CsvProcessingService.php`

**Responsibility:** High-performance CSV parsing and bulk database insertion

**Constants:**
- `CHUNK_SIZE = 500` - Records per batch insert

**Methods:**

#### `processCsv(UploadedFile $file): array`
Processes CSV with hardcoded NYC Open Data format.

**Features:**
- Automatic column detection for NYC scaffolding data
- Address concatenation from multiple fields
- Status normalization (Permit Entire → active)
- Zero-coordinate filtering
- Chunked inserts for memory efficiency
- Error collection without halting process

**Algorithm:**
```
1. Open CSV file
2. Read header row
3. Identify column indexes for expected fields
4. For each data row:
   a. Parse latitude/longitude
   b. Skip if coordinates are zero or empty
   c. Concatenate address from House Number, Street Name, Borough
   d. Map status to enum values
   e. Add to batch array
   f. If batch size reaches 500, insert to database
5. Insert remaining records
6. Return processed count and errors
```

**Performance:**
- ~1,700 records/second on standard hardware
- Memory-efficient streaming (no full file load)
- Transaction safety with rollback on errors

#### `processCsvWithMapping(UploadedFile $file, array $mapping): array`
Processes CSV with user-defined column mapping.

**Parameters:**
- `$file`: Uploaded CSV file
- `$mapping`: Associative array mapping DB columns to CSV indexes
  ```php
  [
      'name' => 0,        // CSV column 0 maps to DB 'name'
      'latitude' => 1,    // CSV column 1 maps to DB 'latitude'
      'longitude' => 2,   // CSV column 2 maps to DB 'longitude'
      'address' => 3,     // CSV column 3 maps to DB 'address'
      'status' => 4,      // CSV column 4 maps to DB 'status'
      'notes' => 5        // CSV column 5 maps to DB 'notes'
  ]
  ```

**Intelligent Address Handling:**
1. Searches for "House Number", "Street Name", "Borough Name" columns
2. If found, concatenates into single address
3. Otherwise, uses mapped `address` column
4. Provides flexibility for different CSV formats

---

## 7. API Endpoints

### Base URL
- **Production:** `http://157.245.189.216/api/v1`
- **Local:** `http://localhost:8000/api/v1`

### Authentication Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/register` | No | Register new user |
| POST | `/login` | No | User login |
| POST | `/logout` | Yes | User logout |
| GET | `/me` | Yes | Get current user |

### Scaffolding Location Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/scaffolding_locations` | Yes | List all locations |
| POST | `/scaffolding_locations` | Yes | Create location |
| GET | `/scaffolding_locations/{id}` | Yes | Get location by ID |
| PUT | `/scaffolding_locations/{id}` | Yes | Update location |
| DELETE | `/scaffolding_locations/{id}` | Yes | Delete location |

### Geographic Query Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/scaffolds` | Yes | Query with geographic filters |
| GET | `/scaffolds?lat={lat}&lng={lng}&radius={km}` | Yes | Radius search |
| GET | `/scaffolds?minLat={lat}&maxLat={lat}&minLng={lng}&maxLng={lng}` | Yes | Bounding box search |

### CSV Import Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/analyze-csv` | Yes | Analyze CSV structure |
| POST | `/upload-with-mapping` | Yes | Import with mapping |
| GET | `/import-logs` | Yes | Import history |

### Statistics Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/stats` | Yes | System statistics |

---

## 8. Authentication & Authorization

### Dual Authentication Strategy

The system supports two authentication methods:

#### 8.1 Token-Based (External API Clients)

**Used by:** Mobile apps, third-party integrations, testing tools (Postman)

**Flow:**
```
1. Client: POST /api/v1/login
   Body: {"email": "user@example.com", "password": "secret"}

2. Server: Validates credentials
   - Hash comparison
   - User lookup

3. Server: Generates token
   - Creates entry in personal_access_tokens table
   - Returns token string

4. Client: Stores token

5. Client: Subsequent requests
   Header: Authorization: Bearer {token}

6. Server: Validates token on each request
   - Token lookup in database
   - Expiry check
   - Ability verification
```

**Token Format:**
```
{id}|{hash}
Example: 1|AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

**Token Storage:**
```sql
SELECT * FROM personal_access_tokens WHERE token = 'hashed_token';
```

#### 8.2 Session-Based (SPA Web Interface)

**Used by:** React/Inertia.js frontend

**Flow:**
```
1. User: Logs in via Laravel Breeze
2. Server: Creates session, sets HTTP-only cookie
3. Frontend: Makes API calls with session cookie
4. Server: EnsureFrontendRequestsAreStateful middleware recognizes SPA
5. Server: Uses session instead of token for auth
```

**Configuration:**
```php
// config/sanctum.php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1,157.245.189.216')),
```

### Middleware Stack

**API Routes:**
```php
Route::middleware('auth:sanctum')->group(function () {
    // Protected endpoints
});
```

**Middleware Order:**
```
1. EnsureFrontendRequestsAreStateful (checks if request from SPA)
2. auth:sanctum (validates token or session)
3. Controller action
```

### CSRF Protection

- **API routes:** Exempt from CSRF (token-based auth)
- **Web routes:** CSRF token required (session-based auth)

**Configuration:**
```php
// bootstrap/app.php
$middleware->validateCsrfTokens(except: [
    'api/*',  // All API routes exempt
]);
```

---

## 9. Geographic Queries

### 9.1 Haversine Distance Formula

Used for radius-based searches to calculate great-circle distance between two points on Earth.

**Formula:**
```
a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlong/2)
c = 2 * atan2(√a, √(1−a))
distance = R * c

Where:
  R = Earth's radius (6371 km)
  Δlat = lat2 - lat1 (in radians)
  Δlong = long2 - long1 (in radians)
```

**SQL Implementation:**
```sql
SELECT
    id,
    latitude as lat,
    longitude as lng,
    address,
    (6371 * acos(
        cos(radians(:centerLat)) * cos(radians(latitude)) *
        cos(radians(longitude) - radians(:centerLng)) +
        sin(radians(:centerLat)) * sin(radians(latitude))
    )) AS distance
FROM scaffolding_locations
HAVING distance <= :radius
ORDER BY distance ASC;
```

**Performance:**
- O(n) time complexity (full table scan)
- Optimized with coordinate indexes
- ~50ms for 10,000 records on indexed table

### 9.2 Bounding Box Filtering

Rectangular area filtering using latitude/longitude boundaries.

**SQL Implementation:**
```sql
SELECT id, latitude as lat, longitude as lng, address
FROM scaffolding_locations
WHERE latitude BETWEEN :minLat AND :maxLat
  AND longitude BETWEEN :minLng AND :maxLng
ORDER BY created_at DESC;
```

**Performance:**
- O(log n) with composite index
- ~5ms for 10,000 records with index
- Much faster than radius search

**Index:**
```sql
CREATE INDEX idx_coordinates ON scaffolding_locations(latitude, longitude);
```

---

## 10. CSV Import System

### 10.1 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      User Upload                             │
│                   (CSV File via HTTP)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   analyze-csv Endpoint                       │
│  1. Read headers                                             │
│  2. Detect column types                                      │
│  3. Auto-match with aliases                                  │
│  4. Return suggested mapping                                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  User Reviews Mapping                        │
│              (Frontend ColumnMapper UI)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              upload-with-mapping Endpoint                    │
│  1. Validate mapping completeness                            │
│  2. Stream CSV row by row                                    │
│  3. Transform data per mapping                               │
│  4. Batch insert (500 records/batch)                         │
│  5. Log results to import_logs                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Insert                           │
│            (Bulk INSERT with UUIDs)                          │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Column Mapping Aliases

**Purpose:** Recognize common variations of column names from different data sources.

```php
$aliases = [
    'name' => [
        'name', 'job number', 'job_number',
        'location', 'location_name', 'site_name', 'site'
    ],
    'latitude' => [
        'latitude', 'lat', 'latitude point', 'latitude_point'
    ],
    'longitude' => [
        'longitude', 'lng', 'lon', 'long',
        'longitude point', 'longitude_point'
    ],
    'address' => [
        'address', 'full address', 'full_address',
        'street', 'location_address',
        'house number', 'street name', 'borough name'
    ],
    'status' => [
        'status', 'current job status',
        'current_job_status', 'job_status', 'state'
    ],
    'notes' => [
        'notes', 'note', 'comments',
        'comment', 'description', 'remarks'
    ]
];
```

### 10.3 Status Normalization

Maps various status formats to standard enum values:

```php
$statusMap = [
    'Permit Entire' => 'active',
    'Active' => 'active',
    'Inactive' => 'inactive',
    'Maintenance' => 'maintenance'
];
```

### 10.4 Error Handling

**Non-Blocking Errors:**
- Invalid coordinates (lat=0, lng=0)
- Missing required fields
- Type conversion failures

**Behavior:**
- Skip invalid row
- Continue processing
- Log error with row number
- Return summary at end

**Error Response:**
```json
{
  "message": "File uploaded successfully",
  "data": {
    "processed": 8465,
    "errors": [
      {
        "row": 47,
        "error": "Invalid coordinates: (0, 0)"
      },
      {
        "row": 152,
        "error": "Missing required field: latitude"
      }
    ],
    "upload_id": 1
  }
}
```

### 10.5 Performance Benchmarks

| Records | Time | Speed | Memory |
|---------|------|-------|--------|
| 1,000 | 0.6s | 1,667/s | 8 MB |
| 5,000 | 3.0s | 1,667/s | 10 MB |
| 10,000 | 6.0s | 1,667/s | 12 MB |
| 50,000 | 30.0s | 1,667/s | 15 MB |

**Optimizations:**
- Streaming file reading (no memory load)
- Chunked inserts (500 at a time)
- Single database transaction
- Prepared UUID generation

---

## 11. Error Handling

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT requests |
| 201 | Created | Successful POST creating resource |
| 204 | No Content | Successful DELETE |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

### Validation Errors (422)

**Format:**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "latitude": [
      "The latitude must be between -90 and 90."
    ],
    "longitude": [
      "The longitude must be between -180 and 180."
    ],
    "status": [
      "The selected status is invalid."
    ]
  }
}
```

### Authentication Errors (401)

**Token Missing:**
```json
{
  "message": "Unauthenticated."
}
```

**Token Invalid:**
```json
{
  "message": "Unauthenticated. Please provide a valid token."
}
```

### Server Errors (500)

**Format:**
```json
{
  "message": "Error processing file",
  "error": "Detailed error message for debugging"
}
```

**Logging:**
All 500 errors are logged to Laravel log files with full stack traces.

---

## 12. Performance Optimization

### 12.1 Database Indexes

```sql
-- Geographic queries
CREATE INDEX idx_coordinates ON scaffolding_locations(latitude, longitude);

-- Status filtering
CREATE INDEX idx_status ON scaffolding_locations(status);

-- Temporal queries
CREATE INDEX idx_created_at ON scaffolding_locations(created_at);

-- Authentication lookups
CREATE INDEX idx_tokenable ON personal_access_tokens(tokenable_type, tokenable_id);
```

### 12.2 Query Optimization

**Eager Loading:**
```php
// Avoid N+1 queries
$logs = ImportLog::with('user')->get();  // ✓ Single query per table

// Avoid
$logs = ImportLog::all();
foreach ($logs as $log) {
    $user = $log->user;  // ✗ Query per iteration
}
```

**Chunked Results:**
```php
// Memory-efficient for large datasets
ScaffoldingLocation::chunk(500, function ($locations) {
    foreach ($locations as $location) {
        // Process
    }
});
```

### 12.3 Caching Strategy

**Configuration Cache:**
```bash
php artisan config:cache
```

**Route Cache:**
```bash
php artisan route:cache
```

**View Cache:**
```bash
php artisan view:cache
```

### 12.4 Bulk Operations

**Bulk Insert:**
```php
// ✓ Single query, 500 records
DB::table('scaffolding_locations')->insert($batch);

// ✗ 500 queries
foreach ($records as $record) {
    ScaffoldingLocation::create($record);
}
```

**Performance Gain:** ~100x faster for large datasets

---

## 13. Deployment

### 13.1 Server Requirements

- **PHP:** 8.2 or higher
- **MySQL:** 8.0 or higher
- **Composer:** 2.x
- **Node.js:** 18.x (for frontend assets)
- **Nginx/Apache:** Web server
- **SSL Certificate:** Required for production

### 13.2 Environment Setup

**1. Clone Repository:**
```bash
git clone <repository-url>
cd scaffolding-app
```

**2. Install Dependencies:**
```bash
composer install --optimize-autoloader --no-dev
```

**3. Configure Environment:**
```bash
cp .env.example .env
php artisan key:generate
```

**4. Database Migration:**
```bash
php artisan migrate --force
```

**5. Run Seeders (Optional):**
```bash
php artisan db:seed --class=ScaffoldingLocationSeeder
```

**6. Optimize for Production:**
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

**7. Set Permissions:**
```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 13.3 Web Server Configuration

**Nginx:**
```nginx
server {
    listen 80;
    server_name 157.245.189.216;
    root /var/www/scaffolding/scaffolding-app/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

### 13.4 Deployment Checklist

- [ ] Set `APP_ENV=production`
- [ ] Set `APP_DEBUG=false`
- [ ] Configure `APP_URL` correctly
- [ ] Set secure `APP_KEY`
- [ ] Configure database credentials
- [ ] Set `SANCTUM_STATEFUL_DOMAINS`
- [ ] Enable HTTPS
- [ ] Set up backups
- [ ] Configure monitoring
- [ ] Test all API endpoints
- [ ] Review logs for errors

---

## 14. Environment Configuration

### Required Variables

```env
# Application
APP_NAME="Scaffolding Management System"
APP_ENV=production
APP_KEY=base64:GeneratedKeyHere
APP_DEBUG=false
APP_URL=http://157.245.189.216

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=scaffolding
DB_USERNAME=laravel_user
DB_PASSWORD=SecurePasswordHere

# Sanctum
SANCTUM_STATEFUL_DOMAINS=157.245.189.216,localhost

# Session
SESSION_DRIVER=file
SESSION_LIFETIME=120

# Queue
QUEUE_CONNECTION=sync

# Cache
CACHE_DRIVER=file

# Mail (if using)
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@scaffolding.com
MAIL_FROM_NAME="${APP_NAME}"
```

### Security Considerations

- **Never commit `.env` to version control**
- Use strong, unique passwords
- Rotate `APP_KEY` periodically
- Use HTTPS in production
- Enable rate limiting
- Regular security updates

---

## Appendix A: API Request Examples

### cURL Examples

**Login:**
```bash
curl -X POST http://157.245.189.216/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Get Locations (with token):**
```bash
curl -X GET http://157.245.189.216/api/v1/scaffolding_locations \
  -H "Authorization: Bearer 1|AbCdEfGh..."
```

**Create Location:**
```bash
curl -X POST http://157.245.189.216/api/v1/scaffolding_locations \
  -H "Authorization: Bearer 1|AbCdEfGh..." \
  -H "Content-Type: application/json" \
  -d '{
    "name":"New Site",
    "latitude":40.7580,
    "longitude":-73.9855,
    "status":"active"
  }'
```

**Radius Search:**
```bash
curl -X GET "http://157.245.189.216/api/v1/scaffolds?lat=40.7580&lng=-73.9855&radius=5" \
  -H "Authorization: Bearer 1|AbCdEfGh..."
```

---

## Appendix B: Database Seeder

**File:** `database/seeders/ScaffoldingLocationSeeder.php`

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ScaffoldingLocation;

class ScaffoldingLocationSeeder extends Seeder
{
    public function run(): void
    {
        // Sample data for testing
        $locations = [
            [
                'name' => 'Times Square Site',
                'latitude' => 40.7580,
                'longitude' => -73.9855,
                'address' => '1 Times Square, New York, NY 10036',
                'status' => 'active',
                'notes' => 'High-traffic area'
            ],
            [
                'name' => 'Central Park Site',
                'latitude' => 40.7829,
                'longitude' => -73.9654,
                'address' => 'Central Park, New York, NY',
                'status' => 'maintenance',
                'notes' => 'Routine inspection scheduled'
            ],
            // Add more test data as needed
        ];

        foreach ($locations as $location) {
            ScaffoldingLocation::create($location);
        }
    }
}
```

---

## Appendix C: Testing

### Unit Tests

**File:** `tests/Unit/ScaffoldingLocationTest.php`

```php
<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\ScaffoldingLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ScaffoldingLocationTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_location()
    {
        $location = ScaffoldingLocation::create([
            'name' => 'Test Site',
            'latitude' => 40.7580,
            'longitude' => -73.9855,
            'status' => 'active'
        ]);

        $this->assertDatabaseHas('scaffolding_locations', [
            'name' => 'Test Site',
            'latitude' => 40.7580
        ]);
    }

    public function test_coordinates_are_cast_to_decimal()
    {
        $location = ScaffoldingLocation::create([
            'name' => 'Test Site',
            'latitude' => '40.75800000',
            'longitude' => '-73.98550000',
            'status' => 'active'
        ]);

        $this->assertIsFloat($location->latitude);
        $this->assertIsFloat($location->longitude);
    }
}
```

### Feature Tests

**File:** `tests/Feature/ApiAuthTest.php`

```php
<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class ApiAuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register()
    {
        $response = $this->postJson('/api/v1/register', [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ]);

        $response->assertStatus(201)
                 ->assertJsonStructure(['message', 'user', 'token']);
    }

    public function test_user_can_login()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password123')
        ]);

        $response = $this->postJson('/api/v1/login', [
            'email' => 'test@example.com',
            'password' => 'password123'
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure(['message', 'user', 'token']);
    }
}
```

---

## Appendix D: Maintenance Commands

### Clear Caches
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Database Maintenance
```bash
# Run migrations
php artisan migrate

# Rollback last migration
php artisan migrate:rollback

# Reset database
php artisan migrate:fresh

# Seed database
php artisan db:seed
```

### Queue Management
```bash
# Process queue jobs
php artisan queue:work

# List failed jobs
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all
```

### Monitoring
```bash
# View logs
tail -f storage/logs/laravel.log

# Check routes
php artisan route:list

# Check database connection
php artisan db:show
```

---

**Document Version:** 1.0.0
**Last Updated:** January 2025
**Author:** Development Team
**License:** Proprietary
