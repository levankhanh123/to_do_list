<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->string('category')->default('Cá nhân');
            $table->string('priority')->default('normal');
            $table->date('due_date');
            $table->boolean('done')->default(false);
            $table->timestamps();
        });

        Schema::create('mood_posts', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->string('mood');
            $table->text('caption')->nullable();
            $table->longText('image')->nullable();
            $table->date('entry_date')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mood_posts');
        Schema::dropIfExists('tasks');
    }
};
