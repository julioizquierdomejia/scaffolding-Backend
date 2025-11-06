<?php

use App\Http\Controllers\Api\ScaffoldingLocationController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1')->middleware('web')->group(function () {
    Route::get('/scaffolding_locations', [ScaffoldingLocationController::class, 'index']);
    Route::post('/scaffolding_locations', [ScaffoldingLocationController::class, 'store']);
    Route::get('/scaffolding_locations/{id}', [ScaffoldingLocationController::class, 'show']);
    Route::put('/scaffolding_locations/{id}', [ScaffoldingLocationController::class, 'update']);
    Route::delete('/scaffolding_locations/{id}', [ScaffoldingLocationController::class, 'destroy']);
    Route::post('/analyze-csv', [ScaffoldingLocationController::class, 'analyzeCsv']);
    Route::post('/upload-with-mapping', [ScaffoldingLocationController::class, 'uploadWithMapping']);
    Route::post('/upload', [ScaffoldingLocationController::class, 'uploadCsv']);
    Route::get('/stats', [ScaffoldingLocationController::class, 'stats']);
    Route::get('/import-logs', [ScaffoldingLocationController::class, 'importLogs']);
});
