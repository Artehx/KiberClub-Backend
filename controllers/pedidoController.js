const mongoose = require('mongoose');
const clienteController = require('../controllers/clienteController');
const Orden = require("../models/orden");
const Cliente = require("../models/cliente");
const Ficha = require("../models/ficha");
const Chat = require("../models/chat");
const Rango = require("../models/rango");
const qr = require('qrcode');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2022-08-01",
  });

  function encrypt(qrCode) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.QR_SECRET_ENCRYPT_KEY), iv);
    let encrypted = cipher.update(qrCode, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
    };

    function decrypt (qrCode) {
      const decipher = crypto.createDecipheriv('aes-256-cbc', process.env.QR_SECRET_ENCRYPT_KEY, Buffer.alloc(16));
      let decrypted = decipher.update(qrCode, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
  };

  
  async function findTicketByEncryptedId(encryptedId) {
      const orden = await Orden.findOne({ 'entradas.idQr': encryptedId });
      if (orden) {
          const ticket = orden.entradas.find(entrada => entrada.idQr === encryptedId);
          return { orden, ticket };
      }
      return null;
  };

module.exports = {

    
    configStripe: async(req, res, next) => {

        try {
         res.send({
            publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
         })
            
        } catch (error) {
          console.log('Error al configurar Stripe: ', error);
          res.status(500).json({ codigo: 1, mensaje: 'Error interno del servidor.' });
        }
    },

    paymentIntent: async (req, res, next) => {

        try {

            const { totalPago } = req.body;
            const { email } = req.body;
            console.log('Total pago no finalizado: ', totalPago);

            const amount = Math.round(totalPago * 100);
            
            const paymentIntent = await stripe.paymentIntents.create({
              currency: "EUR",
              amount: amount,
              description: "Pago en ⚡KiberClub⚡",
              automatic_payment_methods: { enabled: true },
              receipt_email: email
            });
        
            res.send({
            clientSecret: paymentIntent.client_secret,
            });
          } catch (e) {
            return res.status(400).send({
              error: {
                message: e.message,
              },
            });
          }
    },

    nuevaOrden: async (req, res, next) => {

      try {

        const { entradas } = req.body;
        const { idConcierto } = req.body;
        const { paymentId } = req.body;
        const { totalPago } = req.body;

        //console.log('**********************')
        //console.log('Entradas -> ', entradas);
        //console.log('Concierto -> ', idConcierto);
        //console.log('PaymentId (secretKey) -> ', paymentId);
        console.log('Entradas en nuevaOrden -> ', entradas);

        const ordenEntradas = entradas.map(ticket => ({
          
          tipo: ticket.entrada.tipo,
          precio: ticket.entrada.precio,
          descripcion: ticket.entrada.descripcion,
          idQr: ticket.entrada.id 
        }));

        console.log('OrdenEntradas -> ', ordenEntradas);

        const orden = new Orden({
          concierto: idConcierto,
          entradas: ordenEntradas,
          tipoPago: 'Tarjeta', 
          totalOrden: totalPago,
          paymentId: paymentId,

          
        });

        await orden.save();
 

        res.status(200).send({codigo: 0, mensaje: 'Orden insertado con exito!'})

        
      } catch (error) {
        console.log('Error al crear una nueva orden: ', error);
        res.status(500).json({ codigo: 1, mensaje: 'Error interno del servidor.' });
      }

    },

    forzarSesionConPago: async (req, res, next) => {

     try {
      //Agregar a la coleccion de ese cliente el orden ya creado y confirmar ese orden
      // de 'Pendiente' a 'Pagado'... Y luego devolver todo el cliente con todos los cambios

      const { paymentId, clientId, descuentoId } = req.body;
      const pdfFile = new Blob([req.file.buffer], {type: 'application/pdf'});

      console.log('req.body -> ', req.body);
      console.log('PdfFile -> ', pdfFile)
      const pdfFileName = 'pdf_' + paymentId + '.pdf'; 
      const pdfFilePath = path.join(__dirname, '../pdfs', pdfFileName); 
      fs.writeFileSync(pdfFilePath, req.file.buffer);      
    
     
      
      if (descuentoId !== "0") {
      
      await Cliente.findByIdAndUpdate(
            clientId,
            { 
                $pull: { descuentosGanados: descuentoId }, 
                $inc: { descuentosUsados: 1 } 
            }, 
            { new: true } 
        );
      }

      await Orden.findOneAndUpdate(
        { paymentId: paymentId },
        { estadoOrden: 'Pagada',
          fechaCompra: Date.now(),}
      );

      const orden = await Orden.findOne({ paymentId: paymentId });
      
      console.log('Hasta aqui no casca...')
      console.log('PaymentId -> ', paymentId);
      
      await Cliente.findByIdAndUpdate(
        clientId,
        { $push: { ordenes: orden._id } }, 
        { new: true } 
      );
   
      //NIVELES, RANGO Y EXPERIENCIA DEL USUARIO

      const cliente = await Cliente.findById(clientId);

      //Con cada compra la experiencia sube un 40% mas 
      let experiencia = cliente.dominio.experiencia + 40;
      let nuevoNivel = cliente.dominio.nivel;
  
      //Si el usuario tiene 100 de experiencia se sube de nivel
      while (experiencia >= 100) {
        experiencia -= 100;
        nuevoNivel += 1;
      }

      const rango = await Rango.findOne({ nivel: nuevoNivel });

      //APARTADO DEL CHAT

      // Obtener el concierto asociado al paymentId
      let ordenChat = await Orden.findOne({ paymentId: paymentId }).populate('concierto');
      
      if (!ordenChat) {
       return res.status(404).json({ codigo: 1, mensaje: 'Orden no encontrada' });
      }
       
       // Verificar si ya existe un chat para este concierto
       let chat = await Chat.findOne({ concierto: ordenChat.concierto._id }).populate('usuarios');
       if (!chat) {
        // Si no existe, crear un nuevo chat
        chat = await new Chat({ concierto: ordenChat.concierto }).save();
       }
       
       //Verificamos si el cliente ya está en el chat
       if (!chat.usuarios.includes(clientId)) {
        //Si no está se agrega
        chat.usuarios.push(clientId);
        await chat.save();
       }

       // Actualizar la lista de chats del cliente
       await Cliente.findByIdAndUpdate(
           req.body.clientId,
           { $addToSet: { chats: chat._id } }, 
           { new: true }
        );


      //NUEVA FICHA POR HACER UN PEDIDO/ORDEN

      const nuevaFicha = new Ficha({
        clave: `ficha_${paymentId}`,
        cantidad: 1, 
        valido: true
      });
  
      const fichaGuardada = await nuevaFicha.save();
  
      await Cliente.findByIdAndUpdate(
        clientId,
        {
          $set: {
            'dominio.experiencia': experiencia,
            'dominio.nivel': nuevoNivel,
            'dominio.rango': rango._id 
          },
          $push: { fichasRuleta: fichaGuardada._id }
        },
        { new: true }
      );
  

      console.log('clientId -> ', clientId);

      let clienteAdevolver = await clienteController.recuperarCliente(clientId);
      let nuevoJWT = await clienteController.nuevoJWT(clienteAdevolver);



      res.status(200).send({codigo: 0, datoscliente: clienteAdevolver, tokensesion: nuevoJWT, mensaje: 'Todo bieen..'});

      
     } catch (error) {
        console.log('Error al forzar la sesion: ', error);
        res.status(500).json({ codigo: 1, mensaje: 'Error interno del servidor.' });
     }


    },

    nuevoQR: async (req, res, next) => {

     const {ticket} = req.body;
     
     //console.log('entrada data -> ', req.body);

     //console.log('Id de entrada: ', ticket.entrada.id)
     
     try {

      //const qrCodeDataUrl = await qr.toDataURL(ticket.entrada.id);
      //res.send({  qr: qrCodeDataUrl });

      const encryptedId = encrypt(ticket.entrada.id.toString());
      console.log('Id encriptado -> ', encryptedId);
      const qrCodeDataUrl = await qr.toDataURL(encryptedId);
      res.send({ qr: qrCodeDataUrl });

     } catch (error) {
        console.log('Error al crear el QR: ', error);
        res.status(500).json({ codigo: 1, mensaje: 'Error interno del servidor.' });
     }

    },

    verificarQR: async (req, res, next) => {
    //Endpoint ficticio...
    //Una pistola de escaneo mandaria una peticion post al servidor
    // concatenando la url junto al qr encriptado
    // y entrando a este endpoint para verificar el qr
    // desencriptando y validando la entrada
    
    const { qrData } = req.body;

      try {
          const decryptedId = decrypt(qrData);
          const result = await findTicketByEncryptedId(qrData);

          if (result && result.ticket) {
              const { orden, ticket } = result;

              //Verificamos si ya esta validado
              if (ticket.validado) {
                  return res.status(400).json({ codigo: 3, mensaje: 'Entrada ya validada' });
              }

              //Actualizamos el ticket para marcarlo como validado
              ticket.validado = true;

              //Guardamos la orden actualizada en la base de datos
              await orden.save();

              res.send({ codigo: 0, mensaje: 'Entrada válida', ticket });
          } else {
              res.status(400).json({ codigo: 2, mensaje: 'Entrada no válida' });
          }
      } catch (error) {
          console.log('Error al verificar el QR: ', error);
          res.status(500).json({ codigo: 1, mensaje: 'Error interno del servidor.' });
      }



    },

    recuperarPDF: async (req, res, next) => {

      const {paymentId} = req.body;

      console.log('Id del pago a devolver -> ', paymentId);
      try {

      const filePath = path.join(__dirname, '..', 'pdfs', `pdf_${paymentId}.pdf`);
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=pdf_${paymentId}.pdf`);
        res.sendFile(filePath, err => {
            if (err) {
                console.log('Error al enviar el archivo PDF: ', err);
                res.status(500).send('Error al enviar el archivo PDF');
            }
        });
    } else {
        res.status(404).send('Archivo PDF no encontrado');
    }
        
      } catch (error) {
        console.log('Error al buscar el PDF: ', error);
        res.status(500).json({ codigo: 1, mensaje: 'Error interno del servidor.' });
      }

    },

    compartirOrden: async(req, res, next) => {

      try {
        console.log('Id de la orden -> ', req.body);
        const { idOrden, user } = req.body;
        console.log('llega aqui')
        const cliente = await Cliente.findOne({ 'cuenta.usuario': user.toUpperCase() });

        if (!cliente) {
            return res.status(404).json({ mensaje: 'Usuario no encontrado' });
        }

        cliente.ordenes.push(idOrden);
        await cliente.save();

        res.status(200).send({codigo: 0, mensaje: '¡Orden compartida!'});
    } catch (error) {
        console.log('Error al compartir la orden:', error);
        res.status(500).send({codigo: 1, mensaje: 'Error al compartir la orden', error });
    }

    }
  

}