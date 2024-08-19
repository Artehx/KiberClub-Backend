
const express = require('express');
const router = express.Router();

const tiendaController = require('../controllers/tiendaController');

router.get('/RecuperarConciertos', tiendaController.recuperarConciertos);
router.get('/RecuperarConcierto/:id', tiendaController.recuperarConcierto);
router.get('/RecuperarTracksArtista/:nombreArtista', tiendaController.recuperarTopTracksArtista);
router.post('/RecuperarTiempo', tiendaController.recuperarDatosTiempo);


module.exports = router;