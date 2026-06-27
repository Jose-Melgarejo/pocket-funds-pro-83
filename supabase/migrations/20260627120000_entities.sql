-- Fase 2: entities (Personal, iFixCell, TécnicoCerca MG, TécnicoCerca EZE)

CREATE TABLE public.entities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'personal' CHECK (type IN ('personal', 'business')),
  color TEXT NOT NULL DEFAULT '#3b82f6',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.entities TO anon, authenticated;
GRANT ALL ON public.entities TO service_role;
ALTER TABLE public.entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read entities"   ON public.entities FOR SELECT USING (true);
CREATE POLICY "Public write entities"  ON public.entities FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update entities" ON public.entities FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete entities" ON public.entities FOR DELETE USING (true);
CREATE TRIGGER trg_entities_updated BEFORE UPDATE ON public.entities
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed entities
INSERT INTO public.entities (name, type, color, sort_order) VALUES
  ('Personal',                    'personal', '#3b82f6', 0),
  ('iFixCell',                    'business', '#f59e0b', 1),
  ('TécnicoCerca Monte Grande',   'business', '#10b981', 2),
  ('TécnicoCerca Ezeiza',         'business', '#8b5cf6', 3);

-- Add entity_id to accounts
ALTER TABLE public.accounts ADD COLUMN entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL;

-- Assign accounts to entities based on type
UPDATE public.accounts SET entity_id = (SELECT id FROM public.entities WHERE name = 'Personal')
  WHERE name IN ('Efectivo personal','Mercado Pago personal','Banco personal','Tarjeta personal','Otros');
UPDATE public.accounts SET entity_id = (SELECT id FROM public.entities WHERE name = 'iFixCell')
  WHERE name = 'Caja iFixCell';
UPDATE public.accounts SET entity_id = (SELECT id FROM public.entities WHERE name = 'TécnicoCerca Monte Grande')
  WHERE name = 'Caja TécnicoCerca Monte Grande';
UPDATE public.accounts SET entity_id = (SELECT id FROM public.entities WHERE name = 'TécnicoCerca Ezeiza')
  WHERE name = 'Caja TécnicoCerca Ezeiza';

-- Add entity columns to movements
ALTER TABLE public.movements
  ADD COLUMN entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL,
  ADD COLUMN to_entity_id UUID REFERENCES public.entities(id) ON DELETE SET NULL;

CREATE INDEX movements_entity_idx ON public.movements(entity_id);

-- Default existing movements to Personal entity
UPDATE public.movements
SET entity_id = (SELECT id FROM public.entities WHERE name = 'Personal');
