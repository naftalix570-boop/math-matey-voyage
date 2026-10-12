ALTER TABLE public.guest_players ADD COLUMN IF NOT EXISTS public_id uuid NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS guest_players_public_id_key ON public.guest_players(public_id);
ALTER TABLE public.guest_players ADD COLUMN IF NOT EXISTS recent_batches text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.guest_players ADD COLUMN IF NOT EXISTS strike_hour timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.guest_players ADD COLUMN IF NOT EXISTS strikes integer NOT NULL DEFAULT 0;
ALTER TABLE public.player_scores ADD COLUMN IF NOT EXISTS recent_batches text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.player_scores ADD COLUMN IF NOT EXISTS strike_hour timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.player_scores ADD COLUMN IF NOT EXISTS strikes integer NOT NULL DEFAULT 0;

CREATE OR REPLACE VIEW public.leaderboard_public WITH (security_invoker = false) AS
SELECT p.user_id, p.display_name, p.icon, p.country, COALESCE(s.score, 0) AS score
FROM public.profiles p
LEFT JOIN public.player_scores s ON s.user_id = p.user_id
WHERE COALESCE(s.suspicious, false) = false
UNION ALL
SELECT g.public_id AS user_id, g.display_name, g.icon, g.country, g.score
FROM public.guest_players g
WHERE g.claimed_by IS NULL AND g.suspicious = false;
GRANT SELECT ON public.leaderboard_public TO anon, authenticated;

CREATE TABLE IF NOT EXISTS public.rate_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS rate_events_lookup ON public.rate_events(kind, key, created_at);
GRANT ALL ON public.rate_events TO service_role;
ALTER TABLE public.rate_events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.guest_transfer_pins (
  code text PRIMARY KEY,
  pin_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.guest_transfer_pins TO service_role;
ALTER TABLE public.guest_transfer_pins ENABLE ROW LEVEL SECURITY;