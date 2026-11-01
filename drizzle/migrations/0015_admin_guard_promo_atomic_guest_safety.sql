CREATE TABLE public.user_roles (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 role text NOT NULL DEFAULT 'user',
 UNIQUE (user_id, role), CHECK (role IN ('admin','moderator','user'))
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own role read" ON public.user_roles FOR SELECT TO authenticated USING (user_id=auth.uid());

CREATE OR REPLACE FUNCTION public.authorize_admin_attempt(_key text, _valid boolean)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE ip_failures integer; global_failures integer;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended('admin-attempts',0));
 DELETE FROM public.rate_events WHERE created_at < now()-interval '2 days';
 SELECT count(*) INTO ip_failures FROM public.rate_events WHERE kind='admin_failure' AND key=_key AND created_at>now()-interval '15 minutes';
 SELECT count(*) INTO global_failures FROM public.rate_events WHERE kind='admin_failure' AND created_at>now()-interval '15 minutes';
 IF ip_failures>=5 OR global_failures>=100 THEN RETURN false; END IF;
 IF NOT COALESCE(_valid,false) THEN INSERT INTO public.rate_events(kind,key) VALUES ('admin_failure',left(_key,64)); RETURN false; END IF;
 RETURN true;
END; $$;
REVOKE ALL ON FUNCTION public.authorize_admin_attempt(text,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.authorize_admin_attempt(text,boolean) TO service_role;
CREATE INDEX IF NOT EXISTS rate_events_window_idx ON public.rate_events(kind,key,created_at);
CREATE INDEX IF NOT EXISTS rate_events_cleanup_idx ON public.rate_events(created_at);

CREATE OR REPLACE FUNCTION public.cleanup_rate_events()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 DELETE FROM public.rate_events WHERE created_at < now()-interval '2 days';
 RETURN NULL;
END; $$;
REVOKE ALL ON FUNCTION public.cleanup_rate_events() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER rate_events_cleanup AFTER INSERT ON public.rate_events FOR EACH STATEMENT EXECUTE FUNCTION public.cleanup_rate_events();

REVOKE UPDATE ON public.admin_grants FROM authenticated;
GRANT UPDATE(applied) ON public.admin_grants TO authenticated;
REVOKE ALL ON public.leaderboard_all FROM PUBLIC,anon,authenticated;
COMMENT ON VIEW public.leaderboard_all IS 'DEPRECATED: use leaderboard_public, which does not expose guest credentials';

CREATE OR REPLACE FUNCTION public.redeem_promo_atomic(_user_id uuid,_code text)
RETURNS TABLE(reward_type text,amount integer,score integer) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE promo public.promo_codes%ROWTYPE;
BEGIN
 UPDATE public.promo_codes p SET uses=p.uses+1 WHERE p.code=_code AND p.uses<p.max_uses RETURNING p.* INTO promo;
 IF NOT FOUND THEN RAISE EXCEPTION 'Promo unavailable'; END IF;
 INSERT INTO public.promo_redemptions(code,user_id) VALUES (_code,_user_id);
 RETURN QUERY SELECT promo.reward_type,promo.amount,COALESCE((SELECT s.score FROM public.player_scores s WHERE s.user_id=_user_id),0);
END; $$;
REVOKE ALL ON FUNCTION public.redeem_promo_atomic(uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.redeem_promo_atomic(uuid,text) TO service_role;

CREATE OR REPLACE FUNCTION public.validate_guest_save_size()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF jsonb_typeof(NEW.data)<>'object' OR octet_length(convert_to(NEW.data::text,'UTF8'))>65536 THEN RAISE EXCEPTION 'Invalid guest save'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.validate_guest_save_size() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guest_save_size BEFORE INSERT OR UPDATE OF data ON public.guest_players FOR EACH ROW EXECUTE FUNCTION public.validate_guest_save_size();