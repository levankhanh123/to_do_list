<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasIndex('mood_posts', 'mood_posts_entry_date_unique', 'unique')) {
            Schema::table('mood_posts', function (Blueprint $table): void {
                $table->dropUnique('mood_posts_entry_date_unique');
            });
        }

        if (! Schema::hasIndex('mood_posts', 'mood_posts_entry_date_index')) {
            Schema::table('mood_posts', function (Blueprint $table): void {
                $table->index('entry_date', 'mood_posts_entry_date_index');
            });
        }
    }

    public function down(): void
    {
        Schema::table('mood_posts', function (Blueprint $table): void {
            $table->dropIndex(['entry_date']);
            $table->unique('entry_date');
        });
    }
};
