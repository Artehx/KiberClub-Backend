const mongoose = require('mongoose');

const mensajeSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true },
  mensaje: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true }
});

module.exports = mongoose.model('Mensaje', mensajeSchema, 'mensajes');

