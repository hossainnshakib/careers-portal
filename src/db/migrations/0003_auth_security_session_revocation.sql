-- Free-plan provider updates can leave an old AAL2 session valid after a
-- password/factor change. Revoke existing provider sessions, not custom tokens.
CREATE FUNCTION public.careers_revoke_auth_sessions_on_security_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_TABLE_NAME = 'users' THEN
    IF NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password THEN
      DELETE FROM auth.sessions WHERE user_id = NEW.id;
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    IF OLD.status::text = 'verified' THEN
      DELETE FROM auth.sessions WHERE user_id = OLD.user_id;
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.status::text = 'verified' AND
     (NEW.status IS DISTINCT FROM OLD.status OR NEW.secret IS DISTINCT FROM OLD.secret) THEN
    DELETE FROM auth.sessions WHERE user_id = OLD.user_id;
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION public.careers_revoke_auth_sessions_on_security_change() FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
CREATE TRIGGER careers_password_change_revokes_sessions
AFTER UPDATE OF encrypted_password ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.careers_revoke_auth_sessions_on_security_change();
--> statement-breakpoint
CREATE TRIGGER careers_verified_factor_change_revokes_sessions
BEFORE DELETE OR UPDATE OF status, secret ON auth.mfa_factors
FOR EACH ROW EXECUTE FUNCTION public.careers_revoke_auth_sessions_on_security_change();
