export const APP_NAME = 'Sourcy Supplier Intelligence';

export const SOURCY_SUPPLIER_API_URL =
  'https://labs.sourcy.ai/api/supplier-intelligence/ask';
export const SUPPLIER_NODE_NAME = 'supplier_intelligence';
export const POSTGREST_BASE_URL = 'https://api.sourcy.ai/db';

export const PRIMARY_MODEL = 'gemini-3.1-pro-preview';
export const FAST_MODEL = 'gemini-3-flash-preview';

export const ANON_LIMIT = 2;
export const AUTH_LIMIT = 5;

export const CHAT_USAGE_STORAGE_KEY = 'sourcy_chat_usage';
export const AUTH_STORAGE_KEY = 'sourcy_auth';

export const QUERY_TYPES = {
  FAST: 'RAG_COMPLETION',
  DEEP: 'GRAPH_COMPLETION_CONTEXT_EXTENSION',
} as const;

export type QueryType = (typeof QUERY_TYPES)[keyof typeof QUERY_TYPES];

export const TOOL_PROGRESS_MESSAGES = [
  'Searching supplier knowledge base...',
  'Analyzing supplier capabilities...',
  'Ranking potential matches...',
] as const;

export const SOURCY_PRIMARY_COLOR = '#00B4A0';
