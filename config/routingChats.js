
const express = require('express');
const router = express.Router();

const chatController = require('../controllers/chatController');


module.exports = function(io) {
 
    router.post('/nuevoMensaje', (req, res) => chatController.nuevoMensaje(req, res, io));
    router.post('/recuperarMensajes', chatController.recuperarMensajes);
 
    return router;
};