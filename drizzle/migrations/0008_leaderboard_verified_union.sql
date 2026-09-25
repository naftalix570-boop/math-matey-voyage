CREATE OR REPLACE VIEW public.leaderboard_public WITH (security_invoker = false) AS
SELECT p.user_id, p.display_name, p.icon, p.country, COALESCE(s.score, 0) AS score
FROM public.profiles p
LEFT JOIN public.player_scores s ON s.user_id = p.user_id
WHERE COALESCE(s.suspicious, false) = false
UNION ALL
SELECT md5(g.code)::uuid AS user_id, g.display_name, g.icon, g.country, g.score
FROM public.guest_players g
WHERE g.claimed_by IS NULL AND g.suspicious = false;
GRANT SELECT ON public.leaderboard_public TO anon, authenticated;