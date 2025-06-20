<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('avatar')->nullable()->after('email');
            $table->text('bio')->nullable()->after('avatar');
            $table->boolean('is_online')->default(false)->after('bio');
            $table->timestamp('last_activity')->nullable()->after('is_online');
            $table->json('preferences')->nullable()->after('last_activity'); // chat preferences
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['avatar', 'bio', 'is_online', 'last_activity', 'preferences']);
        });
    }
};
