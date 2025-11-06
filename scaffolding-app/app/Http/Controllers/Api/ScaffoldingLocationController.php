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
            'address' => ['address', 'full address', 'full_address', 'street', 'location_address'],
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
}
