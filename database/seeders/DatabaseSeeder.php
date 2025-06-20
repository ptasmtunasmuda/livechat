<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\ChatRoom;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Create a test user if not exists
        $user = User::firstOrCreate(
            ['email' => 'admin@livechat.com'],
            [
                'name' => 'Admin User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        // Create a general chat room
        $generalRoom = ChatRoom::firstOrCreate(
            ['slug' => 'general'],
            [
                'name' => 'General Chat',
                'type' => 'public',
                'description' => 'General discussion for everyone',
                'created_by' => $user->id,
                'is_active' => true,
            ]
        );

        // Add user as admin member
        $generalRoom->addMember($user, 'admin');

        // Create a random chat room
        $randomRoom = ChatRoom::firstOrCreate(
            ['slug' => 'random'],
            [
                'name' => 'Random Chat',
                'type' => 'public',
                'description' => 'Random discussions and fun',
                'created_by' => $user->id,
                'is_active' => true,
            ]
        );

        // Add user as admin member
        $randomRoom->addMember($user, 'admin');

        echo "✅ Database seeded successfully!\n";
        echo "📧 Login email: admin@livechat.com\n";
        echo "🔑 Password: password\n";
    }
}
