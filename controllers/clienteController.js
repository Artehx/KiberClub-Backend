
const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');

var Genero=require('../models/genero');
var Cliente=require('../models/cliente');
var Direccion =require('../models/direccion');
var Descuento = require('../models/descuento');
var Ficha = require('../models/ficha');
var Concierto = require('../models/concierto');
var Chat = require('../models/chat');
var Mensaje = require('../models/mensaje');
var Rango = require('../models/rango');
var Orden = require('../models/orden');

const mongoose = require('mongoose');
const { Types: { ObjectId } } = mongoose; 
const { sendGridEmail } = require('../services/email/sendGrid');
const concierto = require('../models/concierto');

async function nuevoJWT(_cliente) {

    let _jwt=jsonwebtoken.sign(
        { nombre: _cliente.nombre, apellidos: _cliente.apellidos, email: _cliente.cuenta.email, idcliente: _cliente._id }, //<--- payload jwt
        process.env.JWT_SECRETKEY, //<---- clave secreta para firmar jwt y comprobar autenticidad...
        { expiresIn: '1h', issuer: 'http://localhost:5000' } //opciones o lista de cliams predefinidos
    );

    return _jwt;

}

async function recuperarCliente(id) {

    console.log('Id en recuperarCliente: ', id);

    let _clienteBuscado = await Cliente.findById(id)
    .populate([
        { path: 'direcciones', model: 'Direccion' },
        { path: 'gustosMusicales', model: 'Genero' },
        { path: 'descuentosGanados', model: 'Descuento' },
        { path: 'fichasRuleta', model: 'Ficha' },
        { path: 'fichasUsadas', model: 'Ficha' },
        { path: 'favoritos', model: 'Concierto', 
            populate: { 
                path: 'artistaPrincipal', 
                model: 'Artista',
                populate: { path: 'generos', model: 'Genero' } 
            }
        },
        { path: 'dominio.rango', model: 'Rango' },
        { path: 'ordenes', model: 'Orden', 
            populate: {
                path: 'concierto',
                model: 'Concierto',
                populate: { 
                    path: 'artistaPrincipal', 
                    model: 'Artista',
                    populate: { path: 'generos', model: 'Genero' } 
                }
            }
        },
        { 
            path: 'chats', 
            model: 'Chat',
            populate: [
                {
                    path: 'concierto',
                    model: 'Concierto',
                    populate: { 
                        path: 'artistaPrincipal', 
                        model: 'Artista',
                      } 
                },
                {
                    path: 'usuarios',
                    model: 'Cliente'
                },
               /*  {
                    
                    path: 'mensajes',
                    model: 'Mensaje',
                   populate: {
                        path: 'usuarioId',
                        model: 'Cliente'
                    }
                }*/
            ]
        }
        
    ]);

    if (!_clienteBuscado) {
        throw new Error('Cliente no encontrado');
      }

    _clienteBuscado.favoritos.forEach(favorito => {
        favorito.posterBASE64 = null;
        favorito.artistaBASE64 = null;
    });

    

  return _clienteBuscado;

}

module.exports ={
    recuperarCliente: recuperarCliente,
    nuevoJWT: nuevoJWT,

    registro: async(req, res, next) => {

        try {

        console.log('Datos del cliente... ', req.body);

        let {nombre, apellidos, telefono, genero, fechaNacimiento,
              email, usuario, password, gustosMusicales, direcciones} = req.body.datosCliente;

         usuario = usuario.toUpperCase();

         const usuarioExiste = await Cliente.findOne({'cuenta.usuario': usuario})
         const emailExiste = await Cliente.findOne({'cuenta.email': email});

         console.log('Usuario existe? ', usuarioExiste);
         console.log('Email existe? ', emailExiste)

         if(!usuarioExiste && !emailExiste){

            let direccionesIds = [];
            let gustosMusicalesIds = [];

            for(const dir of direcciones){
            const nuevaDir = new Direccion(dir);
            const savedDir = await nuevaDir.save();
            direccionesIds.push(savedDir._id);
            }

            for(const gus of gustosMusicales){
            const gusto = new Genero(gus);
            gustosMusicalesIds.push(gusto._id);
            }

            const rangoDefault = '662cc59bf8bdf8751e0dc171';

            _resultInsertCliente = await new Cliente({
                nombre: nombre.toUpperCase(),
                apellidos: apellidos.toUpperCase(),
                telefono: telefono,
                fechaNacimiento: fechaNacimiento,
                genero: genero,
                fechaCreacion: Date.now(),
                cuenta: {
                    email: email,
                    password: bcrypt.hashSync(password, 10),
                    cuentaActiva: false,
                    usuario: usuario.toUpperCase(),
                    imagenAvatarBASE64: ""
                },
                spinsRuleta: 0,
                descuentosUsados: 0,
                dominio: {
                 experiencia: 20,
                 nivel: 1,
                 rango: rangoDefault 
                },
                gustosMusicales: gustosMusicalesIds,
                direcciones: direccionesIds
            
            }).save();

            console.log('resultado del insert en la coleccion clientes de mongodb...', _resultInsertCliente);
          
            await sendGridEmail(email, _resultInsertCliente._id);
      
            res.status(200).send(
                    {codigo:0,
                     mensaje:'datos del cliente insertados ok' } )


         } else {

            res.status(200).send(
                {codigo:2,
                 mensaje:'El usuario o email ya estan registrados' } )

         }

     
         
            
        } catch (error) {
            console.log('error en el back en el registrio...', error);
            res.status(200).send(
                {
                    codigo:1,
                    mensaje:`error a la hora de insertar datos del cliente: ${JSON.stringify(error)}`
                }
    
            )
        }


    },

    login: async(req, res, next) => {

        try {

        console.log('Datos del cliente: ', req.body);     
        let {email, password} = req.body.datoslogin;
   
        let _cliente = await Cliente.findOne({'cuenta.email': email})
        .populate([
            { path: 'direcciones', model: 'Direccion' },
            { path: 'gustosMusicales', model: 'Genero' },
            { path: 'descuentosGanados', model: 'Descuento' },
            { path: 'fichasRuleta', model: 'Ficha' },
            { path: 'fichasUsadas', model: 'Ficha' },
            { path: 'favoritos', model: 'Concierto', 
                populate: { 
                    path: 'artistaPrincipal', 
                    model: 'Artista'
                } 
            },
            { path: 'dominio.rango', model: 'Rango' },
            { path: 'ordenes', model: 'Orden', 
            populate: {
                path: 'concierto',
                model: 'Concierto',
                populate: { 
                    path: 'artistaPrincipal', 
                    model: 'Artista',
                  }
               },
              },
              { 
                path: 'chats', 
                model: 'Chat',
                populate: [
                    {
                        path: 'concierto', model: 'Concierto',
                        populate: { 
                            path: 'artistaPrincipal', 
                            model: 'Artista',
                          } 
                    },
                    /* 
                    {
                        path: 'usuarios', model: 'Cliente', select: 'cuenta'
                    }, 
                        En lugar de hacer este populate para optimizar el cliente en la primera carga 
                        haré una peticion ajax para recuperar los mensajes y usuarios cada vez que el cliente
                        haga click en alguno de los chats
                    {
                        path: 'mensajes',
                        model: 'Mensaje',
                        populate: {
                            path: 'usuarioId', model: 'Cliente', select: 'cuenta'
                        }
                    }*/
                ]
            }            
        ]);
        if (! _cliente ) throw new Error('no existe una cuenta con ese email....');
        
        //2º comprobar q el hash de la password concuerda con la password q me mandan y su hash

        if(bcrypt.compareSync(password, _cliente.cuenta.password)){
         //3º comprobar q la cuenta esta ACTIVADA...
         if (! _cliente.cuenta.cuentaActiva) throw new Error('debes activar tu cuenta....comprueba el email'); //<----deberiamos reenviar email de activacion...

        //4º si todo ok... devolver datos del cliente con los generos y direcciones expandidos (no los _id)
                    //                 devolver token de sesion JWT    

                       //Filtramos los favoritos para omitir los campos posterBASE64 y artistaBASE64
                        //Ocupan bastante y no los vamos a necesitar para luego pintarlos en el calendario
                        // en las notas del tablero de eventos del cliente
                        _cliente.favoritos.forEach(favorito => {
                            favorito.posterBASE64 = null;
                            favorito.artistaBASE64 = null;
                        });

                        console.log("Cliente -> " , _cliente.chats);

                        _cliente.chats.forEach(element => {
                            element.concierto.posterBASE64 = null;
                            element.concierto.artistaBASE64 = null;

                        })
                        

                    let _jwt=jsonwebtoken.sign(
                        { nombre: _cliente.nombre, apellidos: _cliente.apellidos, email: _cliente.cuenta.email, idcliente: _cliente._id }, //<--- payload jwt
                        process.env.JWT_SECRETKEY, //<---- clave secreta para firmar jwt y comprobar autenticidad...
                        { expiresIn: '1h', issuer: 'http://localhost:5000' } //opciones o lista de cliams predefinidos
                    );

                    console.log("Token de sesion back", _jwt);

                    res.status(200).send(
                        {
                            codigo: 0,
                            mensaje: 'login OKS...',
                            error: '',
                            datoscliente: _cliente,
                            tokensesion: _jwt,
                            otrosdatos: null
                        }
                    );

        } else {

            throw new Error('password incorrecta....');
        }

            
        } catch (error) {
            
            console.log('error en el login....', error);
            res.status(200).send(
                {
                    codigo: 1,
                    mensaje: 'login fallido',
                    error: error.message,
                    datoscliente: null,
                    tokensesion: null,
                    otrosdatos: null
                }
            );
            
        }

    },

    recuperarGeneros: async(req, res, next) => {

        try {  
            const generos = await Genero.find();
            console.log(`Categorias en el back: ${generos}`);

            res.json(generos);
        } catch (error) {

            console.log('Error recuperando las categorias:', error);
            res.status(500).json({ message: 'Error recuperando generos' });
        }
    },

    guardarGeneros: async(req, res, next) => {
    
        try {

          let {generos} = req.body;
          let {idCliente} = req.body;
        
          console.log(`Nuevos generos del cliente: ${generos}`)
         
          generos.forEach(genero => {
            console.log(genero);
          });

          const cliente = await Cliente.findById(idCliente);

          if (!cliente) {
            return res.status(200).json({ codigo: 1 });
          }

          cliente.gustosMusicales = [];

          cliente.gustosMusicales.push(...generos);

          await cliente.save();

          res.status(200).send({
          codigo: 0,
          generos: generos
          })
          

        } catch (error) {
            console.log('Error fatal: ', error);
            res.status(500).send({ codigo: 1, 
            mensaje: 'Error al recuperar los descuentos en base a los generos.' });
        }

    },

    recuperarDescuentos: async (req, res, next) => {
  
        try {
    
        let idCliente = req.body.id;
        console.log(`Id del cliente ${idCliente}`)  
        
        const cliente = await Cliente.findById(idCliente).populate('gustosMusicales');
        const gustosCliente = cliente.gustosMusicales.map(genero => genero._id)

        //Buscamos los descuentos que coincidan con los gustos musicales del cliente
        let descuentos = await Descuento.find({idCategoria: {$in: gustosCliente}});

        //Buscamos los descuentos predefinidos que existen independientes a los gustos musicales del cliente
        let descuentosDefault = await Descuento.find({defaultPromo: true});

        descuentosDefault = descuentosDefault.filter(descuento => !descuentos.some(des => des._id.equals(descuento._id)));

        let descuentosRuleta = descuentos.concat(descuentosDefault);

        //Filtramos los descuentos para excluir los descuentos ganados por el cliente
        descuentosRuleta = descuentosRuleta.filter(descuento => !cliente.descuentosGanados.includes(descuento._id));
        
        console.log(`Descuentos de la ruleta: ${descuentosRuleta}`);
        res.status(200).send(descuentosRuleta);
    
      } catch (error) {
          console.log('Error fatal: ', error);
          res.status(500).send({ error: 'Error al recuperar los descuentos en base a los generos.' });
        }
      
    },

    recuperarFicha: async(req, res, next) => {

        try{

            let claveFicha = req.body.clave;
            let idCliente = req.body.idCliente;
            console.log(`La clave de ficha ${claveFicha} y la id del cliente ${idCliente}`);          
    
            const cliente = await Cliente.findById(idCliente)
            .populate('fichasRuleta')
            .populate('fichasUsadas');
    
    
            const claveUsada = cliente.fichasRuleta.some(ficha => ficha.clave === claveFicha) ||
            cliente.fichasUsadas.some(ficha => ficha.clave === claveFicha);
            
            //console.log('ClaveUsada -> ', claveUsada)
            if(claveUsada){
                return res.status(200).send(
                    {
                      codigo: 2,
                      mensaje: 'La ficha ya ha sido utilizada o está en uso'
                    }
                 )
            }
    
            const ficha = await Ficha.findOne({ clave: claveFicha });

            if (!ficha) {
                return res.status(200).send({ codigo: 1, mensaje: 'Clave invalida...' });
            }
    
            cliente.fichasRuleta.push(ficha);
            await cliente.save();
    
            return res.status(200).json({ codigo: 0, ficha: ficha });

        }catch(error){

            console.log('Error al recuperar la ficha: ', error);
            return res.status(500).send({mensaje: 'Error interno del servidor'})

        }
      
    },

    guardarDescuento: async(req, res, next) => {

        try {
        
            const { descuento, fichaUsada, idCliente } = req.body;

            //Eliminamos la ficha de la coleccion de fichasRuleta (fichas activas...)
            await Cliente.findByIdAndUpdate(idCliente, {
                $pull: {fichasRuleta: fichaUsada._id}
            });

            //Guardamos la ficha en fichasUsadas 
            await Cliente.findByIdAndUpdate(idCliente, {
                $push: {fichasUsadas: fichaUsada}
            });

            await Cliente.findByIdAndUpdate(idCliente, {
                $inc: { spinsRuleta: 1 }
            });

            //Y para terminar guardamos el descuento en la coleccion de descuentosGanados
            await Cliente.findByIdAndUpdate(idCliente, {
                $push: {descuentosGanados: descuento}
            });

            res.status(200).send({
             codigo: 0,
             descuento: descuento

            })
            
            
        } catch (error) {
            console.log(`Error al guardar el descuento: ${error}`);
            res.status(500).send({
                codigo: 1,
                mensaje: 'Error interno del servidor, sin cambios realizados'
            })
        }


    },

    manejadorFavoritos: async (req, res, next) => {
        try {
            let { idConcierto, idCliente, operacion } = req.body;
            console.log(`idConcierto -> ${idConcierto}`)
            console.log(`idCliente -> ${idCliente}`)
            console.log(`Operacion -> ${operacion.tipo}`)
    
            const concierto = await Concierto.findOne({ _id: idConcierto });
    
    
            if (!concierto) {
                return res.status(404).json({ codigo: 1, mensaje: 'Concierto no encontrado.' });
            }
    
            if (operacion.tipo === 'agregar') {
                await Cliente.updateOne({ _id: idCliente }, { $push: { favoritos: idConcierto } });
            } else {
                await Cliente.updateOne({ _id: idCliente }, { $pull: { favoritos: idConcierto } });
            }
    
            const cliente = await Cliente.findOne({ _id: idCliente }).populate({
                path: 'favoritos',
                populate: [
                    { path: 'artistaPrincipal', model: 'Artista' },
                    { path: 'artistaPrincipal.generos', model: 'Genero' } //Quitar...
                ]
            });
            //Desahogamos la coleccion para el cliente
            cliente.favoritos.forEach(favorito => {
                favorito.posterBASE64 = null; //Pesan un poco...
                favorito.artistaBASE64 = null;
            });
    
            console.log('Nuevos favoritos para react -> ', cliente.favoritos)
    
            res.send({
                codigo: 0,
                operacion: operacion.tipo,
                favoritos: cliente.favoritos});
                
        } catch (error) {
            console.error('Error al manejar favoritos:', error);
            res.status(500).json({ codigo: 1, mensaje: 'Error interno del servidor.' });
        }
    },

    eliminarFavorito: async (req, res, next) => {
        try {
            let { idEvento, idCliente } = req.body;
    
            await Cliente.updateOne({ _id: idCliente }, { $pull: { favoritos: idEvento } });
    
            const cliente = await Cliente.findOne({ _id: idCliente }).populate({
                path: 'favoritos',
                populate: [
                    { path: 'artistaPrincipal', model: 'Artista' },
                    { path: 'artistaPrincipal.generos', model: 'Genero' } //Quitar...
                ]
            });
    
            cliente.favoritos.forEach(favorito => {
                favorito.posterBASE64 = null;
                favorito.artistaBASE64 = null;
            });
    
            console.log('Favoritos actualizados:', cliente.favoritos);
    
            // Enviar la respuesta a React con los favoritos actualizados
            res.send({
                codigo: 0,
                favoritos: cliente.favoritos
            });
        } catch (error) {
            console.log('Error al eliminar favorito:', error);
            res.status(500).json({ codigo: 1, mensaje: 'Error interno del servidor.' });
        }
    },

    actualizarPerfil: async (req, res, next) => {
        try {
            console.log("Datos del perfil: ", req.body);
            const { datosCliente, idCliente } = req.body;
    
            
            //let _cliente = await Cliente.findById(idCliente);
            let _cliente = await recuperarCliente(idCliente);

            _cliente.nombre = datosCliente.nombre.toUpperCase();
            _cliente.apellidos = datosCliente.apellidos.toUpperCase();
            _cliente.telefono = datosCliente.telefono;
            _cliente.cuenta.usuario = datosCliente.cuenta.usuario.toUpperCase();
            _cliente.cuenta.email = datosCliente.cuenta.email;
            
            if(datosCliente.cuenta.password != ""){
            _cliente.cuenta.password = bcrypt.hashSync(datosCliente.cuenta.password, 10);
            }

            _cliente.genero = datosCliente.genero;
            _cliente.fechaNacimiento = datosCliente.fechaNacimiento;

            let _updateCliente = await _cliente.save();

            let token = nuevoJWT(_cliente);

            if(_updateCliente){

                res.status(200).send(
                    {
                        codigo: 0,
                        datoscliente: _cliente,
                        token: token
                    }
                )
                
            } else {

             res.status(400).json({ codigo: 1, mensaje: 'Error al modificar datos.' });

            }
    
            
        } catch (error) {
            console.log('Error al actualizar el perfil:', error);
            res.status(500).json({ codigo: 1, mensaje: 'Error interno del servidor.' });
        }
    },

    actualizarFoto: async(req, res, next) => {

        try {
            const { idCliente, imagen } = req.body;
            console.log('Imagen -> ', imagen);
            
            const clienteActualizado = await Cliente.findByIdAndUpdate(
                idCliente,
                { "cuenta.imagenAvatarBASE64": imagen },
                { new: true }
            );
        
            if (!clienteActualizado) {
                console.log("No se encontró el cliente");
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }
        
            //console.log("Cliente actualizado con nueva imagen:", clienteActualizado);
        
    
        
            if(clienteActualizado){

                res.status(200).send({
                    codigo: 0,
                    
                });
            } else{
                console.log('Algo salio mal...')
            }
           
          
        
        } catch (error) {
            console.log('Error al actualizar la foto:', error);
            res.status(500).json({ codigo: 1, mensaje: 'Error interno del servidor.' });
        }

       


    },

    operarDirecciones: async(req, res, next) => {
   
        //Pensandolo bien..Con mandar del cliente al back las direcciones
        // que tiene en ese momento el cliente y setear esas direcciones en
        // la coleccion y en las referencias en el cliente deberia valer
        try {
         
        const {direccion, operacion, idCliente} = req.body;

        const cliente = await Cliente.findById(idCliente);

        switch (operacion) {
            case "agregar":

               const nuevaDireccion = new Direccion(direccion);
               const direccionSave = await nuevaDireccion.save();

               cliente.direcciones.push(direccionSave._id);
               await cliente.save();
                
               break;

            case "eliminar":

                await Direccion.findByIdAndDelete(direccion._id);

                cliente.direcciones = cliente.direcciones.filter(dir => !dir.equals(direccion._id));
    
                await cliente.save();
                
                break;
            
            case "editar":
                 const { _id, ...direccionData } = direccion;
                 console.log('Llega aquí... Con dirección:', direccion);
    
                 if (!_id) { 
                  return res.status(400).json({ codigo: 1, mensaje: 'ID de la dirección no proporcionado' });
                 }
    
                 const direccionEditada = await Direccion.findOneAndUpdate(
                    { _id: _id }, 
                    { $set: direccionData },
                    { new: true }
                );
            
    
                 if (!direccionEditada) {
                  console.log('No encuentra la id...');
                  return res.status(404).json({ codigo: 1, mensaje: 'Dirección no encontrada' });
                 }
    
                 console.log('Dirección editada:', direccionEditada);
                  break;
        
            default:
                break;
        }

        const clienteDirecciones = await Cliente.findById(idCliente).populate('direcciones');
       
        res.status(200).send({
            codigo: 0,
            direcciones: clienteDirecciones.direcciones
            
        });
    
        } catch (error) {
            console.log('Error al enviar las direcciones:', error);
            res.status(500).json({ codigo: 1, mensaje: 'Error interno del servidor.' });

            
        }

    }

    
    

}