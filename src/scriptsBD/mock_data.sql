-- ==========================================
-- 1. ESTADOS Y CATALOGOS MAESTROS
-- ==========================================

INSERT INTO EstadoApp (IdEstadoApp, Estado) VALUES 
(1, 'Activo'), (2, 'Suspendido'), (3, 'Eliminado'), (4, 'En Espera'), (5, 'En Revisión'), (6, 'Deployed');

INSERT INTO Estado (IdEstado, Descripcion) VALUES 
(1, 'Activo'), (2, 'Inactivo');

INSERT INTO Rol (IdRol, Nombre) VALUES 
(1, 'admin'), (2, 'recepcionista'), (3, 'profesional');

INSERT INTO EstadoCita (IdEstadoCita, Descripcion) VALUES 
(1, 'Confirmada'), (2, 'En Espera'), (3, 'Cancelada'), (4, 'Completada');

INSERT INTO TipoCita (IdTipoCita, Descripcion) VALUES 
(1, 'Valoración'), (2, 'Tratamiento'), (3, 'Seguimiento'), (4, 'Consulta'), (5, 'Control'), (6, 'Otro');

INSERT INTO Permisos (IdPermiso, Nombre) VALUES 
(1, '📊 Dashboard'), (2, '📅 Agenda'), (3, '👥 Pacientes'), (4, '💰 Pagos/Servicios'), (5, '📦 Inventario'), (6, '🔑 Usuarios');

INSERT INTO MetodoPago (IdMetodoPago, Tipo) VALUES 
(1, 'Efectivo'), (2, 'Tarjeta'), (3, 'Transferencia'), (4, 'Nequi / Daviplata');

-- ==========================================
-- 2. NEGOCIOS INICIALES
-- ==========================================

INSERT INTO Negocios (IdNegocios, NIT, Nombre, Dominio, IdEstadoApp, Descripcion) VALUES 
(1, '901234567-1', 'Centro Soleil', 'soleil', 1, 'Centro de Medicina Estética'),
(2, '902345678-2', 'Clínica Especializada', 'clinica', 1, 'Clínica de prueba'),
(3, '12345-6', 'Negocio de Prueba', 'prueba', 1, 'Negocio para pruebas de sistema');

-- ==========================================
-- 3. USUARIOS INICIALES (Hashing automático vía Trigger)
-- ==========================================

INSERT INTO Usuario (IdUsuario, Nombre, Apellido, Email, password, IdEstado, IdNegocios, IsSuperAdmin, Cedula) VALUES 
-- Personal Negocio 1 (Soleil)
(4, 'Admin', 'Soleil', 'admin@soleil.com', 'admin', 1, 1, FALSE, '20000001'),
(5, 'Karen', 'Useche', 'recepcion@soleil.com', 'recepcion', 1, 1, FALSE, '20000002'),
(6, 'Dra. Fabiola', 'Rodríguez', 'especialista@soleil.com', 'especialista', 1, 1, FALSE, '20000003'),
-- Personal Negocio 3 (Prueba)
(7, 'Prueba', 'Admin', 'admin@prueba.com', 'admin', 1, 3, FALSE, '30000001');

-- ==========================================
-- 4. PERMISOS Y ROLES (RolPermisos)
-- ==========================================

INSERT INTO RolPermisos (IdUsuario, IdRol, IdPermiso) VALUES 
-- Admin Soleil (Id 4): Todos (1-6)
(4, 1, 1), (4, 1, 2), (4, 1, 3), (4, 1, 4), (4, 1, 5), (4, 1, 6),
-- Karen (Id 5): Recepcionista (2,3,5)
(5, 2, 2), (5, 2, 3), (5, 2, 5),
-- Dra. Fabiola (Id 6): Profesional (2)
(6, 3, 2),
-- Admin Prueba (Id 7): Todos (1-6)
(7, 1, 1), (7, 1, 2), (7, 1, 3), (7, 1, 4), (7, 1, 5), (7, 1, 6);

-- ==========================================
-- 5. ASIGNAR ADMINS A NEGOCIOS
-- ==========================================

UPDATE Negocios SET IdUsuarioAdmin = 4 WHERE IdNegocios = 1;
UPDATE Negocios SET IdUsuarioAdmin = 7 WHERE IdNegocios = 3;

-- ==========================================
-- 6. DATOS DE NEGOCIO (INICIALES)
-- ==========================================

INSERT INTO Cliente (IdCliente, Nombre, Apellido, Cedula, Telefono, IdNegocios) VALUES 
(1, 'Ana', 'Rodríguez', '1010123456', '+57 300 123 4567', 1),
(2, 'María', 'Gómez', '52345678', '+57 320 987 6543', 1),
(3, 'Carlos', 'Mendoza', '30000001', '+57 311 444 5555', 3);

-- ==========================================
-- 7. REINICIAR SECUENCIAS
-- ==========================================

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
