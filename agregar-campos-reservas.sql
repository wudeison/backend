-- =====================================
-- MIGRACIÓN: Agregar campos para sistema de reservas
-- Fecha: 29 de noviembre 2025
-- =====================================

USE boost;

-- Agregar campos a la tabla sesion para manejar reservas completas
ALTER TABLE `sesion` 
  ADD COLUMN `horaInicio` TIME DEFAULT NULL AFTER `fecha`,
  ADD COLUMN `horaFin` TIME DEFAULT NULL AFTER `horaInicio`,
  ADD COLUMN `estado` ENUM('pendiente','confirmada','cancelada','completada') DEFAULT 'pendiente' AFTER `duracion`,
  ADD COLUMN `idDisponibilidad` INT DEFAULT NULL AFTER `idProfesional`,
  ADD CONSTRAINT `sesion_ibfk_3` FOREIGN KEY (`idDisponibilidad`) REFERENCES `disponibilidad` (`idDisponibilidad`) ON DELETE SET NULL;

-- Agregar campo metodoPago a la tabla pago
ALTER TABLE `pago` 
  ADD COLUMN `metodoPago` VARCHAR(50) DEFAULT NULL AFTER `monto`;

-- Verificar cambios
SELECT 'Campos agregados exitosamente' AS resultado;
