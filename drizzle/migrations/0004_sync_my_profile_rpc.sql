CREATE OR REPLACE FUNCTION public.sync_my_profile(
  _display_name text,
  _icon text,
  _country text,
  _score integer,
  _data jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  INSERT INTO public.profiles (user_id, display_name, icon, country, score, data, updated_at)
  VALUES (auth.uid(), COALESCE(NULLIF(_display_name,''),'שחקן'), COALESCE(NULLIF(_icon,''),'⭐'), COALESCE(NULLIF(_country,''),'IL'), COALESCE(_score,0), COALESCE(_data,'{}'::jsonb), now())
  ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    icon = EXCLUDED.icon,
    country = EXCLUDED.country,
    score = GREATEST(EXCLUDED.score, public.profiles.score),
    data = EXCLUDED.data,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.sync_my_profile(text, text, text, integer, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_my_profile(text, text, text, integer, jsonb) TO authenticated;