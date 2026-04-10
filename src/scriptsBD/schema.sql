-- Tablas Independientes
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

-- Negocios (SaaS Tenant)
CREATE TABLE Negocios (
    IdNegocios SERIAL PRIMARY KEY,
    NIT VARCHAR(50) NOT NULL,
    Nombre VARCHAR(100) NOT NULL,
    Dominio VARCHAR(100) UNIQUE,
    IdUsuarioAdmin INT, -- Se agregará FK posteriormente
    IdEstadoApp INT REFERENCES EstadoApp(IdEstadoApp),
    Descripcion TEXT,
    FechaCreacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FechaEliminado TIMESTAMP,
    Direccion TEXT,
    Telefono VARCHAR(20),
    Deployed BOOLEAN DEFAULT FALSE
);

-- Usuarios
CREATE TABLE Usuario (
    IdUsuario SERIAL PRIMARY KEY,
    Nombre VARCHAR(100) NOT NULL,
    Apellido VARCHAR(100) NOT NULL,
    Cedula VARCHAR(20) UNIQUE,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Contraseña VARCHAR(255) NOT NULL,
    Telefono VARCHAR(20),
    IdEstado INT REFERENCES Estado(IdEstado),
    FechaActualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FechaInicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Profesion VARCHAR(100),
    IdNegocios INT REFERENCES Negocios(IdNegocios)
);

-- Constraint para Administrador de Negocio (superando dependencia cíclica)
ALTER TABLE Negocios ADD CONSTRAINT fk_negocios_admin FOREIGN KEY (IdUsuarioAdmin) REFERENCES Usuario(IdUsuario);

-- Roles, Permisos y Actividad del Usuario
CREATE TABLE RolPermisos (
    IdRolPermisos SERIAL PRIMARY KEY,
    IdPermiso INT REFERENCES Permisos(IdPermiso),
    IdUsuario INT REFERENCES Usuario(IdUsuario),
    IdRol INT REFERENCES Rol(IdRol)
);

CREATE TABLE RegistrosActividad (
    IdRegistrosActividad SERIAL PRIMARY KEY,
    Fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Recibido BOOLEAN DEFAULT FALSE,
    Titulo VARCHAR(100) NOT NULL,
    Descripcion TEXT,
    IdUsuario INT REFERENCES Usuario(IdUsuario)
);

-- Entidades de Negocio (Sujetas al IdNegocios)
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

-- Inventario de Productos
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

-- Citas y Operaciones Relacionadas
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
    Monto DECIMAL(10,2) NOT NULL,
    Estado VARCHAR(50) NOT NULL,
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
