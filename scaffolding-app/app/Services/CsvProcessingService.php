<?php

namespace App\Services;

use App\Models\ScaffoldingLocation;
use Illuminate\Http\UploadedFile;

class CsvProcessingService
{
    public function processCsv(UploadedFile $file)
    {
        $processed = 0;
        $errors = [];

        $handle = fopen($file->getPathname(), 'r');

        $headers = fgetcsv($handle);

        $latIndex = array_search('Latitude Point', $headers);
        $lngIndex = array_search('Longitude Point', $headers);
        $nameIndex = array_search('Job Number', $headers);
        $addressIndex = array_search('House Number', $headers);
        $streetIndex = array_search('Street Name', $headers);
        $statusIndex = array_search('Current Job Status', $headers);

        while (($row = fgetcsv($handle)) !== false) {
            try {
                if (empty($row[$latIndex]) || empty($row[$lngIndex])) {
                    continue;
                }

                $latitude = (float) $row[$latIndex];
                $longitude = (float) $row[$lngIndex];

                if ($latitude == 0 || $longitude == 0) {
                    continue;
                }

                $address = '';
                if (!empty($row[$addressIndex]) && !empty($row[$streetIndex])) {
                    $address = trim($row[$addressIndex]) . ' ' . trim($row[$streetIndex]);
                }

                $name = !empty($row[$nameIndex]) ? $row[$nameIndex] : 'Unknown';

                $statusMap = [
                    'Permit Entire' => 'active',
                    'Active' => 'active',
                    'Inactive' => 'inactive',
                    'Maintenance' => 'maintenance'
                ];

                $csvStatus = !empty($row[$statusIndex]) ? $row[$statusIndex] : 'Permit Entire';
                $status = $statusMap[$csvStatus] ?? 'active';

                ScaffoldingLocation::create([
                    'name' => $name,
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'address' => $address,
                    'status' => $status,
                    'notes' => ''
                ]);

                $processed++;

            } catch (\Exception $e) {
                $errors[] = [
                    'row' => $processed + 1,
                    'error' => $e->getMessage()
                ];
            }
        }

        fclose($handle);

        return [
            'processed' => $processed,
            'errors' => $errors
        ];
    }
}
