const db = require('./database');
const fs = require('fs');

async function crearTablaDisponibilidad() {
  try {
    const sql = fs.readFileSync(__dirname + '/disponibilidad-schema.sql', 'utf8');
    
    console.log('📋 Creando tabla disponibilidad...\n');
    await db.query(sql);
    
    console.log('✅ Tabla disponibilidad creada exitosamente');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

crearTablaDisponibilidad();
