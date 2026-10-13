CREATE OR REPLACE VIEW public.leaderboard_all AS
SELECT p.user_id::text AS player_id, p.display_name, p.icon, p.country, COALESCE(s.score, 0) AS score, false AS is_guest
FROM public.profiles p LEFT JOIN public.player_scores s ON s.user_id = p.user_id
WHERE COALESCE(s.suspicious, false) = false
UNION ALL
SELECT g.public_id::text AS player_id, g.display_name, g.icon, g.country, g.score, true AS is_guest
FROM public.guest_players g
WHERE g.suspicious = false AND g.claimed_by IS NULL AND g.score > 0;
GRANT SELECT ON public.leaderboard_all TO anon, authenticated;
GRANT ALL ON public.leaderboard_all TO service_role;