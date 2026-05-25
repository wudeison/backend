const express = require("express");
const cors = require("cors");
const db = require("./database"); // Importa la conexión a MySQL
const app = express();

// Render asigna el puerto en process.env.PORT
// Si corres localmente, usa 4000 por defecto
const PORT = process.env.PORT || 4000;

// Routers agrupados
const loginRouter = require("./router/login");
const registroRouter = require("./router/registro");
const registroPerfilRouter = require("./router/registroperfilcliente");
const registroPerfilProfesionalRouter = require("./router/registroperfilprofesional");
const disponibilidadRouter = require("./router/disponibilidad");
const profesionalesRouter = require("./router/profesionales");
const reservasRouter = require("./router/reservas");

app.use(cors());
app.use(express.json());

// Ruta de prueba accesible por navegador (GET)
app.get("/api/test", (req, res) => {
  res.json({ mensaje: "Backend activo y accesible desde GET" });
});

// Ruta de prueba para POST (útil en frontend)
app.post("/api/test", (req, res) => {
  console.log("✅ Datos recibidos:", req.body);
  res.json({ mensaje: "Datos recibidos correctamente" });
});

// Montar routers (cada uno define rutas relativas como /login, /registro, etc.)
app.use("/api", loginRouter);
app.use("/api", registroRouter);
app.use("/api", registroPerfilRouter);
app.use("/api/registroperfilprofesional", registroPerfilProfesionalRouter);
app.use("/api", disponibilidadRouter);
app.use("/api", profesionalesRouter);
app.use("/api", reservasRouter);

// Arrancar servidor (sin IP fija)
app.listen(PORT, () => {
  console.log(`🚀 Backend activo en puerto ${PORT}`);
  console.log("📌 Conectado a MySQL (Railway)");
});
