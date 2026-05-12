<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class MoodPost extends Model
{
    use HasUuids;

    protected $fillable = [
        'mood',
        'caption',
        'image',
        'entry_date',
    ];

    protected function casts(): array
    {
        return [
            'entry_date' => 'date:Y-m-d',
        ];
    }
}
