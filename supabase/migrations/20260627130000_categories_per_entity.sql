-- Fase 2b: categorías por entidad

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS entity_id UUID REFERENCES public.entities(id) ON DELETE CASCADE;

-- Limpiar categorías genéricas existentes
DELETE FROM public.categories;

-- ─── Personal ─────────────────────────────────────────────────────────────────
INSERT INTO public.categories (name, suggested_type, entity_id)
SELECT name, suggested_type, (SELECT id FROM public.entities WHERE name = 'Personal')
FROM (VALUES
  ('Alimentación',            'expense'),
  ('Vivienda y hogar',        'expense'),
  ('Servicios y suscripciones','expense'),
  ('Transporte',              'expense'),
  ('Auto',                    'expense'),
  ('Salud',                   'expense'),
  ('Educación y formación',   'expense'),
  ('Hijos y familia',         'expense'),
  ('Personal José',           'expense'),
  ('Personal Nancy',          'expense'),
  ('Indumentaria',            'expense'),
  ('Casa y equipamiento',     'expense'),
  ('Tarjetas y deudas',       'expense'),
  ('Otros',                   'expense'),
  ('Sueldo / Retiro',         'income'),
  ('Ingreso extra',           'income')
) AS t(name, suggested_type);

-- ─── iFixCell ─────────────────────────────────────────────────────────────────
INSERT INTO public.categories (name, suggested_type, entity_id)
SELECT name, suggested_type, (SELECT id FROM public.entities WHERE name = 'iFixCell')
FROM (VALUES
  ('Cierre de mes',           'income'),
  ('Sueldos y personal',      'expense'),
  ('Alquiler y local',        'expense'),
  ('Servicios del local',     'expense'),
  ('Internet y telefonía',    'expense'),
  ('Logística y envíos',      'expense'),
  ('Sistemas y software',     'expense'),
  ('Limpieza y mantenimiento','expense'),
  ('Garantías y cambios',     'expense'),
  ('Impuestos y tasas',       'expense'),
  ('Honorarios profesionales','expense'),
  ('Otros gastos',            'expense')
) AS t(name, suggested_type);

-- ─── TécnicoCerca Monte Grande ────────────────────────────────────────────────
INSERT INTO public.categories (name, suggested_type, entity_id)
SELECT name, suggested_type, (SELECT id FROM public.entities WHERE name = 'TécnicoCerca Monte Grande')
FROM (VALUES
  ('Cierre de mes',           'income'),
  ('Sueldos y personal',      'expense'),
  ('Alquiler y local',        'expense'),
  ('Servicios del local',     'expense'),
  ('Internet y telefonía',    'expense'),
  ('Logística y envíos',      'expense'),
  ('Sistemas y software',     'expense'),
  ('Limpieza y mantenimiento','expense'),
  ('Garantías y cambios',     'expense'),
  ('Impuestos y tasas',       'expense'),
  ('Honorarios profesionales','expense'),
  ('Otros gastos',            'expense')
) AS t(name, suggested_type);

-- ─── TécnicoCerca Ezeiza ──────────────────────────────────────────────────────
INSERT INTO public.categories (name, suggested_type, entity_id)
SELECT name, suggested_type, (SELECT id FROM public.entities WHERE name = 'TécnicoCerca Ezeiza')
FROM (VALUES
  ('Cierre de mes',           'income'),
  ('Sueldos y personal',      'expense'),
  ('Alquiler y local',        'expense'),
  ('Servicios del local',     'expense'),
  ('Internet y telefonía',    'expense'),
  ('Logística y envíos',      'expense'),
  ('Sistemas y software',     'expense'),
  ('Limpieza y mantenimiento','expense'),
  ('Garantías y cambios',     'expense'),
  ('Impuestos y tasas',       'expense'),
  ('Honorarios profesionales','expense'),
  ('Otros gastos',            'expense')
) AS t(name, suggested_type);
