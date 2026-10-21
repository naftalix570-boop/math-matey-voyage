CREATE OR REPLACE FUNCTION public.credit_promo_trophies()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE reward_amount integer;
BEGIN
  SELECT amount INTO reward_amount FROM public.promo_codes WHERE code = NEW.code AND reward_type = 'trophies';
  IF reward_amount IS NOT NULL THEN PERFORM public.add_server_trophies(NEW.user_id, reward_amount); END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.credit_promo_trophies() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER promo_redemption_trophies AFTER INSERT ON public.promo_redemptions
FOR EACH ROW EXECUTE FUNCTION public.credit_promo_trophies();

CREATE OR REPLACE FUNCTION public.claim_album_trophies(_user_id uuid, _world_id integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE reward_amount integer; inserted_world integer; saved_stickers jsonb; current_score integer;
BEGIN
  reward_amount := CASE _world_id WHEN 0 THEN 100 WHEN 1 THEN 300 WHEN 2 THEN 800 WHEN 3 THEN 2000 WHEN 4 THEN 6000 ELSE NULL END;
  IF reward_amount IS NULL THEN RAISE EXCEPTION 'Invalid album world'; END IF;
  SELECT data->'stickers' INTO saved_stickers FROM public.profiles WHERE user_id = _user_id;
  IF saved_stickers IS NULL OR jsonb_typeof(saved_stickers) <> 'array' THEN RAISE EXCEPTION 'Album world incomplete'; END IF;
  IF EXISTS (SELECT 1 FROM generate_series(_world_id * 100, _world_id * 100 + 99) AS s(slot)
    WHERE NOT saved_stickers @> jsonb_build_array(s.slot)) THEN RAISE EXCEPTION 'Album world incomplete'; END IF;
  INSERT INTO public.album_world_claims(user_id, world_id, trophies) VALUES (_user_id, _world_id, reward_amount)
  ON CONFLICT (user_id, world_id) DO NOTHING RETURNING world_id INTO inserted_world;
  IF inserted_world IS NOT NULL THEN RETURN public.add_server_trophies(_user_id, reward_amount); END IF;
  SELECT score INTO current_score FROM public.player_scores WHERE user_id = _user_id;
  RETURN COALESCE(current_score, 0);
END;
$$;
REVOKE ALL ON FUNCTION public.claim_album_trophies(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_album_trophies(uuid, integer) TO service_role;