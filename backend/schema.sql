-- ============================================================
-- Hally Dashboard — Schema database multi-tenant
-- ============================================================

-- Streamer registrati tramite Twitch OAuth
CREATE TABLE IF NOT EXISTS streamers (
  id                  SERIAL PRIMARY KEY,
  twitch_id           VARCHAR(100) UNIQUE NOT NULL,
  twitch_username     VARCHAR(100) NOT NULL,
  display_name        VARCHAR(100),
  email               VARCHAR(200),
  avatar_url          VARCHAR(500),
  subscription_status VARCHAR(50)  NOT NULL DEFAULT 'inactive',  -- inactive | active | cancelled | past_due
  subscription_end    DATE,
  stripe_customer_id  VARCHAR(200),
  created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Configurazione bot per ogni streamer (1:1 con streamers)
CREATE TABLE IF NOT EXISTS bot_configs (
  id               SERIAL PRIMARY KEY,
  streamer_id      INTEGER NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  bot_name         VARCHAR(100)  NOT NULL DEFAULT 'Hally',
  bot_personality  TEXT          NOT NULL DEFAULT '',
  creator_name     VARCHAR(100),
  stream_schedule  TEXT          NOT NULL DEFAULT '',
  social_links     TEXT          NOT NULL DEFAULT '',
  custom_commands  JSONB         NOT NULL DEFAULT '[]',
  members          JSONB         NOT NULL DEFAULT '[]',
  ai_provider      VARCHAR(50)   NOT NULL DEFAULT 'gemini',
  created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
  UNIQUE (streamer_id)
);

-- Memorie salvate dal bot per ogni streamer
CREATE TABLE IF NOT EXISTS bot_memories (
  id           SERIAL PRIMARY KEY,
  streamer_id  INTEGER     NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  category     VARCHAR(100),          -- utente | inside_joke | evento | promessa | nome_gioco
  subject      VARCHAR(200),
  content      TEXT        NOT NULL,
  game_context VARCHAR(200),
  created_at   TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Utilizzi giornalieri del comando !hally per ogni streamer
CREATE TABLE IF NOT EXISTS bot_daily_usage (
  streamer_id  INTEGER     NOT NULL REFERENCES streamers(id) ON DELETE CASCADE,
  username     VARCHAR(100) NOT NULL,
  usage_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
  count        INTEGER     NOT NULL DEFAULT 0,
  PRIMARY KEY (streamer_id, username, usage_date)
);

-- ============================================================
-- Indici per performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_streamers_twitch_id
  ON streamers (twitch_id);

CREATE INDEX IF NOT EXISTS idx_bot_memories_streamer_id
  ON bot_memories (streamer_id);

CREATE INDEX IF NOT EXISTS idx_bot_memories_category
  ON bot_memories (streamer_id, category);

CREATE INDEX IF NOT EXISTS idx_bot_daily_usage_streamer_date
  ON bot_daily_usage (streamer_id, usage_date);

-- ============================================================
-- Trigger: aggiorna updated_at automaticamente
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- Lead magnet: analisi canale Twitch
-- ============================================================
CREATE TABLE IF NOT EXISTS analytics_leads (
  id                  SERIAL PRIMARY KEY,
  email               VARCHAR(200) NOT NULL,
  twitch_username     VARCHAR(100),
  form_data           JSONB,
  analysis_generated  TEXT,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_leads_email
  ON analytics_leads (email);

-- Rinomina characters → members (idempotente per DB esistenti)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='characters') THEN
    ALTER TABLE bot_configs RENAME COLUMN characters TO members;
  END IF;
END;
$$;

-- Aggiunge colonne mancanti se non esistono già (idempotente)
DO $$
BEGIN
  -- bot_configs
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='twitch_username') THEN
    ALTER TABLE bot_configs ADD COLUMN twitch_username VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='event_messages') THEN
    ALTER TABLE bot_configs ADD COLUMN event_messages JSONB NOT NULL DEFAULT '{}';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='discord_announce_channel') THEN
    ALTER TABLE bot_configs ADD COLUMN discord_announce_channel VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='discord_livestream_channel') THEN
    ALTER TABLE bot_configs ADD COLUMN discord_livestream_channel VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bot_configs' AND column_name='discord_video_channel') THEN
    ALTER TABLE bot_configs ADD COLUMN discord_video_channel VARCHAR(100);
  END IF;

  -- streamers: contatori messaggi mensili
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='streamers' AND column_name='monthly_message_count') THEN
    ALTER TABLE streamers ADD COLUMN monthly_message_count INTEGER NOT NULL DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='streamers' AND column_name='monthly_reset_date') THEN
    ALTER TABLE streamers ADD COLUMN monthly_reset_date DATE NOT NULL DEFAULT CURRENT_DATE;
  END IF;
END;
$$;

-- Aggiunge colonne Stripe se non esistono già (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='streamers' AND column_name='subscription_plan') THEN
    ALTER TABLE streamers ADD COLUMN subscription_plan VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='streamers' AND column_name='stripe_subscription_id') THEN
    ALTER TABLE streamers ADD COLUMN stripe_subscription_id VARCHAR(200);
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_streamers_updated_at'
  ) THEN
    CREATE TRIGGER trg_streamers_updated_at
      BEFORE UPDATE ON streamers
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_bot_configs_updated_at'
  ) THEN
    CREATE TRIGGER trg_bot_configs_updated_at
      BEFORE UPDATE ON bot_configs
      FOR EACH ROW EXECUTE FUNCTION set_updated_at();
  END IF;
END;
$$;
