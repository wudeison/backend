-- Tabla para gestionar la disponibilidad de los profesionales
CREATE TABLE IF NOT EXISTS `disponibilidad` (
  `idDisponibilidad` INT NOT NULL AUTO_INCREMENT,
  `idProfesional` INT NOT NULL,
  `fecha` DATE NOT NULL,
  `horaInicio` TIME NOT NULL,
  `horaFin` TIME NOT NULL,
  `estado` ENUM('disponible', 'ocupado', 'pendiente') DEFAULT 'disponible',
  `idCliente` VARCHAR(20) DEFAULT NULL,
  `notas` TEXT DEFAULT NULL,
  `fechaCreacion` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idDisponibilidad`),
  UNIQUE KEY `unico_horario` (`idProfesional`, `fecha`, `horaInicio`),
  FOREIGN KEY (`idProfesional`) REFERENCES `profesional` (`idProfesional`) ON DELETE CASCADE,
  FOREIGN KEY (`idCliente`) REFERENCES `usuario` (`idUsuario`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
