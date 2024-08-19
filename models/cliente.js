
const mongoose = require('mongoose');

var clienteSchema = new mongoose.Schema(
   {
    nombre: { type: String, require:[true,'* Nombre obligatario'], maxLength:[50, '* Maxima long.en nobre de 50 caract.'] },
    apellidos: { type: String, require:[true,'* Apellidos obligatarios'], maxLength:[200, '* Maxima long.en apellidos de 200 caract.'] },
    cuenta: {
        email: { type: String, require:[true, '* Email obligatorio'], match:[ new RegExp('^\\w+([\.-]?\\w+)*@\\w+([\.-]?\\w+)*(\.\\w{2,3})+$'), '* formato incorrecto del email'] },
        password:{ type:String, require: [true,'* Password obligatoria'], match:[ /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\u0021-\u002b\u003c-\u0040])\S{8,}$/, '* En la password al menos una MAYS, MINS, NUMERO y caracter raro'] }, 
        cuentaActiva:{ type:Boolean, require:true, default: false },
        usuario:{ type: String, maxLength:[ 200, '* max.longitud del email 200 cars.'] }, 
        imagenAvatarBASE64:{type: String, default:'' }
     },
     telefono:{ type: String, require: [true,'* Telefono obligatorio'], match: [ /^\d{3}(\s?\d{2}){3}$/, '*El telefono tiene q tener formato 666 11 22 33'] },
     fechaNacimiento: {type: String, require: [true, '* Fecha de nacimiento obligatoria']},
     fechaCreacion: {type: Date, default: ''},
     genero: {type: String, require: [true, '*Genero obligatorio']},
     spinsRuleta: {type: Number, require: false},
     descuentosUsados: {type: Number, require: false},
     //Me interesa que los descuentos se puedan ganar de nuevo, por eso no creo un array
     // para guardar los usados 
     dominio: {
      experiencia: {type: Number, default: 20},
      nivel: {type: Number, default: 1},
      rango: { type: mongoose.Schema.Types.ObjectId, ref: 'Rango' }
     },
     direcciones:[
      { type: mongoose.Schema.Types.ObjectId, ref:'Direccion'}
     ],
     gustosMusicales: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Genero' }
     ],
     artistasSeguidos: [
        { type: mongoose.Schema.Types.ObjectId, ref:'Artista'}
     ],
     favoritos: [
        { type: mongoose.Schema.Types.ObjectId, ref: 'Concierto'}
     ],
     descuentosGanados: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Descuento' }
     ],
     fichasRuleta: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Ficha' }
     ],
     fichasUsadas: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Ficha'}
     ],
     ordenes: [
      {type: mongoose.Schema.Types.ObjectId, ref: 'Orden'}
     ],
     chats : [
      {type: mongoose.Schema.Types.ObjectId, ref: 'Chat'}
     ]
   }

)

module.exports = mongoose.model('Cliente', clienteSchema, 'clientes');