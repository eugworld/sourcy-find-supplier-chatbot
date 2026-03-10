create table if not exists public.chat_events (
  id bigserial primary key,
  created_at timestamptz not null default now(),
  message_id text not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  text_content text,
  tools_called jsonb not null default '[]'::jsonb,
  raw_parts jsonb not null default '[]'::jsonb,
  query_mode text,
  is_authenticated boolean not null default false,
  email text,
  user_id uuid,
  anon_session_id text
);

create index if not exists chat_events_created_at_idx on public.chat_events (created_at desc);
create index if not exists chat_events_user_id_idx on public.chat_events (user_id);
create index if not exists chat_events_anon_session_idx on public.chat_events (anon_session_id);

alter table public.chat_events enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'chat_events'
      and policyname = 'chat_events_insert_all'
  ) then
    create policy chat_events_insert_all
      on public.chat_events
      for insert
      to anon, authenticated
      with check (true);
  end if;
end
$$;
