CREATE TABLE public.admin_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reward_type text NOT NULL,
  amount integer NOT NULL,
  applied boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.admin_grants TO authenticated;
GRANT ALL ON public.admin_grants TO service_role;
ALTER TABLE public.admin_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own grants read" ON public.admin_grants FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own grants mark" ON public.admin_grants FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id AND applied = true);