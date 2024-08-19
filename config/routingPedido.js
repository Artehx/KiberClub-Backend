
const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer(); 

const pedidoController = require('../controllers/pedidoController');

router.get('/configStripe', pedidoController.configStripe);
router.post('/create-payment-intent', pedidoController.paymentIntent);
router.post('/nuevaOrden', pedidoController.nuevaOrden);
router.post('/forzarSesionConPago', upload.single("pdfBlob"), pedidoController.forzarSesionConPago);
router.post('/nuevoQR', pedidoController.nuevoQR);
router.post('/recuperarPDF', pedidoController.recuperarPDF);
router.post('/verificarQR', pedidoController.verificarQR);
router.post('/compartirOrden', pedidoController.compartirOrden);

module.exports = router;