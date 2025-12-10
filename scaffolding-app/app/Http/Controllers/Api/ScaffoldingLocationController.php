<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScaffoldingLocation;
use App\Models\UploadedFile;
use App\Models\ImportLog;
use App\Services\CsvProcessingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ScaffoldingLocationController extends Controller
{
    protected $csvService;

    public function __construct(CsvProcessingService $csvService)
    {
        $this->csvService = $csvService;
    }

    public function index()
    {
        $locations = ScaffoldingLocation::orderBy('created_at', 'desc')->get();
        return response()->json($locations);
    }

    public function scaffolds(Request $request)
    {
        // Validar parámetros de filtros geográficos
        $validated = $request->validate([
            'lat' => 'nullable|numeric|between:-90,90',
            'lng' => 'nullable|numeric|between:-180,180',
            'radius' => 'nullable|numeric|min:0.1|max:10000',
            'minLat' => 'nullable|numeric|between:-90,90',
            'maxLat' => 'nullable|numeric|between:-90,90',
            'minLng' => 'nullable|numeric|between:-180,180',
            'maxLng' => 'nullable|numeric|between:-180,180',
        ]);

        $query = ScaffoldingLocation::select('id', 'latitude as lat', 'longitude as lng', 'address');

        // Filtro por bounding box (minLat, maxLat, minLng, maxLng)
        if ($request->has(['minLat', 'maxLat', 'minLng', 'maxLng'])) {
            $query->whereBetween('latitude', [$request->minLat, $request->maxLat])
                  ->whereBetween('longitude', [$request->minLng, $request->maxLng]);
        }

        // Filtro por radio (lat, lng, radius en km)
        if ($request->has(['lat', 'lng', 'radius'])) {
            $lat = $request->lat;
            $lng = $request->lng;
            $radius = $request->radius;

            // Fórmula de Haversine para calcular distancia
            // Radio de la Tierra en km
            $earthRadius = 6371;

            $query->selectRaw(
                "id, latitude as lat, longitude as lng, address,
                ( ? * acos(
                    cos(radians(?)) * cos(radians(latitude)) *
                    cos(radians(longitude) - radians(?)) +
                    sin(radians(?)) * sin(radians(latitude))
                )) AS distance",
                [$earthRadius, $lat, $lng, $lat]
            )
            ->having('distance', '<=', $radius)
            ->orderBy('distance', 'asc');
        } else {
            $query->orderBy('created_at', 'desc');
        }

        $scaffolds = $query->get();
        return response()->json($scaffolds);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'address' => 'nullable|string',
            'status' => 'nullable|in:active,inactive,maintenance',
            'notes' => 'nullable|string'
        ]);

        $location = ScaffoldingLocation::create($validated);
        return response()->json($location, 201);
    }

    public function show($id)
    {
        $location = ScaffoldingLocation::findOrFail($id);
        return response()->json($location);
    }

    public function update(Request $request, $id)
    {
        $location = ScaffoldingLocation::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string',
            'latitude' => 'sometimes|numeric',
            'longitude' => 'sometimes|numeric',
            'address' => 'nullable|string',
            'status' => 'nullable|in:active,inactive,maintenance',
            'notes' => 'nullable|string'
        ]);

        $location->update($validated);
        return response()->json($location);
    }

    public function destroy($id)
    {
        $location = ScaffoldingLocation::findOrFail($id);
        $location->delete();
        return response()->json(null, 204);
    }

    public function uploadCsv(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt'
        ]);

        $startedAt = now();
        $file = $request->file('file');
        $filename = $file->getClientOriginalName();

        try {
            DB::beginTransaction();

            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            DB::table('scaffolding_locations')->delete();
            DB::statement('SET FOREIGN_KEY_CHECKS=1');

            $result = $this->csvService->processCsv($file);

            $uploadRecord = UploadedFile::create([
                'filename' => $filename,
                'total_records' => $result['processed']
            ]);

            DB::commit();

            ImportLog::create([
                'user_id' => auth()->id() ?? null,
                'filename' => $filename,
                'status' => 'completed',
                'total_records' => $result['processed'] + count($result['errors']),
                'processed_records' => $result['processed'],
                'failed_records' => count($result['errors']),
                'errors' => $result['errors'],
                'started_at' => $startedAt,
                'completed_at' => now(),
            ]);

            return response()->json([
                'message' => 'File uploaded successfully',
                'data' => [
                    'processed' => $result['processed'],
                    'errors' => $result['errors'],
                    'upload_id' => $uploadRecord->id
                ]
            ], 200);

        } catch (\Exception $e) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }

            ImportLog::create([
                'user_id' => auth()->id() ?? null,
                'filename' => $filename,
                'status' => 'failed',
                'total_records' => 0,
                'processed_records' => 0,
                'failed_records' => 0,
                'errors' => [['error' => $e->getMessage()]],
                'started_at' => $startedAt,
                'completed_at' => now(),
            ]);

            return response()->json([
                'message' => 'Error processing file',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function stats()
    {
        $total = ScaffoldingLocation::count();
        $active = ScaffoldingLocation::where('status', 'active')->count();
        $inactive = ScaffoldingLocation::where('status', 'inactive')->count();
        $maintenance = ScaffoldingLocation::where('status', 'maintenance')->count();

        $statusPercentage = $total > 0 ? round(($active / $total) * 100, 1) : 0;

        return response()->json([
            'total_locations' => $total,
            'active_sites' => $active,
            'inactive_sites' => $inactive,
            'maintenance_sites' => $maintenance,
            'api_status' => 'online',
            'coverage' => $statusPercentage
        ]);
    }

    public function importLogs()
    {
        $logs = ImportLog::with('user')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json($logs);
    }

    public function analyzeCsv(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt'
        ]);

        $file = $request->file('file');
        $handle = fopen($file->getPathname(), 'r');
        $csvHeaders = fgetcsv($handle);
        fclose($handle);

        $dbColumns = [
            ['name' => 'name', 'type' => 'text', 'required' => true],
            ['name' => 'latitude', 'type' => 'decimal', 'required' => true],
            ['name' => 'longitude', 'type' => 'decimal', 'required' => true],
            ['name' => 'address', 'type' => 'text', 'required' => false],
            ['name' => 'status', 'type' => 'enum', 'required' => false],
            ['name' => 'notes', 'type' => 'text', 'required' => false],
        ];

        $autoMapping = $this->autoMatchColumns($csvHeaders, $dbColumns);

        $hasUnmatchedRequired = false;
        foreach ($dbColumns as $dbCol) {
            if ($dbCol['required'] && !isset($autoMapping[$dbCol['name']])) {
                $hasUnmatchedRequired = true;
                break;
            }
        }

        return response()->json([
            'csv_headers' => $csvHeaders,
            'db_columns' => $dbColumns,
            'auto_mapping' => $autoMapping,
            'requires_manual_mapping' => $hasUnmatchedRequired || count($autoMapping) < count(array_filter($dbColumns, fn($c) => $c['required']))
        ]);
    }

    private function autoMatchColumns($csvHeaders, $dbColumns)
    {
        $mapping = [];

        $aliases = [
            'name' => ['name', 'job number', 'job_number', 'location', 'location_name', 'site_name', 'site'],
            'latitude' => ['latitude', 'lat', 'latitude point', 'latitude_point'],
            'longitude' => ['longitude', 'lng', 'lon', 'long', 'longitude point', 'longitude_point'],
            'address' => ['address', 'full address', 'full_address', 'street', 'location_address', 'house number', 'street name', 'borough name'],
            'status' => ['status', 'current job status', 'current_job_status', 'job_status', 'state'],
            'notes' => ['notes', 'note', 'comments', 'comment', 'description', 'remarks']
        ];

        foreach ($dbColumns as $dbCol) {
            $dbColName = $dbCol['name'];
            $possibleAliases = $aliases[$dbColName] ?? [$dbColName];

            foreach ($csvHeaders as $index => $csvHeader) {
                $normalizedCsvHeader = strtolower(trim($csvHeader));

                foreach ($possibleAliases as $alias) {
                    if ($normalizedCsvHeader === strtolower($alias)) {
                        $mapping[$dbColName] = $index;
                        break 2;
                    }
                }
            }
        }

        return $mapping;
    }

    public function uploadWithMapping(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt',
            'mapping' => 'required'
        ]);

        $startedAt = now();
        $file = $request->file('file');
        $filename = $file->getClientOriginalName();

        $mapping = $request->input('mapping');
        if (is_string($mapping)) {
            $mapping = json_decode($mapping, true);
        }

        try {
            DB::beginTransaction();

            DB::statement('SET FOREIGN_KEY_CHECKS=0');
            DB::table('scaffolding_locations')->delete();
            DB::statement('SET FOREIGN_KEY_CHECKS=1');

            $result = $this->csvService->processCsvWithMapping($file, $mapping);

            $uploadRecord = UploadedFile::create([
                'filename' => $filename,
                'total_records' => $result['processed']
            ]);

            DB::commit();

            ImportLog::create([
                'user_id' => auth()->id() ?? null,
                'filename' => $filename,
                'status' => 'completed',
                'total_records' => $result['processed'] + count($result['errors']),
                'processed_records' => $result['processed'],
                'failed_records' => count($result['errors']),
                'errors' => $result['errors'],
                'started_at' => $startedAt,
                'completed_at' => now(),
            ]);

            return response()->json([
                'message' => 'File uploaded successfully',
                'data' => [
                    'processed' => $result['processed'],
                    'errors' => $result['errors'],
                    'upload_id' => $uploadRecord->id
                ]
            ], 200);

        } catch (\Exception $e) {
            if (DB::transactionLevel() > 0) {
                DB::rollBack();
            }

            ImportLog::create([
                'user_id' => auth()->id() ?? null,
                'filename' => $filename,
                'status' => 'failed',
                'total_records' => 0,
                'processed_records' => 0,
                'failed_records' => 0,
                'errors' => [['error' => $e->getMessage()]],
                'started_at' => $startedAt,
                'completed_at' => now(),
            ]);

            return response()->json([
                'message' => 'Error processing file',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get optimized markers for map visualization
     */
    public function mapMarkers(Request $request)
    {
        $validated = $request->validate([
            'minLat' => 'nullable|numeric|between:-90,90',
            'maxLat' => 'nullable|numeric|between:-90,90',
            'minLng' => 'nullable|numeric|between:-180,180',
            'maxLng' => 'nullable|numeric|between:-180,180',
            'status' => 'nullable|in:active,inactive,maintenance',
        ]);

        $query = ScaffoldingLocation::select('id', 'name', 'latitude', 'longitude', 'address', 'status');

        // Filter by bounding box if provided
        if ($request->has(['minLat', 'maxLat', 'minLng', 'maxLng'])) {
            $query->whereBetween('latitude', [$request->minLat, $request->maxLat])
                  ->whereBetween('longitude', [$request->minLng, $request->maxLng]);
        }

        // Filter by status if provided
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $markers = $query->get()->map(function ($location) {
            return [
                'id' => $location->id,
                'title' => $location->name,
                'latitude' => (float) $location->latitude,
                'longitude' => (float) $location->longitude,
                'address' => $location->address,
                'status' => $location->status,
            ];
        });

        return response()->json($markers);
    }

    /**
     * Optimize route for visiting multiple scaffolding locations
     */
    public function optimizeRoute(Request $request)
    {
        $validated = $request->validate([
            'start_lat' => 'required|numeric|between:-90,90',
            'start_lng' => 'required|numeric|between:-180,180',
            'location_ids' => 'required|array|min:1',
            'location_ids.*' => 'required|uuid|exists:scaffolding_locations,id',
            'return_to_start' => 'nullable|boolean',
        ]);

        $startLat = $request->start_lat;
        $startLng = $request->start_lng;
        $returnToStart = $request->return_to_start ?? false;

        // Get all requested locations
        $locations = ScaffoldingLocation::whereIn('id', $request->location_ids)->get();

        if ($locations->isEmpty()) {
            return response()->json(['error' => 'No locations found'], 404);
        }

        // Create array of points to visit
        $points = $locations->map(function ($loc) {
            return [
                'id' => $loc->id,
                'name' => $loc->name,
                'lat' => (float) $loc->latitude,
                'lng' => (float) $loc->longitude,
                'address' => $loc->address,
                'status' => $loc->status,
            ];
        })->toArray();

        // Optimize route using nearest neighbor algorithm
        $optimizedRoute = $this->nearestNeighborRoute($startLat, $startLng, $points, $returnToStart);

        return response()->json([
            'start' => [
                'latitude' => $startLat,
                'longitude' => $startLng,
            ],
            'waypoints' => $optimizedRoute['waypoints'],
            'total_distance' => $optimizedRoute['total_distance'],
            'estimated_duration' => $optimizedRoute['estimated_duration'],
            'return_to_start' => $returnToStart,
        ]);
    }

    /**
     * Optimize route to a destination passing through scaffolding locations
     */
    public function optimizeRouteToDestination(Request $request)
    {
        $validated = $request->validate([
            'start_lat' => 'required|numeric|between:-90,90',
            'start_lng' => 'required|numeric|between:-180,180',
            'dest_lat' => 'required|numeric|between:-90,90',
            'dest_lng' => 'required|numeric|between:-180,180',
            'location_ids' => 'required|array|min:1',
            'location_ids.*' => 'required|uuid|exists:scaffolding_locations,id',
        ]);

        $startLat = $request->start_lat;
        $startLng = $request->start_lng;
        $destLat = $request->dest_lat;
        $destLng = $request->dest_lng;

        // Get all requested locations
        $locations = ScaffoldingLocation::whereIn('id', $request->location_ids)->get();

        if ($locations->isEmpty()) {
            return response()->json(['error' => 'No locations found'], 404);
        }

        // Create array of points to visit
        $points = $locations->map(function ($loc) {
            return [
                'id' => $loc->id,
                'name' => $loc->name,
                'lat' => (float) $loc->latitude,
                'lng' => (float) $loc->longitude,
                'address' => $loc->address,
                'status' => $loc->status,
            ];
        })->toArray();

        // Optimize route to destination using modified nearest neighbor algorithm
        $optimizedRoute = $this->nearestNeighborRouteToDestination(
            $startLat,
            $startLng,
            $destLat,
            $destLng,
            $points
        );

        return response()->json([
            'start' => [
                'latitude' => $startLat,
                'longitude' => $startLng,
            ],
            'destination' => [
                'latitude' => $destLat,
                'longitude' => $destLng,
            ],
            'waypoints' => $optimizedRoute['waypoints'],
            'total_distance' => $optimizedRoute['total_distance'],
            'estimated_duration' => $optimizedRoute['estimated_duration'],
        ]);
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    private function calculateDistance($lat1, $lng1, $lat2, $lng2)
    {
        $earthRadius = 6371; // kilometers

        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLng / 2) * sin($dLng / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        $distance = $earthRadius * $c;

        return $distance;
    }

    /**
     * Optimize route using nearest neighbor algorithm
     */
    private function nearestNeighborRoute($startLat, $startLng, $points, $returnToStart)
    {
        $route = [];
        $remaining = $points;
        $currentLat = $startLat;
        $currentLng = $startLng;
        $totalDistance = 0;
        $orderIndex = 1;

        while (!empty($remaining)) {
            $nearest = null;
            $minDistance = PHP_FLOAT_MAX;
            $nearestIndex = -1;

            foreach ($remaining as $index => $point) {
                $distance = $this->calculateDistance(
                    $currentLat,
                    $currentLng,
                    $point['lat'],
                    $point['lng']
                );

                if ($distance < $minDistance) {
                    $minDistance = $distance;
                    $nearest = $point;
                    $nearestIndex = $index;
                }
            }

            if ($nearest) {
                $nearest['distance_from_previous'] = round($minDistance, 2);
                $nearest['order'] = $orderIndex++;
                $route[] = $nearest;
                $totalDistance += $minDistance;
                $currentLat = $nearest['lat'];
                $currentLng = $nearest['lng'];
                array_splice($remaining, $nearestIndex, 1);
            }
        }

        // If returning to start, add distance back
        if ($returnToStart && !empty($route)) {
            $lastPoint = end($route);
            $distanceToStart = $this->calculateDistance(
                $lastPoint['lat'],
                $lastPoint['lng'],
                $startLat,
                $startLng
            );
            $totalDistance += $distanceToStart;
        }

        // Estimate duration (assuming average speed of 40 km/h in city + 5 min per stop)
        $drivingTime = ($totalDistance / 40) * 60; // minutes
        $stopTime = count($route) * 5; // 5 minutes per stop
        $estimatedDuration = round($drivingTime + $stopTime);

        return [
            'waypoints' => $route,
            'total_distance' => round($totalDistance, 2),
            'estimated_duration' => $estimatedDuration,
        ];
    }

    /**
     * Optimize route to destination using modified nearest neighbor algorithm
     * This considers the destination and tries to visit scaffoldings along the way
     */
    private function nearestNeighborRouteToDestination($startLat, $startLng, $destLat, $destLng, $points)
    {
        $route = [];
        $remaining = $points;
        $currentLat = $startLat;
        $currentLng = $startLng;
        $totalDistance = 0;
        $orderIndex = 1;

        // Calculate direct distance to destination
        $directDistance = $this->calculateDistance($startLat, $startLng, $destLat, $destLng);

        while (!empty($remaining)) {
            $nearest = null;
            $minScore = PHP_FLOAT_MAX;
            $nearestIndex = -1;
            $distanceToNearest = 0;

            foreach ($remaining as $index => $point) {
                $distFromCurrent = $this->calculateDistance(
                    $currentLat,
                    $currentLng,
                    $point['lat'],
                    $point['lng']
                );

                $distToDest = $this->calculateDistance(
                    $point['lat'],
                    $point['lng'],
                    $destLat,
                    $destLng
                );

                // Score based on: distance from current + how much it keeps us on path to destination
                // Lower score is better
                // We want to minimize detour from direct route
                $totalDetour = $distFromCurrent + $distToDest;
                $score = $totalDetour - $directDistance + $distFromCurrent * 0.5;

                if ($score < $minScore) {
                    $minScore = $score;
                    $nearest = $point;
                    $nearestIndex = $index;
                    $distanceToNearest = $distFromCurrent;
                }
            }

            if ($nearest) {
                $nearest['distance_from_previous'] = round($distanceToNearest, 2);
                $nearest['order'] = $orderIndex++;
                $route[] = $nearest;
                $totalDistance += $distanceToNearest;
                $currentLat = $nearest['lat'];
                $currentLng = $nearest['lng'];

                // Update direct distance from new current position
                $directDistance = $this->calculateDistance($currentLat, $currentLng, $destLat, $destLng);

                array_splice($remaining, $nearestIndex, 1);
            }
        }

        // Add distance to final destination
        if (!empty($route)) {
            $lastPoint = end($route);
            $distanceToDestination = $this->calculateDistance(
                $lastPoint['lat'],
                $lastPoint['lng'],
                $destLat,
                $destLng
            );
            $totalDistance += $distanceToDestination;
        } else {
            // If no waypoints, just direct route to destination
            $totalDistance = $this->calculateDistance($startLat, $startLng, $destLat, $destLng);
        }

        // Estimate duration (assuming average speed of 40 km/h in city + 5 min per stop)
        $drivingTime = ($totalDistance / 40) * 60; // minutes
        $stopTime = count($route) * 5; // 5 minutes per stop
        $estimatedDuration = round($drivingTime + $stopTime);

        return [
            'waypoints' => $route,
            'total_distance' => round($totalDistance, 2),
            'estimated_duration' => $estimatedDuration,
        ];
    }
}
