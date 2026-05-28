<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;

Route::inertia('/', 'Welcome')->name('home');

Route::get('auth/redirect', [AuthController::class, 'redirect'])->name('auth.redirect');
Route::get('auth/callback', [AuthController::class, 'callback'])->name('auth.callback');
Route::post('auth/logout', [AuthController::class, 'logout'])->name('auth.logout');

Route::get('/dashboard', function () {
    return inertia('Dashboard');
})->middleware(['auth'])->name('dashboard');
