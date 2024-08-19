const mongoose = require('mongoose');

const artistaSchema = new mongoose.Schema({
    nombre: { type: String, required: true },
    generos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Genero' }],
    biografia: { type: String, required: false },
    enlacesSociales: {
        twitter: { type: String, required: false },
        instagram: { type: String, required: false },
        facebook: { type: String, required: false }
    },
    artistaBASE64: { type: String, required: false }
});

module.exports = mongoose.model('Artista', artistaSchema);