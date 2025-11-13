<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ScaffoldingLocation;

class UpdateLocationDatesSeeder extends Seeder
{
    public function run(): void
    {
        $locations = ScaffoldingLocation::all();
        $count = 0;
        $this->command->info("Actualizando {$locations->count()} registros...");

        foreach ($locations as $index => $location) {
            // Distribuir antigüedades de manera variada
            if ($index % 5 == 0) {
                // Nuevos: 1-30 días
                $location->created_at = now()->subDays(rand(1, 30));
            } elseif ($index % 5 == 1) {
                // Recientes: 31-90 días
                $location->created_at = now()->subDays(rand(31, 90));
            } elseif ($index % 5 == 2) {
                // Antiguos: 91-180 días
                $location->created_at = now()->subDays(rand(91, 180));
            } elseif ($index % 5 == 3) {
                // Antiguos: 181-365 días
                $location->created_at = now()->subDays(rand(181, 365));
            } else {
                // Muy antiguos: más de 365 días
                $location->created_at = now()->subDays(rand(366, 730));
            }

            $location->updated_at = $location->created_at;
            $location->save();
            $count++;
        }

        $this->command->info("Actualizados: {$count} registros con fechas variadas");
    }
}
