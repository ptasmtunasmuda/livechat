<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        // Set user as online
        $user->setOnline();

        return response()->json([
            'data' => [
                'user' => $user->load('presence'),
                'token' => $token,
            ],
            'message' => 'Registration successful'
        ], Response::HTTP_CREATED);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if (!Auth::attempt($request->only('email', 'password'))) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $user = Auth::user();
        $token = $user->createToken('auth_token')->plainTextToken;

        // Set user as online
        $user->setOnline();

        return response()->json([
            'data' => [
                'user' => $user->load('presence'),
                'token' => $token,
            ],
            'message' => 'Login successful'
        ]);
    }

    public function logout(Request $request)
    {
        try {
            $user = $request->user();
            
            if ($user) {
                // Set user as offline
                $user->setOffline();
                
                // Handle token revocation
                $currentToken = $request->user()->currentAccessToken();
                
                if ($currentToken instanceof \Laravel\Sanctum\PersonalAccessToken) {
                    // Token API biasa - hapus token ini saja
                    $currentToken->delete();
                } elseif ($currentToken instanceof \Laravel\Sanctum\TransientToken) {
                    // Session-based token - tidak perlu dihapus karena otomatis expire
                    // Tapi kita bisa logout dari session juga
                    if ($request->hasSession()) {
                        $request->session()->invalidate();
                        $request->session()->regenerateToken();
                    }
                } else {
                    // Fallback: hapus semua token user (opsional)
                    // $user->tokens()->delete();
                }
            }

            return response()->json([
                'message' => 'Logged out successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error('Logout error: ' . $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine());
            
            // Selalu return success untuk logout agar frontend tidak error
            return response()->json([
                'message' => 'Logged out successfully'
            ]);
        }
    }

    public function me(Request $request)
    {
        return response()->json([
            'data' => $request->user()->load('presence')
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'bio' => 'sometimes|string|max:500',
        ]);

        $data = $request->only(['name', 'bio']);
        $user->update($data);

        return response()->json([
            'data' => $user->fresh()->load('presence'),
            'message' => 'Profile updated successfully'
        ]);
    }

    public function uploadAvatar(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'avatar' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        // Delete old avatar if exists
        if ($user->avatar) {
            Storage::delete('public/' . $user->avatar);
        }

        // Store new avatar
        $avatarPath = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $avatarPath]);

        return response()->json([
            'data' => [
                'url' => Storage::url($avatarPath),
                'path' => $avatarPath
            ],
            'message' => 'Avatar uploaded successfully'
        ]);
    }
}
