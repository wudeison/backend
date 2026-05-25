const express = require("express");
const router = express.Router();
const db = require("../database");

// GET - Obtener todos los profesionales (para mostrar en galería pública)
router.get("/profesionales/publico", async (req, res) => {
  try {
    const query = `
      SELECT 
        u.idUsuario,
        u.nombre,
        u.correo,
        u.telefono,
        u.ciudad,
        p.nombreCompleto,
        p.profesion,
        p.experiencia,
        p.bio,
        p.fotoPerfil
      FROM usuario u
      INNER JOIN profesional p ON u.idUsuario = p.idUsuario
      WHERE u.tipoUsuario = 'profesional'
      ORDER BY u.nombre ASC
    `;

    const [results] = await db.execute(query);
    res.json({ profesionales: results });
  } catch (error) {
    console.error("Error al obtener profesionales:", error);
    res.status(500).json({ error: "Error al obtener profesionales" });
  }
});

// GET - Obtener perfil completo de un profesional específico con disponibilidad
router.get("/profesionales/publico/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Buscando profesional con ID:", id);

    // Obtener información del profesional
    const queryProfesional = `
      SELECT 
        u.idUsuario,
        u.nombre,
        u.correo,
        u.telefono,
        u.ciudad,
        p.idProfesional,
        p.nombreCompleto,
        p.profesion,
        p.experiencia,
        p.habilidadesBlandas,
        p.idiomas,
        p.bio,
        p.fotoPerfil
      FROM usuario u
      INNER JOIN profesional p ON u.idUsuario = p.idUsuario
      WHERE u.idUsuario = ? AND u.tipoUsuario = 'profesional'
    `;

    const [profesional] = await db.execute(queryProfesional, [id]);
    console.log("Profesional encontrado:", profesional.length > 0 ? "SÍ" : "NO");

    if (profesional.length === 0) {
      return res.status(404).json({ error: "Profesional no encontrado" });
    }

    // Obtener disponibilidad del profesional (solo horarios disponibles)
    const queryDisponibilidad = `
      SELECT 
        idDisponibilidad,
        fecha,
        horaInicio,
        horaFin,
        estado
      FROM disponibilidad
      WHERE idProfesional = ? AND estado = 'disponible' AND fecha >= CURDATE()
      ORDER BY fecha ASC, horaInicio ASC
    `;

    const [disponibilidad] = await db.execute(queryDisponibilidad, [profesional[0].idProfesional]);
    console.log("Disponibilidad encontrada para idProfesional", profesional[0].idProfesional, ":", disponibilidad.length, "registros");

    // Parsear JSON fields si existen de forma segura
    let habilidadesBlandas = [];
    let idiomas = [];

    try {
      if (profesional[0].habilidadesBlandas) {
        habilidadesBlandas = typeof profesional[0].habilidadesBlandas === 'string' 
          ? JSON.parse(profesional[0].habilidadesBlandas) 
          : profesional[0].habilidadesBlandas;
      }
    } catch (e) {
      console.log("Error parseando habilidadesBlandas:", e);
    }

    try {
      if (profesional[0].idiomas) {
        idiomas = typeof profesional[0].idiomas === 'string' 
          ? JSON.parse(profesional[0].idiomas) 
          : profesional[0].idiomas;
      }
    } catch (e) {
      console.log("Error parseando idiomas:", e);
    }

    const profesionalData = {
      ...profesional[0],
      habilidadesBlandas,
      idiomas,
      disponibilidad: disponibilidad
    };

    res.json({ profesional: profesionalData });
  } catch (error) {
    console.error("Error al obtener perfil del profesional:", error);
    res.status(500).json({ error: "Error al obtener perfil del profesional" });
  }
});

module.exports = router;
