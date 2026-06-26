-- Fase 1: accounts table + extend movements with kind/account_id

CREATE TABLE public.accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'personal' CHECK (type IN ('personal', 'business')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO anon, authenticated;
GRANT ALL ON public.accounts TO service_role;

ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read accounts"  ON public.accounts FOR SELECT USING (true);
CREATE POLICY "Public write accounts" ON public.accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update accounts" ON public.accounts FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete accounts" ON public.accounts FOR DELETE USING (true);

CREATE TRIGGER trg_accounts_updated BEFORE UPDATE ON public.accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.accounts (name, type) VALUES
  ('Efectivo personal',              'personal'),
  ('Mercado Pago personal',          'personal'),
  ('Banco personal',                 'personal'),
  ('Tarjeta personal',               'personal'),
  ('Caja iFixCell',                  'business'),
  ('Caja TécnicoCerca Monte Grande', 'business'),
  ('Caja TécnicoCerca Ezeiza',       'business'),
  ('Otros',                          'personal');

-- Extend movements
ALTER TABLE public.movements
  ADD COLUMN account_id    UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  ADD COLUMN kind          TEXT CHECK (kind IN (
                             'ingreso_personal','gasto_personal','gasto_negocio',
                             'retiro_negocio','transferencia','pago_tarjeta','ahorro_inversion'
                           )),
  ADD COLUMN to_account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  ADD COLUMN is_planned    BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX movements_account_idx ON public.movements(account_id);

-- Migrate existing rows: derive kind from type
UPDATE public.movements
SET kind = CASE
  WHEN type = 'income'  THEN 'ingreso_personal'
  ELSE 'gasto_personal'
END;
