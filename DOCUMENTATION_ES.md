# Scaffolding Route Management System - Documentación Completa

## Tabla de Contenidos
1. [Introducción](#introducción)
2. [Características](#características)
3. [Tecnologías](#tecnologías)
4. [Requisitos Previos](#requisitos-previos)
5. [Instalación](#instalación)
6. [Acceso a la Aplicación](#acceso-a-la-aplicación)
7. [API Endpoints](#api-endpoints)
8. [Formato del CSV](#formato-del-csv)
9. [Estructura del Proyecto](#estructura-del-proyecto)
10. [Base de Datos - UML](#base-de-datos---modelo-uml)
11. [Comandos Útiles](#comandos-útiles)
12. [Solución de Problemas](#solución-de-problemas)
13. [Contribuir](#contribuir)

---

## Introducción

Sistema de gestión de rutas de andamios con subida de archivos CSV, mapeo interactivo de columnas y API REST para aplicaciones móviles. Permite gestionar ubicaciones de andamios con coordenadas geográficas, estados operacionales y metadatos adicionales.

---

## Características

- 📁 **Upload de CSV** con drag & drop
- 🔄 **Mapeo automático de columnas** con interfaz visual interactiva
- 📊 **Dashboard** con estadísticas en tiempo real
- 📈 **Barra de progreso** durante la carga de archivos
- ⚠️ **Mensajes de error humanizados** en español
- 🔐 **Autenticación** con Laravel Breeze
- 🌐 **API REST** para consumo desde aplicaciones móviles
- ⚡ **Bulk insert** optimizado (500 registros por lote)
- 🗺️ **Visualización de datos** con tabla y mapa interactivo
- 🔍 **Filtros avanzados** por estado, búsqueda y rango de fechas
- 📄 **Paginación** con opciones de registros por página

---

## Tecnologías

- **Backend**: Laravel 11
- **Frontend**: React 18.2.0 + Inertia.js 2.0
- **Build Tool**: Vite 7.0.7
- **Database**: MySQL 8.0+
- **Styling**: Tailwind CSS
- **Maps**: Leaflet / React-Leaflet
- **Charts**: Recharts

---

## Requisitos Previos

Asegúrate de tener instalado:

- PHP >= 8.2
- Composer
- Node.js >= 18
- MySQL >= 8.0
- Git

---

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd scaffolding-app
```

### 2. Instalar dependencias de PHP

```bash
composer install
```

### 3. Instalar dependencias de Node.js

```bash
npm install
```

### 4. Configurar el archivo de entorno

```bash
cp .env.example .env
```

Edita el archivo `.env` y configura la conexión a la base de datos:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=scaffolding_db
DB_USERNAME=laravel_user
DB_PASSWORD=Laravel2024!
```

### 5. Generar la clave de la aplicación

```bash
php artisan key:generate
```

### 6. Crear la base de datos

Ejecuta los siguientes comandos en MySQL:

```sql
CREATE DATABASE scaffolding_db;
CREATE USER 'laravel_user'@'localhost' IDENTIFIED BY 'Laravel2024!';
GRANT ALL PRIVILEGES ON scaffolding_db.* TO 'laravel_user'@'localhost';
FLUSH PRIVILEGES;
```

O si ya tienes un usuario root configurado:

```bash
mysql -u root -p -e "CREATE DATABASE scaffolding_db;"
```

### 7. Ejecutar migraciones

```bash
php artisan migrate
```

### 8. Ejecutar seeders

Esto creará el usuario administrador por defecto:

```bash
php artisan db:seed
```

### 9. Compilar assets

Para producción:

```bash
npm run build
```

Para desarrollo con hot-reload:

```bash
npm run dev
```

### 10. Levantar el servidor

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

---

## Acceso a la Aplicación

Una vez levantado el servidor, accede a:

- **Login**: http://localhost:8000/login
- **Dashboard**: http://localhost:8000/dashboard

### Credenciales por defecto

- **Email**: `admin@scaffolding.com`
- **Password**: `password123`

---

## API Endpoints

### Autenticación requerida

Todos los endpoints requieren autenticación mediante Laravel Sanctum.

### Estadísticas

```http
GET /api/v1/stats
```

**Respuesta:**
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

### Listar ubicaciones

```http
GET /api/v1/scaffolding_locations
```

**Parámetros opcionales:**
- `status`: Filtrar por estado (active, inactive, maintenance)
- `search`: Buscar por nombre o dirección

**Respuesta:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Ubicación 1",
      "latitude": -12.0464,
      "longitude": -77.0428,
      "address": "Av. Ejemplo 123",
      "status": "active",
      "notes": "Notas adicionales"
    }
  ]
}
```

### Obtener una ubicación

```http
GET /api/v1/scaffolding_locations/{id}
```

### Crear ubicación

```http
POST /api/v1/scaffolding_locations
```

**Body:**
```json
{
  "name": "Nueva ubicación",
  "latitude": -12.0464,
  "longitude": -77.0428,
  "address": "Av. Ejemplo 123",
  "status": "active",
  "notes": "Notas adicionales"
}
```

### Actualizar ubicación

```http
PUT /api/v1/scaffolding_locations/{id}
```

### Eliminar ubicación

```http
DELETE /api/v1/scaffolding_locations/{id}
```

### Subir archivo CSV

```http
POST /api/v1/analyze-csv
```

Analiza las columnas del CSV y devuelve un mapeo automático.

**Body:** `multipart/form-data`
- `file`: Archivo CSV

**Respuesta:**
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

### Subir CSV con mapeo personalizado

```http
POST /api/v1/upload-with-mapping
```

**Body:** `multipart/form-data`
- `file`: Archivo CSV
- `mapping`: JSON con el mapeo de columnas

**Ejemplo de mapping:**
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

## Formato del CSV

El archivo CSV debe contener las siguientes columnas (pueden tener nombres diferentes, se mapean automáticamente):

### Columnas requeridas:
- **name** (texto): Nombre de la ubicación
- **latitude** (decimal): Latitud
- **longitude** (decimal): Longitud

### Columnas opcionales:
- **address** (texto): Dirección
- **status** (enum): Estado (active, inactive, maintenance)
- **notes** (texto): Notas adicionales

### Ejemplo de CSV:

```csv
Job Number,Latitude Point,Longitude Point,Address,Status,Notes
"Ubicación 1",-12.0464,-77.0428,"Av. Ejemplo 123",active,"Primera ubicación"
"Ubicación 2",-12.0500,-77.0500,"Calle Test 456",active,""
```

---

## Estructura del Proyecto

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

## Base de Datos - Modelo UML

### Diagrama de Entidad-Relación (ERD)

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

### Especificaciones Detalladas de Entidades

#### Tabla: `scaffolding_locations`

**Propósito:** Almacena las ubicaciones de los andamios con sus coordenadas geográficas y estado.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único del andamio |
| `name` | TEXT | NOT NULL | Nombre o identificador del andamio |
| `latitude` | DECIMAL(10,8) | NOT NULL | Coordenada de latitud |
| `longitude` | DECIMAL(11,8) | NOT NULL | Coordenada de longitud |
| `address` | TEXT | DEFAULT '' | Dirección física completa |
| `status` | TEXT | DEFAULT 'active', CHECK IN ('active', 'inactive', 'maintenance') | Estado operacional |
| `notes` | TEXT | DEFAULT '' | Notas adicionales |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de última actualización |

**Índices:**
- `idx_scaffolding_status` ON (status) - Para filtrar por estado
- `idx_scaffolding_created_at` ON (created_at) - Para ordenamiento temporal

**Triggers:**
- `update_scaffolding_updated_at` - Actualiza automáticamente `updated_at` en cada modificación

**Row Level Security (RLS):**
- Lectura pública: `SELECT * WHERE TRUE`
- Inserción anónima: `INSERT WHERE TRUE`
- Actualización anónima: `UPDATE WHERE TRUE`
- Eliminación anónima: `DELETE WHERE TRUE`

---

#### Tabla: `uploaded_files`

**Propósito:** Registra un historial de archivos Excel subidos y cantidad de registros procesados.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único del upload |
| `filename` | TEXT | NOT NULL | Nombre del archivo subido |
| `total_records` | INTEGER | DEFAULT 0 | Cantidad de registros procesados |
| `uploaded_at` | TIMESTAMPTZ | DEFAULT now() | Fecha y hora del upload |

**Índices:**
- Ninguno (tabla de referencia pequeña)

**Row Level Security (RLS):**
- Lectura pública: `SELECT * WHERE TRUE`
- Inserción anónima: `INSERT WHERE TRUE`

---

### Diagrama de Clases UML

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

### Diagrama de Flujo de Datos (DFD)

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

### Relaciones y Cardinalidad

```
ScaffoldingLocation ──────────────────── UploadedFile
        │                                        │
        │ Muchas ubicaciones pueden             │
        │ venir del mismo archivo               │
        │                                        │
   (1:N)─────────────────────────────────(1:1)
        │
        │ Una ubicación es rastreada por
        │ UN registro de upload (o ninguno si
        │ fue creada por API)
```

---

### Patrones de Consulta Típicos

#### 1. Obtener todas las ubicaciones activas
```sql
SELECT * FROM scaffolding_locations
WHERE status = 'active'
ORDER BY created_at DESC;
```

#### 2. Buscar ubicaciones en rango de coordenadas
```sql
SELECT * FROM scaffolding_locations
WHERE latitude BETWEEN 40.7 AND 40.8
  AND longitude BETWEEN -74.0 AND -73.9
  AND status = 'active';
```

#### 3. Obtener ubicaciones por área (cercanas a un punto)
```sql
SELECT * FROM scaffolding_locations
WHERE status = 'active'
  AND latitude > 40.7 - 0.01
  AND latitude < 40.7 + 0.01
  AND longitude > -74.0 - 0.01
  AND longitude < -74.0 + 0.01;
```

#### 4. Historial de uploads
```sql
SELECT * FROM uploaded_files
ORDER BY uploaded_at DESC
LIMIT 10;
```

#### 5. Estadísticas por estado
```sql
SELECT status, COUNT(*) as count
FROM scaffolding_locations
GROUP BY status;
```

---

### Características de Seguridad

#### Row Level Security (RLS)
- ✅ Todas las tablas tienen RLS habilitado
- ✅ Políticas permiten acceso público para lectura
- ✅ Acceso anónimo para inserciones (uploads)
- ✅ Protección contra inyección SQL mediante ORM

#### Índices
- ✅ `idx_scaffolding_status` para filtros rápidos
- ✅ `idx_scaffolding_created_at` para ordenamiento
- ✅ Mejora rendimiento en queries frecuentes

#### Integridad de Datos
- ✅ Restricciones CHECK en status
- ✅ NOT NULL en campos requeridos
- ✅ UUIDs para evitar colisiones
- ✅ Timestamps automáticos

---

### Consideraciones de Escalabilidad

#### Tabla: scaffolding_locations
- **Tamaño esperado:** Millones de registros
- **Frecuencia de lectura:** Muy alta (mobile app)
- **Frecuencia de escritura:** Baja-media (uploads diarios)
- **Estrategia:** Índices en status y created_at, partición por fecha si es necesario

#### Tabla: uploaded_files
- **Tamaño esperado:** Decenas a centenas
- **Propósito:** Auditoría y referencia
- **Estrategia:** Sin índices necesarios, tamaño pequeño

---

### Configuración de Función de Trigger

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

**Propósito:** Mantener automáticamente el timestamp `updated_at` sincronizado.

---

### Resumen de Entidades

| Entidad | Registros Iniciales | Propósito |
|---------|-------------------|----------|
| `scaffolding_locations` | Variable | Datos geográficos de andamios |
| `uploaded_files` | Variable | Auditoría de uploads |

**Total de campos de datos:** 13
**Total de columnas del sistema:** 4 (id, created_at, updated_at, más funciones)
**Relaciones:** 1 (conceptual, para auditoría)

---

## Comandos Útiles

### Desarrollo

```bash
# Levantar servidor de desarrollo
php artisan serve

# Compilar assets con hot-reload
npm run dev

# Limpiar caché
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Ver rutas disponibles
php artisan route:list
```

### Producción

```bash
# Compilar assets para producción
npm run build

# Optimizar autoload
composer install --optimize-autoloader --no-dev

# Cachear configuración
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Base de datos

```bash
# Ejecutar migraciones
php artisan migrate

# Revertir última migración
php artisan migrate:rollback

# Refrescar base de datos (CUIDADO: elimina todos los datos)
php artisan migrate:fresh --seed

# Ejecutar seeders
php artisan db:seed
```

---

## Solución de Problemas

### Pantalla en blanco después de login

1. Borra el caché del navegador (`Ctrl + Shift + Delete`)
2. Haz un hard refresh (`Ctrl + Shift + R`)
3. O abre en ventana de incógnito

### Error de conexión a la base de datos

1. Verifica que MySQL esté corriendo
2. Verifica las credenciales en `.env`
3. Verifica que la base de datos exista

### Assets no se cargan

```bash
# Eliminar el archivo hot si existe
rm public/hot

# Recompilar assets
npm run build

# Limpiar caché de Laravel
php artisan cache:clear
php artisan view:clear
```

### Error "Class not found"

```bash
# Regenerar autoload
composer dump-autoload
```

---

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## Licencia

Este proyecto está bajo la licencia MIT.

---

## Contacto

Para preguntas o soporte, contacta a: [tu-email@ejemplo.com]
