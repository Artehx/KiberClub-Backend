const express = require('express');
let router = express.Router();

const geoApiController = require("../controllers/geoApiController")

router.get('/ObtenerProvincias', geoApiController.obtenerProvincias);
router.get('/ObtenerMunicipios/:codpro', geoApiController.obtenerMunicipios);

module.exports=router;