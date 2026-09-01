GRANT SELECT ON public.profiles TO anon;

CREATE POLICY "Anyone can read leaderboard profiles"
ON public.profiles FOR SELECT TO anon USING (true);