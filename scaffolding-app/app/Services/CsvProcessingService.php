<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CsvProcessingService
{
    const CHUNK_SIZE = 500;

    public function processCsv(UploadedFile $file)
    {
        $processed = 0;
        $errors = [];
        $batch = [];

        $handle = fopen($file->getPathname(), 'r');
        $headers = fgetcsv($handle);

        $latIndex = array_search('Latitude Point', $headers);
        $lngIndex = array_search('Longitude Point', $headers);
        $nameIndex = array_search('Job Number', $headers);
        $boroughIndex = array_search('Borough Name', $headers);
        $streetIndex = array_search('Street Name', $headers);
        $houseIndex = array_search('House Number', $headers);
        $statusIndex = array_search('Current Job Status', $headers);

        $statusMap = [
            'Permit Entire' => 'active',
            'Active' => 'active',
            'Inactive' => 'inactive',
            'Maintenance' => 'maintenance'
        ];

        $now = now();
        $rowNumber = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;

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
                $addressParts = [];
                if (!empty($row[$houseIndex])) {
                    $addressParts[] = trim($row[$houseIndex]);
                }
                if (!empty($row[$streetIndex])) {
                    $addressParts[] = trim($row[$streetIndex]);
                }
                if (!empty($row[$boroughIndex])) {
                    $addressParts[] = trim($row[$boroughIndex]);
                }
                if (!empty($addressParts)) {
                    $address = implode(', ', $addressParts);
                }

                $name = !empty($row[$nameIndex]) ? $row[$nameIndex] : 'Unknown';
                $csvStatus = !empty($row[$statusIndex]) ? $row[$statusIndex] : 'Permit Entire';
                $status = $statusMap[$csvStatus] ?? 'active';

                $batch[] = [
                    'id' => (string) Str::uuid(),
                    'name' => $name,
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'address' => $address,
                    'status' => $status,
                    'notes' => '',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $processed++;

                if (count($batch) >= self::CHUNK_SIZE) {
                    DB::table('scaffolding_locations')->insert($batch);
                    $batch = [];
                }

            } catch (\Exception $e) {
                $errors[] = [
                    'row' => $rowNumber,
                    'error' => $e->getMessage()
                ];
            }
        }

        if (!empty($batch)) {
            DB::table('scaffolding_locations')->insert($batch);
        }

        fclose($handle);

        return [
            'processed' => $processed,
            'errors' => $errors
        ];
    }

    public function processCsvWithMapping(UploadedFile $file, array $mapping)
    {
        $processed = 0;
        $errors = [];
        $batch = [];

        $handle = fopen($file->getPathname(), 'r');
        $headers = fgetcsv($handle);

        $statusMap = [
            'Permit Entire' => 'active',
            'Active' => 'active',
            'Inactive' => 'inactive',
            'Maintenance' => 'maintenance'
        ];

        $now = now();
        $rowNumber = 0;

        while (($row = fgetcsv($handle)) !== false) {
            $rowNumber++;

            try {
                $latitude = isset($mapping['latitude']) && isset($row[$mapping['latitude']])
                    ? (float) $row[$mapping['latitude']]
                    : null;

                $longitude = isset($mapping['longitude']) && isset($row[$mapping['longitude']])
                    ? (float) $row[$mapping['longitude']]
                    : null;

                if (empty($latitude) || empty($longitude) || $latitude == 0 || $longitude == 0) {
                    continue;
                }

                $name = isset($mapping['name']) && isset($row[$mapping['name']])
                    ? $row[$mapping['name']]
                    : 'Unknown';

                // Construir dirección desde columnas individuales o desde campo address
                $address = '';
                $addressParts = [];

                // Buscar House Number, Street Name, Borough Name en headers
                $houseIndex = array_search('House Number', $headers);
                $streetIndex = array_search('Street Name', $headers);
                $boroughIndex = array_search('Borough Name', $headers);

                if ($houseIndex !== false && !empty($row[$houseIndex])) {
                    $addressParts[] = trim($row[$houseIndex]);
                }
                if ($streetIndex !== false && !empty($row[$streetIndex])) {
                    $addressParts[] = trim($row[$streetIndex]);
                }
                if ($boroughIndex !== false && !empty($row[$boroughIndex])) {
                    $addressParts[] = trim($row[$boroughIndex]);
                }

                // Si se encontraron partes de dirección, concatenarlas
                if (!empty($addressParts)) {
                    $address = implode(', ', $addressParts);
                }
                // Si no, buscar en el mapping si hay un campo address mapeado
                else if (isset($mapping['address']) && isset($row[$mapping['address']])) {
                    $address = $row[$mapping['address']];
                }

                $csvStatus = 'active';
                if (isset($mapping['status']) && isset($row[$mapping['status']])) {
                    $csvStatus = $row[$mapping['status']];
                }
                $status = $statusMap[$csvStatus] ?? 'active';

                $notes = '';
                if (isset($mapping['notes']) && isset($row[$mapping['notes']])) {
                    $notes = $row[$mapping['notes']];
                }

                $batch[] = [
                    'id' => (string) Str::uuid(),
                    'name' => $name,
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'address' => $address,
                    'status' => $status,
                    'notes' => $notes,
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $processed++;

                if (count($batch) >= self::CHUNK_SIZE) {
                    DB::table('scaffolding_locations')->insert($batch);
                    $batch = [];
                }

            } catch (\Exception $e) {
                $errors[] = [
                    'row' => $rowNumber,
                    'error' => $e->getMessage()
                ];
            }
        }

        if (!empty($batch)) {
            DB::table('scaffolding_locations')->insert($batch);
        }

        fclose($handle);

        return [
            'processed' => $processed,
            'errors' => $errors
        ];
    }
}
