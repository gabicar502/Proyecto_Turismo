const UsuarioService = require('./UsuarioService');

async function probar() {
  const servicio = new UsuarioService();

  try {
    console.log('----- CREAR USUARIO -----');
    const nuevoUsuario = await servicio.crearUsuario('NNprueba', 'NNN@email.com', '12345');
    console.log('Usuario creado:', nuevoUsuario);

    console.log('\n----- LISTAR USUARIOS -----');
    const usuarios = await servicio.listarUsuarios();
    console.log('Usuarios:', usuarios);

    console.log('\n----- ACTUALIZAR USUARIO -----');
    const usuarioActualizado = await servicio.actualizarUsuario(
      nuevoUsuario.id_usuario,
      'pruebaActualizada',
      'pruebaActualizada@email.com',
      '98765'
    );
    console.log('Usuario actualizado:', usuarioActualizado);

    console.log('\n----- ELIMINAR USUARIO -----');
    const usuarioEliminado = await servicio.eliminarUsuario(nuevoUsuario.id_usuario);
    console.log('Usuario eliminado:', usuarioEliminado);
    
    console.log('\n✅ Todo funcionó correctamente.');
  } catch (error) {
    console.error('❌ Ocurrió un error:', error);
  }
}

probar();
