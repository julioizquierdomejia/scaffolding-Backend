#!/bin/bash

# Script de prueba para filtros geográficos del endpoint /api/v1/scaffolds
# Asegúrate de que el servidor esté corriendo: php artisan serve

BASE_URL="http://localhost:8000/api/v1"

echo "======================================"
echo "  Pruebas de Filtros Geográficos"
echo "======================================"
echo ""

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test 1: Sin filtros (devuelve todas las ubicaciones)
echo -e "${BLUE}Test 1: Sin filtros${NC}"
echo "GET $BASE_URL/scaffolds"
curl -s "$BASE_URL/scaffolds" | jq '.[0:3]' || echo "Error: jq no está instalado. Instala con: sudo apt install jq"
echo ""
echo ""

# Test 2: Filtro por radio - 5 km desde Times Square, NYC
echo -e "${BLUE}Test 2: Filtro por radio (5 km desde Times Square)${NC}"
echo "GET $BASE_URL/scaffolds?lat=40.7580&lng=-73.9855&radius=5"
curl -s "$BASE_URL/scaffolds?lat=40.7580&lng=-73.9855&radius=5" | jq '.[0:3]'
echo ""
echo ""

# Test 3: Filtro por radio - 1 km (búsqueda muy cercana)
echo -e "${BLUE}Test 3: Filtro por radio (1 km)${NC}"
echo "GET $BASE_URL/scaffolds?lat=40.7580&lng=-73.9855&radius=1"
curl -s "$BASE_URL/scaffolds?lat=40.7580&lng=-73.9855&radius=1" | jq '.[0:5]'
echo ""
echo ""

# Test 4: Filtro por bounding box - Manhattan aproximado
echo -e "${BLUE}Test 4: Filtro por bounding box (Manhattan)${NC}"
echo "GET $BASE_URL/scaffolds?minLat=40.70&maxLat=40.80&minLng=-74.02&maxLng=-73.93"
curl -s "$BASE_URL/scaffolds?minLat=40.70&maxLat=40.80&minLng=-74.02&maxLng=-73.93" | jq '.[0:3]'
echo ""
echo ""

# Test 5: Filtro por bounding box - Área pequeña
echo -e "${BLUE}Test 5: Filtro por bounding box (área pequeña)${NC}"
echo "GET $BASE_URL/scaffolds?minLat=40.75&maxLat=40.77&minLng=-74.00&maxLng=-73.98"
curl -s "$BASE_URL/scaffolds?minLat=40.75&maxLat=40.77&minLng=-74.00&maxLng=-73.98" | jq '.[0:3]'
echo ""
echo ""

# Test 6: Validación de errores - Radio negativo
echo -e "${BLUE}Test 6: Error - Radio negativo (debe fallar)${NC}"
echo "GET $BASE_URL/scaffolds?lat=40.7580&lng=-73.9855&radius=-5"
curl -s "$BASE_URL/scaffolds?lat=40.7580&lng=-73.9855&radius=-5" | jq
echo ""
echo ""

# Test 7: Validación de errores - Latitud fuera de rango
echo -e "${BLUE}Test 7: Error - Latitud fuera de rango (debe fallar)${NC}"
echo "GET $BASE_URL/scaffolds?lat=95&lng=-73.9855&radius=5"
curl -s "$BASE_URL/scaffolds?lat=95&lng=-73.9855&radius=5" | jq
echo ""
echo ""

# Test 8: Filtro por radio - Radio grande (100 km)
echo -e "${BLUE}Test 8: Filtro por radio (100 km - área grande)${NC}"
echo "GET $BASE_URL/scaffolds?lat=40.7580&lng=-73.9855&radius=100"
curl -s "$BASE_URL/scaffolds?lat=40.7580&lng=-73.9855&radius=100" | jq 'length'
echo ""
echo ""

# Test 9: Contar resultados
echo -e "${BLUE}Test 9: Contar total de scaffolds${NC}"
echo "GET $BASE_URL/scaffolds"
TOTAL=$(curl -s "$BASE_URL/scaffolds" | jq 'length')
echo "Total de scaffolds: $TOTAL"
echo ""
echo ""

# Test 10: Verificar que incluye campo distance en filtro por radio
echo -e "${BLUE}Test 10: Verificar campo 'distance' en respuesta${NC}"
echo "GET $BASE_URL/scaffolds?lat=40.7580&lng=-73.9855&radius=2"
curl -s "$BASE_URL/scaffolds?lat=40.7580&lng=-73.9855&radius=2" | jq '.[0]'
echo ""
echo ""

echo -e "${GREEN}======================================"
echo "  Pruebas completadas"
echo "======================================${NC}"
