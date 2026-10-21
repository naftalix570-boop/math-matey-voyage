CREATE TABLE public.album_world_claims (
  user_id uuid NOT NULL,
  world_id integer NOT NULL CHECK (world_id BETWEEN 0 AND 4),
  trophies integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, world_id)
);
GRANT ALL ON public.album_world_claims TO service_role;
ALTER TABLE public.album_world_claims ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.add_server_trophies(_user_id uuid, _amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_score integer;
BEGIN
  IF _amount IS NULL OR _amount <= 0 THEN
    SELECT score INTO new_score FROM public.player_scores WHERE user_id = _user_id;
    RETURN COALESCE(new_score, 0);
  END IF;
  INSERT INTO public.player_scores (user_id, score)
  VALUES (_user_id, _amount)
  ON CONFLICT (user_id) DO UPDATE SET score = public.player_scores.score + EXCLUDED.score
  RETURNING score INTO new_score;
  UPDATE public.profiles SET score = GREATEST(score, new_score) WHERE user_id = _user_id;
  RETURN new_score;
END;
$$;
REVOKE ALL ON FUNCTION public.add_server_trophies(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.add_server_trophies(uuid, integer) TO service_role;