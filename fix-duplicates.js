const db = require('./database');

async function fixDuplicates() {
  try {
    // 1. Ver registros duplicados
    console.log('📋 Consultando registros para idUsuario = 12345...\n');
    const [rows] = await db.query(
      'SELECT idProfesional, idUsuario, profesion FROM profesional WHERE idUsuario = ?',
      ['12345']
    );
    
    console.log('Registros encontrados:', rows);
    console.log('Total:', rows.length, '\n');

    // 2. Eliminar todos los registros
    console.log('🗑️ Eliminando registros duplicados...');
    const [deleteResult] = await db.query(
      'DELETE FROM profesional WHERE idUsuario = ?',
      ['12345']
    );
    console.log('✅ Eliminados:', deleteResult.affectedRows, 'registros\n');

    // 3. Verificar que se eliminaron
    const [check] = await db.query(
      'SELECT COUNT(*) as total FROM profesional WHERE idUsuario = ?',
      ['12345']
    );
    console.log('✅ Verificación - Registros restantes:', check[0].total);
    
    console.log('\n✅ Ahora puedes guardar el formulario y debería actualizar correctamente.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDuplicates();
