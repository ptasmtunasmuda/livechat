<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPresence extends Model
{
    use HasFactory;

    protected $table = 'user_presence';

    protected $fillable = [
        'user_id',
        'status',
        'last_seen',
        'socket_id',
    ];

    protected $casts = [
        'last_seen' => 'datetime',
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeOnline($query)
    {
        return $query->where('status', 'online');
    }

    public function scopeAway($query)
    {
        return $query->where('status', 'away');
    }

    public function scopeBusy($query)
    {
        return $query->where('status', 'busy');
    }

    public function scopeOffline($query)
    {
        return $query->where('status', 'offline');
    }

    // Helper Methods
    public function setOnline(string $socketId = null): void
    {
        $this->update([
            'status' => 'online',
            'last_seen' => now(),
            'socket_id' => $socketId,
        ]);
    }

    public function setOffline(): void
    {
        $this->update([
            'status' => 'offline',
            'last_seen' => now(),
            'socket_id' => null,
        ]);
    }

    public function isOnline(): bool
    {
        return $this->status === 'online';
    }

    public function getLastSeenHumanAttribute(): string
    {
        if ($this->isOnline()) {
            return 'Online';
        }

        return $this->last_seen->diffForHumans();
    }
}
