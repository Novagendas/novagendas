-- ============================================================
-- NOVAGENDAS — SQL COMPLETO PARA ENTORNO DEVELOP
-- Generado: 2026-05-04
-- Fuente: proyecto Supabase aulddrljywoigivxugqf (producción)
-- ============================================================
-- Instrucciones:
--   1. Crea un nuevo proyecto en Supabase (tu entorno develop).
--   2. Ve a SQL Editor y ejecuta este archivo completo.
--   3. Despliega las Edge Functions (ver Sección 7 al final).
--   4. Configura los secrets en el nuevo proyecto:
--        GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
--   5. Actualiza el Redirect URI en Google Cloud Console
--      apuntando al nuevo proyecto.
-- ============================================================


-- ============================================================
-- SECCIÓN 0: EXTENSIONES
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;


-- ============================================================
-- SECCIÓN 1: TABLAS (orden correcto por dependencias)
-- ============================================================

-- --- Catálogos base (sin dependencias) ---

CREATE TABLE estadoapp (
  idestadoapp SERIAL PRIMARY KEY,
  estado      VARCHAR
);

CREATE TABLE estado (
  idestado    SERIAL PRIMARY KEY,
  descripcion VARCHAR
);

CREATE TABLE estadocita (
  idestadocita SERIAL PRIMARY KEY,
  descripcion  VARCHAR
);

CREATE TABLE tipocita (
  idtipocita  SERIAL PRIMARY KEY,
  descripcion VARCHAR
);

CREATE TABLE metodopago (
  idmetodopago SERIAL PRIMARY KEY,
  tipo         VARCHAR
);

CREATE TABLE tipomovimiento (
  idtipomovimiento SERIAL PRIMARY KEY,
  tipo             VARCHAR
);

CREATE TABLE permisos (
  idpermiso SERIAL PRIMARY KEY,
  nombre    VARCHAR
);

CREATE TABLE rol (
  idrol  SERIAL PRIMARY KEY,
  nombre VARCHAR
);

-- --- Geografía ---

CREATE TABLE pais (
  idpais     SERIAL PRIMARY KEY,
  nombre     VARCHAR NOT NULL UNIQUE,
  codigo_iso VARCHAR
);

CREATE TABLE departamento (
  iddepartamento SERIAL PRIMARY KEY,
  nombre         VARCHAR NOT NULL,
  idpais         INTEGER REFERENCES pais(idpais)
);

CREATE TABLE ciudad (
  idciudad       SERIAL PRIMARY KEY,
  nombre         VARCHAR NOT NULL,
  iddepartamento INTEGER REFERENCES departamento(iddepartamento)
);

-- --- negocios sin FK circular (se agrega después de crear usuario) ---

CREATE TABLE negocios (
  idnegocios         SERIAL PRIMARY KEY,
  nit                VARCHAR NOT NULL,
  nombre             VARCHAR NOT NULL,
  dominio            VARCHAR UNIQUE,
  idusuarioadmin     INTEGER,                                   -- FK añadida luego
  idestadoapp        INTEGER REFERENCES estadoapp(idestadoapp),
  descripcion        TEXT,
  fechacreacion      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fechaactualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fechaeliminado     TIMESTAMP,
  direccion          TEXT,
  telefono           VARCHAR,
  deployed           BOOLEAN DEFAULT false
);

CREATE TABLE usuario (
  idusuario          SERIAL PRIMARY KEY,
  nombre             VARCHAR NOT NULL,
  apellido           VARCHAR NOT NULL,
  cedula             VARCHAR UNIQUE,
  email              VARCHAR NOT NULL UNIQUE,
  password           VARCHAR NOT NULL,
  telefono           VARCHAR,
  idestado           INTEGER REFERENCES estado(idestado),
  fechaactualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  fechainicio        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  profesion          VARCHAR,
  idnegocios         INTEGER REFERENCES negocios(idnegocios),
  issuperadmin       BOOLEAN DEFAULT false,
  deleted_at         TIMESTAMPTZ
);

-- FK circular: negocios.idusuarioadmin → usuario
ALTER TABLE negocios
  ADD CONSTRAINT fk_negocios_admin
  FOREIGN KEY (idusuarioadmin) REFERENCES usuario(idusuario);

CREATE TABLE rolpermisos (
  idrolpermisos SERIAL PRIMARY KEY,
  idpermiso     INTEGER REFERENCES permisos(idpermiso),
  idusuario     INTEGER REFERENCES usuario(idusuario),
  idrol         INTEGER REFERENCES rol(idrol)
);

CREATE TABLE registrosactividad (
  idregistrosactividad SERIAL PRIMARY KEY,
  fecha                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  recibido             BOOLEAN DEFAULT false,
  titulo               VARCHAR NOT NULL,
  descripcion          TEXT,
  idusuario            INTEGER REFERENCES usuario(idusuario)
);

CREATE TABLE cliente (
  idcliente             SERIAL PRIMARY KEY,
  nombre                VARCHAR NOT NULL,
  apellido              VARCHAR NOT NULL,
  cedula                VARCHAR,
  email                 VARCHAR,
  telefono              VARCHAR,
  fecharegistro         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  contadorinasistencias INTEGER DEFAULT 0,
  idnegocios            INTEGER REFERENCES negocios(idnegocios),
  deleted_at            TIMESTAMPTZ
);

CREATE TABLE categoriaproducto (
  idcategoriaproducto SERIAL PRIMARY KEY,
  idnegocios          INTEGER REFERENCES negocios(idnegocios),
  descripcion         VARCHAR NOT NULL
);

CREATE TABLE categoriaservicio (
  idcategoriaservicio SERIAL PRIMARY KEY,
  idnegocios          INTEGER REFERENCES negocios(idnegocios),
  descripcion         VARCHAR NOT NULL
);

CREATE TABLE producto (
  idproducto          SERIAL PRIMARY KEY,
  nombre              VARCHAR NOT NULL,
  descripcion         TEXT,
  precio              NUMERIC NOT NULL,
  cantidad            INTEGER DEFAULT 0,
  cantidadminima      INTEGER DEFAULT 0,
  idcategoriaproducto INTEGER REFERENCES categoriaproducto(idcategoriaproducto),
  idnegocios          INTEGER REFERENCES negocios(idnegocios),
  lote                VARCHAR,
  deleted_at          TIMESTAMPTZ,
  fechacreacion       TIMESTAMPTZ DEFAULT now(),
  fechaactualizacion  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE servicios (
  idservicios         SERIAL PRIMARY KEY,
  nombre              VARCHAR NOT NULL,
  descripcion         TEXT,
  precio              NUMERIC NOT NULL,
  idnegocios          INTEGER REFERENCES negocios(idnegocios),
  duracion            INTEGER NOT NULL,
  idcategoriaservicio INTEGER REFERENCES categoriaservicio(idcategoriaservicio),
  idestado            INTEGER REFERENCES estado(idestado),
  imagen              VARCHAR,
  color               VARCHAR,
  deleted_at          TIMESTAMPTZ
);

CREATE TABLE ubicacion (
  idubicacion   SERIAL PRIMARY KEY,
  nombre        VARCHAR NOT NULL,
  direccion     VARCHAR,
  barrio        VARCHAR,
  telefono      VARCHAR,
  color         VARCHAR,
  idciudad      INTEGER REFERENCES ciudad(idciudad),
  idnegocios    INTEGER NOT NULL REFERENCES negocios(idnegocios),
  fechacreacion TIMESTAMPTZ DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);

CREATE TABLE cita (
  idcita          SERIAL PRIMARY KEY,
  idcliente       INTEGER REFERENCES cliente(idcliente),
  idusuario       INTEGER REFERENCES usuario(idusuario),
  fechahorainicio TIMESTAMP NOT NULL,
  fechahorafin    TIMESTAMP NOT NULL,
  idestadocita    INTEGER REFERENCES estadocita(idestadocita),
  idtipocita      INTEGER REFERENCES tipocita(idtipocita),
  observacion     TEXT,
  valortotal      NUMERIC,
  idnegocios      INTEGER REFERENCES negocios(idnegocios),
  idservicio      INTEGER REFERENCES servicios(idservicios),
  deleted_at      TIMESTAMPTZ,
  idubicacion     INTEGER REFERENCES ubicacion(idubicacion),
  escitagrupal    BOOLEAN DEFAULT false,
  gcal_event_id   TEXT
);

CREATE TABLE pagos (
  idpagos      SERIAL PRIMARY KEY,
  idmetodopago INTEGER REFERENCES metodopago(idmetodopago),
  monto        NUMERIC NOT NULL,
  estado       VARCHAR NOT NULL,
  fecha        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  observacion  TEXT,
  idnegocios   INTEGER REFERENCES negocios(idnegocios),
  idcliente    INTEGER REFERENCES cliente(idcliente),
  idservicios  INTEGER REFERENCES servicios(idservicios),
  deleted_at   TIMESTAMPTZ
);

CREATE TABLE pagoscita (
  idpagoscita SERIAL PRIMARY KEY,
  idcita      INTEGER REFERENCES cita(idcita),
  idpagos     INTEGER REFERENCES pagos(idpagos),
  fecha       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE citaservicios (
  idcitaservicio SERIAL PRIMARY KEY,
  idservicios    INTEGER REFERENCES servicios(idservicios),
  idcita         INTEGER REFERENCES cita(idcita)
);

CREATE TABLE detallecitagrupal (
  iddetallecitagrupal SERIAL PRIMARY KEY,
  idcita              INTEGER REFERENCES cita(idcita),
  idcliente           INTEGER REFERENCES cliente(idcliente)
);

CREATE TABLE logsnegocio (
  idlog       SERIAL PRIMARY KEY,
  fecha       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accion      VARCHAR NOT NULL,
  entidad     VARCHAR NOT NULL,
  descripcion TEXT,
  idusuario   INTEGER REFERENCES usuario(idusuario),
  idnegocios  INTEGER REFERENCES negocios(idnegocios)
);

CREATE TABLE inventario (
  idinventario     SERIAL PRIMARY KEY,
  idusuario        INTEGER REFERENCES usuario(idusuario),
  cantidad         INTEGER NOT NULL,
  lote             VARCHAR,
  fechavencimiento DATE,
  idtipomovimiento INTEGER REFERENCES tipomovimiento(idtipomovimiento),
  idproducto       INTEGER REFERENCES producto(idproducto),
  idnegocios       INTEGER REFERENCES negocios(idnegocios)
);

CREATE TABLE historialclinico (
  idhistorial  SERIAL PRIMARY KEY,
  idcliente    INTEGER REFERENCES cliente(idcliente),
  fecha        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  titulo       VARCHAR NOT NULL,
  notas        TEXT NOT NULL,
  especialista VARCHAR,
  idnegocios   INTEGER REFERENCES negocios(idnegocios)
);

CREATE TABLE negociousuario (
  idusuario     INTEGER NOT NULL REFERENCES usuario(idusuario),
  idnegocios    INTEGER NOT NULL REFERENCES negocios(idnegocios),
  es_principal  BOOLEAN DEFAULT false,
  fecha_vinculo TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (idusuario, idnegocios)
);

CREATE TABLE abono (
  idabono          SERIAL PRIMARY KEY,
  idcliente        INTEGER NOT NULL REFERENCES cliente(idcliente),
  idusuario        INTEGER REFERENCES usuario(idusuario),
  idmetodopago     INTEGER REFERENCES metodopago(idmetodopago),
  monto            NUMERIC NOT NULL CHECK (monto > 0),
  saldo_disponible NUMERIC NOT NULL CHECK (saldo_disponible >= 0),
  fecha_abono      TIMESTAMPTZ DEFAULT now(),
  observacion      TEXT,
  idnegocios       INTEGER NOT NULL REFERENCES negocios(idnegocios),
  deleted_at       TIMESTAMPTZ,
  idservicios      INTEGER REFERENCES servicios(idservicios)
);

CREATE TABLE abonoaplicacion (
  idabonoaplicacion SERIAL PRIMARY KEY,
  idabono           INTEGER NOT NULL REFERENCES abono(idabono),
  idcita            INTEGER NOT NULL REFERENCES cita(idcita),
  monto_aplicado    NUMERIC NOT NULL CHECK (monto_aplicado > 0),
  fecha_aplicacion  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE citaproducto (
  idcitaproducto SERIAL PRIMARY KEY,
  idcita         INTEGER NOT NULL REFERENCES cita(idcita),
  idproducto     INTEGER NOT NULL REFERENCES producto(idproducto),
  cantidad       NUMERIC NOT NULL CHECK (cantidad > 0),
  fecha_uso      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE google_integrations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idnegocios    INTEGER NOT NULL UNIQUE REFERENCES negocios(idnegocios),
  access_token  TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expiry_date   BIGINT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);


-- ============================================================
-- SECCIÓN 2: FUNCIONES / RPCs
-- ============================================================

CREATE OR REPLACE FUNCTION public.hash_password()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR NEW.password <> OLD.password) THEN
    NEW.password = crypt(NEW.password, gen_salt('bf'));
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.login_usuario(
  p_email      text,
  p_password   text,
  p_idnegocios integer
)
  RETURNS TABLE(
    idusuario  integer,
    nombre     character varying,
    apellido   character varying,
    email      character varying,
    idnegocios integer,
    rol_nombre character varying
  )
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.IdUsuario, u.Nombre, u.Apellido, u.Email, u.IdNegocios,
    (SELECT r.Nombre FROM Rol r JOIN RolPermisos rp ON r.IdRol = rp.IdRol WHERE rp.IdUsuario = u.IdUsuario LIMIT 1)
  FROM Usuario u
  WHERE u.Email = p_email
    AND u.IdNegocios = p_idnegocios
    AND u.password = crypt(p_password, u.password);
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_producto_updated()
  RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  NEW.fechaactualizacion = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.validar_cambio_password(
  p_idusuario       integer,
  p_password_actual text,
  p_password_nuevo  text
)
  RETURNS json
  LANGUAGE plpgsql
  SECURITY DEFINER
AS $$
DECLARE
  v_password_db TEXT;
  v_resultado   JSON;
BEGIN
  SELECT password INTO v_password_db FROM usuario WHERE idusuario = p_idusuario;

  IF v_password_db = crypt(p_password_actual, v_password_db) THEN
    UPDATE usuario
    SET password = p_password_nuevo,
        fechaactualizacion = CURRENT_TIMESTAMP
    WHERE idusuario = p_idusuario;

    v_resultado := json_build_object('success', true, 'message', 'Contraseña actualizada correctamente.');
  ELSE
    v_resultado := json_build_object('success', false, 'message', 'La contraseña actual es incorrecta.');
  END IF;

  RETURN v_resultado;
END;
$$;

CREATE OR REPLACE FUNCTION public.has_google_integration(p_idnegocios integer)
  RETURNS boolean
  LANGUAGE sql
  SECURITY DEFINER
AS $$
  SELECT EXISTS(SELECT 1 FROM google_integrations WHERE idnegocios = p_idnegocios);
$$;

CREATE OR REPLACE FUNCTION public.disconnect_google_integration(p_idnegocios integer)
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
AS $$
  DELETE FROM google_integrations WHERE idnegocios = p_idnegocios;
$$;


-- ============================================================
-- SECCIÓN 3: TRIGGERS
-- ============================================================

CREATE TRIGGER trg_hash_password
  BEFORE INSERT OR UPDATE ON usuario
  FOR EACH ROW EXECUTE FUNCTION hash_password();

CREATE TRIGGER trg_producto_touch
  BEFORE UPDATE ON producto
  FOR EACH ROW EXECUTE FUNCTION touch_producto_updated();


-- ============================================================
-- SECCIÓN 4: RLS (Row Level Security)
-- ============================================================

-- google_integrations: acceso solo via service_role o RPCs SECURITY DEFINER
ALTER TABLE google_integrations ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- SECCIÓN 5: DATOS DE REFERENCIA (seed obligatorio)
-- ============================================================

INSERT INTO estadoapp (idestadoapp, estado) VALUES
  (1, 'Activo'),
  (2, 'Suspendido'),
  (3, 'Eliminado'),
  (4, 'En Espera'),
  (5, 'En Revisión'),
  (6, 'Deployed');
SELECT setval('estadoapp_idestadoapp_seq', 6);

INSERT INTO estado (idestado, descripcion) VALUES
  (1, 'Activo'),
  (2, 'Inactivo');
SELECT setval('estado_idestado_seq', 2);

INSERT INTO estadocita (idestadocita, descripcion) VALUES
  (1, 'Confirmada'),
  (2, 'En Espera'),
  (3, 'Cancelada'),
  (4, 'Completada');
SELECT setval('estadocita_idestadocita_seq', 4);

INSERT INTO tipocita (idtipocita, descripcion) VALUES
  (1, 'Valoración'),
  (2, 'Tratamiento'),
  (3, 'Seguimiento'),
  (4, 'Consulta'),
  (5, 'Control'),
  (6, 'Otro');
SELECT setval('tipocita_idtipocita_seq', 6);

INSERT INTO metodopago (idmetodopago, tipo) VALUES
  (1, 'Efectivo'),
  (2, 'Tarjeta'),
  (3, 'Transferencia'),
  (4, 'Nequi / Daviplata');
SELECT setval('metodopago_idmetodopago_seq', 4);

INSERT INTO permisos (idpermiso, nombre) VALUES
  (1, '📊 Dashboard'),
  (2, '📅 Agenda'),
  (3, '👥 Pacientes'),
  (4, '💰 Pagos/Servicios'),
  (5, '📦 Inventario'),
  (6, '🔑 Usuarios');
SELECT setval('permisos_idpermiso_seq', 6);

INSERT INTO rol (idrol, nombre) VALUES
  (1, 'admin'),
  (2, 'recepcionista'),
  (3, 'profesional');
SELECT setval('rol_idrol_seq', 3);

-- Geografía Colombia

INSERT INTO pais (idpais, nombre, codigo_iso) VALUES
  (1, 'Colombia', 'CO');
SELECT setval('pais_idpais_seq', 1);

INSERT INTO departamento (iddepartamento, nombre, idpais) VALUES
  (1,  'Amazonas', 1),
  (2,  'Antioquia', 1),
  (3,  'Arauca', 1),
  (4,  'Atlántico', 1),
  (5,  'Bolívar', 1),
  (6,  'Boyacá', 1),
  (7,  'Caldas', 1),
  (8,  'Caquetá', 1),
  (9,  'Casanare', 1),
  (10, 'Cauca', 1),
  (11, 'Cesar', 1),
  (12, 'Chocó', 1),
  (13, 'Córdoba', 1),
  (14, 'Cundinamarca', 1),
  (15, 'Bogotá D.C.', 1),
  (16, 'Guainía', 1),
  (17, 'Guaviare', 1),
  (18, 'Huila', 1),
  (19, 'La Guajira', 1),
  (20, 'Magdalena', 1),
  (21, 'Meta', 1),
  (22, 'Nariño', 1),
  (23, 'Norte de Santander', 1),
  (24, 'Putumayo', 1),
  (25, 'Quindío', 1),
  (26, 'Risaralda', 1),
  (27, 'San Andrés y Providencia', 1),
  (28, 'Santander', 1),
  (29, 'Sucre', 1),
  (30, 'Tolima', 1),
  (31, 'Valle del Cauca', 1),
  (32, 'Vaupés', 1),
  (33, 'Vichada', 1);
SELECT setval('departamento_iddepartamento_seq', 33);

INSERT INTO ciudad (idciudad, nombre, iddepartamento) VALUES
  (1,  'Leticia', 1),
  (2,  'Itagüí', 2),
  (3,  'Envigado', 2),
  (4,  'Bello', 2),
  (5,  'Medellín', 2),
  (6,  'Arauca', 3),
  (7,  'Soledad', 4),
  (8,  'Barranquilla', 4),
  (9,  'Cartagena', 5),
  (10, 'Sogamoso', 6),
  (11, 'Duitama', 6),
  (12, 'Tunja', 6),
  (13, 'Manizales', 7),
  (14, 'Florencia', 8),
  (15, 'Yopal', 9),
  (16, 'Popayán', 10),
  (17, 'Valledupar', 11),
  (18, 'Quibdó', 12),
  (19, 'Montería', 13),
  (20, 'Zipaquirá', 14),
  (21, 'Chía', 14),
  (22, 'Soacha', 14),
  (23, 'Bogotá', 15),
  (24, 'Inírida', 16),
  (25, 'San José del Guaviare', 17),
  (26, 'Neiva', 18),
  (27, 'Maicao', 19),
  (28, 'Riohacha', 19),
  (29, 'Santa Marta', 20),
  (30, 'Villavicencio', 21),
  (31, 'Ipiales', 22),
  (32, 'Pasto', 22),
  (33, 'Cúcuta', 23),
  (34, 'Mocoa', 24),
  (35, 'Armenia', 25),
  (36, 'Dosquebradas', 26),
  (37, 'Pereira', 26),
  (38, 'San Andrés', 27),
  (39, 'Floridablanca', 28),
  (40, 'Bucaramanga', 28),
  (41, 'Sincelejo', 29),
  (42, 'Ibagué', 30),
  (43, 'Buenaventura', 31),
  (44, 'Palmira', 31),
  (45, 'Cali', 31),
  (46, 'Mitú', 32),
  (47, 'Puerto Carreño', 33),
  (48, 'Tuluá', 31);
SELECT setval('ciudad_idciudad_seq', 48);


-- ============================================================
-- SECCIÓN 6: NEGOCIO Y SUPERADMIN INICIAL (develop)
-- ============================================================
-- La contraseña es hasheada automáticamente por trg_hash_password.
-- Cambia email, dominio y contraseña según tu entorno.

INSERT INTO negocios (nit, nombre, dominio, idestadoapp, deployed)
  VALUES ('000000000', 'Demo Clínica Dev', 'demo', 1, true);

INSERT INTO usuario (nombre, apellido, email, password, idestado, idnegocios, issuperadmin)
  VALUES ('Super', 'Admin', 'admin@novagendas.dev', 'admin123', 1, 1, true);

INSERT INTO negociousuario (idusuario, idnegocios, es_principal)
  VALUES (1, 1, true);

INSERT INTO rolpermisos (idpermiso, idusuario, idrol) VALUES
  (1, 1, 1),
  (2, 1, 1),
  (3, 1, 1),
  (4, 1, 1),
  (5, 1, 1),
  (6, 1, 1);

UPDATE negocios SET idusuarioadmin = 1 WHERE idnegocios = 1;


-- ============================================================
-- SECCIÓN 7: EDGE FUNCTIONS
-- ============================================================
-- Las Edge Functions NO se despliegan vía SQL.
-- Usa el Supabase CLI desde la raíz del proyecto:
--
--   supabase functions deploy google-calendar-login   --project-ref <TU_PROJECT_REF>
--   supabase functions deploy google-calendar-callback --project-ref <TU_PROJECT_REF>
--   supabase functions deploy google-calendar-event    --project-ref <TU_PROJECT_REF>
--
-- Luego configura los secrets en el dashboard del nuevo proyecto:
--   GOOGLE_CLIENT_ID     → tu OAuth2 Client ID
--   GOOGLE_CLIENT_SECRET → tu OAuth2 Client Secret
--
-- Y agrega el nuevo Redirect URI en Google Cloud Console:
--   https://<TU_PROJECT_REF>.supabase.co/functions/v1/google-calendar-callback
--
-- IMPORTANTE: en google-calendar-callback/index.ts debes actualizar
-- la constante CALLBACK_URI y las URLs de redirección al dominio dev.
-- ============================================================

-- == google-calendar-login/index.ts ==
/*
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const CALLBACK_URI =
  "https://<TU_PROJECT_REF>.supabase.co/functions/v1/google-calendar-callback";
const SCOPE = "https://www.googleapis.com/auth/calendar";

serve((req) => {
  const url = new URL(req.url);
  const idnegocios = url.searchParams.get("idnegocios");

  if (!idnegocios || isNaN(parseInt(idnegocios, 10))) {
    return new Response("idnegocios inválido", { status: 400 });
  }

  const state = btoa(
    JSON.stringify({ idnegocios: parseInt(idnegocios, 10), ts: Date.now() })
  );

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", CALLBACK_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SCOPE);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", state);

  return Response.redirect(authUrl.toString(), 302);
});
*/

-- == google-calendar-callback/index.ts ==
/*
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_CLIENT_ID     = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CALLBACK_URI =
  "https://<TU_PROJECT_REF>.supabase.co/functions/v1/google-calendar-callback";

const errorRedirect = (msg: string) =>
  Response.redirect(
    `https://novagendas.com?google_error=${encodeURIComponent(msg)}`,
    302
  );

serve(async (req) => {
  const url   = new URL(req.url);
  const code  = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) return errorRedirect("missing_params");

  let idnegocios: number;
  try {
    const decoded = JSON.parse(atob(state));
    idnegocios = parseInt(decoded.idnegocios, 10);
    if (isNaN(idnegocios)) throw new Error("invalid");
  } catch {
    return errorRedirect("invalid_state");
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: CALLBACK_URI,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) return errorRedirect("token_exchange_failed");

  const { access_token, refresh_token, expires_in } = await tokenRes.json();
  const expiry_date = Date.now() + (expires_in - 60) * 1000;

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { error } = await supabase.from("google_integrations").upsert(
    {
      idnegocios,
      access_token,
      refresh_token,
      expiry_date,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "idnegocios" }
  );

  if (error) return errorRedirect("db_error");

  const { data: negocio } = await supabase
    .from("negocios")
    .select("dominio")
    .eq("idnegocios", idnegocios)
    .single();

  const subdomain = negocio?.dominio ?? "app";
  return Response.redirect(
    `https://${subdomain}.novagendas.com?google_connected=true`,
    302
  );
});
*/

-- == google-calendar-event/index.ts ==
/*
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GOOGLE_CLIENT_ID     = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const GCAL_BASE = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function getRefreshedToken(
  supabase: ReturnType<typeof createClient>,
  integration: { idnegocios: number; refresh_token: string }
): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: integration.refresh_token,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error("No se pudo renovar el token de Google");
  const { access_token, expires_in } = await res.json();
  const expiry_date = Date.now() + (expires_in - 60) * 1000;
  await supabase
    .from("google_integrations")
    .update({ access_token, expiry_date, updated_at: new Date().toISOString() })
    .eq("idnegocios", integration.idnegocios);
  return access_token as string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  const { idnegocios, action, eventId, eventData } = await req.json();

  if (!idnegocios || !action) {
    return json({ success: false, error: "Faltan parámetros requeridos" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: integration, error: fetchErr } = await supabase
    .from("google_integrations")
    .select("*")
    .eq("idnegocios", idnegocios)
    .single();

  if (fetchErr || !integration) {
    return json(
      { success: false, error: "Google Calendar no conectado para este negocio" },
      404
    );
  }

  let access_token: string = integration.access_token;

  if (Date.now() >= integration.expiry_date - 60_000) {
    access_token = await getRefreshedToken(supabase, integration);
  }

  const headers = {
    Authorization: `Bearer ${access_token}`,
    "Content-Type": "application/json",
  };

  if (action === "create") {
    const res = await fetch(`${GCAL_BASE}?sendUpdates=all`, {
      method: "POST",
      headers,
      body: JSON.stringify(eventData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return json(
        { success: false, error: err.error?.message ?? `HTTP ${res.status}` },
        500
      );
    }
    const data = await res.json();
    return json({ success: true, eventId: data.id });
  }

  if (action === "update") {
    if (!eventId)
      return json({ success: false, error: "eventId requerido para update" }, 400);
    const res = await fetch(`${GCAL_BASE}/${eventId}?sendUpdates=all`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(eventData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return json(
        { success: false, error: err.error?.message ?? `HTTP ${res.status}` },
        500
      );
    }
    return json({ success: true, eventId });
  }

  if (action === "delete") {
    if (!eventId)
      return json({ success: false, error: "eventId requerido para delete" }, 400);
    const res = await fetch(`${GCAL_BASE}/${eventId}?sendUpdates=all`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok && res.status !== 410) {
      const err = await res.json().catch(() => ({}));
      return json(
        { success: false, error: err.error?.message ?? `HTTP ${res.status}` },
        500
      );
    }
    return json({ success: true });
  }

  return json({ success: false, error: `Acción desconocida: ${action}` }, 400);
});
*/
