import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '../types/database';
import { supabase } from '../services/supabase';
import { unregisterPushToken } from '../services/notifications';

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isLoading: boolean;
  initialized: boolean;

  initialize: () => Promise<void>;
  setSession: (session: Session | null) => void;
  fetchProfile: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: Error | null }>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  isLoading: true,
  initialized: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({ session, user: session?.user ?? null, initialized: true, isLoading: false });

    if (session?.user) {
      get().fetchProfile();
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, user: session?.user ?? null });
      if (session?.user) {
        get().fetchProfile();
      } else {
        set({ profile: null });
      }
    });
  },

  setSession: (session) => {
    set({ session, user: session?.user ?? null });
  },

  fetchProfile: async () => {
    const user = get().user;
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (data) {
      set({ profile: data as Profile });
    }
  },

  signUp: async (email, password) => {
    set({ isLoading: true });
    const { error } = await supabase.auth.signUp({ email, password });
    set({ isLoading: false });
    return { error: error ? new Error(error.message) : null };
  },

  signIn: async (email, password) => {
    set({ isLoading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ isLoading: false });
    return { error: error ? new Error(error.message) : null };
  },

  signOut: async () => {
    const user = get().user;
    if (user) {
      await unregisterPushToken(user.id);
    }
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },

  deleteAccount: async () => {
    const user = get().user;
    if (!user) return { error: new Error('Not authenticated') };

    try {
      await unregisterPushToken(user.id);
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) return { error: new Error(error.message) };
      await supabase.auth.signOut();
      set({ session: null, user: null, profile: null });
      return { error: null };
    } catch (e: any) {
      return { error: new Error(e.message ?? 'Failed to delete account') };
    }
  },

  updateProfile: async (updates) => {
    const user = get().user;
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error) {
      set((state) => ({
        profile: state.profile ? { ...state.profile, ...updates } : null,
      }));
    }

    return { error: error ? new Error(error.message) : null };
  },
}));
