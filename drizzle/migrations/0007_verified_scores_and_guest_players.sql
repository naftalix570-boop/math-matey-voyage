-- ניקוד מאומת-שרת לשחקנים רשומים
CREATE TABLE public.player_scores (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  answered integer NOT NULL DEFAULT 0,
  suspicious boolean NOT NULL DEFAULT false,
  window_start timestamptz NOT NULL DEFAULT now(),
  window_answers integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.player_scores TO authenticated;
GRANT ALL ON public.player_scores TO service_role;

ALTER TABLE public.player_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own score"
  ON public.player_scores FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- שחקני קוד (בלי התחברות)
CREATE TABLE public.guest_players (
  code text PRIMARY KEY,
  secret text NOT NULL,
  display_name text NOT NULL DEFAULT 'שחקן',
  icon text NOT NULL DEFAULT '⭐',
  country text NOT NULL DEFAULT 'IL',
  score integer NOT NULL DEFAULT 0,
  answered integer NOT NULL DEFAULT 0,
  suspicious boolean NOT NULL DEFAULT false,
  window_start timestamptz NOT NULL DEFAULT now(),
  window_answers integer NOT NULL DEFAULT 0,
  claimed_by uuid,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.guest_players TO service_role;

ALTER TABLE public.guest_players ENABLE ROW LEVEL SECURITY;
-- אין מדיניות: הגישה רק דרך פונקציות שרת מאומתות

-- העברת הניקוד הקיים לטבלת הניקוד המאומת
INSERT INTO public.player_scores (user_id, score, answered)
SELECT p.user_id, GREATEST(COALESCE(p.score, 0), 0), GREATEST(COALESCE(p.score, 0), 0)
FROM public.profiles p
ON CONFLICT (user_id) DO NOTHING;

-- טבלת מובילים מאוחדת: רשומים + שחקני קוד, בלי חשודים
CREATE VIEW public.leaderboard_all
WITH (security_invoker = false) AS
SELECT
  p.user_id::text AS player_id,
  p.display_name,
  p.icon,
  p.country,
  COALESCE(s.score, 0) AS score,
  false AS is_guest
FROM public.profiles p
LEFT JOIN public.player_scores s ON s.user_id = p.user_id
WHERE COALESCE(s.suspicious, false) = false
UNION ALL
SELECT
  g.code AS player_id,
  g.display_name,
  g.icon,
  g.country,
  g.score,
  true AS is_guest
FROM public.guest_players g
WHERE g.suspicious = false AND g.claimed_by IS NULL AND g.score > 0;

GRANT SELECT ON public.leaderboard_all TO anon, authenticated;

COMMENT ON VIEW public.leaderboard_public IS 'DEPRECATED: replaced by leaderboard_all';

CREATE TRIGGER player_scores_touch_updated_at
  BEFORE UPDATE ON public.player_scores
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER guest_players_touch_updated_at
  BEFORE UPDATE ON public.guest_players
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
