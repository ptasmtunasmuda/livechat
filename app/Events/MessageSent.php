<?php

namespace App\Events;

use App\Models\Message;
use App\Models\ChatRoom;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $message;
    public $room;

    public function __construct(Message $message, ChatRoom $room)
    {
        $this->message = $message;
        $this->room = $room;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('chat-room.' . $this->room->id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'message' => $this->message->load(['user', 'attachments']),
            'room_id' => $this->room->id,
        ];
    }

    public function broadcastAs(): string
    {
        return 'MessageSent';
    }
}
