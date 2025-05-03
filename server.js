const express = require('express');
const cors = require('cors');
const UsuarioService = require('./UsuarioService');
const OntologiaService = require('./OntologiaService');

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const usuarioService = new UsuarioService();
const ontologiaService = new OntologiaService();

app.use(cors());
app.use(express.json());

// 📘 Configuración Swagger
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Turismo API',
      version: '1.0.0',
      description: 'API para gestionar usuarios y consultar la ontología de Turismo',
    },
    servers: [{ url: 'http://localhost:3001' }],
  },
  apis: ['./server.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * components:
 *   schemas:
 *     Usuario:
 *       type: object
 *       properties:
 *         id_usuario:
 *           type: integer
 *         nombre_usuario:
 *           type: string
 *         correo:
 *           type: string
 *         contraseña:
 *           type: string
 */

///////////////////////// USUARIOS /////////////////////////

/**
 * @swagger
 * /usuarios:
 *   post:
 *     summary: Crear un nuevo usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Usuario'
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 */
app.post('/usuarios', async (req, res) => {
  try {
    const { nombre_usuario, correo, contraseña } = req.body;
    const nuevoUsuario = await usuarioService.crearUsuario(nombre_usuario, correo, contraseña);
    res.status(201).json(nuevoUsuario);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /usuarios:
 *   get:
 *     summary: Listar todos los usuarios
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
app.get('/usuarios', async (req, res) => {
  try {
    const usuarios = await usuarioService.listarUsuarios();
    res.json(usuarios);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /usuarios/{id}:
 *   put:
 *     summary: Actualizar un usuario por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Usuario'
 *     responses:
 *       200:
 *         description: Usuario actualizado
 */
app.put('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_usuario, correo, contraseña } = req.body;
    const usuarioActualizado = await usuarioService.actualizarUsuario(id, nombre_usuario, correo, contraseña);
    res.json(usuarioActualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /usuarios/{id}:
 *   delete:
 *     summary: Eliminar un usuario por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuario eliminado
 */
app.delete('/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioEliminado = await usuarioService.eliminarUsuario(id);
    res.json(usuarioEliminado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

///////////////////////// ONTOLOGÍA /////////////////////////

/**
 * @swagger
 * /alojamientos:
 *   get:
 *     summary: Consultar alojamientos de la ontología
 *     responses:
 *       200:
 *         description: Lista de alojamientos
 */
app.get('/alojamientos', async (req, res) => {
  try {
    const alojamientos = await ontologiaService.consultarAlojamientos();
    res.json(alojamientos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /categorias:
 *   get:
 *     summary: Consultar categorías principales de la ontología
 *     responses:
 *       200:
 *         description: Lista de categorías principales (clases raíz)
 */
app.get('/categorias', async (req, res) => {
  try {
    const categorias = await ontologiaService.consultarCategoriasPrincipales();
    res.json(categorias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /ofertas-destacadas:
 *   get:
 *     summary: Consultar ofertas con valoración mayor a 4.5
 *     responses:
 *       200:
 *         description: Lista de ofertas destacadas
 */
app.get('/ofertas-destacadas', async (req, res) => {
  try {
    const resultados = await ontologiaService.consultarOfertasDestacadas();

    const ofertas = resultados.map(item => ({
      nombre: item.nombre?.value || '',
      direccion: item.direccion?.value || '',
      valoracion: item.valoracion?.value || '',
      tipo: item.type?.value || ''
    }));

    res.json(ofertas);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /subcategorias/{categoria}:
 *   get:
 *     summary: Consultar subcategorías de una categoría específica
 *     parameters:
 *       - in: path
 *         name: categoria
 *         required: true
 *         schema:
 *           type: string
 *         description: "Nombre de la categoría (ej: Alojamiento)"
 *     responses:
 *       200:
 *         description: Lista de subcategorías relacionadas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   nombre:
 *                     type: string
 */
app.get('/subcategorias/:categoria', async (req, res) => {
  try {
    const categoria = req.params.categoria;
    if (!categoria) return res.status(400).json({ error: "Categoría no proporcionada" });

    const resultados = await ontologiaService.consultarSubcategoriasDeCategoria(categoria);
    const subcategorias = resultados.map(item => ({
      nombre: item.nombre?.value || ''
    }));

    res.json(subcategorias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /instancias/{categoria}:
 *   get:
 *     summary: Consultar instancias y propiedades de una categoría
 *     parameters:
 *       - in: path
 *         name: categoria
 *         required: true
 *         schema:
 *           type: string
 *         description: "Nombre de la categoría (ej: Campamento)"
 *     responses:
 *       200:
 *         description: Lista de instancias con sus propiedades
 */
app.get('/instancias/:categoria', async (req, res) => {
  try {
    const categoria = req.params.categoria;
    const resultados = await ontologiaService.consultarInstanciasDeCategoria(categoria);
    const instancias = resultados.map(item => ({
      instancia: item.Instancia?.value || '',
      propiedad: item.Propiedad?.value || '',
      detalle: item.Detalles?.value || ''
    }));
    res.json(instancias);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /buscar:
 *   get:
 *     summary: Buscar instancias en la ontología por texto libre
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: "Texto de búsqueda (ej: hotel, parque, 4.5, etc.)"
 *       - in: query
 *         name: offset
 *         required: false
 *         schema:
 *           type: integer
 *         description: "Número de resultados a omitir (paginación)"
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 */
app.get('/buscar', async (req, res) => {
  try {
    const q = req.query.q;
    const offset = isNaN(parseInt(req.query.offset)) ? 0 : parseInt(req.query.offset);

    if (!q) {
      return res.status(400).json({ error: 'El parámetro q es obligatorio' });
    }

    const resultados = await ontologiaService.buscarInstanciasPorTexto(q, offset);

    const instancias = resultados.map(item => ({
      nombre: item.nombre?.value || '',
      direccion: item.direccion?.value || '',
      valoracion: item.valoracion?.value || '',
      tipo: item.type?.value || ''
    }));

    res.json(instancias);
  } catch (error) {
    console.error('Error en /buscar:', error.message);
    res.status(500).json({ error: error.message });
  }
});
///////////////////////// INICIAR SERVIDOR /////////////////////////

app.listen(3001, '0.0.0.0', () => {
  console.log('✅ Servidor API corriendo en puerto 3001');
  console.log('📚 Documentación Swagger disponible en http://localhost:3001/api-docs');
});