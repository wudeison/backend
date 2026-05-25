-- Ver registros duplicados para idUsuario = '12345'
SELECT * FROM profesional WHERE idUsuario = '12345';

-- PASO 1: Eliminar todos los registros duplicados del usuario 12345
DELETE FROM profesional WHERE idUsuario = '12345';

-- PASO 2: Insertar un registro limpio (ajusta los valores si necesitas otros datos)
INSERT INTO profesional (
  idUsuario, 
  nombreCompleto, 
  profesion, 
  experiencia, 
  habilidadesBlandas, 
  idiomas, 
  fotoPerfil, 
  bio
) VALUES (
  '12345',
  'Nombre del Profesional',  -- Ajusta este valor
  'Salud Mental',
  5,
  '[]',
  '[]',
  NULL,
  ''
);

-- Verificar que quedó solo un registro
SELECT * FROM profesional WHERE idUsuario = '12345';
