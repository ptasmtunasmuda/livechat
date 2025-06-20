<?php

use Illuminate\Support\Facades\Route;

// Route untuk menampilkan Vue.js app
Route::get('/', function () {
    return view('app');
});

// Route untuk halaman chat (SPA catchall)
Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');

require __DIR__.'/auth.php';
