const express = require("express");
const router = express.Router();
const db = require("../database");

router.post("/", async (req, res) => {
  const {
    idUsuario,
    nombreCompleto,
    profesion,
    experiencia,
    habilidadesBlandas,
    idiomas,
    fotoPerfil,
    bio,
    correo,
    telefono,
    ciudad,
    direccion,
    fechaNacimiento,
  } = req.body;

  if (!idUsuario) {
    return res.status(400).json({ mensaje: "El ID de usuario es requerido" });
  }

  if (!nombreCompleto || !profesion) {
    return res.status(400).json({ mensaje: "Nombre completo y profesión son obligatorios" });
  }

  try {
    // Normalizar JSON
    const habilidadesJSON = habilidadesBlandas ? JSON.stringify(habilidadesBlandas) : null;
    const idiomasJSON = idiomas ? JSON.stringify(idiomas) : null;

    // Convertir fecha ISO a formato MySQL (YYYY-MM-DD)
    let fechaFormateada = null;
    if (fechaNacimiento) {
      const fecha = new Date(fechaNacimiento);
      if (!isNaN(fecha.getTime())) {
        fechaFormateada = fecha.toISOString().split('T')[0];
      } else {
        fechaFormateada = null;
      }
    }

    // 1. Actualizar tabla usuario con datos generales
    const updateUsuarioQuery = `
      UPDATE usuario 
      SET 
        nombre = ?,
        correo = COALESCE(?, correo),
        telefono = ?,
        ciudad = ?,
        direccion = ?,
        fechaNacimiento = ?,
        tipoUsuario = 'profesional'
      WHERE idUsuario = ?
    `;

    await db.query(updateUsuarioQuery, [
      nombreCompleto,
      correo,
      telefono,
      ciudad,
      direccion,
      fechaFormateada,
      idUsuario,
    ]);

    // 2. Insertar o actualizar en tabla profesional
    const upsertProfesionalQuery = `
      INSERT INTO profesional (
        idUsuario,
        nombreCompleto,
        profesion,
        experiencia,
        habilidadesBlandas,
        idiomas,
        fotoPerfil,
        bio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        nombreCompleto = ?,
        profesion = ?,
        experiencia = ?,
        habilidadesBlandas = ?,
        idiomas = ?,
        fotoPerfil = ?,
        bio = ?
    `;

    const [upsertResult] = await db.query(upsertProfesionalQuery, [
      idUsuario,
      nombreCompleto,
      profesion,
      experiencia || 0,
      habilidadesJSON,
      idiomasJSON,
      fotoPerfil,
      bio,
      // Repetir los mismos valores para el UPDATE
      nombreCompleto,
      profesion,
      experiencia || 0,
      habilidadesJSON,
      idiomasJSON,
      fotoPerfil,
      bio,
    ]);

    // 3. Obtener datos actualizados del profesional
    const [rows] = await db.query(
      `SELECT 
        p.*,
        u.correo,
        u.telefono,
        u.ciudad,
        u.direccion,
        u.fechaNacimiento,
        u.tipoUsuario
      FROM profesional p
      INNER JOIN usuario u ON p.idUsuario = u.idUsuario
      WHERE p.idUsuario = ?`,
      [idUsuario]
    );

    if (rows.length === 0) {
      return res.status(404).json({ mensaje: "Error al obtener datos del profesional" });
    }

    const profesionalActualizado = rows[0];

    // Parsear JSON
    if (profesionalActualizado.habilidadesBlandas) {
      try {
        profesionalActualizado.habilidadesBlandas = JSON.parse(profesionalActualizado.habilidadesBlandas);
      } catch (e) {}
    }
    
    if (profesionalActualizado.idiomas) {
      try {
        profesionalActualizado.idiomas = JSON.parse(profesionalActualizado.idiomas);
      } catch (e) {}
    }

    res.status(200).json({
      mensaje: "Perfil profesional guardado correctamente",
      profesional: profesionalActualizado,
    });
  } catch (error) {
    console.error("Error al guardar perfil profesional:", error);
    res.status(500).json({ mensaje: "Error en el servidor", error: error.message });
  }
});

module.exports = router;
