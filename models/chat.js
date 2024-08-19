const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  concierto: { type: mongoose.Schema.Types.ObjectId, ref: 'Concierto', required: true },
  usuarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cliente', required: true }],
  mensajes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Mensaje' }]
});

module.exports = mongoose.model('Chat', chatSchema, 'chats');