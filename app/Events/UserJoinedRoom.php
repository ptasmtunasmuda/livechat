<?php

namespace App\Events;

use App\Models\User;
use App\Models\ChatRoom;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UserJoinedRoom implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $user;
    public $room;

    public function __construct(ChatRoom $room, User $user)
    {
        $this->room = $room;
        $this->user = $user;
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
            'user' => $this->user,
            'room_id' => $this->room->id,
        ];
    }

    public function broadcastAs(): string
    {
        return 'UserJoined';
    }
}
