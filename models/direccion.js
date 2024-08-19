var mongoose=require('mongoose');

var direccionSchema=new mongoose.Schema(
    {
         calle: { type: String, require:[true, '*calle requerida' ] },
         cp: { type: Number, require:[true, '*cp requerido' ], match:[/^\d{5}$/, '* formato invalido cp 12345'] },
         pais: { type: String, default:'España' },
         provincia: 
                     { 
                         CPRO:{ type: String, require: true },
                         CCOM:{ type: String, require: true },
                         PRO: { type: String, require: true}
                      },
         municipio: 
                     { 
                         CPRO:{ type: String, require: true },
                         CMUM:{ type: String, require: true },
                         DMUN50:{ type: String, require: true },
                         CUN:{ type: String, require: true }
                      },
         observaciones: {type: String, require: false},
         esPrincipal: { type: Boolean, default: false },
         esFacturacion: { type: Boolean, default: false }
  }
 );

module.exports=mongoose.model('Direccion',direccionSchema,'direcciones');