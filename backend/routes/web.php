<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'Daily Corner API',
        'status' => 'ok',
        'endpoints' => [
            'tasks' => url('/api/tasks'),
            'moods' => url('/api/moods'),
        ],
    ]);
});
