-- ============================================================
-- MIGRACIÓN: MULTI-TENANT POR SUBDOMINIO
-- Este script adapta la base de datos existente al nuevo modelo.
-- ============================================================

-- 1. Crear tabla intermedia UsuarioNegocio si no existe
CREATE TABLE IF NOT EXISTS UsuarioNegocio (
    IdUsuarioNegocio SERIAL PRIMARY KEY,
    IdUsuario INT REFERENCES Usuario(IdUsuario),
    IdNegocio INT REFERENCES Negocios(IdNegocios),
    IdRol INT REFERENCES Rol(IdRol),
    FechaAsignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Migrar datos existentes (opcional pero recomendado si ya tienes usuarios)
-- Esto vincula a los usuarios con su negocio actual según la columna IdNegocios de la tabla Usuario
INSERT INTO UsuarioNegocio (IdUsuario, IdNegocio, IdRol)
SELECT 
    u.IdUsuario, 
    u.IdNegocios, 
    (SELECT rp.IdRol FROM RolPermisos rp WHERE rp.IdUsuario = u.IdUsuario LIMIT 1)
FROM Usuario u
WHERE u.IdNegocios IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Actualizar la función de Login para usar Subdominios
-- Primero eliminamos la versión anterior para evitar conflictos de parámetros
DROP FUNCTION IF EXISTS login_usuario(TEXT, TEXT, INT);

CREATE OR REPLACE FUNCTION login_usuario(
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
        u.IdUsuario, 
        u.Nombre, 
        u.Apellido, 
        u.Email, 
        n.IdNegocios, 
        r.Nombre
    FROM Usuario u
    JOIN UsuarioNegocio un ON un.IdUsuario = u.IdUsuario
    JOIN Negocios n ON n.IdNegocios = un.IdNegocio
    LEFT JOIN Rol r ON r.IdRol = un.IdRol
    WHERE u.Email = p_email 
      AND u.password = crypt(p_password, u.password)
      AND n.Dominio = p_subdominio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
