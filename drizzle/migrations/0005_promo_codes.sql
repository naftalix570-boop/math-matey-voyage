CREATE TABLE public.promo_codes (
  code text PRIMARY KEY,
  reward_type text NOT NULL CHECK (reward_type IN ('coins','hints','chest','trophies','stickers')),
  amount integer NOT NULL CHECK (amount > 0 AND amount <= 100000),
  max_uses integer NOT NULL CHECK (max_uses > 0 AND max_uses <= 100000),
  uses integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.promo_codes TO service_role;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.promo_redemptions (
  code text NOT NULL REFERENCES public.promo_codes(code) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (code, user_id)
);

GRANT SELECT ON public.promo_redemptions TO authenticated;
GRANT ALL ON public.promo_redemptions TO service_role;
ALTER TABLE public.promo_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users read own redemptions"
ON public.promo_redemptions FOR SELECT TO authenticated
USING (auth.uid() = user_id);