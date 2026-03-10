alter table public.chat_events
  add column if not exists tool_outputs jsonb not null default '[]'::jsonb,
  add column if not exists supplier_cards jsonb not null default '[]'::jsonb,
  add column if not exists product_cards jsonb not null default '[]'::jsonb;
