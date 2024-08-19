const mongoose = require('mongoose');

const ordenSchema = new mongoose.Schema({
    concierto: { type: mongoose.Schema.Types.ObjectId, ref: 'Concierto', required: true },
    entradas: [{
        tipo: { type: String, required: true },
        precio: { type: Number, required: true },
        descripcion: {type: String, required: false},
        idQr: {type: String, required: false},
        validado: {type: Boolean, value: false}
    }],
    gastosGestion: {type: Number, default: 4.60},
    totalOrden: {type: Number, default: 0},
    tipoPago: {type: String , default: ''},
    estadoOrden: {type: String, default: 'Pendiente'},
    paymentId: {type: String, default: ''},
    fechaCompra: {type: Date, default: ''}
    //Clave para identificar el pago para luego confirmarlo...    
});

module.exports = mongoose.model('Orden', ordenSchema, 'ordenes');