const db = require('./database');

async function fixConstraint() {
  try {
    // 1. Ver el schema actual
    console.log('📋 Verificando estructura de la tabla profesional...\n');
    const [schema] = await db.query('SHOW CREATE TABLE profesional');
    console.log('Schema actual:');
    console.log(schema[0]['Create Table']);
    console.log('\n');

    // 2. Eliminar registros duplicados actuales
    console.log('🗑️ Limpiando registros del usuario 12345...');
    await db.query('DELETE FROM profesional WHERE idUsuario = ?', ['12345']);
    console.log('✅ Limpiado\n');

    // 3. Verificar si existe el constraint UNIQUE
    const [indexes] = await db.query('SHOW INDEX FROM profesional WHERE Column_name = "idUsuario"');
    console.log('Índices en columna idUsuario:', indexes);
    
    if (indexes.length === 0 || !indexes.some(idx => idx.Non_unique === 0)) {
      console.log('\n⚠️ NO existe UNIQUE constraint en idUsuario. Creándolo...');
      await db.query('ALTER TABLE profesional ADD UNIQUE KEY (idUsuario)');
      console.log('✅ UNIQUE constraint creado');
    } else {
      console.log('\n✅ UNIQUE constraint ya existe');
    }

    console.log('\n✅ Listo. Ahora el UPSERT debería funcionar correctamente.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixConstraint();
