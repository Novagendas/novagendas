CREATE TABLE IF NOT EXISTS bot_config (
  idnegocios INT PRIMARY KEY REFERENCES negocios(idnegocios) ON DELETE CASCADE,
  dias_disponibles INT[] DEFAULT '{1,2,3,4,5,6}',  -- 0=Dom, 1=Lun...6=Sab
  hora_inicio TIME DEFAULT '08:00:00',
  hora_fin TIME DEFAULT '20:00:00',
  servicios_excluidos INT[] DEFAULT '{}',  -- IDs de servicios que NO debe mostrar el bot
  mostrar_precios BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bot_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "negocios own config" ON bot_config
  USING (TRUE) WITH CHECK (TRUE);

-- Migración: jornadas de atención personalizables
ALTER TABLE bot_config
  ADD COLUMN IF NOT EXISTS jornadas JSONB DEFAULT '{
    "manana": {"habilitado": true,  "inicio": "08:00", "fin": "12:00"},
    "tarde":  {"habilitado": true,  "inicio": "13:00", "fin": "18:00"},
    "noche":  {"habilitado": false, "inicio": "18:00", "fin": "21:00"}
  }'::jsonb;

-- Notificaciones del bot al administrador
ALTER TABLE bot_config
  ADD COLUMN IF NOT EXISTS email_notificaciones TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS telefono_contacto TEXT DEFAULT NULL;
