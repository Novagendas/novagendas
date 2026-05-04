-- ============================================================
-- MIGRACIÓN FINAL: MULTI-TENANT POR SUBDOMINIO (Nombres Exactos)
-- ============================================================

-- 1. Asegurar que negociousuario tenga la columna idrol para el nuevo diseño
-- (En el esquema actual de Supabase parece que el rol está en rolpermisos, 
-- pero el nuevo diseño multi-tenant sugiere moverlo o duplicarlo aquí para facilitar el login)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='negociousuario' AND column_name='idrol') THEN
        ALTER TABLE negociousuario ADD COLUMN idrol INTEGER REFERENCES rol(idrol);
    END IF;
END $$;

-- 2. Poblar idrol en negociousuario desde rolpermisos si está vacío
UPDATE negociousuario nu
SET idrol = (SELECT rp.idrol FROM rolpermisos rp WHERE rp.idusuario = nu.idusuario LIMIT 1)
WHERE nu.idrol IS NULL;

-- 3. Actualizar la función de Login para usar Subdominios y la estructura real
DROP FUNCTION IF EXISTS public.login_usuario(text, text, integer);
DROP FUNCTION IF EXISTS public.login_usuario(text, text, text);

CREATE OR REPLACE FUNCTION public.login_usuario(
    p_email TEXT, 
    p_password TEXT, 
    p_subdominio TEXT
)
RETURNS TABLE (
    idusuario INT,
    nombre VARCHAR,
    apellido VARCHAR,
    email VARCHAR,
    idnegocios INT,
    rol_nombre VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.idusuario, 
        u.nombre, 
        u.apellido, 
        u.email, 
        n.idnegocios, 
        r.nombre
    FROM usuario u
    JOIN negociousuario nu ON nu.idusuario = u.idusuario
    JOIN negocios n ON n.idnegocios = nu.idnegocios
    LEFT JOIN rol r ON r.idrol = nu.idrol
    WHERE u.email = p_email 
      AND u.password = crypt(p_password, u.password)
      AND n.dominio = p_subdominio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
