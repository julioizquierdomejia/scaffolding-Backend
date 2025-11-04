<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ScaffoldingLocation extends Model
{
    use HasUuids;

    protected $fillable = [
        'name',
        'latitude',
        'longitude',
        'address',
        'status',
        'notes'
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];
}
