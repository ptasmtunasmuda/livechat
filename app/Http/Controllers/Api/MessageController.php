<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ChatRoom;
use App\Models\Message;
use App\Models\MessageAttachment;
use App\Events\MessageSent;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class MessageController extends Controller
{
    public function index(Request $request, ChatRoom $room)
    {
        $user = $request->user();

        if (!$room->isMember($user)) {
            return response()->json([
                'message' => 'You do not have access to this room'
            ], Response::HTTP_FORBIDDEN);
        }

        $messages = $room->messages()
            ->with(['user', 'attachments'])
            ->latest()
            ->paginate(50);

        // Reverse the order to show oldest first
        $messages->getCollection()->transform(function ($message) {
            return $message;
        });

        return response()->json([
            'data' => $messages
        ]);
    }

    public function store(Request $request, ChatRoom $room)
    {
        $user = $request->user();

        if (!$room->isMember($user)) {
            return response()->json([
                'message' => 'You do not have access to this room'
            ], Response::HTTP_FORBIDDEN);
        }

        $request->validate([
            'content' => 'required|string|max:1000',
            'type' => 'sometimes|in:text,file,image',
            'reply_to' => 'sometimes|exists:messages,id',
            'attachments.*' => 'sometimes|file|max:10240', // 10MB max
        ]);

        $messageData = [
            'room_id' => $room->id,
            'user_id' => $user->id,
            'content' => $request->content,
            'type' => $request->type ?? 'text',
        ];

        // Handle reply
        if ($request->reply_to) {
            $messageData['metadata'] = ['reply_to' => $request->reply_to];
        }

        $message = Message::create($messageData);

        // Handle file attachments
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('chat-attachments', 'public');
                
                MessageAttachment::create([
                    'message_id' => $message->id,
                    'file_name' => $file->getClientOriginalName(),
                    'file_path' => $path,
                    'file_type' => $file->getClientOriginalExtension(),
                    'file_size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                ]);
            }
        }

        $message->load(['user', 'attachments']);

        // Broadcast the message
        broadcast(new MessageSent($message, $room));

        return response()->json([
            'data' => $message,
            'message' => 'Message sent successfully'
        ], Response::HTTP_CREATED);
    }

    public function update(Request $request, Message $message)
    {
        $user = $request->user();

        // Check if user owns the message
        if ($message->user_id !== $user->id) {
            return response()->json([
                'message' => 'You can only edit your own messages'
            ], Response::HTTP_FORBIDDEN);
        }

        // Check if message is editable
        if (!$message->isEditable()) {
            return response()->json([
                'message' => 'This message can no longer be edited'
            ], Response::HTTP_BAD_REQUEST);
        }

        $request->validate([
            'content' => 'required|string|max:1000',
        ]);

        $message->edit($request->content);

        $message->load(['user', 'attachments']);

        return response()->json([
            'data' => $message,
            'message' => 'Message updated successfully'
        ]);
    }

    public function destroy(Request $request, Message $message)
    {
        $user = $request->user();

        // Check if user owns the message or is room moderator
        $room = $message->room;
        $memberRole = $room->getMemberRole($user);
        
        if ($message->user_id !== $user->id && !in_array($memberRole, ['admin', 'moderator'])) {
            return response()->json([
                'message' => 'You do not have permission to delete this message'
            ], Response::HTTP_FORBIDDEN);
        }

        // Check if message is deletable (for non-moderators)
        if ($message->user_id === $user->id && !$message->isDeletable()) {
            return response()->json([
                'message' => 'This message can no longer be deleted'
            ], Response::HTTP_BAD_REQUEST);
        }

        $message->delete();

        return response()->json([
            'message' => 'Message deleted successfully'
        ]);
    }

    public function search(Request $request, ChatRoom $room)
    {
        $user = $request->user();

        if (!$room->isMember($user)) {
            return response()->json([
                'message' => 'You do not have access to this room'
            ], Response::HTTP_FORBIDDEN);
        }

        $request->validate([
            'q' => 'required|string|min:3|max:100',
        ]);

        $messages = $room->messages()
            ->with(['user', 'attachments'])
            ->search($request->q)
            ->latest()
            ->paginate(20);

        return response()->json([
            'data' => $messages
        ]);
    }
}
