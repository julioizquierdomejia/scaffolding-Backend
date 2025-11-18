<?php

namespace App\Http\Controllers\Api;

use OpenApi\Attributes as OA;

#[OA\Info(
    version: "1.0.0",
    title: "Scaffolding Management API",
    description: "API REST para gestión de ubicaciones de andamios con filtros geográficos",
    contact: new OA\Contact(
        email: "support@scaffolding.com"
    )
)]
#[OA\Server(
    url: "http://157.245.189.216/api/v1",
    description: "Servidor de Producción"
)]
#[OA\Server(
    url: "http://localhost:8000/api/v1",
    description: "Servidor de Desarrollo"
)]
#[OA\Tag(
    name: "Scaffolding Locations",
    description: "Operaciones sobre ubicaciones de andamios"
)]
#[OA\Tag(
    name: "Statistics",
    description: "Estadísticas y métricas"
)]
#[OA\Tag(
    name: "CSV Import",
    description: "Importación de datos desde archivos CSV"
)]
class OpenApiController
{
    // Este controlador solo sirve para almacenar las anotaciones de OpenAPI
}
