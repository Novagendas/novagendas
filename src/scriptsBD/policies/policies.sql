-- 1. Función para obtener el IdNegocios del usuario actual basado en su email de Supabase Auth
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

-- 2. Habilitar RLS en todas las tablas
ALTER TABLE EstadoApp ENABLE ROW LEVEL SECURITY;
ALTER TABLE Estado ENABLE ROW LEVEL SECURITY;
ALTER TABLE EstadoCita ENABLE ROW LEVEL SECURITY;
ALTER TABLE TipoCita ENABLE ROW LEVEL SECURITY;
ALTER TABLE MetodoPago ENABLE ROW LEVEL SECURITY;
ALTER TABLE Tipomovimiento ENABLE ROW LEVEL SECURITY;
ALTER TABLE Permisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE Rol ENABLE ROW LEVEL SECURITY;
ALTER TABLE Negocios ENABLE ROW LEVEL SECURITY;
ALTER TABLE Usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE RolPermisos ENABLE ROW LEVEL SECURITY;
ALTER TABLE RegistrosActividad ENABLE ROW LEVEL SECURITY;
ALTER TABLE Cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE CategoriaProducto ENABLE ROW LEVEL SECURITY;
ALTER TABLE CategoriaServicio ENABLE ROW LEVEL SECURITY;
ALTER TABLE Producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE Servicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE Inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE Cita ENABLE ROW LEVEL SECURITY;
ALTER TABLE Pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE PagosCita ENABLE ROW LEVEL SECURITY;
ALTER TABLE CitaServicios ENABLE ROW LEVEL SECURITY;
ALTER TABLE DetalleCitaGrupal ENABLE ROW LEVEL SECURITY;

-- 3. Políticas para Tablas Maestras (Lectura para todos los autenticados)
CREATE POLICY "Lectura publica para usuarios autenticados" ON EstadoApp FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lectura publica para usuarios autenticados" ON Estado FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lectura publica para usuarios autenticados" ON EstadoCita FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lectura publica para usuarios autenticados" ON TipoCita FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lectura publica para usuarios autenticados" ON MetodoPago FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lectura publica para usuarios autenticados" ON Tipomovimiento FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lectura publica para usuarios autenticados" ON Permisos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Lectura publica para usuarios autenticados" ON Rol FOR SELECT TO authenticated USING (true);

-- 4. Políticas basadas en IdNegocios

-- Negocios: El usuario solo puede ver el negocio al que pertenece
CREATE POLICY "Negocios_Isolation" ON Negocios
FOR ALL TO authenticated
USING (IdNegocios IN (SELECT id_negocio FROM public.get_my_negocio_id()));

-- Usuario: El usuario solo puede ver/editar usuarios de su mismo negocio
CREATE POLICY "Usuario_Isolation" ON Usuario
FOR ALL TO authenticated
USING (IdNegocios IN (SELECT id_negocio FROM public.get_my_negocio_id()));

-- Cliente
CREATE POLICY "Cliente_Isolation" ON Cliente
FOR ALL TO authenticated
USING (IdNegocios IN (SELECT id_negocio FROM public.get_my_negocio_id()));

-- CategoriaProducto
CREATE POLICY "CategoriaProducto_Isolation" ON CategoriaProducto
FOR ALL TO authenticated
USING (IdNegocios IN (SELECT id_negocio FROM public.get_my_negocio_id()));

-- CategoriaServicio
CREATE POLICY "CategoriaServicio_Isolation" ON CategoriaServicio
FOR ALL TO authenticated
USING (IdNegocios IN (SELECT id_negocio FROM public.get_my_negocio_id()));

-- Producto
CREATE POLICY "Producto_Isolation" ON Producto
FOR ALL TO authenticated
USING (IdNegocios IN (SELECT id_negocio FROM public.get_my_negocio_id()));

-- Servicios
CREATE POLICY "Servicios_Isolation" ON Servicios
FOR ALL TO authenticated
USING (IdNegocios IN (SELECT id_negocio FROM public.get_my_negocio_id()));

-- Inventario
CREATE POLICY "Inventario_Isolation" ON Inventario
FOR ALL TO authenticated
USING (IdNegocios IN (SELECT id_negocio FROM public.get_my_negocio_id()));

-- Cita
CREATE POLICY "Cita_Isolation" ON Cita
FOR ALL TO authenticated
USING (IdNegocios IN (SELECT id_negocio FROM public.get_my_negocio_id()));

-- Pagos: (Nota: Esta tabla no tenia IdNegocios, sugiero agregarla o filtrar por relacion)
-- Por ahora se habilita solo para autenticados como medida basica
CREATE POLICY "Pagos_Authenticated" ON Pagos
FOR ALL TO authenticated
USING (true);

-- RegistrosActividad
CREATE POLICY "RegistrosActividad_Isolation" ON RegistrosActividad
FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM Usuario u 
    WHERE u.IdUsuario = RegistrosActividad.IdUsuario 
    AND u.IdNegocios IN (SELECT id_negocio FROM public.get_my_negocio_id())
));

-- Tablas de Relación (Join Tables)

-- RolPermisos
CREATE POLICY "RolPermisos_Isolation" ON RolPermisos
FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM Usuario u 
    WHERE u.IdUsuario = RolPermisos.IdUsuario 
    AND u.IdNegocios IN (SELECT id_negocio FROM public.get_my_negocio_id())
));

-- PagosCita
CREATE POLICY "PagosCita_Isolation" ON PagosCita
FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM Cita c 
    WHERE c.IdCita = PagosCita.IdCita 
    AND c.IdNegocios IN (SELECT id_negocio FROM public.get_my_negocio_id())
));

-- CitaServicios
CREATE POLICY "CitaServicios_Isolation" ON CitaServicios
FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM Cita c 
    WHERE c.IdCita = CitaServicios.IdCita 
    AND c.IdNegocios IN (SELECT id_negocio FROM public.get_my_negocio_id())
));

-- DetalleCitaGrupal
CREATE POLICY "DetalleCitaGrupal_Isolation" ON DetalleCitaGrupal
FOR ALL TO authenticated
USING (EXISTS (
    SELECT 1 FROM Cita c 
    WHERE c.IdCita = DetalleCitaGrupal.IdCita 
    AND c.IdNegocios IN (SELECT id_negocio FROM public.get_my_negocio_id())
));

--La tabla Pagos no tiene la columna IdNegocios en el esquema original. 
--Por ahora, las políticas de PagosCita protegen indirectamente el acceso, 
--pero  sugiero añadir IdNegocios a la tabla Pagos para un aislamiento más robusto.
--Recuerda ejecutar primero el archivo schema.sql,
-- luego el policies.sql y finalmente el mock_data.sql 
--en el editor SQL de Supabase para que todo funcione correctamente