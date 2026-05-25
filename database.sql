-- =====================================
-- CREAR BASE DE DATOS
-- =====================================
CREATE DATABASE IF NOT EXISTS boost;
USE boost;

-- =====================================
-- ELIMINAR TABLAS EXISTENTES EN ORDEN CORRECTO
-- =====================================
DROP TABLE IF EXISTS `pago`;
DROP TABLE IF EXISTS `sesion`;
DROP TABLE IF EXISTS `recursodigital`;
DROP TABLE IF EXISTS `profesional`;
DROP TABLE IF EXISTS `usuario`;

-- =====================================
-- 1️⃣ Tabla usuario
-- =====================================
CREATE TABLE `usuario` (
  `idUsuario` varchar(20) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `contrasena` varchar(100) NULL,
  `fechaRegistro` datetime DEFAULT CURRENT_TIMESTAMP,
  `tipoUsuario` enum('profesional','cliente') DEFAULT NULL,
  `telefono` varchar(30) DEFAULT NULL,
  `ciudad` varchar(100) DEFAULT NULL,
  `direccion` varchar(150) DEFAULT NULL,
  `fechaNacimiento` date DEFAULT NULL,
  `ocupacion` varchar(120) DEFAULT NULL,
  `fotoPerfil` varchar(255) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `preferencias` json DEFAULT NULL,
  `metodoPagoPreferido` varchar(50) DEFAULT NULL,
  `recibeNewsletter` tinyint(1) DEFAULT 0,
  `isVerified` tinyint(1) DEFAULT 0,
  PRIMARY KEY (`idUsuario`),
  UNIQUE KEY `correo` (`correo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =====================================
-- 2️⃣ Tabla profesional
-- =====================================
CREATE TABLE `profesional` (
  `idProfesional` int NOT NULL AUTO_INCREMENT,
  `idUsuario` varchar(20) NOT NULL,
  `nombreCompleto` varchar(150) DEFAULT NULL,
  `profesion` varchar(100) DEFAULT NULL,
  `experiencia` int DEFAULT NULL,
  `habilidadesBlandas` json DEFAULT NULL,
  `idiomas` json DEFAULT NULL,
  `fotoPerfil` text DEFAULT NULL,
  `bio` text DEFAULT NULL,
  PRIMARY KEY (`idProfesional`),
  UNIQUE KEY `idUsuario` (`idUsuario`),
  CONSTRAINT `profesional_ibfk_1` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =====================================
-- 3️⃣ Tabla recursodigital
-- =====================================
CREATE TABLE `recursodigital` (
  `idRecurso` int NOT NULL AUTO_INCREMENT,
  `idProfesional` int NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `descripcion` text,
  `url` varchar(255),
  PRIMARY KEY (`idRecurso`),
  KEY `idProfesional` (`idProfesional`),
  CONSTRAINT `recursodigital_ibfk_1` FOREIGN KEY (`idProfesional`) REFERENCES `profesional` (`idProfesional`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =====================================
-- 4️⃣ Tabla sesion
-- =====================================
CREATE TABLE `sesion` (
  `idSesion` int NOT NULL AUTO_INCREMENT,
  `idUsuario` varchar(20) NOT NULL,
  `idProfesional` int DEFAULT NULL,
  `idDisponibilidad` int DEFAULT NULL,
  `fecha` datetime DEFAULT NULL,
  `horaInicio` time DEFAULT NULL,
  `horaFin` time DEFAULT NULL,
  `duracion` int DEFAULT NULL,
  `estado` enum('pendiente','confirmada','cancelada','completada') DEFAULT 'pendiente',
  `canceladoPor` VARCHAR(20) DEFAULT NULL,
  `notificacionPendiente` TINYINT(1) DEFAULT 0,
  `montoReembolso` DECIMAL(10,2) DEFAULT NULL,
  `descuentoDisponible` TINYINT(1) DEFAULT 0,
  `archivadaCliente` TINYINT(1) DEFAULT 0,
  `archivadaProfesional` TINYINT(1) DEFAULT 0,
  PRIMARY KEY (`idSesion`),
  KEY `idUsuario` (`idUsuario`),
  KEY `idProfesional` (`idProfesional`),
  KEY `idDisponibilidad` (`idDisponibilidad`),
  CONSTRAINT `sesion_ibfk_1` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `sesion_ibfk_2` FOREIGN KEY (`idProfesional`) REFERENCES `profesional` (`idProfesional`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `sesion_ibfk_3` FOREIGN KEY (`idDisponibilidad`) REFERENCES `disponibilidad` (`idDisponibilidad`)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- =====================================
-- 5️⃣ Tabla pago
-- =====================================
CREATE TABLE `pago` (
  `idPago` int NOT NULL AUTO_INCREMENT,
  `idUsuario` varchar(20) NOT NULL,
  `idSesion` int DEFAULT NULL,
  `idRecurso` int DEFAULT NULL,
  `monto` decimal(10,2) DEFAULT NULL,
  `metodoPago` varchar(50) DEFAULT NULL,
  `fechaPago` datetime DEFAULT NULL,
  PRIMARY KEY (`idPago`),
  KEY `idUsuario` (`idUsuario`),
  KEY `idSesion` (`idSesion`),
  KEY `idRecurso` (`idRecurso`),
  CONSTRAINT `pago_ibfk_1` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `pago_ibfk_2` FOREIGN KEY (`idSesion`) REFERENCES `sesion` (`idSesion`),
  CONSTRAINT `pago_ibfk_3` FOREIGN KEY (`idRecurso`) REFERENCES `recursodigital` (`idRecurso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;