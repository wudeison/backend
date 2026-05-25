const mysql = require("mysql2/promise");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "tarrao",        // la contraseña de mi MySQL
  database: "boost",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Verificar conexión
(async () => {
  try {
    const connection = await db.getConnection();
    console.log("📌 Conectado a MySQL (BD: boost)");
    connection.release();
  } catch (err) {
    console.log("❌ Error al conectar a MySQL:", err);
  }
})();

module.exports = db;
