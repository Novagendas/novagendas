-- SCRIPT DE INSERCIÓN DE DATOS DE PRUEBA (MOCK) PARA SUPABASE
-- Ejecutar en el Editor SQL de Supabase después de ejecutar schema.sql

-- 1. Estados Básicos
INSERT INTO EstadoApp (IdEstadoApp, Estado) VALUES 
(1, 'Activo'), 
(2, 'Suspendido'),
(3, 'Eliminado'),
(4, 'En Espera'),
(5, 'En Revisión'),
(6, 'Deployed')
ON CONFLICT DO NOTHING;

INSERT INTO Estado (IdEstado, Descripcion) VALUES 
(1, 'Activo'), 
(2, 'Inactivo') 
ON CONFLICT DO NOTHING;

INSERT INTO Rol (IdRol, Nombre) VALUES 
(1, 'admin'), 
(2, 'recepcionista'), 
(3, 'profesional') 
ON CONFLICT DO NOTHING;

INSERT INTO EstadoCita (IdEstadoCita, Descripcion) VALUES 
(1, 'Confirmada'), 
(2, 'En Espera'), 
(3, 'Cancelada'), 
(4, 'Completada') 
ON CONFLICT DO NOTHING;

INSERT INTO TipoCita (IdTipoCita, Descripcion) VALUES 
(1, 'Valoracion'), 
(2, 'Tratamiento'),
(3, 'Seguimiento'),
(4, 'Consulta'),
(5, 'Control'),
(6, 'Post-operatorio'),
(7, 'Reunion'),
(8, 'Otro')
ON CONFLICT DO NOTHING;

-- 2. Negocios Iniciales
INSERT INTO Negocios (IdNegocios, NIT, Nombre, Dominio, IdEstadoApp, Descripcion) VALUES 
(1, '901234567-1', 'Centro Soleil', 'soleil', 1, 'Centro de Medicina Estética'),
(2, '902345678-2', 'Clínica Dra. Fabiola', 'drfabiola', 1, 'Clínica Dermatológica') 
ON CONFLICT DO NOTHING;

-- 3. Usuarios de Prueba
INSERT INTO Usuario (IdUsuario, Nombre, Apellido, Email, Contraseña, IdEstado, IdNegocios, Cedula) VALUES 
(1, 'Admin', 'Soleil', 'admin@soleil.com', 'admin', 1, 1, '10000001'),
(2, 'Karen', 'Useche', 'recepcion@soleil.com', 'recepcion', 1, 1, '10000002'),
(3, 'Dra. Fabiola', 'Rodríguez', 'especialista@soleil.com', 'especialista', 1, 1, '10000003'),
(4, 'Admin', 'Fabiola', 'admin@drfabiola.com', 'admin', 1, 2, '20000001')
ON CONFLICT DO NOTHING;

-- 3.5. Permisos y Asignación de Roles (Actualizado por diseño de permisos detallados)
INSERT INTO Permisos (IdPermiso, Nombre) VALUES 
(1, '📊 Dashboard General'),
(2, '📅 Agenda de Citas'),
(3, '👥 Pacientes'),
(4, '💰 Catálogo y Pagos'),
(5, '📦 Inventario'),
(6, '🔑 Gestión de Usuarios')
ON CONFLICT DO NOTHING;

INSERT INTO RolPermisos (IdRolPermisos, IdUsuario, IdRol, IdPermiso) VALUES 
-- Admin Soleil (IdUsuario 1, IdRol 1): Todos los permisos (1-6)
(1, 1, 1, 1), (2, 1, 1, 2), (3, 1, 1, 3), (4, 1, 1, 4), (5, 1, 1, 5), (6, 1, 1, 6),
-- Recepcionista Karen (IdUsuario 2, IdRol 2): Citas, Pacientes, Inventario (2, 3, 5)
(7, 2, 2, 2), (8, 2, 2, 3), (9, 2, 2, 5),
-- Dra. Fabiola (IdUsuario 3, IdRol 3): Agenda de Citas (2)
(10, 3, 3, 2),
-- Admin Dra.Fabiola (IdUsuario 4, IdRol 1): Todos
(11, 4, 1, 1), (12, 4, 1, 2), (13, 4, 1, 3), (14, 4, 1, 4), (15, 4, 1, 5), (16, 4, 1, 6)
ON CONFLICT DO NOTHING;

-- Asignar el Admin responsable de cada negocio
UPDATE Negocios SET IdUsuarioAdmin = 1 WHERE IdNegocios = 1;
UPDATE Negocios SET IdUsuarioAdmin = 4 WHERE IdNegocios = 2;

-- 4. Clientes de Prueba
INSERT INTO Cliente (IdCliente, Nombre, Apellido, Cedula, Telefono, IdNegocios) VALUES 
(1, 'Ana', 'Rodríguez', '1010123456', '+57 300 123 4567', 1),
(2, 'María', 'Gómez', '52345678', '+57 320 987 6543', 1),
(3, 'Carlos', 'Mendoza', '90012345', '+57 311 444 5555', 2) 
ON CONFLICT DO NOTHING;

-- 5. Categorías y Servicios
INSERT INTO CategoriaServicio (IdCategoriaServicio, Descripcion, IdNegocios) VALUES 
(1, 'Inyectables', 1),
(2, 'Aparatología', 1),
(3, 'Cosmetología', 2) 
ON CONFLICT DO NOTHING;

INSERT INTO Servicios (IdServicios, Nombre, Descripcion, Precio, Duracion, IdCategoriaServicio, IdNegocios, Color) VALUES 
(1, 'Aplicación Bótox (3 Zonas)', 'Retoque y botox general', 850000, 45, 1, 1, '#3b82f6'),
(2, 'Depilación Láser', 'Cuerpo Completo', 450000, 60, 2, 1, '#2dd4bf'),
(3, 'Limpieza Facial Profunda', 'Limpieza y extracción', 180000, 90, 3, 2, '#8b5cf6') 
ON CONFLICT DO NOTHING;

-- Ajustes de secuencias de PostgreSQL para que los siguientes insertos autogenerados de la App funcionen sin colisión (ID's standarizados)
SELECT setval('estadoapp_idestadoapp_seq', COALESCE((SELECT MAX(idestadoapp) FROM estadoapp), 1));
SELECT setval('estado_idestado_seq', COALESCE((SELECT MAX(idestado) FROM estado), 1));
SELECT setval('rol_idrol_seq', COALESCE((SELECT MAX(idrol) FROM rol), 1));
SELECT setval('negocios_idnegocios_seq', COALESCE((SELECT MAX(idnegocios) FROM negocios), 1));
SELECT setval('usuario_idusuario_seq', COALESCE((SELECT MAX(idusuario) FROM usuario), 1));
SELECT setval('cliente_idcliente_seq', COALESCE((SELECT MAX(idcliente) FROM cliente), 1));
SELECT setval('categoriaservicio_idcategoriaservicio_seq', COALESCE((SELECT MAX(idcategoriaservicio) FROM categoriaservicio), 1));
SELECT setval('servicios_idservicios_seq', COALESCE((SELECT MAX(idservicios) FROM servicios), 1));
SELECT setval('permisos_idpermiso_seq', COALESCE((SELECT MAX(idpermiso) FROM permisos), 1));
SELECT setval('rolpermisos_idrolpermisos_seq', COALESCE((SELECT MAX(idrolpermisos) FROM rolpermisos), 1));
