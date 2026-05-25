const express = require("express");
const router = express.Router();
const db = require("../database");

const SLOT_DURATION_MINUTES = 60;

const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (minutesTotal) => {
  const hours = Math.floor(minutesTotal / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (minutesTotal % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}:00`;
};

// GET - Obtener disponibilidad de un profesional para un mes específico
router.get("/disponibilidad/:idProfesional", async (req, res) => {
  const { idProfesional } = req.params;
  const { mes, anio } = req.query; // Formato: mes=11, anio=2025

  try {
    let query = `
      SELECT * FROM disponibilidad 
      WHERE idProfesional = ?
    `;
    const params = [idProfesional];

    // Si se especifica mes y año, filtrar
    if (mes && anio) {
      query += ` AND MONTH(fecha) = ? AND YEAR(fecha) = ?`;
      params.push(mes, anio);
    }

    query += ` ORDER BY fecha ASC, horaInicio ASC`;

    const [rows] = await db.query(query, params);
    
    res.json({ disponibilidad: rows });
  } catch (error) {
    console.error("❌ Error al obtener disponibilidad:", error);
    res.status(500).json({ mensaje: "Error al obtener disponibilidad" });
  }
});

// POST - Guardar/actualizar disponibilidad
router.post("/disponibilidad", async (req, res) => {
  const { idProfesional, fecha, horaInicio, horaFin, estado } = req.body;

  if (!idProfesional || !fecha || !horaInicio || !horaFin) {
    return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
  }

  try {
    const query = `
      INSERT INTO disponibilidad (idProfesional, fecha, horaInicio, horaFin, estado)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        horaFin = ?,
        estado = ?
    `;

    await db.query(query, [
      idProfesional,
      fecha,
      horaInicio,
      horaFin,
      estado || 'disponible',
      // Para el UPDATE
      horaFin,
      estado || 'disponible'
    ]);

    res.json({ mensaje: "Disponibilidad guardada correctamente" });
  } catch (error) {
    console.error("❌ Error al guardar disponibilidad:", error);
    res.status(500).json({ mensaje: "Error al guardar disponibilidad" });
  }
});

// POST - Generar bloques de una hora dentro de una franja
router.post("/disponibilidad/franja", async (req, res) => {
  const { idProfesional, fecha, horaInicio, horaFin } = req.body;

  if (!idProfesional || !fecha || !horaInicio || !horaFin) {
    return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
  }

  const inicioMin = timeToMinutes(horaInicio);
  const finMin = timeToMinutes(horaFin);

  if (isNaN(inicioMin) || isNaN(finMin) || finMin <= inicioMin) {
    return res.status(400).json({ mensaje: "Horario inválido" });
  }

  const bloques = [];
  for (let actual = inicioMin; actual < finMin; actual += SLOT_DURATION_MINUTES) {
    const siguiente = Math.min(actual + SLOT_DURATION_MINUTES, finMin);
    const inicio = minutesToTime(actual);
    const fin = minutesToTime(siguiente);
    bloques.push({ inicio, fin });
  }

  try {
    const promises = bloques.map(({ inicio, fin }) =>
      db.query(
        `INSERT INTO disponibilidad (idProfesional, fecha, horaInicio, horaFin, estado, idCliente, notas)
         VALUES (?, ?, ?, ?, 'disponible', NULL, NULL)
         ON DUPLICATE KEY UPDATE estado = 'disponible', idCliente = NULL, notas = NULL`,
        [idProfesional, fecha, inicio, fin]
      )
    );

    await Promise.all(promises);

    res.json({ mensaje: "Bloques generados", bloquesCreados: bloques.length, bloques });
  } catch (error) {
    console.error("❌ Error al generar bloques:", error);
    res.status(500).json({ mensaje: "Error al generar bloques", detalle: error.message });
  }
});

// DELETE - Eliminar un horario de disponibilidad
router.delete("/disponibilidad/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("DELETE FROM disponibilidad WHERE idDisponibilidad = ?", [id]);
    res.json({ mensaje: "Disponibilidad eliminada correctamente" });
  } catch (error) {
    console.error("❌ Error al eliminar disponibilidad:", error);
    res.status(500).json({ mensaje: "Error al eliminar disponibilidad" });
  }
});

// POST - Cliente solicita cita
router.post("/solicitar-cita", async (req, res) => {
  const { idDisponibilidad, idCliente, notas } = req.body;

  if (!idDisponibilidad || !idCliente) {
    return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
  }

  try {
    // Verificar que el horario esté disponible
    const [rows] = await db.query(
      "SELECT * FROM disponibilidad WHERE idDisponibilidad = ? AND estado = 'disponible'",
      [idDisponibilidad]
    );

    if (rows.length === 0) {
      return res.status(400).json({ mensaje: "Este horario ya no está disponible" });
    }

    // Actualizar el horario a pendiente
    await db.query(
      "UPDATE disponibilidad SET estado = 'pendiente', idCliente = ?, notas = ? WHERE idDisponibilidad = ?",
      [idCliente, notas || null, idDisponibilidad]
    );

    res.json({ mensaje: "Solicitud de cita enviada correctamente" });
  } catch (error) {
    console.error("❌ Error al solicitar cita:", error);
    res.status(500).json({ mensaje: "Error al solicitar cita" });
  }
});

module.exports = router;
