const mongoose = require('mongoose');

const rangoSchema = new mongoose.Schema({

     nombre: {type: String, required: true},
     estiloIcono: {type: String, required: true},
     descripcion: { type: String },
     nivel: {type: Number, required: true}

});

module.exports = mongoose.model('Rango', rangoSchema);
