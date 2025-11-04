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

        $importLog = ImportLog::create([
            'user_id' => auth()->id(),
            'filename' => $filename,
            'status' => 'processing',
            'started_at' => $startedAt,
        ]);

        try {
            DB::beginTransaction();

            ScaffoldingLocation::truncate();

            $result = $this->csvService->processCsv($file);

            $uploadRecord = UploadedFile::create([
                'filename' => $filename,
                'total_records' => $result['processed']
            ]);

            $importLog->update([
                'status' => 'completed',
                'total_records' => $result['processed'] + count($result['errors']),
                'processed_records' => $result['processed'],
                'failed_records' => count($result['errors']),
                'errors' => $result['errors'],
                'completed_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'message' => 'File uploaded successfully',
                'data' => [
                    'processed' => $result['processed'],
                    'errors' => $result['errors'],
                    'upload_id' => $uploadRecord->id,
                    'import_log_id' => $importLog->id
                ]
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();

            $importLog->update([
                'status' => 'failed',
                'errors' => [['error' => $e->getMessage()]],
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
}
