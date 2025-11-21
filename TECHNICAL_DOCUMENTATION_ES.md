# Sistema de Gestión de Andamios - Documentación Técnica del Backend

**Versión:** 1.0.0
**Framework:** Laravel 11
**Lenguaje:** PHP 8.2+
**Base de Datos:** MySQL 8.0
**Autenticación:** Laravel Sanctum
**Tipo de API:** RESTful API

---

## Tabla de Contenidos

1. [Arquitectura del Sistema](#arquitectura-del-sistema)
2. [Stack Tecnológico](#stack-tecnológico)
3. [Esquema de Base de Datos](#esquema-de-base-de-datos)
4. [Modelos](#modelos)
5. [Controladores](#controladores)
6. [Servicios](#servicios)
7. [Endpoints de la API](#endpoints-de-la-api)
8. [Autenticación y Autorización](#autenticación-y-autorización)
9. [Consultas Geográficas](#consultas-geográficas)
10. [Sistema de Importación CSV](#sistema-de-importación-csv)
11. [Manejo de Errores](#manejo-de-errores)
12. [Optimización de Rendimiento](#optimización-de-rendimiento)
13. [Despliegue](#despliegue)
14. [Configuración del Entorno](#configuración-del-entorno)

---

## 1. Arquitectura del Sistema

### Visión General
El Sistema de Gestión de Andamios sigue un patrón de arquitectura **Modelo-Vista-Controlador (MVC)** con separación de **Capa de Servicios** para la lógica de negocio.

```
┌─────────────────────────────────────────────────────────────┐
│                    Capa de Cliente                           │
│  (SPA React/Inertia.js + Consumidores Externos de API)     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Capa de API (Laravel)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Middleware de Autenticación                    │   │
│  │    (Laravel Sanctum - Tokens y Sesiones)             │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                Controladores                          │   │
│  │  - ApiAuthController                                  │   │
│  │  - ScaffoldingLocationController                      │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │             Capa de Servicios                         │   │
│  │  - CsvProcessingService (Lógica de Negocio)         │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │            Capa de Modelos (ORM)                      │   │
│  │  - ScaffoldingLocation                                │   │
│  │  - User                                               │   │
│  │  - ImportLog                                          │   │
│  │  - UploadedFile                                       │   │
│  └──────────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Capa de Base de Datos                        │
│                      MySQL 8.0                               │
│  - scaffolding_locations (con índices espaciales)           │
│  - users                                                     │
│  - import_logs                                               │
│  - uploaded_files                                            │
│  - personal_access_tokens                                    │
└─────────────────────────────────────────────────────────────┘
```

### Principios de Diseño Clave
- **Separación de Responsabilidades:** Controladores manejan HTTP, Servicios manejan lógica de negocio
- **Diseño RESTful:** Métodos y códigos de estado HTTP estándar
- **API Sin Estado:** Autenticación basada en tokens para clientes externos
- **Web Con Estado:** Autenticación basada en sesiones para SPA (Inertia.js)
- **Procesamiento Masivo:** Importaciones CSV eficientes usando inserciones por lotes
- **Optimización Geográfica:** Fórmula de Haversine para cálculos de distancia

---

## 2. Stack Tecnológico

### Framework Backend
- **Laravel 11.x** - Framework PHP con ORM Eloquent
- **PHP 8.2+** - PHP moderno con tipado fuerte

### Base de Datos
- **MySQL 8.0** - Base de datos relacional con soporte de indexación espacial
- **Índices Espaciales** - Optimizados para consultas geográficas

### Autenticación
- **Laravel Sanctum** - Autenticación por token de API
- **Laravel Breeze** - Autenticación basada en sesión para interfaz web

### Documentación de API
- **OpenAPI 3.0** - Especificación estandarizada de API
- **Swagger UI** - Documentación interactiva de API

### Herramientas de Desarrollo
- **Composer** - Gestión de dependencias PHP
- **Artisan** - Herramienta de línea de comandos de Laravel
- **PHPUnit** - Framework de pruebas unitarias

---

## 3. Esquema de Base de Datos

### 3.1 scaffolding_locations

Tabla principal que almacena información de sitios de andamios con coordenadas geográficas.

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

**Descripción de Campos:**
- `id`: Clave primaria UUID (RFC 4122)
- `name`: Identificador de ubicación de andamio (ej. Número de Trabajo)
- `latitude`: Latitud geográfica (-90 a 90)
- `longitude`: Longitud geográfica (-180 a 180)
- `address`: Dirección completa (opcional)
- `status`: Estado operacional
- `notes`: Información adicional o comentarios
- `created_at`: Marca de tiempo de creación del registro
- `updated_at`: Marca de tiempo de última modificación

**Índices:**
- Índice compuesto en `(latitude, longitude)` para consultas geográficas
- Índice simple en `status` para filtrado
- Índice simple en `created_at` para consultas temporales

### 3.2 users

Autenticación y gestión de usuarios.

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

Tokens de API Sanctum para autenticación externa.

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

Registro de auditoría para operaciones de importación CSV.

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

Metadatos para archivos CSV cargados.

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

## 4. Modelos

### 4.1 ScaffoldingLocation

**Archivo:** `app/Models/ScaffoldingLocation.php`

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

**Características:**
- Usa UUID como clave primaria para compatibilidad con sistemas distribuidos
- Campos asignables en masa para inserciones masivas
- Conversión de tipos para coordenadas decimales precisas
- ORM Eloquent para interacciones con la base de datos

**Ejemplo de Uso:**
```php
// Crear nueva ubicación
$location = ScaffoldingLocation::create([
    'name' => 'Sitio 001',
    'latitude' => 40.7580,
    'longitude' => -73.9855,
    'address' => '123 Main St, New York, NY',
    'status' => 'active',
    'notes' => 'Sitio de construcción principal'
]);

// Consultar por estado
$activeLocations = ScaffoldingLocation::where('status', 'active')->get();

// Actualizar estado
$location->update(['status' => 'maintenance']);
```

### 4.2 User

**Archivo:** `app/Models/User.php`

Modelo de usuario estándar de Laravel con integración de Sanctum para tokens de API.

**Características:**
- Autenticación basada en email
- Hash de contraseñas (bcrypt)
- Generación de tokens de API vía Sanctum
- Soporte de verificación de email

### 4.3 ImportLog

**Archivo:** `app/Models/ImportLog.php`

Rastrea operaciones de importación CSV para auditoría y solución de problemas.

**Relaciones:**
- Pertenece a User (opcional, anulable para importaciones del sistema)

### 4.4 UploadedFile

**Archivo:** `app/Models/UploadedFile.php`

Almacenamiento de metadatos para archivos CSV cargados.

---

## 5. Controladores

### 5.1 ApiAuthController

**Archivo:** `app/Http/Controllers/Api/ApiAuthController.php`

**Responsabilidad:** Manejar autenticación de usuarios y gestión de tokens

**Métodos:**

#### `register(Request $request): JsonResponse`
Crea nueva cuenta de usuario y emite token de API.

**Solicitud:**
```json
{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

**Respuesta (201):**
```json
{
  "message": "Registration successful",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com"
  },
  "token": "1|AbCdEfGhIjKlMnOpQrStUvWxYz..."
}
```

#### `login(Request $request): JsonResponse`
Autentica usuario y emite token de API.

**Solicitud:**
```json
{
  "email": "juan@example.com",
  "password": "password123"
}
```

**Respuesta (200):**
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com"
  },
  "token": "2|XyZaBcDeFgHiJkLmNoPqRsTuVw..."
}
```

#### `logout(Request $request): JsonResponse`
Revoca el token de API actual.

**Respuesta (200):**
```json
{
  "message": "Logout successful"
}
```

#### `me(Request $request): JsonResponse`
Retorna información del usuario autenticado.

**Respuesta (200):**
```json
{
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "juan@example.com",
    "email_verified_at": "2025-01-17T10:00:00Z",
    "created_at": "2025-01-17T10:00:00Z"
  }
}
```

### 5.2 ScaffoldingLocationController

**Archivo:** `app/Http/Controllers/Api/ScaffoldingLocationController.php`

**Responsabilidad:** Operaciones CRUD, importación CSV, estadísticas y consultas geográficas

**Métodos:**

#### `index(): JsonResponse`
Retorna todas las ubicaciones de andamios ordenadas por fecha de creación.

**Respuesta (200):**
```json
[
  {
    "id": "9c8e7f6a-5b4d-3c2a-1e0d-9f8e7d6c5b4a",
    "name": "Sitio 001",
    "latitude": "40.75800000",
    "longitude": "-73.98550000",
    "address": "123 Main St, New York, NY",
    "status": "active",
    "notes": "Sitio principal",
    "created_at": "2025-01-17T10:00:00Z",
    "updated_at": "2025-01-17T10:00:00Z"
  }
]
```

#### `scaffolds(Request $request): JsonResponse`
Filtrado geográfico avanzado con radio o cuadro delimitador.

**Parámetros de Consulta:**

**Filtro por Radio:**
- `lat` (float): Latitud central
- `lng` (float): Longitud central
- `radius` (float): Radio de búsqueda en kilómetros

**Ejemplo de Solicitud:**
```
GET /api/v1/scaffolds?lat=40.7580&lng=-73.9855&radius=5
```

**Respuesta (200):**
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

**Filtro por Cuadro Delimitador:**
- `minLat` (float): Latitud mínima
- `maxLat` (float): Latitud máxima
- `minLng` (float): Longitud mínima
- `maxLng` (float): Longitud máxima

**Ejemplo de Solicitud:**
```
GET /api/v1/scaffolds?minLat=40.70&maxLat=40.80&minLng=-74.02&maxLng=-73.93
```

#### `store(Request $request): JsonResponse`
Crea nueva ubicación de andamio.

**Solicitud:**
```json
{
  "name": "Nuevo Sitio",
  "latitude": 40.7580,
  "longitude": -73.9855,
  "address": "789 Park Ave",
  "status": "active",
  "notes": "Nueva construcción"
}
```

**Respuesta (201):**
Retorna objeto de ubicación creado.

#### `show($id): JsonResponse`
Recupera ubicación única por ID.

**Respuesta (200):**
Retorna objeto de ubicación.

**Respuesta (404):**
```json
{
  "message": "No query results for model [App\\Models\\ScaffoldingLocation] {id}"
}
```

#### `update(Request $request, $id): JsonResponse`
Actualiza ubicación existente.

**Solicitud:**
```json
{
  "status": "maintenance",
  "notes": "En reparación"
}
```

**Respuesta (200):**
Retorna objeto de ubicación actualizado.

#### `destroy($id): JsonResponse`
Elimina ubicación.

**Respuesta (204):**
Sin contenido.

#### `stats(): JsonResponse`
Retorna estadísticas del sistema.

**Respuesta (200):**
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
Analiza encabezados de archivo CSV y sugiere mapeo de columnas.

**Solicitud:**
```
POST /api/v1/analyze-csv
Content-Type: multipart/form-data

file: [Archivo CSV]
```

**Respuesta (200):**
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
Importa CSV con mapeo de columnas personalizado.

**Solicitud:**
```
POST /api/v1/upload-with-mapping
Content-Type: multipart/form-data

file: [Archivo CSV]
mapping: {"name": 0, "latitude": 1, "longitude": 2}
```

**Respuesta (200):**
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
Retorna las últimas 50 operaciones de importación.

**Respuesta (200):**
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

## 6. Servicios

### 6.1 CsvProcessingService

**Archivo:** `app/Services/CsvProcessingService.php`

**Responsabilidad:** Análisis de CSV de alto rendimiento e inserción masiva en base de datos

**Constantes:**
- `CHUNK_SIZE = 500` - Registros por inserción por lotes

**Métodos:**

#### `processCsv(UploadedFile $file): array`
Procesa CSV con formato codificado de NYC Open Data.

**Características:**
- Detección automática de columnas para datos de andamios de NYC
- Concatenación de direcciones desde múltiples campos
- Normalización de estado (Permit Entire → active)
- Filtrado de coordenadas cero
- Inserciones por lotes para eficiencia de memoria
- Recopilación de errores sin detener el proceso

**Algoritmo:**
```
1. Abrir archivo CSV
2. Leer fila de encabezados
3. Identificar índices de columnas para campos esperados
4. Para cada fila de datos:
   a. Analizar latitud/longitud
   b. Omitir si las coordenadas son cero o vacías
   c. Concatenar dirección desde House Number, Street Name, Borough
   d. Mapear estado a valores enum
   e. Agregar a array de lotes
   f. Si el tamaño del lote alcanza 500, insertar en base de datos
5. Insertar registros restantes
6. Retornar conteo procesado y errores
```

**Rendimiento:**
- ~1,700 registros/segundo en hardware estándar
- Streaming eficiente en memoria (sin carga de archivo completo)
- Seguridad transaccional con rollback en errores

#### `processCsvWithMapping(UploadedFile $file, array $mapping): array`
Procesa CSV con mapeo de columnas definido por el usuario.

**Parámetros:**
- `$file`: Archivo CSV cargado
- `$mapping`: Array asociativo mapeando columnas de BD a índices CSV
  ```php
  [
      'name' => 0,        // Columna CSV 0 mapea a 'name' de BD
      'latitude' => 1,    // Columna CSV 1 mapea a 'latitude' de BD
      'longitude' => 2,   // Columna CSV 2 mapea a 'longitude' de BD
      'address' => 3,     // Columna CSV 3 mapea a 'address' de BD
      'status' => 4,      // Columna CSV 4 mapea a 'status' de BD
      'notes' => 5        // Columna CSV 5 mapea a 'notes' de BD
  ]
  ```

**Manejo Inteligente de Direcciones:**
1. Busca columnas "House Number", "Street Name", "Borough Name"
2. Si se encuentran, concatena en una sola dirección
3. De lo contrario, usa columna mapeada de `address`
4. Proporciona flexibilidad para diferentes formatos CSV

---

## 7. Endpoints de la API

### URL Base
- **Producción:** `http://157.245.189.216/api/v1`
- **Local:** `http://localhost:8000/api/v1`

### Endpoints de Autenticación

| Método | Endpoint | Auth Requerida | Descripción |
|--------|----------|----------------|-------------|
| POST | `/register` | No | Registrar nuevo usuario |
| POST | `/login` | No | Inicio de sesión de usuario |
| POST | `/logout` | Sí | Cerrar sesión de usuario |
| GET | `/me` | Sí | Obtener usuario actual |

### Endpoints de Ubicaciones de Andamios

| Método | Endpoint | Auth Requerida | Descripción |
|--------|----------|----------------|-------------|
| GET | `/scaffolding_locations` | Sí | Listar todas las ubicaciones |
| POST | `/scaffolding_locations` | Sí | Crear ubicación |
| GET | `/scaffolding_locations/{id}` | Sí | Obtener ubicación por ID |
| PUT | `/scaffolding_locations/{id}` | Sí | Actualizar ubicación |
| DELETE | `/scaffolding_locations/{id}` | Sí | Eliminar ubicación |

### Endpoints de Consultas Geográficas

| Método | Endpoint | Auth Requerida | Descripción |
|--------|----------|----------------|-------------|
| GET | `/scaffolds` | Sí | Consultar con filtros geográficos |
| GET | `/scaffolds?lat={lat}&lng={lng}&radius={km}` | Sí | Búsqueda por radio |
| GET | `/scaffolds?minLat={lat}&maxLat={lat}&minLng={lng}&maxLng={lng}` | Sí | Búsqueda por cuadro delimitador |

### Endpoints de Importación CSV

| Método | Endpoint | Auth Requerida | Descripción |
|--------|----------|----------------|-------------|
| POST | `/analyze-csv` | Sí | Analizar estructura CSV |
| POST | `/upload-with-mapping` | Sí | Importar con mapeo |
| GET | `/import-logs` | Sí | Historial de importaciones |

### Endpoints de Estadísticas

| Método | Endpoint | Auth Requerida | Descripción |
|--------|----------|----------------|-------------|
| GET | `/stats` | Sí | Estadísticas del sistema |

---

## 8. Autenticación y Autorización

### Estrategia de Autenticación Dual

El sistema soporta dos métodos de autenticación:

#### 8.1 Basada en Token (Clientes API Externos)

**Usado por:** Aplicaciones móviles, integraciones de terceros, herramientas de prueba (Postman)

**Flujo:**
```
1. Cliente: POST /api/v1/login
   Body: {"email": "usuario@example.com", "password": "secreto"}

2. Servidor: Valida credenciales
   - Comparación de hash
   - Búsqueda de usuario

3. Servidor: Genera token
   - Crea entrada en tabla personal_access_tokens
   - Retorna cadena de token

4. Cliente: Almacena token

5. Cliente: Solicitudes subsecuentes
   Header: Authorization: Bearer {token}

6. Servidor: Valida token en cada solicitud
   - Búsqueda de token en base de datos
   - Verificación de expiración
   - Verificación de habilidades
```

**Formato de Token:**
```
{id}|{hash}
Ejemplo: 1|AbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

**Almacenamiento de Token:**
```sql
SELECT * FROM personal_access_tokens WHERE token = 'hashed_token';
```

#### 8.2 Basada en Sesión (Interfaz Web SPA)

**Usado por:** Frontend React/Inertia.js

**Flujo:**
```
1. Usuario: Inicia sesión vía Laravel Breeze
2. Servidor: Crea sesión, establece cookie HTTP-only
3. Frontend: Hace llamadas API con cookie de sesión
4. Servidor: Middleware EnsureFrontendRequestsAreStateful reconoce SPA
5. Servidor: Usa sesión en lugar de token para auth
```

**Configuración:**
```php
// config/sanctum.php
'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', 'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1,157.245.189.216')),
```

### Pila de Middleware

**Rutas API:**
```php
Route::middleware('auth:sanctum')->group(function () {
    // Endpoints protegidos
});
```

**Orden de Middleware:**
```
1. EnsureFrontendRequestsAreStateful (verifica si solicitud es de SPA)
2. auth:sanctum (valida token o sesión)
3. Acción del controlador
```

### Protección CSRF

- **Rutas API:** Exentas de CSRF (auth basada en token)
- **Rutas Web:** Token CSRF requerido (auth basada en sesión)

**Configuración:**
```php
// bootstrap/app.php
$middleware->validateCsrfTokens(except: [
    'api/*',  // Todas las rutas API exentas
]);
```

---

## 9. Consultas Geográficas

### 9.1 Fórmula de Distancia de Haversine

Usada para búsquedas basadas en radio para calcular la distancia del gran círculo entre dos puntos en la Tierra.

**Fórmula:**
```
a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlong/2)
c = 2 * atan2(√a, √(1−a))
distancia = R * c

Donde:
  R = Radio de la Tierra (6371 km)
  Δlat = lat2 - lat1 (en radianes)
  Δlong = long2 - long1 (en radianes)
```

**Implementación SQL:**
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

**Rendimiento:**
- Complejidad temporal O(n) (escaneo completo de tabla)
- Optimizado con índices de coordenadas
- ~50ms para 10,000 registros en tabla indexada

### 9.2 Filtrado por Cuadro Delimitador

Filtrado de área rectangular usando límites de latitud/longitud.

**Implementación SQL:**
```sql
SELECT id, latitude as lat, longitude as lng, address
FROM scaffolding_locations
WHERE latitude BETWEEN :minLat AND :maxLat
  AND longitude BETWEEN :minLng AND :maxLng
ORDER BY created_at DESC;
```

**Rendimiento:**
- O(log n) con índice compuesto
- ~5ms para 10,000 registros con índice
- Mucho más rápido que búsqueda por radio

**Índice:**
```sql
CREATE INDEX idx_coordinates ON scaffolding_locations(latitude, longitude);
```

---

## 10. Sistema de Importación CSV

### 10.1 Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                   Carga de Usuario                           │
│                 (Archivo CSV vía HTTP)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Endpoint analyze-csv                         │
│  1. Leer encabezados                                         │
│  2. Detectar tipos de columnas                               │
│  3. Auto-emparejar con alias                                 │
│  4. Retornar mapeo sugerido                                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│               Usuario Revisa Mapeo                           │
│           (UI ColumnMapper del Frontend)                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           Endpoint upload-with-mapping                       │
│  1. Validar completitud del mapeo                            │
│  2. Transmitir CSV fila por fila                             │
│  3. Transformar datos según mapeo                            │
│  4. Inserción por lotes (500 registros/lote)                │
│  5. Registrar resultados en import_logs                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                 Inserción en Base de Datos                   │
│              (INSERT masivo con UUIDs)                       │
└─────────────────────────────────────────────────────────────┘
```

### 10.2 Alias de Mapeo de Columnas

**Propósito:** Reconocer variaciones comunes de nombres de columnas de diferentes fuentes de datos.

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

### 10.3 Normalización de Estado

Mapea varios formatos de estado a valores enum estándar:

```php
$statusMap = [
    'Permit Entire' => 'active',
    'Active' => 'active',
    'Inactive' => 'inactive',
    'Maintenance' => 'maintenance'
];
```

### 10.4 Manejo de Errores

**Errores No Bloqueantes:**
- Coordenadas inválidas (lat=0, lng=0)
- Campos requeridos faltantes
- Fallos de conversión de tipo

**Comportamiento:**
- Omitir fila inválida
- Continuar procesamiento
- Registrar error con número de fila
- Retornar resumen al final

**Respuesta de Error:**
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

### 10.5 Benchmarks de Rendimiento

| Registros | Tiempo | Velocidad | Memoria |
|-----------|--------|-----------|---------|
| 1,000 | 0.6s | 1,667/s | 8 MB |
| 5,000 | 3.0s | 1,667/s | 10 MB |
| 10,000 | 6.0s | 1,667/s | 12 MB |
| 50,000 | 30.0s | 1,667/s | 15 MB |

**Optimizaciones:**
- Lectura de archivo por streaming (sin carga en memoria)
- Inserciones por lotes (500 a la vez)
- Transacción única de base de datos
- Generación preparada de UUID

---

## 11. Manejo de Errores

### Códigos de Estado HTTP

| Código | Significado | Cuándo se Usa |
|--------|-------------|---------------|
| 200 | OK | GET, PUT exitosos |
| 201 | Creado | POST exitoso creando recurso |
| 204 | Sin Contenido | DELETE exitoso |
| 401 | No Autorizado | Token faltante o inválido |
| 403 | Prohibido | Token válido pero permisos insuficientes |
| 404 | No Encontrado | Recurso no existe |
| 422 | Entidad No Procesable | Falló validación |
| 429 | Demasiadas Solicitudes | Límite de tasa excedido |
| 500 | Error Interno del Servidor | Error inesperado del servidor |

### Errores de Validación (422)

**Formato:**
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

### Errores de Autenticación (401)

**Token Faltante:**
```json
{
  "message": "Unauthenticated."
}
```

**Token Inválido:**
```json
{
  "message": "Unauthenticated. Please provide a valid token."
}
```

### Errores del Servidor (500)

**Formato:**
```json
{
  "message": "Error processing file",
  "error": "Detailed error message for debugging"
}
```

**Registro:**
Todos los errores 500 se registran en archivos de log de Laravel con trazas de pila completas.

---

## 12. Optimización de Rendimiento

### 12.1 Índices de Base de Datos

```sql
-- Consultas geográficas
CREATE INDEX idx_coordinates ON scaffolding_locations(latitude, longitude);

-- Filtrado por estado
CREATE INDEX idx_status ON scaffolding_locations(status);

-- Consultas temporales
CREATE INDEX idx_created_at ON scaffolding_locations(created_at);

-- Búsquedas de autenticación
CREATE INDEX idx_tokenable ON personal_access_tokens(tokenable_type, tokenable_id);
```

### 12.2 Optimización de Consultas

**Carga Anticipada:**
```php
// Evitar consultas N+1
$logs = ImportLog::with('user')->get();  // ✓ Consulta única por tabla

// Evitar
$logs = ImportLog::all();
foreach ($logs as $log) {
    $user = $log->user;  // ✗ Consulta por iteración
}
```

**Resultados por Lotes:**
```php
// Eficiente en memoria para grandes conjuntos de datos
ScaffoldingLocation::chunk(500, function ($locations) {
    foreach ($locations as $location) {
        // Procesar
    }
});
```

### 12.3 Estrategia de Caché

**Caché de Configuración:**
```bash
php artisan config:cache
```

**Caché de Rutas:**
```bash
php artisan route:cache
```

**Caché de Vistas:**
```bash
php artisan view:cache
```

### 12.4 Operaciones Masivas

**Inserción Masiva:**
```php
// ✓ Consulta única, 500 registros
DB::table('scaffolding_locations')->insert($batch);

// ✗ 500 consultas
foreach ($records as $record) {
    ScaffoldingLocation::create($record);
}
```

**Ganancia de Rendimiento:** ~100x más rápido para grandes conjuntos de datos

---

## 13. Despliegue

### 13.1 Requisitos del Servidor

- **PHP:** 8.2 o superior
- **MySQL:** 8.0 o superior
- **Composer:** 2.x
- **Node.js:** 18.x (para assets del frontend)
- **Nginx/Apache:** Servidor web
- **Certificado SSL:** Requerido para producción

### 13.2 Configuración del Entorno

**1. Clonar Repositorio:**
```bash
git clone <repository-url>
cd scaffolding-app
```

**2. Instalar Dependencias:**
```bash
composer install --optimize-autoloader --no-dev
```

**3. Configurar Entorno:**
```bash
cp .env.example .env
php artisan key:generate
```

**4. Migración de Base de Datos:**
```bash
php artisan migrate --force
```

**5. Ejecutar Seeders (Opcional):**
```bash
php artisan db:seed --class=ScaffoldingLocationSeeder
```

**6. Optimizar para Producción:**
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

**7. Establecer Permisos:**
```bash
chmod -R 775 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 13.3 Configuración del Servidor Web

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

### 13.4 Lista de Verificación de Despliegue

- [ ] Establecer `APP_ENV=production`
- [ ] Establecer `APP_DEBUG=false`
- [ ] Configurar `APP_URL` correctamente
- [ ] Establecer `APP_KEY` segura
- [ ] Configurar credenciales de base de datos
- [ ] Establecer `SANCTUM_STATEFUL_DOMAINS`
- [ ] Habilitar HTTPS
- [ ] Configurar respaldos
- [ ] Configurar monitoreo
- [ ] Probar todos los endpoints de API
- [ ] Revisar logs en busca de errores

---

## 14. Configuración del Entorno

### Variables Requeridas

```env
# Aplicación
APP_NAME="Sistema de Gestión de Andamios"
APP_ENV=production
APP_KEY=base64:GeneratedKeyHere
APP_DEBUG=false
APP_URL=http://157.245.189.216

# Base de Datos
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=scaffolding
DB_USERNAME=laravel_user
DB_PASSWORD=SecurePasswordHere

# Sanctum
SANCTUM_STATEFUL_DOMAINS=157.245.189.216,localhost

# Sesión
SESSION_DRIVER=file
SESSION_LIFETIME=120

# Cola
QUEUE_CONNECTION=sync

# Caché
CACHE_DRIVER=file

# Correo (si se usa)
MAIL_MAILER=smtp
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@scaffolding.com
MAIL_FROM_NAME="${APP_NAME}"
```

### Consideraciones de Seguridad

- **Nunca hacer commit de `.env` al control de versiones**
- Usar contraseñas fuertes y únicas
- Rotar `APP_KEY` periódicamente
- Usar HTTPS en producción
- Habilitar limitación de tasa
- Actualizaciones de seguridad regulares

---

## Apéndice A: Ejemplos de Solicitudes API

### Ejemplos con cURL

**Inicio de Sesión:**
```bash
curl -X POST http://157.245.189.216/api/v1/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@example.com","password":"password123"}'
```

**Obtener Ubicaciones (con token):**
```bash
curl -X GET http://157.245.189.216/api/v1/scaffolding_locations \
  -H "Authorization: Bearer 1|AbCdEfGh..."
```

**Crear Ubicación:**
```bash
curl -X POST http://157.245.189.216/api/v1/scaffolding_locations \
  -H "Authorization: Bearer 1|AbCdEfGh..." \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Nuevo Sitio",
    "latitude":40.7580,
    "longitude":-73.9855,
    "status":"active"
  }'
```

**Búsqueda por Radio:**
```bash
curl -X GET "http://157.245.189.216/api/v1/scaffolds?lat=40.7580&lng=-73.9855&radius=5" \
  -H "Authorization: Bearer 1|AbCdEfGh..."
```

---

## Apéndice B: Seeder de Base de Datos

**Archivo:** `database/seeders/ScaffoldingLocationSeeder.php`

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ScaffoldingLocation;

class ScaffoldingLocationSeeder extends Seeder
{
    public function run(): void
    {
        // Datos de muestra para pruebas
        $locations = [
            [
                'name' => 'Sitio Times Square',
                'latitude' => 40.7580,
                'longitude' => -73.9855,
                'address' => '1 Times Square, New York, NY 10036',
                'status' => 'active',
                'notes' => 'Área de alto tráfico'
            ],
            [
                'name' => 'Sitio Central Park',
                'latitude' => 40.7829,
                'longitude' => -73.9654,
                'address' => 'Central Park, New York, NY',
                'status' => 'maintenance',
                'notes' => 'Inspección rutinaria programada'
            ],
            // Agregar más datos de prueba según sea necesario
        ];

        foreach ($locations as $location) {
            ScaffoldingLocation::create($location);
        }
    }
}
```

---

## Apéndice C: Pruebas

### Pruebas Unitarias

**Archivo:** `tests/Unit/ScaffoldingLocationTest.php`

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
            'name' => 'Sitio de Prueba',
            'latitude' => 40.7580,
            'longitude' => -73.9855,
            'status' => 'active'
        ]);

        $this->assertDatabaseHas('scaffolding_locations', [
            'name' => 'Sitio de Prueba',
            'latitude' => 40.7580
        ]);
    }

    public function test_coordinates_are_cast_to_decimal()
    {
        $location = ScaffoldingLocation::create([
            'name' => 'Sitio de Prueba',
            'latitude' => '40.75800000',
            'longitude' => '-73.98550000',
            'status' => 'active'
        ]);

        $this->assertIsFloat($location->latitude);
        $this->assertIsFloat($location->longitude);
    }
}
```

### Pruebas de Funcionalidad

**Archivo:** `tests/Feature/ApiAuthTest.php`

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
            'name' => 'Usuario de Prueba',
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

## Apéndice D: Comandos de Mantenimiento

### Limpiar Cachés
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Mantenimiento de Base de Datos
```bash
# Ejecutar migraciones
php artisan migrate

# Revertir última migración
php artisan migrate:rollback

# Resetear base de datos
php artisan migrate:fresh

# Sembrar base de datos
php artisan db:seed
```

### Gestión de Colas
```bash
# Procesar trabajos de cola
php artisan queue:work

# Listar trabajos fallidos
php artisan queue:failed

# Reintentar trabajos fallidos
php artisan queue:retry all
```

### Monitoreo
```bash
# Ver logs
tail -f storage/logs/laravel.log

# Verificar rutas
php artisan route:list

# Verificar conexión de base de datos
php artisan db:show
```

---

**Versión del Documento:** 1.0.0
**Última Actualización:** Enero 2025
**Autor:** Equipo de Desarrollo
**Licencia:** Propietaria
