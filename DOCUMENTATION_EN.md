# Scaffolding Route Management System - Complete Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Features](#features)
3. [Technologies](#technologies)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Application Access](#application-access)
7. [API Endpoints](#api-endpoints)
8. [CSV Format](#csv-format)
9. [Project Structure](#project-structure)
10. [Database - UML Model](#database---uml-model)
11. [Useful Commands](#useful-commands)
12. [Troubleshooting](#troubleshooting)
13. [Contributing](#contributing)

---

## Introduction

Scaffolding route management system with CSV file upload, interactive column mapping, and REST API for mobile applications. Allows managing scaffolding locations with geographic coordinates, operational status, and additional metadata.

---

## Features

- 📁 **CSV Upload** with drag & drop
- 🔄 **Automatic column mapping** with interactive visual interface
- 📊 **Dashboard** with real-time statistics
- 📈 **Progress bar** during file upload
- ⚠️ **Humanized error messages** in Spanish
- 🔐 **Authentication** with Laravel Breeze
- 🌐 **REST API** for mobile application consumption
- ⚡ **Optimized bulk insert** (500 records per batch)
- 🗺️ **Data visualization** with interactive table and map
- 🔍 **Advanced filters** by status, search, and date range
- 📄 **Pagination** with records per page options

---

## Technologies

- **Backend**: Laravel 11
- **Frontend**: React 18.2.0 + Inertia.js 2.0
- **Build Tool**: Vite 7.0.7
- **Database**: MySQL 8.0+
- **Styling**: Tailwind CSS
- **Maps**: Leaflet / React-Leaflet
- **Charts**: Recharts

---

## Prerequisites

Make sure you have installed:

- PHP >= 8.2
- Composer
- Node.js >= 18
- MySQL >= 8.0
- Git

---

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd scaffolding-app
```

### 2. Install PHP dependencies

```bash
composer install
```

### 3. Install Node.js dependencies

```bash
npm install
```

### 4. Configure environment file

```bash
cp .env.example .env
```

Edit the `.env` file and configure the database connection:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=scaffolding_db
DB_USERNAME=laravel_user
DB_PASSWORD=Laravel2024!
```

### 5. Generate application key

```bash
php artisan key:generate
```

### 6. Create database

Execute the following commands in MySQL:

```sql
CREATE DATABASE scaffolding_db;
CREATE USER 'laravel_user'@'localhost' IDENTIFIED BY 'Laravel2024!';
GRANT ALL PRIVILEGES ON scaffolding_db.* TO 'laravel_user'@'localhost';
FLUSH PRIVILEGES;
```

Or if you already have a configured root user:

```bash
mysql -u root -p -e "CREATE DATABASE scaffolding_db;"
```

### 7. Run migrations

```bash
php artisan migrate
```

### 8. Run seeders

This will create the default admin user:

```bash
php artisan db:seed
```

### 9. Compile assets

For production:

```bash
npm run build
```

For development with hot-reload:

```bash
npm run dev
```

### 10. Start the server

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

---

## Application Access

Once the server is running, access:

- **Login**: http://localhost:8000/login
- **Dashboard**: http://localhost:8000/dashboard

### Default credentials

- **Email**: `admin@scaffolding.com`
- **Password**: `password123`

---

## API Endpoints

### Authentication required

All endpoints require authentication via Laravel Sanctum.

### Statistics

```http
GET /api/v1/stats
```

**Response:**
```json
{
  "total_locations": 8465,
  "active_sites": 8465,
  "inactive_sites": 0,
  "maintenance_sites": 0,
  "api_status": "online",
  "coverage": 100
}
```

### List locations

```http
GET /api/v1/scaffolding_locations
```

**Optional parameters:**
- `status`: Filter by status (active, inactive, maintenance)
- `search`: Search by name or address

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Location 1",
      "latitude": -12.0464,
      "longitude": -77.0428,
      "address": "123 Example Ave",
      "status": "active",
      "notes": "Additional notes"
    }
  ]
}
```

### Get a location

```http
GET /api/v1/scaffolding_locations/{id}
```

### Create location

```http
POST /api/v1/scaffolding_locations
```

**Body:**
```json
{
  "name": "New location",
  "latitude": -12.0464,
  "longitude": -77.0428,
  "address": "123 Example Ave",
  "status": "active",
  "notes": "Additional notes"
}
```

### Update location

```http
PUT /api/v1/scaffolding_locations/{id}
```

### Delete location

```http
DELETE /api/v1/scaffolding_locations/{id}
```

### Upload CSV file

```http
POST /api/v1/analyze-csv
```

Analyzes CSV columns and returns automatic mapping.

**Body:** `multipart/form-data`
- `file`: CSV file

**Response:**
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

### Upload CSV with custom mapping

```http
POST /api/v1/upload-with-mapping
```

**Body:** `multipart/form-data`
- `file`: CSV file
- `mapping`: JSON with column mapping

**Mapping example:**
```json
{
  "name": 0,
  "latitude": 1,
  "longitude": 2,
  "address": 3,
  "status": 4,
  "notes": 5
}
```

---

## CSV Format

The CSV file must contain the following columns (can have different names, they are automatically mapped):

### Required columns:
- **name** (text): Location name
- **latitude** (decimal): Latitude
- **longitude** (decimal): Longitude

### Optional columns:
- **address** (text): Address
- **status** (enum): Status (active, inactive, maintenance)
- **notes** (text): Additional notes

### CSV example:

```csv
Job Number,Latitude Point,Longitude Point,Address,Status,Notes
"Location 1",-12.0464,-77.0428,"123 Example Ave",active,"First location"
"Location 2",-12.0500,-77.0500,"456 Test St",active,""
```

---

## Project Structure

```
scaffolding-app/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       └── ScaffoldingLocationController.php
│   │   └── Middleware/
│   │       └── DisableCache.php
│   ├── Models/
│   │   └── ScaffoldingLocation.php
│   └── Services/
│       └── CsvProcessingService.php
├── database/
│   ├── migrations/
│   │   └── 2024_11_06_000001_create_scaffolding_locations_table.php
│   └── seeders/
│       ├── AdminUserSeeder.php
│       └── DatabaseSeeder.php
├── resources/
│   ├── js/
│   │   ├── Components/
│   │   │   ├── ColumnMapper.jsx
│   │   │   ├── LocationsTable.jsx
│   │   │   └── LocationsMap.jsx
│   │   ├── Pages/
│   │   │   └── ScaffoldingDashboard.jsx
│   │   └── app.jsx
│   └── views/
│       └── app.blade.php
├── routes/
│   ├── api.php
│   └── web.php
└── public/
    └── build/
```

---

## Database - UML Model

### Entity Relationship Diagram (ERD)

```
┌─────────────────────────────────────────┐
│      scaffolding_locations              │
├─────────────────────────────────────────┤
│ PK  id: UUID                            │
├─────────────────────────────────────────┤
│     name: TEXT (NOT NULL)               │
│     latitude: DECIMAL(10,8) (NOT NULL)  │
│     longitude: DECIMAL(11,8) (NOT NULL) │
│     address: TEXT (DEFAULT: '')         │
│     status: TEXT (DEFAULT: 'active')    │
│        - CHECK: active|inactive|maint.. │
│     notes: TEXT (DEFAULT: '')           │
│     created_at: TIMESTAMPTZ (DEFAULT)   │
│     updated_at: TIMESTAMPTZ (DEFAULT)   │
└─────────────────────────────────────────┘
        ▲
        │ (1:1)
        │
        └──────────────────────┐
                               │
                               │
            ┌──────────────────────────────────────────┐
            │      uploaded_files                      │
            ├──────────────────────────────────────────┤
            │ PK  id: UUID                             │
            ├──────────────────────────────────────────┤
            │     filename: TEXT (NOT NULL)            │
            │     total_records: INTEGER (DEFAULT: 0)  │
            │     uploaded_at: TIMESTAMPTZ (DEFAULT)   │
            └──────────────────────────────────────────┘
```

---

### Detailed Entity Specifications

#### Table: `scaffolding_locations`

**Purpose:** Stores scaffolding locations with their geographic coordinates and status.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique scaffolding identifier |
| `name` | TEXT | NOT NULL | Name or scaffolding identifier |
| `latitude` | DECIMAL(10,8) | NOT NULL | Latitude coordinate |
| `longitude` | DECIMAL(11,8) | NOT NULL | Longitude coordinate |
| `address` | TEXT | DEFAULT '' | Complete physical address |
| `status` | TEXT | DEFAULT 'active', CHECK IN ('active', 'inactive', 'maintenance') | Operational status |
| `notes` | TEXT | DEFAULT '' | Additional notes |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Creation date |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Last update date |

**Indexes:**
- `idx_scaffolding_status` ON (status) - For status filtering
- `idx_scaffolding_created_at` ON (created_at) - For temporal ordering

**Triggers:**
- `update_scaffolding_updated_at` - Automatically updates `updated_at` on each modification

**Row Level Security (RLS):**
- Public read: `SELECT * WHERE TRUE`
- Anonymous insert: `INSERT WHERE TRUE`
- Anonymous update: `UPDATE WHERE TRUE`
- Anonymous delete: `DELETE WHERE TRUE`

---

#### Table: `uploaded_files`

**Purpose:** Records a history of uploaded Excel files and number of processed records.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique upload identifier |
| `filename` | TEXT | NOT NULL | Uploaded file name |
| `total_records` | INTEGER | DEFAULT 0 | Number of processed records |
| `uploaded_at` | TIMESTAMPTZ | DEFAULT now() | Upload date and time |

**Indexes:**
- None (small reference table)

**Row Level Security (RLS):**
- Public read: `SELECT * WHERE TRUE`
- Anonymous insert: `INSERT WHERE TRUE`

---

### UML Class Diagram

```
┌──────────────────────────────────────────────┐
│      ScaffoldingLocation                     │
├──────────────────────────────────────────────┤
│ - id: UUID                                   │
│ - name: string                               │
│ - latitude: decimal                          │
│ - longitude: decimal                         │
│ - address: string                            │
│ - status: 'active'|'inactive'|'maintenance'  │
│ - notes: string                              │
│ - createdAt: DateTime                        │
│ - updatedAt: DateTime                        │
├──────────────────────────────────────────────┤
│ + getId(): UUID                              │
│ + getName(): string                          │
│ + getCoordinates(): (lat, lng)               │
│ + getStatus(): string                        │
│ + setStatus(status: string): void            │
│ + getAddress(): string                       │
│ + setAddress(address: string): void          │
│ + getNotes(): string                         │
│ + setNotes(notes: string): void              │
│ + getCreatedAt(): DateTime                   │
│ + getUpdatedAt(): DateTime                   │
│ + isActive(): boolean                        │
│ + calculateDistance(lat, lng): number        │
└──────────────────────────────────────────────┘


┌──────────────────────────────────────────┐
│        UploadedFile                      │
├──────────────────────────────────────────┤
│ - id: UUID                               │
│ - filename: string                       │
│ - totalRecords: integer                  │
│ - uploadedAt: DateTime                   │
├──────────────────────────────────────────┤
│ + getId(): UUID                          │
│ + getFilename(): string                  │
│ + getTotalRecords(): integer             │
│ + getUploadedAt(): DateTime              │
│ + getUploadSummary(): string             │
└──────────────────────────────────────────┘
```

---

### Data Flow Diagram (DFD)

```
┌─────────────────┐
│   Mobile App    │
└────────┬────────┘
         │
         │ (HTTP GET)
         │ Fetch scaffolding locations
         ▼
    ┌────────────────┐
    │  REST API      │
    │  (Laravel)     │
    └────────┬───────┘
             │
             ▼
    ┌────────────────────────┐
    │  Auth & Validation     │
    │  (Laravel Sanctum)     │
    └────────┬───────────────┘
             │
             ▼
    ┌────────────────────────┐
    │  MySQL Database        │
    │  (Query Execution)     │
    └────────┬───────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │  scaffolding_locations     │
    │  (Records)                 │
    └────────┬───────────────────┘
             │
             │ (JSON Response)
             ▼
    ┌────────────────┐
    │   Mobile App   │
    │ (Display Map)  │
    └────────────────┘


┌─────────────────┐
│   Web Upload    │
│   Interface     │
└────────┬────────┘
         │
         │ (CSV File)
         ▼
    ┌────────────────┐
    │  CSV Parser    │
    │  (PHP)         │
    └────────┬───────┘
             │
             │ (Parsed Data)
             ▼
    ┌────────────────┐
    │  Validation    │
    │  (Lat/Lng)     │
    └────────┬───────┘
             │
             ▼
    ┌────────────────┐
    │  Bulk Insert   │
    │  (Laravel)     │
    └────────┬───────┘
             │
             ▼
    ┌────────────────────────┐
    │  scaffolding_locations │
    │  (INSERT batch)        │
    └────────┬───────────────┘
             │
             ▼
    ┌──────────────────┐
    │  uploaded_files  │
    │  (Log entry)     │
    └──────────────────┘
```

---

### Relationships and Cardinality

```
ScaffoldingLocation ──────────────────── UploadedFile
        │                                        │
        │ Many locations can come from          │
        │ the same file                         │
        │                                        │
   (1:N)─────────────────────────────────(1:1)
        │
        │ One location is tracked by
        │ ONE upload record (or none if
        │ created via API)
```

---

### Typical Query Patterns

#### 1. Get all active locations
```sql
SELECT * FROM scaffolding_locations
WHERE status = 'active'
ORDER BY created_at DESC;
```

#### 2. Search locations in coordinate range
```sql
SELECT * FROM scaffolding_locations
WHERE latitude BETWEEN 40.7 AND 40.8
  AND longitude BETWEEN -74.0 AND -73.9
  AND status = 'active';
```

#### 3. Get locations by area (near a point)
```sql
SELECT * FROM scaffolding_locations
WHERE status = 'active'
  AND latitude > 40.7 - 0.01
  AND latitude < 40.7 + 0.01
  AND longitude > -74.0 - 0.01
  AND longitude < -74.0 + 0.01;
```

#### 4. Upload history
```sql
SELECT * FROM uploaded_files
ORDER BY uploaded_at DESC
LIMIT 10;
```

#### 5. Statistics by status
```sql
SELECT status, COUNT(*) as count
FROM scaffolding_locations
GROUP BY status;
```

---

### Security Features

#### Row Level Security (RLS)
- ✅ All tables have RLS enabled
- ✅ Policies allow public read access
- ✅ Anonymous access for inserts (uploads)
- ✅ SQL injection protection via ORM

#### Indexes
- ✅ `idx_scaffolding_status` for fast filtering
- ✅ `idx_scaffolding_created_at` for ordering
- ✅ Improves performance on frequent queries

#### Data Integrity
- ✅ CHECK constraints on status
- ✅ NOT NULL on required fields
- ✅ UUIDs to avoid collisions
- ✅ Automatic timestamps

---

### Scalability Considerations

#### Table: scaffolding_locations
- **Expected size:** Millions of records
- **Read frequency:** Very high (mobile app)
- **Write frequency:** Low-medium (daily uploads)
- **Strategy:** Indexes on status and created_at, partition by date if necessary

#### Table: uploaded_files
- **Expected size:** Tens to hundreds
- **Purpose:** Audit and reference
- **Strategy:** No indexes needed, small size

---

### Trigger Function Configuration

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_scaffolding_updated_at
  BEFORE UPDATE ON scaffolding_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

**Purpose:** Automatically maintain the `updated_at` timestamp synchronized.

---

### Entity Summary

| Entity | Initial Records | Purpose |
|---------|----------------|---------|
| `scaffolding_locations` | Variable | Scaffolding geographic data |
| `uploaded_files` | Variable | Upload audit |

**Total data fields:** 13
**Total system columns:** 4 (id, created_at, updated_at, plus functions)
**Relationships:** 1 (conceptual, for audit)

---

## Useful Commands

### Development

```bash
# Start development server
php artisan serve

# Compile assets with hot-reload
npm run dev

# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# View available routes
php artisan route:list
```

### Production

```bash
# Compile assets for production
npm run build

# Optimize autoload
composer install --optimize-autoloader --no-dev

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Database

```bash
# Run migrations
php artisan migrate

# Rollback last migration
php artisan migrate:rollback

# Refresh database (WARNING: deletes all data)
php artisan migrate:fresh --seed

# Run seeders
php artisan db:seed
```

---

## Troubleshooting

### Blank screen after login

1. Clear browser cache (`Ctrl + Shift + Delete`)
2. Do a hard refresh (`Ctrl + Shift + R`)
3. Or open in incognito window

### Database connection error

1. Verify MySQL is running
2. Verify credentials in `.env`
3. Verify database exists

### Assets not loading

```bash
# Remove hot file if exists
rm public/hot

# Recompile assets
npm run build

# Clear Laravel cache
php artisan cache:clear
php artisan view:clear
```

### "Class not found" error

```bash
# Regenerate autoload
composer dump-autoload
```

---

## Contributing

1. Fork the project
2. Create a branch for your feature (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is under the MIT license.

---

## Contact

For questions or support, contact: [your-email@example.com]
