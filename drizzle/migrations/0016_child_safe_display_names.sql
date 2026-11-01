CREATE OR REPLACE FUNCTION public.is_safe_player_name(_name text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path=public AS $$
 SELECT length(btrim(COALESCE(_name,''))) BETWEEN 1 AND 40
 AND _name !~ '[[:cntrl:]]'
 AND lower(_name) !~ '(https?:|www\.|mailto:|@|[a-z0-9][a-z0-9-]*\.[a-z]{2,})'
 AND length(regexp_replace(_name,'[^0-9]','','g')) < 7
 AND lower(regexp_replace(normalize(_name,NFKC),'[֑-ׇ​-‏‪-‮⁠-⁯]','','g')) !~ '(^|[^a-zא-ת])(fuck|fucking|shit|bitch|cunt|asshole|motherfucker|זין|זונה|זונות|כוס|כוסית|כוסעמק|מניאק|מנייק|שרמוטה)($|[^a-zא-ת])';
$$;
REVOKE ALL ON FUNCTION public.is_safe_player_name(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.is_safe_player_name(text) TO authenticated,service_role;

CREATE OR REPLACE FUNCTION public.validate_player_display_name()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF TG_OP='UPDATE' AND NEW.display_name IS NOT DISTINCT FROM OLD.display_name THEN RETURN NEW; END IF;
 IF NOT public.is_safe_player_name(NEW.display_name) THEN RAISE EXCEPTION 'Choose a safe player name'; END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.validate_player_display_name() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER profiles_name_moderation BEFORE INSERT OR UPDATE OF display_name ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.validate_player_display_name();
CREATE TRIGGER guest_name_moderation BEFORE INSERT OR UPDATE OF display_name ON public.guest_players FOR EACH ROW EXECUTE FUNCTION public.validate_player_display_name();