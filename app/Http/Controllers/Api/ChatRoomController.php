<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatRoom;
use App\Events\UserJoinedRoom;
use App\Events\UserLeftRoom;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Str;

class ChatRoomController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        
        try {
            $rooms = $user->getJoinedRooms()
                ->map(function ($room) use ($user) {
                    $room->unread_count = $room->getUnreadCountForUser($user);
                    return $room;
                });

            return response()->json([
                'data' => $rooms->values()->all() // Ensure it's a proper array
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to fetch rooms for user ' . $user->id . ': ' . $e->getMessage());
            
            return response()->json([
                'data' => [],
                'message' => 'Failed to fetch rooms'
            ], 500);
        }
    }

    public function show(Request $request, ChatRoom $room)
    {
        $user = $request->user();

        if (!$room->canUserJoin($user)) {
            return response()->json([
                'message' => 'You do not have access to this room'
            ], Response::HTTP_FORBIDDEN);
        }

        $room->load(['members.user', 'creator']);

        return response()->json([
            'data' => $room
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'type' => 'required|in:public,private',
            'description' => 'nullable|string|max:500',
        ]);

        $room = ChatRoom::create([
            'name' => $request->name,
            'slug' => Str::slug($request->name),
            'type' => $request->type,
            'description' => $request->description,
            'created_by' => $request->user()->id,
        ]);

        // Add creator as admin member
        $room->addMember($request->user(), 'admin');

        $room->load(['members.user', 'creator']);

        return response()->json([
            'data' => $room,
            'message' => 'Room created successfully'
        ], Response::HTTP_CREATED);
    }

    public function update(Request $request, ChatRoom $room)
    {
        $user = $request->user();
        
        // Check if user can moderate the room
        $memberRole = $room->getMemberRole($user);
        if (!in_array($memberRole, ['admin', 'moderator'])) {
            return response()->json([
                'message' => 'You do not have permission to update this room'
            ], Response::HTTP_FORBIDDEN);
        }

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:500',
        ]);

        $data = $request->only(['name', 'description']);
        
        if (isset($data['name'])) {
            $data['slug'] = Str::slug($data['name']);
        }

        $room->update($data);

        return response()->json([
            'data' => $room->fresh(),
            'message' => 'Room updated successfully'
        ]);
    }

    public function destroy(Request $request, ChatRoom $room)
    {
        $user = $request->user();

        // Only room creator or admin can delete
        if ($room->created_by !== $user->id && !$user->is_admin) {
            return response()->json([
                'message' => 'You do not have permission to delete this room'
            ], Response::HTTP_FORBIDDEN);
        }

        $room->delete();

        return response()->json([
            'message' => 'Room deleted successfully'
        ]);
    }

    public function join(Request $request, ChatRoom $room)
    {
        $user = $request->user();

        if (!$room->canUserJoin($user)) {
            return response()->json([
                'message' => 'You cannot join this room'
            ], Response::HTTP_FORBIDDEN);
        }

        if ($room->isMember($user)) {
            return response()->json([
                'message' => 'You are already a member of this room'
            ], Response::HTTP_BAD_REQUEST);
        }

        $room->addMember($user);

        // Broadcast user joined event
        broadcast(new UserJoinedRoom($room, $user));

        $room->load(['members.user', 'creator']);

        return response()->json([
            'data' => $room,
            'message' => 'Joined room successfully'
        ]);
    }

    public function leave(Request $request, ChatRoom $room)
    {
        $user = $request->user();

        if (!$room->isMember($user)) {
            return response()->json([
                'message' => 'You are not a member of this room'
            ], Response::HTTP_BAD_REQUEST);
        }

        // Prevent room creator from leaving
        if ($room->created_by === $user->id) {
            return response()->json([
                'message' => 'Room creator cannot leave the room'
            ], Response::HTTP_BAD_REQUEST);
        }

        $room->removeMember($user);

        // Broadcast user left event
        broadcast(new UserLeftRoom($room, $user));

        return response()->json([
            'message' => 'Left room successfully'
        ]);
    }

    public function markAsRead(Request $request, ChatRoom $room)
    {
        $user = $request->user();

        if (!$room->isMember($user)) {
            return response()->json([
                'message' => 'You are not a member of this room'
            ], Response::HTTP_FORBIDDEN);
        }

        $member = $room->members()->where('user_id', $user->id)->first();
        $member->markAsRead();

        return response()->json([
            'message' => 'Room marked as read'
        ]);
    }
}
