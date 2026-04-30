-- Migration: add google_integrations table and helper RPCs
-- Applied: 2026-04-29
-- Note: FK references negocios(idnegocios) — the actual PK column name

CREATE TABLE IF NOT EXISTS public.google_integrations (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  idnegocios    INT     NOT NULL UNIQUE REFERENCES negocios(idnegocios) ON DELETE CASCADE,
  access_token  TEXT    NOT NULL,
  refresh_token TEXT    NOT NULL,
  expiry_date   BIGINT  NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.google_integrations ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_google_integration(p_idnegocios INT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT EXISTS(SELECT 1 FROM google_integrations WHERE idnegocios = p_idnegocios);
$$;

CREATE OR REPLACE FUNCTION public.disconnect_google_integration(p_idnegocios INT)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER
AS $$
  DELETE FROM google_integrations WHERE idnegocios = p_idnegocios;
$$;
