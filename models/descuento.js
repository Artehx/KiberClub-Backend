const mongoose = require('mongoose');

var descuentoSchema = new mongoose.Schema(
   {
    titulo: { type: String, required: true },
    idCategoria: { type: mongoose.Schema.Types.ObjectId, required: true },
    valido: { type: Boolean, default: true },
    expiracion: { type: Date },
    defaultPromo: { type: Boolean, default: false },
    descuento: { type: Number, required: true },
    porcentaje: {type: String, required: true}
   }
)

module.exports = mongoose.model('Descuento', descuentoSchema, 'descuentos');