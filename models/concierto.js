const mongoose = require('mongoose');

const conciertoSchema = new mongoose.Schema({
    artistaPrincipal: { type: mongoose.Schema.Types.ObjectId, ref: 'Artista', required: true },
    artistasSecundarios: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Artista' }],
    ubicacion: { type: String, required: true },
    direccion: {type: String, required: true},
    coordenadas: {
        latitud: { type: Number, required: false}, 
        longitud: { type: Number, required: false} 
    },
    fecha: { type: Date, required: true },
    dia: {type: String, required: false},
    hora: { type: String, required: true },
    horaFinal: {type: String, required: true},
    puertas: {type: String, required: true},
    titulo: {type: String, required: true},
    precios: [{
        tipo: { type: String, required: true },
        precio: { type: Number, required: true },
        descripcion: {type: String, required: false}
    }],
    posterBASE64: { type: String, required: false },
    artistaBASE64: { type: String, required: false },
    prioridad: { type: Number, required: true },
    alignType: { type: String, required: false}
});

module.exports = mongoose.model('Concierto', conciertoSchema, 'conciertos');
