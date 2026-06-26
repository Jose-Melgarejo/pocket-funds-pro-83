
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  suggested_type TEXT NOT NULL DEFAULT 'both' CHECK (suggested_type IN ('income','expense','both')),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('income','expense')),
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX movements_date_idx ON public.movements(date DESC);
CREATE INDEX movements_category_idx ON public.movements(category_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.movements TO anon, authenticated;
GRANT ALL ON public.movements TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public write categories" ON public.categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update categories" ON public.categories FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete categories" ON public.categories FOR DELETE USING (true);

CREATE POLICY "Public read movements" ON public.movements FOR SELECT USING (true);
CREATE POLICY "Public write movements" ON public.movements FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update movements" ON public.movements FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Public delete movements" ON public.movements FOR DELETE USING (true);

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_categories_updated BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_movements_updated BEFORE UPDATE ON public.movements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.categories (name, suggested_type) VALUES
  ('Comida y Restaurantes','expense'),
  ('Ingresos','income'),
  ('Educación','expense'),
  ('Bancos y Comisiones','expense'),
  ('Impuestos','expense'),
  ('Entretenimiento','expense'),
  ('Vivienda','expense'),
  ('Sueldo','income'),
  ('Salud y Medicina','expense'),
  ('Transporte','expense'),
  ('Tarjetas de crédito','expense'),
  ('Inversiones','both'),
  ('Renta','income'),
  ('Ropa','expense'),
  ('Servicios','expense'),
  ('Kiosco','expense'),
  ('Retiro del negocio','income'),
  ('Familia','expense'),
  ('Hijos','expense'),
  ('Supermercado','expense'),
  ('Otros','both');
