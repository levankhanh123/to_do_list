<?php

use App\Models\MoodPost;
use App\Models\Task;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

Route::middleware('cors')->group(function (): void {
    Route::options('/{any}', fn () => response()->noContent())->where('any', '.*');

    Route::post('/auth/register', function (Request $request) {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:180', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6', 'max:100'],
        ]);

        $user = User::query()->create($data);
        $plainToken = Str::random(64);

        $user->apiTokens()->create([
            'name' => 'web',
            'token_hash' => hash('sha256', $plainToken),
        ]);

        return response()->json([
            'data' => [
                'user' => $user,
                'token' => $plainToken,
            ],
        ], 201);
    });

    Route::post('/auth/login', function (Request $request) {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()->where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email hoặc mật khẩu không đúng.'],
            ]);
        }

        $plainToken = Str::random(64);
        $user->apiTokens()->create([
            'name' => 'web',
            'token_hash' => hash('sha256', $plainToken),
        ]);

        return response()->json([
            'data' => [
                'user' => $user,
                'token' => $plainToken,
            ],
        ]);
    });

    Route::middleware('token.auth')->group(function (): void {
    Route::get('/auth/me', function (Request $request) {
        return response()->json(['data' => $request->user()]);
    });

    Route::post('/auth/logout', function (Request $request) {
        $plainToken = $request->bearerToken();

        if ($plainToken) {
            $request->user()
                ->apiTokens()
                ->where('token_hash', hash('sha256', $plainToken))
                ->delete();
        }

        return response()->noContent();
    });

    Route::get('/tasks', function (Request $request) {
        return response()->json([
            'data' => $request->user()
                ->tasks()
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
            'user_id' => $request->user()->id,
            'title' => $data['title'],
            'category' => $data['category'],
            'priority' => $data['priority'],
            'due_date' => $data['due_date'],
            'done' => $data['done'] ?? false,
        ]);

        return response()->json(['data' => $task], 201);
    });

    Route::patch('/tasks/{task}', function (Request $request, Task $task) {
        abort_unless($task->user_id === $request->user()->id, 404);

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
        abort_unless($task->user_id === request()->user()->id, 404);

        $task->delete();

        return response()->noContent();
    });

    Route::get('/moods', function (Request $request) {
        return response()->json([
            'data' => $request->user()
                ->moodPosts()
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
            'user_id' => $request->user()->id,
            'mood' => $data['mood'],
            'caption' => $data['caption'] ?? null,
            'image' => $data['image'] ?? null,
            'entry_date' => $data['entry_date'],
        ]);

        return response()->json(['data' => $mood], 201);
    });

    Route::delete('/moods/{moodPost}', function (MoodPost $moodPost) {
        abort_unless($moodPost->user_id === request()->user()->id, 404);

        $moodPost->delete();

        return response()->noContent();
    });
    });
});
