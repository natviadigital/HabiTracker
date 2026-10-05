-- HabiTracker - Supabase Database Setup
-- Execute este script en Supabase SQL Editor para crear la tabla y políticas

-- Crear tabla habit_logs
CREATE TABLE IF NOT EXISTS habit_logs (
  id BIGSERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  diet_completed BOOLEAN DEFAULT false,
  exercise_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para búsquedas rápidas por fecha
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date);

-- Habilitar Row Level Security
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas (permite re-ejecutar el script sin errores)
DROP POLICY IF EXISTS "Allow public read access" ON habit_logs;
DROP POLICY IF EXISTS "Allow public insert access" ON habit_logs;
DROP POLICY IF EXISTS "Allow public update access" ON habit_logs;
DROP POLICY IF EXISTS "Allow public delete access" ON habit_logs;

-- Política: Permitir acceso público sin autenticación (READ)
CREATE POLICY "Allow public read access" ON habit_logs
  FOR SELECT
  USING (true);

-- Política: Permitir acceso público sin autenticación (INSERT)
CREATE POLICY "Allow public insert access" ON habit_logs
  FOR INSERT
  WITH CHECK (true);

-- Política: Permitir acceso público sin autenticación (UPDATE)
CREATE POLICY "Allow public update access" ON habit_logs
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Política: Permitir acceso público sin autenticación (DELETE)
CREATE POLICY "Allow public delete access" ON habit_logs
  FOR DELETE
  USING (true);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_habit_logs_updated_at ON habit_logs;
CREATE TRIGGER update_habit_logs_updated_at
    BEFORE UPDATE ON habit_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- Desmopresina: registro de pastillas por día
-- (tabla separada para no afectar dieta/ejercicio)
-- ========================================
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

DROP TRIGGER IF EXISTS update_desmo_logs_updated_at ON desmo_logs;
CREATE TRIGGER update_desmo_logs_updated_at
    BEFORE UPDATE ON desmo_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Verificación: Mostrar estructura de la tabla
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'habit_logs'
ORDER BY ordinal_position;
