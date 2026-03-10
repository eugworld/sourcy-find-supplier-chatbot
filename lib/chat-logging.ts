'use client';

import { isToolOrDynamicToolUIPart, getToolOrDynamicToolName, type UIMessage } from 'ai';

import { getSupabaseClient } from '@/lib/supabase';

const ANON_SESSION_KEY = 'sourcy_anon_session_id';

let warned = false;

function randomId(): string {
  return `anon_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateAnonSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server_session';
  }

  const stored = localStorage.getItem(ANON_SESSION_KEY);
  if (stored) {
    return stored;
  }

  const created = randomId();
  localStorage.setItem(ANON_SESSION_KEY, created);
  return created;
}

function extractText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n')
    .trim();
}

function extractTools(message: UIMessage): Array<{ name: string; state: string }> {
  return message.parts
    .filter((part) => isToolOrDynamicToolUIPart(part))
    .map((part) => ({
      name: getToolOrDynamicToolName(part),
      state: part.state,
    }));
}

export async function logChatMessageEvent(params: {
  message: UIMessage;
  queryMode: string;
  isAuthenticated: boolean;
  email: string | null;
  userId: string | null;
  anonSessionId: string;
}): Promise<void> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return;
  }

  const tools = extractTools(params.message);

  const payload = {
    message_id: params.message.id,
    role: params.message.role,
    text_content: extractText(params.message),
    tools_called: tools,
    raw_parts: params.message.parts,
    query_mode: params.queryMode,
    is_authenticated: params.isAuthenticated,
    email: params.email,
    user_id: params.userId,
    anon_session_id: params.anonSessionId,
  };

  const { error } = await supabase.from('chat_events').insert(payload);
  if (error && !warned) {
    warned = true;
    console.warn('chat_events logging failed. Create table/policy in Supabase.', error.message);
  }
}
