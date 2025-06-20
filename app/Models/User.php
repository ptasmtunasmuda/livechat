<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
        'bio',
        'is_online',
        'last_activity',
        'preferences',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_online' => 'boolean',
            'last_activity' => 'datetime',
            'preferences' => 'array',
        ];
    }

    // Chat-related relationships
    public function roomMemberships(): HasMany
    {
        return $this->hasMany(RoomMember::class);
    }

    public function chatRooms(): HasMany
    {
        return $this->hasMany(ChatRoom::class, 'created_by');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function presence(): HasOne
    {
        return $this->hasOne(UserPresence::class);
    }

    // Helper methods
    public function getAvatarUrlAttribute(): string
    {
        return $this->avatar 
            ? asset('storage/' . $this->avatar)
            : 'https://ui-avatars.com/api/?name=' . urlencode($this->name) . '&background=3B82F6&color=fff';
    }

    public function setOnline(): void
    {
        $this->update([
            'is_online' => true,
            'last_activity' => now(),
        ]);

        $this->presence()->updateOrCreate(
            ['user_id' => $this->id],
            ['status' => 'online', 'last_seen' => now()]
        );
    }

    public function setOffline(): void
    {
        $this->update([
            'is_online' => false,
            'last_activity' => now(),
        ]);

        $this->presence()->updateOrCreate(
            ['user_id' => $this->id],
            ['status' => 'offline', 'last_seen' => now()]
        );
    }

    public function getJoinedRooms()
    {
        return ChatRoom::whereHas('members', function ($query) {
            $query->where('user_id', $this->id);
        })->with(['latestMessage', 'members.user'])->get();
    }

    public function canJoinRoom(ChatRoom $room): bool
    {
        return $room->canUserJoin($this);
    }

    public function joinRoom(ChatRoom $room, string $role = 'member'): RoomMember
    {
        if (!$this->canJoinRoom($room)) {
            throw new \Exception('Cannot join this room');
        }

        return $room->addMember($this, $role);
    }

    public function leaveRoom(ChatRoom $room): bool
    {
        return $room->removeMember($this);
    }
}
