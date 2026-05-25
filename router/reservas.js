
const express = require("express");
const router = express.Router();
const db = require("../database");

const TARIFA_FIJA = 80000;

// PUT /api/reservas/notificacion/:idSesion - Ocultar notificación de cancelación
router.put("/reservas/notificacion/:idSesion", async (req, res) => {
  const { idSesion } = req.params;
  try {
    await db.execute(
      "UPDATE sesion SET notificacionPendiente = 0 WHERE idSesion = ?",
      [idSesion]
    );
    res.json({ mensaje: "Notificación ocultada" });
  } catch (error) {
    res.status(500).json({ error: "Error al ocultar la notificación", detalle: error.message });
  }
});

// POST /api/reservas/crear - Crear una nueva reserva con pago
router.post("/reservas/crear", async (req, res) => {
  const { idCliente, idProfesional, idDisponibilidad, metodoPago } = req.body;

  // Validar datos requeridos
  if (!idCliente || !idProfesional || !idDisponibilidad || !metodoPago) {
    return res.status(400).json({ 
      error: "Faltan datos requeridos",
      detalle: { idCliente, idProfesional, idDisponibilidad, metodoPago }
    });
  }

  try {
    // 1. Verificar que la disponibilidad existe y está disponible
    const [disponibilidad] = await db.execute(
      "SELECT * FROM disponibilidad WHERE idDisponibilidad = ? AND estado = 'disponible'",
      [idDisponibilidad]
    );

    if (disponibilidad.length === 0) {
      return res.status(404).json({ 
        error: "Horario no disponible o ya reservado" 
      });
    }

    const horario = disponibilidad[0];

    // 2. Crear la sesión
    const [resultSesion] = await db.execute(
      `INSERT INTO sesion (idUsuario, idProfesional, idDisponibilidad, fecha, horaInicio, horaFin, estado) 
       VALUES (?, ?, ?, ?, ?, ?, 'pendiente')`,
      [
        idCliente,
        idProfesional,
        idDisponibilidad,
        horario.fecha,
        horario.horaInicio,
        horario.horaFin
      ]
    );

    const idSesion = resultSesion.insertId;

    // 3. Crear el registro de pago
    await db.execute(
      `INSERT INTO pago (idUsuario, idSesion, monto, metodoPago, fechaPago) 
       VALUES (?, ?, ?, ?, NOW())`,
      [idCliente, idSesion, TARIFA_FIJA, metodoPago]
    );

    // 4. Actualizar el estado de la disponibilidad a 'ocupado'
    await db.execute(
      "UPDATE disponibilidad SET estado = 'ocupado' WHERE idDisponibilidad = ?",
      [idDisponibilidad]
    );

    res.status(201).json({ 
      mensaje: "Reserva creada exitosamente",
      idSesion,
      fecha: horario.fecha,
      horaInicio: horario.horaInicio,
      horaFin: horario.horaFin,
      monto: TARIFA_FIJA
    });

  } catch (error) {
    console.error("Error al crear reserva:", error);
    res.status(500).json({ 
      error: "Error al procesar la reserva",
      detalle: error.message 
    });
  }
});

// GET /api/reservas/profesional/:idProfesional - Obtener sesiones reservadas del profesional
router.get("/reservas/profesional/:idProfesional", async (req, res) => {
  const { idProfesional } = req.params;

  try {
    const query = `
      SELECT 
        s.idSesion,
        s.fecha,
        s.horaInicio,
        s.horaFin,
        s.estado,
        s.canceladoPor,
        s.notificacionPendiente,
        s.montoReembolso,
        s.descuentoDisponible,
        u.idUsuario as idCliente,
        u.nombre as nombreCliente,
        u.correo as correoCliente,
        u.telefono as telefonoCliente,
        p.monto,
        p.metodoPago,
        p.fechaPago
      FROM sesion s
      INNER JOIN usuario u ON s.idUsuario = u.idUsuario
      INNER JOIN pago p ON s.idSesion = p.idSesion
      WHERE s.idProfesional = ?
        AND (s.archivadaProfesional IS NULL OR s.archivadaProfesional = 0)
      ORDER BY s.fecha ASC, s.horaInicio ASC
    `;

    const [sesiones] = await db.execute(query, [idProfesional]);

    res.json({ sesiones });

  } catch (error) {
    console.error("Error al obtener sesiones:", error);
    res.status(500).json({ 
      error: "Error al obtener las sesiones",
      detalle: error.message 
    });
  }
});

// GET /api/reservas/cliente/:idCliente - Obtener sesiones reservadas del cliente
router.get("/reservas/cliente/:idCliente", async (req, res) => {
  const { idCliente } = req.params;

  try {
    const query = `
      SELECT 
        s.idSesion,
        s.fecha,
        s.horaInicio,
        s.horaFin,
        s.estado,
        s.canceladoPor,
        s.notificacionPendiente,
        s.montoReembolso,
        s.descuentoDisponible,
        prof.idProfesional,
        prof.nombreCompleto as nombreProfesional,
        prof.profesion,
        prof.fotoPerfil,
        u.correo as correoProfesional,
        u.telefono as telefonoProfesional,
        p.monto,
        p.metodoPago,
        p.fechaPago
      FROM sesion s
      INNER JOIN profesional prof ON s.idProfesional = prof.idProfesional
      INNER JOIN usuario u ON prof.idUsuario = u.idUsuario
      INNER JOIN pago p ON s.idSesion = p.idSesion
      WHERE s.idUsuario = ?
        AND (s.archivadaCliente IS NULL OR s.archivadaCliente = 0)
      ORDER BY s.fecha ASC, s.horaInicio ASC
    `;

    const [sesiones] = await db.execute(query, [idCliente]);

    res.json({ sesiones });

  } catch (error) {
    console.error("Error al obtener sesiones del cliente:", error);
    res.status(500).json({ 
      error: "Error al obtener las sesiones",
      detalle: error.message 
    });
  }
});

// DELETE /api/reservas/cancelar/:idSesion - Cancelar una sesión
router.delete("/reservas/cancelar/:idSesion", async (req, res) => {
  const { idSesion } = req.params;
  const canceladoPor = req.query.canceladoPor; // 'cliente' o 'profesional'

  if (!canceladoPor || (canceladoPor !== 'cliente' && canceladoPor !== 'profesional')) {
    return res.status(400).json({ error: "Falta o valor inválido en canceladoPor" });
  }

  try {
    // 1. Obtener información de la sesión y pago antes de cancelar
    const [sesion] = await db.execute(
      "SELECT idDisponibilidad FROM sesion WHERE idSesion = ?",
      [idSesion]
    );
    const [pago] = await db.execute(
      "SELECT monto FROM pago WHERE idSesion = ?",
      [idSesion]
    );

    if (sesion.length === 0) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }
    const idDisponibilidad = sesion[0].idDisponibilidad;
    const montoPagado = pago.length > 0 ? parseFloat(pago[0].monto) : 0;

    // 2. Calcular reembolso/descuento y mensaje de notificación
    let montoReembolso = null;
    let descuentoDisponible = 0;
    let mensajeNotificacion = "";
    if (canceladoPor === 'cliente') {
      montoReembolso = montoPagado * 0.7;
      mensajeNotificacion = "El cliente canceló la sesión. Se devolverá el 70% del valor pagado.";
    } else if (canceladoPor === 'profesional') {
      montoReembolso = montoPagado; // El cliente puede reagendar con 30% de descuento
      descuentoDisponible = 1;
      mensajeNotificacion = "El profesional canceló la sesión. Puedes reagendar con 30% de descuento.";
    }

    // 3. Actualizar estado de la sesión y registrar cancelador, notificación y reembolso/descuento
    await db.execute(
      `UPDATE sesion SET estado = 'cancelada', canceladoPor = ?, notificacionPendiente = 1, montoReembolso = ?, descuentoDisponible = ? WHERE idSesion = ?`,
      [canceladoPor, montoReembolso, descuentoDisponible, idSesion]
    );

    // 4. Actualizar la disponibilidad según quién canceló
    if (idDisponibilidad) {
      if (canceladoPor === 'cliente') {
        await db.execute(
          "UPDATE disponibilidad SET estado = 'disponible', idCliente = NULL WHERE idDisponibilidad = ?",
          [idDisponibilidad]
        );
      } else if (canceladoPor === 'profesional') {
        await db.execute(
          "UPDATE disponibilidad SET estado = 'pendiente', idCliente = NULL WHERE idDisponibilidad = ?",
          [idDisponibilidad]
        );
      }
    }

    res.json({ 
      mensaje: "Sesión cancelada exitosamente",
      idSesion,
      canceladoPor,
      montoReembolso,
      descuentoDisponible,
      mensajeNotificacion
    });

  } catch (error) {
    console.error("Error al cancelar sesión:", error);
    res.status(500).json({ 
      error: "Error al cancelar la sesión",
      detalle: error.message 
    });
  }
});

// PUT /api/reservas/archivar/:idSesion?tipo=cliente|profesional - Ocultar sesión cancelada en listas
router.put("/reservas/archivar/:idSesion", async (req, res) => {
  const { idSesion } = req.params;
  const { tipo } = req.query;

  if (!tipo || (tipo !== "cliente" && tipo !== "profesional")) {
    return res.status(400).json({ error: "Falta o valor inválido en tipo" });
  }

  const campo = tipo === "cliente" ? "archivadaCliente" : "archivadaProfesional";

  try {
    const [resultado] = await db.execute(
      `UPDATE sesion SET ${campo} = 1 WHERE idSesion = ?`,
      [idSesion]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: "Sesión no encontrada" });
    }

    res.json({ mensaje: "Sesión archivada", idSesion, tipo });
  } catch (error) {
    console.error("Error al archivar sesión:", error);
    res.status(500).json({ error: "Error al archivar la sesión", detalle: error.message });
  }
});

module.exports = router;
