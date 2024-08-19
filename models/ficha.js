const mongoose = require('mongoose');

const fichaSchema = new mongoose.Schema({
    clave: { type: String, required: true },
    cantidad: { type: Number, required: true },
    valido: { type: Boolean, default: true }
});

module.exports = mongoose.model('Ficha', fichaSchema, 'fichas');