-- HabiTracker - Migración: registro de Desmopresina
-- Ejecuta SOLO este script en Supabase SQL Editor (la tabla habit_logs ya existe)
-- Es seguro ejecutarlo más de una vez.

CREATE TABLE IF NOT EXISTS desmo_logs (
  id BIGSERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  pills SMALLINT NOT NULL CHECK (pills BETWEEN 1 AND 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_desmo_logs_date ON desmo_logs(date);

ALTER TABLE desmo_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON desmo_logs;
DROP POLICY IF EXISTS "Allow public insert access" ON desmo_logs;
DROP POLICY IF EXISTS "Allow public update access" ON desmo_logs;
DROP POLICY IF EXISTS "Allow public delete access" ON desmo_logs;

CREATE POLICY "Allow public read access" ON desmo_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON desmo_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON desmo_logs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete access" ON desmo_logs FOR DELETE USING (true);

-- Se (re)crea la función por si acaso; es idéntica a la de supabase-setup.sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_desmo_logs_updated_at ON desmo_logs;
CREATE TRIGGER update_desmo_logs_updated_at
    BEFORE UPDATE ON desmo_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verificación
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'desmo_logs' ORDER BY ordinal_position;
