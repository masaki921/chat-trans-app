import { Message, Profile, Conversation, ConversationMember } from './database';

export type ConversationWithDetails = Conversation & {
  members: (ConversationMember & { profile: Profile })[];
};

export type MessageWithSender = Message & {
  sender: Profile;
};
