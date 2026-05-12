<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('api_tokens', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name')->default('web');
            $table->string('token_hash')->unique();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
        });

        Schema::table('tasks', function (Blueprint $table): void {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            $table->index(['user_id', 'due_date']);
        });

        Schema::table('mood_posts', function (Blueprint $table): void {
            $table->foreignId('user_id')->nullable()->after('id')->constrained()->cascadeOnDelete();
            $table->index(['user_id', 'entry_date']);
        });
    }

    public function down(): void
    {
        Schema::table('mood_posts', function (Blueprint $table): void {
            $table->dropIndex(['user_id', 'entry_date']);
            $table->dropConstrainedForeignId('user_id');
        });

        Schema::table('tasks', function (Blueprint $table): void {
            $table->dropIndex(['user_id', 'due_date']);
            $table->dropConstrainedForeignId('user_id');
        });

        Schema::dropIfExists('api_tokens');
    }
};
