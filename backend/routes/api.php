<?php

use App\Models\MoodPost;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;

Route::middleware('cors')->group(function (): void {
    Route::options('/{any}', fn () => response()->noContent())->where('any', '.*');

    Route::get('/tasks', function () {
        return response()->json([
            'data' => Task::query()
                ->latest('created_at')
                ->get(),
        ]);
    });

    Route::post('/tasks', function (Request $request) {
        $data = $request->validate([
            'id' => ['nullable', 'uuid'],
            'title' => ['required', 'string', 'max:180'],
            'category' => ['required', 'string', 'max:60'],
            'priority' => ['required', 'in:low,normal,high'],
            'due_date' => ['required', 'date'],
            'done' => ['sometimes', 'boolean'],
        ]);

        $task = Task::query()->create([
            'id' => $data['id'] ?? (string) Str::uuid(),
            'title' => $data['title'],
            'category' => $data['category'],
            'priority' => $data['priority'],
            'due_date' => $data['due_date'],
            'done' => $data['done'] ?? false,
        ]);

        return response()->json(['data' => $task], 201);
    });

    Route::patch('/tasks/{task}', function (Request $request, Task $task) {
        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:180'],
            'category' => ['sometimes', 'string', 'max:60'],
            'priority' => ['sometimes', 'in:low,normal,high'],
            'due_date' => ['sometimes', 'date'],
            'done' => ['sometimes', 'boolean'],
        ]);

        $task->update($data);

        return response()->json(['data' => $task->fresh()]);
    });

    Route::delete('/tasks/{task}', function (Task $task) {
        $task->delete();

        return response()->noContent();
    });

    Route::get('/moods', function () {
        return response()->json([
            'data' => MoodPost::query()
                ->latest('entry_date')
                ->latest('created_at')
                ->get(),
        ]);
    });

    Route::post('/moods', function (Request $request) {
        $data = $request->validate([
            'id' => ['nullable', 'uuid'],
            'mood' => ['required', 'string', 'max:40'],
            'caption' => ['nullable', 'string', 'max:500'],
            'image' => ['nullable', 'string'],
            'entry_date' => ['required', 'date'],
        ]);

        $mood = MoodPost::query()->create([
            'id' => $data['id'] ?? (string) Str::uuid(),
            'mood' => $data['mood'],
            'caption' => $data['caption'] ?? null,
            'image' => $data['image'] ?? null,
            'entry_date' => $data['entry_date'],
        ]);

        return response()->json(['data' => $mood], 201);
    });

    Route::delete('/moods/{moodPost}', function (MoodPost $moodPost) {
        $moodPost->delete();

        return response()->noContent();
    });
});
