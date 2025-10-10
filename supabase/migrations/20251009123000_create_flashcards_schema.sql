-- migration: create flashcards & generation tracking schema
-- purpose: introduce core tables (flashcards, generations, generation_error_logs) with row-level security policies tied to supabase auth users.
-- affected tables: public.flashcards, public.generations, public.generation_error_logs
-- special notes:
--   • all tables include automatic timestamp management via trigger set_updated_at().
--   • row level security (rls) is enabled immediately upon creation.
--   • explicit policies are provided per role (anon, authenticated) and per command (select, insert, update, delete) for clarity and auditability.
--   • destructive statements are NOT included in this migration.
--   • ensure this file executes on an empty database without errors.

-- 1. helper function to maintain updated_at column -----------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;
comment on function public.set_updated_at() is
    'trigger function that automatically stamps the updated_at column with the current timestamptz on every row update';

-- 2. table: generations --------------------------------------------------------------------------
create table public.generations (
    id                      bigserial primary key,
    user_id                 uuid references auth.users(id) not null,
    model                   varchar not null,
    generated_count         integer not null,
    accepted_unedited_count integer,
    accepted_edited_count   integer,
    source_text_hash        varchar not null,
    source_text_length      integer not null check (source_text_length between 1000 and 10000),
    generation_duration     integer not null, -- duration in milliseconds
    created_at              timestamptz not null default now(),
    updated_at              timestamptz not null default now()
);

-- index to quickly query user''s generations
create index if not exists idx_generations_user_id on public.generations(user_id);

-- enable row level security & add granular policies ----------------------------------------------
alter table public.generations enable row level security;

-- authenticated role policies
create policy generations_select_authenticated on public.generations
    for select to authenticated
    using (auth.uid() = user_id);

create policy generations_insert_authenticated on public.generations
    for insert to authenticated
    with check (auth.uid() = user_id);

create policy generations_update_authenticated on public.generations
    for update to authenticated
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create policy generations_delete_authenticated on public.generations
    for delete to authenticated
    using (auth.uid() = user_id);

-- anon role explicitly denied (clarity & audit trail)
create policy generations_select_anon on public.generations for select to anon using (false);
create policy generations_insert_anon on public.generations for insert to anon with check (false);
create policy generations_update_anon on public.generations for update to anon using (false) with check (false);
create policy generations_delete_anon on public.generations for delete to anon using (false);

-- trigger to keep updated_at current ----------------------------------------------------------------
create trigger generations_set_updated_at
    before update on public.generations
    for each row
    execute procedure public.set_updated_at();

-- 3. table: flashcards ----------------------------------------------------------------------------
create table public.flashcards (
    id             bigserial primary key,
    front          varchar(200) not null,
    back           varchar(500) not null,
    source         varchar not null check (source in ('ai-full','ai-edited','manual')),
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now(),
    generation_id  bigint references public.generations(id) on delete set null,
    user_id        uuid not null references auth.users(id)
);

-- indexes to accelerate look-ups
create index if not exists idx_flashcards_user_id on public.flashcards(user_id);
create index if not exists idx_flashcards_generation_id on public.flashcards(generation_id);

-- enable row level security & policies ------------------------------------------------------------
alter table public.flashcards enable row level security;

-- authenticated policies
create policy flashcards_select_authenticated on public.flashcards for select to authenticated using (auth.uid() = user_id);
create policy flashcards_insert_authenticated on public.flashcards for insert to authenticated with check (auth.uid() = user_id);
create policy flashcards_update_authenticated on public.flashcards for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy flashcards_delete_authenticated on public.flashcards for delete to authenticated using (auth.uid() = user_id);

-- anon role denied
create policy flashcards_select_anon on public.flashcards for select to anon using (false);
create policy flashcards_insert_anon on public.flashcards for insert to anon with check (false);
create policy flashcards_update_anon on public.flashcards for update to anon using (false) with check (false);
create policy flashcards_delete_anon on public.flashcards for delete to anon using (false);

-- trigger for updated_at
create trigger flashcards_set_updated_at
    before update on public.flashcards
    for each row
    execute procedure public.set_updated_at();

-- 4. table: generation_error_logs -----------------------------------------------------------------
create table public.generation_error_logs (
    id                bigserial primary key,
    user_id           uuid not null references auth.users(id),
    model             varchar not null,
    source_text_hash  varchar not null,
    source_text_length integer not null check (source_text_length between 1000 and 10000),
    error_code        varchar(100) not null,
    error_message     text not null,
    created_at        timestamptz not null default now()
);

-- index for filtering by user
create index if not exists idx_generation_error_logs_user_id on public.generation_error_logs(user_id);

-- enable rls
alter table public.generation_error_logs enable row level security;

-- authenticated access
create policy generation_error_logs_select_authenticated on public.generation_error_logs for select to authenticated using (auth.uid() = user_id);
create policy generation_error_logs_insert_authenticated on public.generation_error_logs for insert to authenticated with check (auth.uid() = user_id);
create policy generation_error_logs_update_authenticated on public.generation_error_logs for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy generation_error_logs_delete_authenticated on public.generation_error_logs for delete to authenticated using (auth.uid() = user_id);

-- anon denied
create policy generation_error_logs_select_anon on public.generation_error_logs for select to anon using (false);
create policy generation_error_logs_insert_anon on public.generation_error_logs for insert to anon with check (false);
create policy generation_error_logs_update_anon on public.generation_error_logs for update to anon using (false) with check (false);
create policy generation_error_logs_delete_anon on public.generation_error_logs for delete to anon using (false);

-- 5. done -----------------------------------------------------------------------------------------
-- this migration is idempotent and safe to run in production environments.
