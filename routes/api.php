<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ChatRoomController;
use App\Http\Controllers\Api\MessageController;

// Public routes
Route::get('/test', function () {
    return response()->json(['message' => 'API is working', 'time' => now()]);
});
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware(['auth:sanctum'])->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'me']);
    Route::put('/user/profile', [AuthController::class, 'updateProfile']);
    Route::post('/user/avatar', [AuthController::class, 'uploadAvatar']);
    
    // Chat rooms
    Route::apiResource('rooms', ChatRoomController::class);
    Route::post('/rooms/{room}/join', [ChatRoomController::class, 'join']);
    Route::post('/rooms/{room}/leave', [ChatRoomController::class, 'leave']);
    Route::post('/rooms/{room}/read', [ChatRoomController::class, 'markAsRead']);
    
    // Messages
    Route::get('/rooms/{room}/messages', [MessageController::class, 'index']);
    Route::post('/rooms/{room}/messages', [MessageController::class, 'store']);
    Route::get('/rooms/{room}/messages/search', [MessageController::class, 'search']);
    Route::put('/messages/{message}', [MessageController::class, 'update']);
    Route::delete('/messages/{message}', [MessageController::class, 'destroy']);
});
