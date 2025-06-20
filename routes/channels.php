<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\ChatRoom;

// User private channel
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// Chat room private channels
Broadcast::channel('chat-room.{roomId}', function ($user, $roomId) {
    $room = ChatRoom::find($roomId);
    
    // Check if user is a member of the room
    return $room && $room->isMember($user) ? $user : null;
});

// Online users presence channel
Broadcast::channel('online-users', function ($user) {
    return [
        'id' => $user->id,
        'name' => $user->name,
        'avatar_url' => $user->avatar_url,
    ];
});
