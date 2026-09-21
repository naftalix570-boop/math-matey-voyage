-- Public leaderboard exposes only display columns, never the private data jsonb.
create or replace view public.leaderboard_public
with (security_invoker = false) as
select user_id, display_name, icon, country, score
from public.profiles;

grant select on public.leaderboard_public to anon, authenticated;

-- Stop exposing full profile rows (including the private data jsonb) to everyone.
drop policy if exists "Anyone can read leaderboard profiles" on public.profiles;
drop policy if exists "Authenticated users can read profiles for leaderboard" on public.profiles;

create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using (auth.uid() = user_id);

revoke select on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;