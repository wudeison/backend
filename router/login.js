const express = require("express");
const router = express.Router();
const db = require("../database");

router.post("/login", async (req, res) => {
  const { idUsuario, contrasena } = req.body;

  if (!idUsuario || !contrasena) {
    return res.status(400).json({ mensaje: "Faltan datos" });
  }

  try {
    // Buscar usuario
    const queryUsuario = "SELECT * FROM usuario WHERE idUsuario = ?";
    const [resultUsuario] = await db.query(queryUsuario, [idUsuario]);

    if (resultUsuario.length === 0) {
      return res.status(400).json({ mensaje: "El usuario no existe" });
    }

    const usuario = resultUsuario[0];

    if (usuario.contrasena !== contrasena) {
      return res.status(401).json({ mensaje: "Contraseña incorrecta" });
    }

    // Si es profesional, buscar datos adicionales en tabla profesional
    let profesionalData = null;
    if (usuario.tipoUsuario === "profesional") {
      const queryProfesional = `
        SELECT * FROM profesional WHERE idUsuario = ?
      `;
      const [resultProfesional] = await db.query(queryProfesional, [idUsuario]);
      
      if (resultProfesional.length > 0) {
        profesionalData = resultProfesional[0];
        
        // Parsear JSON
        if (profesionalData.habilidadesBlandas) {
          try {
            profesionalData.habilidadesBlandas = JSON.parse(profesionalData.habilidadesBlandas);
          } catch (e) {}
        }
        
        if (profesionalData.idiomas) {
          try {
            profesionalData.idiomas = JSON.parse(profesionalData.idiomas);
          } catch (e) {}
        }
      }
    }

    // Construir respuesta combinando datos de usuario y profesional
    const responseData = {
      idUsuario: usuario.idUsuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      tipoUsuario: usuario.tipoUsuario,
      telefono: usuario.telefono,
      ciudad: usuario.ciudad,
      direccion: usuario.direccion,
      fechaNacimiento: usuario.fechaNacimiento,
      ocupacion: usuario.ocupacion,
      fotoPerfil: usuario.fotoPerfil,
      bio: usuario.bio,
      preferencias: usuario.preferencias,
      metodoPagoPreferido: usuario.metodoPagoPreferido,
      recibeNewsletter: usuario.recibeNewsletter,
      isVerified: usuario.isVerified,
    };

    // Si es profesional, agregar TODOS los datos adicionales
    if (profesionalData) {
      responseData.idProfesional = profesionalData.idProfesional;
      responseData.tarjetaProfesional = profesionalData.tarjetaProfesional;
      responseData.nombreCompleto = profesionalData.nombreCompleto;
      responseData.profesion = profesionalData.profesion;
      responseData.experiencia = profesionalData.experiencia;
      responseData.habilidadesBlandas = profesionalData.habilidadesBlandas;
      responseData.idiomas = profesionalData.idiomas;
      responseData.avatar = profesionalData.avatar;
      // Usar fotoPerfil de profesional si existe, si no el de usuario
      if (profesionalData.fotoPerfil) {
        responseData.fotoPerfil = profesionalData.fotoPerfil;
      }
      // Usar bio de profesional si existe, si no el de usuario
      if (profesionalData.bio) {
        responseData.bio = profesionalData.bio;
      }
    }

    res.json({
      mensaje: "Inicio de sesión exitoso",
      cliente: responseData,
    });
  } catch (err) {
    console.error("Error en login:", err);
    return res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

module.exports = router;
