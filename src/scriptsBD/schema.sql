-- ==========================================
-- 0. EXTENSIONES Y SEGURIDAD
-- ==========================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==========================================
-- 1. TABLAS MAESTRAS (INDEPENDIENTES)
-- ==========================================

CREATE TABLE EstadoApp (
    IdEstadoApp SERIAL PRIMARY KEY,
    Estado VARCHAR(50) NOT NULL
);

CREATE TABLE Estado (
    IdEstado SERIAL PRIMARY KEY,
    Descripcion VARCHAR(50) NOT NULL
);

CREATE TABLE EstadoCita (
    IdEstadoCita SERIAL PRIMARY KEY,
    Descripcion VARCHAR(50) NOT NULL
);

CREATE TABLE TipoCita (
    IdTipoCita SERIAL PRIMARY KEY,
    Descripcion VARCHAR(50) NOT NULL
);

CREATE TABLE MetodoPago (
    IdMetodoPago SERIAL PRIMARY KEY,
    Tipo VARCHAR(50) NOT NULL
);

CREATE TABLE Tipomovimiento (
    IdTipoMovimiento SERIAL PRIMARY KEY,
    Tipo VARCHAR(50) NOT NULL
);

CREATE TABLE Permisos (
    IdPermiso SERIAL PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL
);

CREATE TABLE Rol (
    IdRol SERIAL PRIMARY KEY,
    Nombre VARCHAR(50) NOT NULL
);

-- ==========================================
-- 2. INFRAESTRUCTURA DE NEGOCIO (TENANTS)
-- ==========================================

CREATE TABLE Negocios (
    IdNegocios SERIAL PRIMARY KEY,
    NIT VARCHAR(50) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Dominio VARCHAR(100) UNIQUE,
    IdUsuarioAdmin INT, -- FK se agrega al final para evitar circularidad
    IdEstadoApp INT REFERENCES EstadoApp(IdEstadoApp),
    Descripcion TEXT,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FechaEliminado TIMESTAMP,
    Direccion TEXT,
    Telefono VARCHAR(20),
    Deployed BOOLEAN DEFAULT FALSE
);

-- ==========================================
-- 3. GESTIÓN DE USUARIOS
-- ==========================================

CREATE TABLE Usuario (
    IdUsuario SERIAL PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Apellido VARCHAR(100) NOT NULL,
    Cedula VARCHAR(20) UNIQUE,
    Email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    Telefono VARCHAR(20),
    IdEstado INT REFERENCES Estado(IdEstado),
    FechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FechaInicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Profesion VARCHAR(100),
    IdNegocios INT REFERENCES Negocios(IdNegocios),
    IsSuperAdmin BOOLEAN DEFAULT FALSE
);

-- Cerrar circularidad Admin-Negocio
ALTER TABLE Negocios ADD CONSTRAINT fk_negocios_admin FOREIGN KEY (IdUsuarioAdmin) REFERENCES Usuario(IdUsuario);

CREATE TABLE RolPermisos (
    IdRolPermisos SERIAL PRIMARY KEY,
    IdPermiso INT REFERENCES Permisos(IdPermiso),
    IdUsuario INT REFERENCES Usuario(IdUsuario),
    IdRol INT REFERENCES Rol(IdRol)
);

-- ==========================================
-- 4. LOGICA DE SEGURIDAD (HASHING Y LOGIN)
-- ==========================================

-- Trigger para hashear contraseña automáticamente
CREATE OR REPLACE FUNCTION hash_password()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo hashear si la contraseña ha cambiado o es nueva
    IF (TG_OP = 'INSERT' OR NEW.password <> OLD.password) THEN
        NEW.password = crypt(NEW.password, gen_salt('bf'));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hash_password
BEFORE INSERT OR UPDATE ON Usuario
FOR EACH ROW EXECUTE FUNCTION hash_password();

-- Función de Login Seguro (RPC)
CREATE OR REPLACE FUNCTION login_usuario(p_email TEXT, p_password TEXT, p_idnegocios INT)
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
        u.IdUsuario, u.Nombre, u.Apellido, u.Email, u.IdNegocios, 
        (SELECT r.Nombre FROM Rol r JOIN RolPermisos rp ON r.IdRol = rp.IdRol WHERE rp.IdUsuario = u.IdUsuario LIMIT 1)
    FROM Usuario u
    WHERE u.Email = p_email 
      AND u.IdNegocios = p_idnegocios
      AND u.password = crypt(p_password, u.password); -- Verificación de hash
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 5. ENTIDADES DEL NEGOCIO (MULTI-TENANT)
-- ==========================================

CREATE TABLE Cliente (
    IdCliente SERIAL PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Apellido VARCHAR(100) NOT NULL,
    Cedula VARCHAR(20),
    Email VARCHAR(100),
    Telefono VARCHAR(20),
    FechaRegistro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ContadorInasistencias INT DEFAULT 0,
    IdNegocios INT REFERENCES Negocios(IdNegocios)
);

CREATE TABLE CategoriaProducto (
    IdCategoriaProducto SERIAL PRIMARY KEY,
    IdNegocios INT REFERENCES Negocios(IdNegocios),
    Descripcion VARCHAR(100) NOT NULL
);

CREATE TABLE CategoriaServicio (
    IdCategoriaServicio SERIAL PRIMARY KEY,
    IdNegocios INT REFERENCES Negocios(IdNegocios),
    Descripcion VARCHAR(100) NOT NULL
);

CREATE TABLE Producto (
    IdProducto SERIAL PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Descripcion TEXT,
    Precio DECIMAL(10,2) NOT NULL,
    Cantidad INT NOT NULL DEFAULT 0,
    CantidadMinima INT NOT NULL DEFAULT 0,
    IdCategoriaProducto INT REFERENCES CategoriaProducto(IdCategoriaProducto),
    IdNegocios INT REFERENCES Negocios(IdNegocios)
);

CREATE TABLE Servicios (
    IdServicios SERIAL PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Descripcion TEXT,
    Precio DECIMAL(10,2) NOT NULL,
    IdNegocios INT REFERENCES Negocios(IdNegocios),
    Duracion INT NOT NULL,
    IdCategoriaServicio INT REFERENCES CategoriaServicio(IdCategoriaServicio),
    IdEstado INT REFERENCES Estado(IdEstado),
    Imagen VARCHAR(255),
    Color VARCHAR(20)
);

CREATE TABLE Inventario (
    IdInventario SERIAL PRIMARY KEY,
    IdUsuario INT REFERENCES Usuario(IdUsuario),
    Cantidad INT NOT NULL,
    Lote VARCHAR(50),
    FechaVencimiento DATE,
    IdTipoMovimiento INT REFERENCES Tipomovimiento(IdTipoMovimiento),
    IdProducto INT REFERENCES Producto(IdProducto),
    IdNegocios INT REFERENCES Negocios(IdNegocios)
);

CREATE TABLE HistorialClinico (
    IdHistorial SERIAL PRIMARY KEY,
    IdCliente INT REFERENCES Cliente(IdCliente),
    Fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Titulo VARCHAR(255) NOT NULL,
    Notas TEXT NOT NULL,
    Especialista VARCHAR(100),
    IdNegocios INT REFERENCES Negocios(IdNegocios)
);

CREATE TABLE Cita (
    IdCita SERIAL PRIMARY KEY,
    IdCliente INT REFERENCES Cliente(IdCliente),
    IdUsuario INT REFERENCES Usuario(IdUsuario),
    FechaHoraInicio TIMESTAMP NOT NULL,
    FechaHoraFin TIMESTAMP NOT NULL,
    IdEstadoCita INT REFERENCES EstadoCita(IdEstadoCita),
    IdTipoCita INT REFERENCES TipoCita(IdTipoCita),
    Observacion TEXT,
    ValorTotal DECIMAL(10,2),
    IdNegocios INT REFERENCES Negocios(IdNegocios)
);

CREATE TABLE Pagos (
    IdPagos SERIAL PRIMARY KEY,
    IdMetodoPago INT REFERENCES MetodoPago(IdMetodoPago),
    IdCliente INT REFERENCES Cliente(IdCliente),
    IdServicios INT REFERENCES Servicios(IdServicios),
    Monto DECIMAL(10,2) NOT NULL,
    Estado VARCHAR(50) NOT NULL,
    Fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Observacion TEXT,
    IdNegocios INT REFERENCES Negocios(IdNegocios)
);

CREATE TABLE PagosCita (
    IdPagosCita SERIAL PRIMARY KEY,
    IdCita INT REFERENCES Cita(IdCita),
    IdPagos INT REFERENCES Pagos(IdPagos),
    Fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE CitaServicios (
    IdCitaservicio SERIAL PRIMARY KEY,
    IdServicios INT REFERENCES Servicios(IdServicios),
    IdCita INT REFERENCES Cita(IdCita)
);

CREATE TABLE DetalleCitaGrupal (
    IdDetallecitaGrupal SERIAL PRIMARY KEY,
    IdCita INT REFERENCES Cita(IdCita),
    IdCliente INT REFERENCES Cliente(IdCliente)
);

CREATE TABLE LogsNegocio (
    IdLog SERIAL PRIMARY KEY,
    Fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Accion VARCHAR(50) NOT NULL,
    Entidad VARCHAR(100) NOT NULL,
    Descripcion TEXT,
    IdUsuario INT REFERENCES Usuario(IdUsuario),
    IdNegocios INT REFERENCES Negocios(IdNegocios)
);

-- Actualizar tabla Pagos para soportar los nuevos campos
ALTER TABLE Pagos ADD COLUMN IF NOT EXISTS IdCliente INT REFERENCES Cliente(IdCliente);
ALTER TABLE Pagos ADD COLUMN IF NOT EXISTS IdServicios INT REFERENCES Servicios(IdServicios);
