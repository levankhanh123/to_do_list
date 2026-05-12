<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
