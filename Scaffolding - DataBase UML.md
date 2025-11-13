

# Scaffolding Route Management System - Database UML Model

## Entity Relationship Diagram (ERD)

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

## Detailed Entity Specifications

### Table: `scaffolding_locations`

**Purpose:** Almacena las ubicaciones de los andamios con sus coordenadas geográficas y estado.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único del andamio |
| `name` | TEXT | NOT NULL | Nombre o identificador del andamio |
| `latitude` | DECIMAL(10,8) | NOT NULL | Coordenada de latitud |
| `longitude` | DECIMAL(11,8) | NOT NULL | Coordenada de longitud |
| `address` | TEXT | DEFAULT '' | Dirección física completa |
| `status` | TEXT | DEFAULT 'active', CHECK IN ('active', 'inactive', 'maintenance') | Estado operacional |
| `notes` | TEXT | DEFAULT '' | Notas adicionales |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de creación |
| `updated_at` | TIMESTAMPTZ | DEFAULT now() | Fecha de última actualización |

**Indexes:**
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

### Table: `uploaded_files`

**Purpose:** Registra un historial de archivos Excel subidos y cantidad de registros procesados.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | Identificador único del upload |
| `filename` | TEXT | NOT NULL | Nombre del archivo subido |
| `total_records` | INTEGER | DEFAULT 0 | Cantidad de registros procesados |
| `uploaded_at` | TIMESTAMPTZ | DEFAULT now() | Fecha y hora del upload |

**Indexes:**
- Ninguno (tabla de referencia pequeña)

**Row Level Security (RLS):**
- Lectura pública: `SELECT * WHERE TRUE`
- Inserción anónima: `INSERT WHERE TRUE`

---

## UML Class Diagram

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

## Data Flow Diagram (DFD)

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
    │  (Supabase)    │
    └────────┬───────┘
             │
             ▼
    ┌────────────────────────┐
    │  RLS Policies          │
    │  (Auth & Validation)   │
    └────────┬───────────────┘
             │
             ▼
    ┌────────────────────────┐
    │  PostgreSQL Database   │
    │  (Query Execution)     │
    └────────┬───────────────┘
             │
             ▼
    ┌────────────────────────────┐
    │  scaffolding_locations     │
    │  (40+ sample records)      │
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
         │ (Excel File)
         ▼
    ┌────────────────┐
    │  Excel Parser  │
    │  (XLSX.js)     │
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
    │  REST Insert   │
    │  (Supabase)    │
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

## Relaciones y Cardinalidad

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

## Patrones de Consulta Típicos

### 1. Obtener todas las ubicaciones activas
```sql
SELECT * FROM scaffolding_locations
WHERE status = 'active'
ORDER BY created_at DESC;
```

### 2. Buscar ubicaciones en rango de coordenadas
```sql
SELECT * FROM scaffolding_locations
WHERE latitude BETWEEN 40.7 AND 40.8
  AND longitude BETWEEN -74.0 AND -73.9
  AND status = 'active';
```

### 3. Obtener ubicaciones por área (cercanas a un punto)
```sql
SELECT * FROM scaffolding_locations
WHERE status = 'active'
  AND latitude > 40.7 - 0.01
  AND latitude < 40.7 + 0.01
  AND longitude > -74.0 - 0.01
  AND longitude < -74.0 + 0.01;
```

### 4. Historial de uploads
```sql
SELECT * FROM uploaded_files
ORDER BY uploaded_at DESC
LIMIT 10;
```

### 5. Estadísticas por estado
```sql
SELECT status, COUNT(*) as count
FROM scaffolding_locations
GROUP BY status;
```

---

## Características de Seguridad

### Row Level Security (RLS)
- ✅ Todas las tablas tienen RLS habilitado
- ✅ Políticas permiten acceso público para lectura
- ✅ Acceso anónimo para inserciones (uploads)
- ✅ Protección contra inyección SQL mediante ORM

### Indexes
- ✅ `idx_scaffolding_status` para filtros rápidos
- ✅ `idx_scaffolding_created_at` para ordenamiento
- ✅ Mejora rendimiento en queries frecuentes

### Data Integrity
- ✅ Constrains CHECK en status
- ✅ NOT NULL en campos requeridos
- ✅ UUIDs para evitar colisiones
- ✅ Timestamps automáticos

---

## Consideraciones de Escalabilidad

### Tabla: scaffolding_locations
- **Tamaño esperado:** Millones de registros
- **Frecuencia de lectura:** Muy alta (mobile app)
- **Frecuencia de escritura:** Baja-media (uploads diarios)
- **Estrategia:** Índices en status y created_at, partición por fecha si es necesario

### Tabla: uploaded_files
- **Tamaño esperado:** Decenas a centenas
- **Propósito:** Auditoría y referencia
- **Estrategia:** Sin índices necesarios, tamaño pequeño

---

## Configuración de Función de Trigger

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

## Resumen de Entidades

| Entidad | Registros Iniciales | Propósito |
|---------|-------------------|----------|
| `scaffolding_locations` | 40 | Datos geográficos de andamios |
| `uploaded_files` | 3 | Auditoría de uploads |

**Total de campos de datos:** 13
**Total de columnas del sistema:** 4 (id, created_at, updated_at, más funciones)
**Relaciones:** 1 (conceptual, para auditoría)

