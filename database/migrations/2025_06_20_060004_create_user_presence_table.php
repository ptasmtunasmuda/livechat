<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_presence', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', ['online', 'away', 'busy', 'offline'])->default('offline');
            $table->timestamp('last_seen')->useCurrent();
            $table->string('socket_id')->nullable(); // for tracking websocket connections
            $table->timestamps();
            
            $table->unique('user_id');
            $table->index(['status', 'last_seen']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_presence');
    }
};
