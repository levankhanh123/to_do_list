<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasUuids;

    protected $fillable = [
        'title',
        'category',
        'priority',
        'due_date',
        'done',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date:Y-m-d',
            'done' => 'boolean',
        ];
    }
}
