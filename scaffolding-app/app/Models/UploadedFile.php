<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class UploadedFile extends Model
{
    use HasUuids;

    public $timestamps = false;

    protected $fillable = [
        'filename',
        'total_records'
    ];

    protected $casts = [
        'uploaded_at' => 'datetime',
    ];
}
