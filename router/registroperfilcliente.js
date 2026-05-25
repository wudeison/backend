const express = require("express");
const router = express.Router();
const db = require("../database");

// Endpoint para crear/actualizar el perfil del cliente (registro de perfil)
router.post("/registroperfilcliente", async (req, res) => {
  const {
    idUsuario,
    nombre,
    correo,
    contrasena,
    tipoUsuario,
    telefono,
    ciudad,
    direccion,
    fechaNacimiento,
    ocupacion,
    fotoPerfil,
    bio,
    preferencias,
    metodoPagoPreferido,
    recibeNewsletter,
    isVerified,
  } = req.body;

  if (!idUsuario || !nombre || !correo) {
    return res.status(400).json({ mensaje: "Faltan datos obligatorios (idUsuario, nombre, correo)" });
  }

  // Convertir fecha de nacimiento si viene en formato ISO
  let fechaFormateada = fechaNacimiento;
  if (fechaNacimiento) {
    try {
      const fecha = new Date(fechaNacimiento);
      fechaFormateada = fecha.toISOString().split('T')[0]; // YYYY-MM-DD
    } catch (e) {
      fechaFormateada = fechaNacimiento;
    }
  }

  // Normalizar preferencias a string JSON si viene como objeto
  let preferenciasVal = null;
  try {
    if (typeof preferencias === 'object' && preferencias !== null) preferenciasVal = JSON.stringify(preferencias);
    else if (typeof preferencias === 'string' && preferencias.trim() !== '') {
      // intentar validar si es JSON válido
      try { JSON.parse(preferencias); preferenciasVal = preferencias; } catch (e) { preferenciasVal = JSON.stringify({ value: preferencias }); }
    }
  } catch (e) { preferenciasVal = null; }

  // Preparar INSERT ... ON DUPLICATE KEY UPDATE con los nuevos campos
  const query = `
    INSERT INTO usuario (idUsuario, nombre, correo, contrasena, tipoUsuario, telefono, ciudad, direccion, fechaNacimiento, ocupacion, fotoPerfil, bio, preferencias, metodoPagoPreferido, recibeNewsletter, isVerified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      nombre = ?,
      correo = ?,
      contrasena = COALESCE(?, contrasena),
      tipoUsuario = ?,
      telefono = ?,
      ciudad = ?,
      direccion = ?,
      fechaNacimiento = ?,
      ocupacion = ?,
      fotoPerfil = ?,
      bio = ?,
      preferencias = ?,
      metodoPagoPreferido = ?,
      recibeNewsletter = ?,
      isVerified = ?
  `;

  const values = [
    idUsuario,
    nombre,
    correo,
    contrasena || null,
    tipoUsuario || 'cliente',
    telefono || null,
    ciudad || null,
    direccion || null,
    fechaFormateada || null,
    ocupacion || null,
    fotoPerfil || null,
    bio || null,
    preferenciasVal,
    metodoPagoPreferido || null,
    recibeNewsletter ? 1 : 0,
    isVerified ? 1 : 0,
    // Repetir para el UPDATE
    nombre,
    correo,
    contrasena || null,
    tipoUsuario || 'cliente',
    telefono || null,
    ciudad || null,
    direccion || null,
    fechaFormateada || null,
    ocupacion || null,
    fotoPerfil || null,
    bio || null,
    preferenciasVal,
    metodoPagoPreferido || null,
    recibeNewsletter ? 1 : 0,
    isVerified ? 1 : 0,
  ];

  try {
    await db.query(query, values);

    // Devolver el cliente actualizado (sin contrasena)
    const [rows] = await db.query('SELECT idUsuario, nombre, correo, tipoUsuario, telefono, ciudad, direccion, fechaNacimiento, ocupacion, fotoPerfil, bio, preferencias, metodoPagoPreferido, recibeNewsletter, isVerified FROM usuario WHERE idUsuario = ?', [idUsuario]);
    
    if (!rows || rows.length === 0) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado después de guardar' });
    }
    
    const cliente = rows[0];
    // si preferencias es JSON almacenado como string, intentar parsear
    try { 
      if (typeof cliente.preferencias === 'string') {
        cliente.preferencias = JSON.parse(cliente.preferencias);
      }
    } catch(e){}
    
    res.json({ mensaje: 'Perfil guardado correctamente', cliente });
  } catch (err) {
    console.error("❌ Error en registroperfilcliente:", err);
    return res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

module.exports = router;
