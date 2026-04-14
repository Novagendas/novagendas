-- ==========================================
-- 1. DESHABILITAR RLS (GESTIÓN DESDE CÓDIGO)
-- ==========================================

-- El usuario ha solicitado manejar la seguridad y el filtrado desde la aplicación.
-- Este script deshabilita Row Level Security en todas las tablas para permitir acceso total vía API.

DO $$ 
DECLARE 
    tbl RECORD;
BEGIN 
    FOR tbl IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
    LOOP 
        EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY;', tbl.table_name);
    END LOOP; 
END $$;

-- Mantener funciones auxiliares por si se necesitan en la lógica del código o RPC
CREATE OR REPLACE FUNCTION public.get_my_negocio_id()
RETURNS TABLE (id_negocio INT) AS $$
BEGIN
    RETURN QUERY
    SELECT u.IdNegocios
    FROM public.Usuario u
    WHERE u.Email = auth.jwt() ->> 'email'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.Usuario u
        WHERE u.Email = auth.jwt() ->> 'email'
        AND u.IsSuperAdmin = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;