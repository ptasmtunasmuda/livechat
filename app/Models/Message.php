<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'room_id',
        'user_id',
        'content',
        'type',
        'metadata',
        'is_edited',
        'edited_at',
    ];

    protected $casts = [
        'metadata' => 'array',
        'is_edited' => 'boolean',
        'edited_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
    // Relationships
    public function room(): BelongsTo
    {
        return $this->belongsTo(ChatRoom::class, 'room_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(MessageAttachment::class);
    }

    // Scopes
    public function scopeText($query)
    {
        return $query->where('type', 'text');
    }

    public function scopeFiles($query)
    {
        return $query->whereIn('type', ['file', 'image']);
    }

    public function scopeSystem($query)
    {
        return $query->where('type', 'system');
    }

    public function scopeRecent($query, int $days = 7)
    {
        return $query->where('created_at', '>=', now()->subDays($days));
    }

    public function scopeSearch($query, string $term)
    {
        return $query->whereFullText('content', $term);
    }

    // Helper Methods
    public function isEditable(): bool
    {
        return $this->type === 'text' && 
               $this->created_at->diffInMinutes(now()) <= 15;
    }

    public function isDeletable(): bool
    {
        return $this->created_at->diffInHours(now()) <= 24;
    }

    public function edit(string $newContent): void
    {
        if (!$this->isEditable()) {
            throw new \Exception('Message is no longer editable');
        }

        $this->update([
            'content' => $newContent,
            'is_edited' => true,
            'edited_at' => now(),
        ]);
    }

    public function hasAttachments(): bool
    {
        return $this->attachments()->exists();
    }

    public function getReplyTo(): ?self
    {
        $replyToId = $this->metadata['reply_to'] ?? null;
        return $replyToId ? self::find($replyToId) : null;
    }

    public function setReplyTo(self $message): void
    {
        $metadata = $this->metadata ?? [];
        $metadata['reply_to'] = $message->id;
        $this->update(['metadata' => $metadata]);
    }
}
