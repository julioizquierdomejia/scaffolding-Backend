<?php

use App\Http\Controllers\Api\ApiAuthController;
use App\Http\Controllers\Api\ScaffoldingLocationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public authentication routes
Route::prefix('v1')->group(function () {
    Route::post('/register', [ApiAuthController::class, 'register']);
    Route::post('/login', [ApiAuthController::class, 'login']);
});

// Protected routes (require authentication via session or token)
Route::prefix('v1')->middleware(['auth:sanctum,web'])->group(function () {
    // Auth routes
    Route::post('/logout', [ApiAuthController::class, 'logout']);
    Route::get('/me', [ApiAuthController::class, 'me']);

    // Scaffolding locations CRUD
    Route::get('/scaffolding_locations', [ScaffoldingLocationController::class, 'index']);
    Route::post('/scaffolding_locations', [ScaffoldingLocationController::class, 'store']);
    Route::get('/scaffolding_locations/{id}', [ScaffoldingLocationController::class, 'show']);
    Route::put('/scaffolding_locations/{id}', [ScaffoldingLocationController::class, 'update']);
    Route::delete('/scaffolding_locations/{id}', [ScaffoldingLocationController::class, 'destroy']);

    // CSV Import
    Route::post('/analyze-csv', [ScaffoldingLocationController::class, 'analyzeCsv']);
    Route::post('/upload-with-mapping', [ScaffoldingLocationController::class, 'uploadWithMapping']);
    Route::post('/upload', [ScaffoldingLocationController::class, 'uploadCsv']);
    Route::get('/import-logs', [ScaffoldingLocationController::class, 'importLogs']);

    // Stats and Scaffolds with geographic filters
    Route::get('/stats', [ScaffoldingLocationController::class, 'stats']);
    Route::get('/scaffolds', [ScaffoldingLocationController::class, 'scaffolds']);
});
