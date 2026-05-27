const mysql = require("mysql2/promise");

const db = mysql.createPool({
  uri: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificar conexión
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("📌 Conectado a MySQL (Railway)");
    connection.release();
  } catch (err) {
    console.log("❌ Error al conectar a MySQL:", err);
  }
})();

module.exports = db;