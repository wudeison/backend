ALTER TABLE sesion
ADD COLUMN IF NOT EXISTS notificacionClientePendiente TINYINT(1) DEFAULT 0 AFTER notificacionPendiente,
ADD COLUMN IF NOT EXISTS notificacionProfesionalPendiente TINYINT(1) DEFAULT 0 AFTER notificacionClientePendiente;
