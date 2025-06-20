<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('message_id')->constrained('messages')->onDelete('cascade');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type');
            $table->unsignedBigInteger('file_size'); // in bytes
            $table->string('mime_type');
            $table->timestamps();
            
            $table->index('file_type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_attachments');
    }
};
