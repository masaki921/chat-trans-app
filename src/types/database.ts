export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  status_message: string | null;
  primary_language: string;
  friend_code: string;
  push_token: string | null;
  is_online: boolean;
  last_seen_at: string | null;
  created_at: string;
  updated_at: string;
};

export type FriendshipStatus = 'pending' | 'accepted' | 'blocked';

export type Friendship = {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
};

export type ConversationType = 'direct' | 'group';

export type Conversation = {
  id: string;
  type: ConversationType;
  name: string | null;
  avatar_url: string | null;
  created_by: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
};

export type MemberRole = 'owner' | 'admin' | 'member';

export type ConversationMember = {
  conversation_id: string;
  user_id: string;
  role: MemberRole;
  unread_count: number;
  last_read_at: string | null;
  joined_at: string;
};

export type MessageType = 'text' | 'image' | 'system';

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: MessageType;
  content: string;
  media_url: string | null;
  original_language: string;
  translations: Record<string, string> | null;
  read_by: string[];
  created_at: string;
};
