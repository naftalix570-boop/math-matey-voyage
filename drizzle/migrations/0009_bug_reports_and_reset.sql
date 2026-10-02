CREATE TABLE public.bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (char_length(category) <= 40),
  description text NOT NULL CHECK (char_length(description) BETWEEN 1 AND 2000),
  app_version text CHECK (char_length(app_version) <= 20),
  device text CHECK (char_length(device) <= 60),
  os text CHECK (char_length(os) <= 60),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.bug_reports TO anon, authenticated;
GRANT ALL ON public.bug_reports TO service_role;
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit bug reports" ON public.bug_reports FOR INSERT TO anon, authenticated WITH CHECK (true);

DELETE FROM public.player_scores;
DELETE FROM public.guest_players;
DELETE FROM public.profiles;