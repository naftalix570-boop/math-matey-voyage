REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.profiles FROM authenticated;
GRANT SELECT (user_id, display_name, icon, country, score) ON public.profiles TO anon;
GRANT SELECT (user_id, display_name, icon, country, score) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_profile()
RETURNS TABLE (display_name text, icon text, country text, data jsonb)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.display_name, p.icon, p.country, p.data
  FROM public.profiles p
  WHERE p.user_id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.get_my_profile() TO authenticated;