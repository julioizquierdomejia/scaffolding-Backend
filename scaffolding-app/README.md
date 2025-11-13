# Scaffolding Route Management System

Sistema de gestión de rutas de andamios con subida de archivos CSV, mapeo interactivo de columnas y API REST para aplicaciones móviles.

## Características

- 📁 **Upload de CSV** con drag & drop
- 🔄 **Mapeo automático de columnas** con interfaz visual interactiva
- 📊 **Dashboard** con estadísticas en tiempo real
- 📈 **Barra de progreso** durante la carga de archivos
- ⚠️ **Mensajes de error humanizados** en español
- 🔐 **Autenticación** con Laravel Breeze
- 🌐 **API REST** para consumo desde aplicaciones móviles
- ⚡ **Bulk insert** optimizado (500 registros por lote)

## Tecnologías

- **Backend**: Laravel 11
- **Frontend**: React 18.2.0 + Inertia.js 2.0
- **Build Tool**: Vite 7.0.7
- **Database**: MySQL 8.0+
- **Styling**: Tailwind CSS

## Requisitos previos

Asegúrate de tener instalado:

- PHP >= 8.2
- Composer
- Node.js >= 18
- MySQL >= 8.0
- Git

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

## Acceso a la aplicación

Una vez levantado el servidor, accede a:

- **Login**: http://localhost:8000/login
- **Dashboard**: http://localhost:8000/dashboard

### Credenciales por defecto

- **Email**: `admin@scaffolding.com`
- **Password**: `password123`

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

## Estructura del proyecto

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
│   │   │   └── ColumnMapper.jsx
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

## Comandos útiles

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

## Solución de problemas

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

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la licencia MIT.

## Contacto

Para preguntas o soporte, contacta a: [tu-email@ejemplo.com]
