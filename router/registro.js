const express = require("express");
const router = express.Router();
const db = require("../database");

router.post("/registro", async (req, res) => {
  const { idUsuario, nombre, correo, contrasena, tipoUsuario } = req.body;

  if (!idUsuario || !nombre || !correo || !contrasena || !tipoUsuario) {
    return res.status(400).json({ mensaje: "Faltan datos obligatorios" });
  }

  const query = `
    INSERT INTO usuario (idUsuario, nombre, correo, contrasena, fechaRegistro, tipoUsuario)
    VALUES (?, ?, ?, ?, NOW(), ?)
  `;

  const values = [idUsuario, nombre, correo, contrasena, tipoUsuario];

  try {
    await db.query(query, values);
    res.json({ mensaje: "Usuario registrado correctamente" });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ mensaje: "El usuario ya existe" });
    }
    return res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

// DELETE /api/usuarios/:idUsuario - elimina al usuario y todo su perfil relacionado
router.delete("/usuarios/:idUsuario", async (req, res) => {
  const { idUsuario } = req.params;

  if (!idUsuario) {
    return res.status(400).json({ mensaje: "Falta el id del usuario" });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [usuarios] = await connection.query(
      "SELECT idUsuario FROM usuario WHERE idUsuario = ?",
      [idUsuario]
    );

    if (usuarios.length === 0) {
      await connection.rollback();
      return res.status(404).json({ mensaje: "Usuario no encontrado" });
    }

    // Eliminar pagos asociados a sesiones del usuario (como cliente o profesional)
    await connection.query(
      `DELETE p FROM pago p
       INNER JOIN sesion s ON p.idSesion = s.idSesion
       WHERE s.idUsuario = ?
          OR s.idProfesional IN (
            SELECT prof.idProfesional FROM profesional prof WHERE prof.idUsuario = ?
          )`,
      [idUsuario, idUsuario]
    );

    await connection.query("DELETE FROM usuario WHERE idUsuario = ?", [idUsuario]);

    await connection.commit();
    res.json({ mensaje: "Usuario eliminado permanentemente" });
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Error al revertir la transacción de eliminación:", rollbackError);
      }
    }
    console.error("Error al eliminar usuario:", error);
    res.status(500).json({ mensaje: "Error al eliminar el usuario", detalle: error.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
});

module.exports = router;
