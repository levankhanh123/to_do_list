<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            Schema::table('mood_posts', function (Blueprint $table): void {
                $table->dropUnique('mood_posts_entry_date_unique');
                $table->index('entry_date');
            });

            return;
        }

        Schema::table('mood_posts', function (Blueprint $table): void {
            $table->dropUnique(['entry_date']);
            $table->index('entry_date');
        });
    }

    public function down(): void
    {
        Schema::table('mood_posts', function (Blueprint $table): void {
            $table->dropIndex(['entry_date']);
            $table->unique('entry_date');
        });
    }
};
