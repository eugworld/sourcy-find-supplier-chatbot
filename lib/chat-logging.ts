'use client';

import { isToolOrDynamicToolUIPart, getToolOrDynamicToolName, type UIMessage } from 'ai';

import { parseProductsFromToolOutput } from '@/lib/parse-product-response';
import { parseSupplierResponse } from '@/lib/parse-supplier-response';
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

function extractToolOutputs(message: UIMessage): Array<{
  name: string;
  state: string;
  output: unknown;
}> {
  return message.parts
    .filter((part) => isToolOrDynamicToolUIPart(part))
    .map((part) => ({
      name: getToolOrDynamicToolName(part),
      state: part.state,
      output: part.state === 'output-available' ? part.output : null,
    }));
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value) ?? '';
  } catch {
    return '';
  }
}

export function getMessageSnapshotSignature(message: UIMessage): string {
  const summary = {
    id: message.id,
    role: message.role,
    text: extractText(message),
    tools: extractTools(message),
    parts: message.parts,
  };

  return safeStringify(summary);
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
  const textContent = extractText(params.message);
  const toolOutputs = extractToolOutputs(params.message);
  const supplierCards =
    params.message.role === 'assistant' ? parseSupplierResponse(textContent) : [];
  const productCards = toolOutputs.flatMap((tool) =>
    tool.name === 'lookup_supplier_products' && tool.state === 'output-available'
      ? parseProductsFromToolOutput(tool.output)
      : [],
  );

  const payload = {
    message_id: params.message.id,
    role: params.message.role,
    text_content: textContent,
    tools_called: tools,
    tool_outputs: toolOutputs,
    supplier_cards: supplierCards,
    product_cards: productCards,
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
