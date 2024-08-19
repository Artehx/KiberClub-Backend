
const express = require('express');
const router = express.Router();

const clienteController = require('../controllers/clienteController');

router.post('/Registro', clienteController.registro);
router.post('/Login', clienteController.login);
router.get('/RecuperarGeneros', clienteController.recuperarGeneros);
router.post('/RecuperarDescuentos', clienteController.recuperarDescuentos);
router.post('/RecuperarFicha', clienteController.recuperarFicha);
router.post('/GuardarDescuento', clienteController.guardarDescuento);
router.post('/ManejarFavoritos', clienteController.manejadorFavoritos);
router.delete('/EliminarFavorito', clienteController.eliminarFavorito);
router.post('/GuardarGeneros', clienteController.guardarGeneros);
router.post('/ActualizarPerfil', clienteController.actualizarPerfil);
router.post('/ActualizarFoto', clienteController.actualizarFoto);
router.post('/OperarDirecciones', clienteController.operarDirecciones);

module.exports = router;