# Filtros Geográficos API - Endpoint /api/v1/scaffolds

## Descripción

El endpoint `/api/v1/scaffolds` ahora soporta filtros geográficos para buscar ubicaciones de andamios basándose en criterios espaciales.

## Endpoint

```
GET /api/v1/scaffolds
```

## Respuesta Base (sin filtros)

```json
[
  {
    "id": 1,
    "lat": -12.0464,
    "lng": -77.0428,
    "address": "Av. Ejemplo 123"
  },
  {
    "id": 2,
    "lat": -12.0500,
    "lng": -77.0500,
    "address": "Calle Test 456"
  }
]
```

---

## Filtro 1: Por Radio (Búsqueda de Proximidad)

Busca todas las ubicaciones dentro de un radio específico desde un punto central.

### Parámetros

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `lat` | decimal | Sí | Latitud del punto central (-90 a 90) |
| `lng` | decimal | Sí | Longitud del punto central (-180 a 180) |
| `radius` | decimal | Sí | Radio de búsqueda en kilómetros (0.1 a 10000) |

### Ejemplo de Uso

```bash
# Buscar todos los scaffolds en un radio de 5 km desde una ubicación específica
curl "http://localhost:8000/api/v1/scaffolds?lat=-12.0464&lng=-77.0428&radius=5"
```

### Ejemplo con coordenadas de Lima, Perú

```bash
# Centro de Lima: lat=-12.0464, lng=-77.0428, radio de 10 km
curl "http://localhost:8000/api/v1/scaffolds?lat=-12.0464&lng=-77.0428&radius=10"
```

### Respuesta

```json
[
  {
    "id": 1,
    "lat": -12.0464,
    "lng": -77.0428,
    "address": "Av. Ejemplo 123",
    "distance": 0.0
  },
  {
    "id": 3,
    "lat": -12.0500,
    "lng": -77.0450,
    "address": "Jr. Cercano 789",
    "distance": 0.42
  },
  {
    "id": 5,
    "lat": -12.0600,
    "lng": -77.0500,
    "address": "Av. Lejos 321",
    "distance": 1.58
  }
]
```

**Nota:** Los resultados se ordenan por distancia (del más cercano al más lejano) e incluyen el campo `distance` con la distancia en kilómetros.

---

## Filtro 2: Por Bounding Box (Área Rectangular)

Busca todas las ubicaciones dentro de un rectángulo geográfico definido por coordenadas mínimas y máximas.

### Parámetros

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `minLat` | decimal | Sí | Latitud mínima del rectángulo (-90 a 90) |
| `maxLat` | decimal | Sí | Latitud máxima del rectángulo (-90 a 90) |
| `minLng` | decimal | Sí | Longitud mínima del rectángulo (-180 a 180) |
| `maxLng` | decimal | Sí | Longitud máxima del rectángulo (-180 a 180) |

### Ejemplo de Uso

```bash
# Buscar scaffolds en un área rectangular específica
curl "http://localhost:8000/api/v1/scaffolds?minLat=-12.05&maxLat=-12.04&minLng=-77.05&maxLng=-77.04"
```

### Ejemplo con área de Miraflores, Lima

```bash
# Área aproximada de Miraflores
curl "http://localhost:8000/api/v1/scaffolds?minLat=-12.1350&maxLat=-12.1100&minLng=-77.0450&maxLng=-77.0200"
```

### Respuesta

```json
[
  {
    "id": 8,
    "lat": -12.1200,
    "lng": -77.0300,
    "address": "Av. Larco 456"
  },
  {
    "id": 12,
    "lat": -12.1150,
    "lng": -77.0350,
    "address": "Calle Miraflores 123"
  }
]
```

**Nota:** Los resultados se ordenan por fecha de creación (más recientes primero) y NO incluyen el campo `distance`.

---

## Validación de Parámetros

### Reglas de Validación

- **lat**: Debe ser un número entre -90 y 90
- **lng**: Debe ser un número entre -180 y 180
- **radius**: Debe ser un número entre 0.1 y 10000 km
- **minLat/maxLat**: Deben ser números entre -90 y 90
- **minLng/maxLng**: Deben ser números entre -180 y 180

### Errores de Validación

Si los parámetros son inválidos, la API devolverá un error 422:

```json
{
  "message": "The given data was invalid.",
  "errors": {
    "lat": ["The lat must be between -90 and 90."],
    "radius": ["The radius must be at least 0.1."]
  }
}
```

---

## Casos de Uso

### 1. App Móvil - Mostrar andamios cercanos

```javascript
// JavaScript/React Native
const getUserNearbyScaffolds = async (userLat, userLng, radiusKm) => {
  const response = await fetch(
    `http://api.example.com/api/v1/scaffolds?lat=${userLat}&lng=${userLng}&radius=${radiusKm}`
  );
  const scaffolds = await response.json();
  return scaffolds;
};

// Uso
const scaffolds = await getUserNearbyScaffolds(-12.0464, -77.0428, 5);
```

### 2. Mapa Web - Filtrar por área visible

```javascript
// JavaScript/Leaflet
const getScaffoldsInMapBounds = async (bounds) => {
  const { minLat, maxLat, minLng, maxLng } = bounds;
  const response = await fetch(
    `http://api.example.com/api/v1/scaffolds?minLat=${minLat}&maxLat=${maxLat}&minLng=${minLng}&maxLng=${maxLng}`
  );
  const scaffolds = await response.json();
  return scaffolds;
};

// Uso con Leaflet
map.on('moveend', async () => {
  const bounds = map.getBounds();
  const scaffolds = await getScaffoldsInMapBounds({
    minLat: bounds.getSouth(),
    maxLat: bounds.getNorth(),
    minLng: bounds.getWest(),
    maxLng: bounds.getEast()
  });
  updateMapMarkers(scaffolds);
});
```

### 3. Sistema de Rutas - Optimización

```bash
# Encontrar todos los scaffolds en un radio de 2 km desde el punto de partida
curl "http://localhost:8000/api/v1/scaffolds?lat=-12.0464&lng=-77.0428&radius=2"
```

---

## Notas Técnicas

### Fórmula de Haversine

El filtro por radio utiliza la fórmula de Haversine para calcular distancias precisas sobre la superficie esférica de la Tierra:

```
d = 2r × arcsin(√(sin²((lat2-lat1)/2) + cos(lat1) × cos(lat2) × sin²((lng2-lng1)/2)))
```

Donde:
- `r` = Radio de la Tierra (6371 km)
- `d` = Distancia entre dos puntos

### Rendimiento

- **Filtro por Bounding Box**: Más rápido, utiliza índices de base de datos
- **Filtro por Radio**: Más preciso pero más costoso computacionalmente
- Recomendación: Usar bounding box para áreas grandes, radio para búsquedas precisas

### Límites

- **Radio máximo**: 10,000 km (aproximadamente 1/4 de la circunferencia de la Tierra)
- **Radio mínimo**: 0.1 km (100 metros)
- No se pueden combinar ambos filtros en la misma petición (el filtro por radio tiene prioridad)

---

## Testing

### Prueba sin filtros

```bash
curl http://localhost:8000/api/v1/scaffolds
```

### Prueba con radio

```bash
curl "http://localhost:8000/api/v1/scaffolds?lat=-12.0464&lng=-77.0428&radius=10"
```

### Prueba con bounding box

```bash
curl "http://localhost:8000/api/v1/scaffolds?minLat=-12.05&maxLat=-12.04&minLng=-77.05&maxLng=-77.04"
```

### Prueba con Postman

1. Crear una nueva petición GET
2. URL: `http://localhost:8000/api/v1/scaffolds`
3. Agregar parámetros en la pestaña "Params":
   - Para radio: `lat`, `lng`, `radius`
   - Para bounding box: `minLat`, `maxLat`, `minLng`, `maxLng`
4. Enviar petición

---

## Troubleshooting

### Error: "The lat must be between -90 and 90"

**Solución**: Verifica que la latitud esté en el rango válido (-90 a 90).

### Error: "The radius must be at least 0.1"

**Solución**: El radio mínimo es 0.1 km (100 metros).

### Resultado vacío

**Posibles causas**:
1. No hay ubicaciones en el área especificada
2. El radio es muy pequeño
3. Las coordenadas del bounding box están invertidas (minLat > maxLat o minLng > maxLng)

### Distancia incorrecta

**Solución**: Verifica que estés usando:
- Latitud: Norte (+) / Sur (-)
- Longitud: Este (+) / Oeste (-)

---

## Changelog

### v1.0 (2025-01-17)
- ✅ Implementado filtro por radio usando fórmula de Haversine
- ✅ Implementado filtro por bounding box
- ✅ Validación de parámetros geográficos
- ✅ Ordenamiento por distancia en filtro de radio
- ✅ Campo `distance` en resultados de filtro por radio
