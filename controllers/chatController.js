
var Cliente=require('../models/cliente');
var Chat = require('../models/chat');
var Mensaje = require('../models/mensaje');

 async function recuperarChatData(idChat) {

   const chat = await Chat.findById(idChat)
      .populate({
         path: 'mensajes',
         model: 'Mensaje',
         populate: {
            path: 'usuarioId',
            model: 'Cliente',
            select: 'cuenta'
         }
      })
      .populate({
         path: 'concierto',
         model: 'Concierto',
         select: 'artistaPrincipal puertas fecha titulo dia',
         populate: {
            path: 'artistaPrincipal',
            model: 'Artista',
            select: 'nombre'
       }
    });

      if (!chat) {
         console.log('Salta aqui... ')
         return res.status(404).json({ error: 'Chat no encontrado' });
      }

      chat.concierto.posterBASE64 = null;
      chat.concierto.artistaBASE64 = null;

      return chat;

   }

module.exports = {

    nuevoMensaje: async function(req, res, io) {
       try {
          console.log('Entra en nuevo mensaje...', req.body);
    
          const {usuarioId, mensaje, chatId} = req.body.datosMensaje;

          const nuevoMensaje = new Mensaje( {
            usuarioId,
            mensaje,
            chatId,
            fecha: Date.now()
          });

          await nuevoMensaje.save();

          await Chat.findByIdAndUpdate(chatId, { $push: { mensajes: nuevoMensaje._id } });

          const chat = await recuperarChatData(chatId);

          //console.log('chat en el back -> ', chat);

          res.send({ codigo: 0, chatData: chat});
       } catch (error) {
          console.error(error);
          res.status(500).send({ error: 'Ocurrió un error al procesar el mensaje' });
       }
    },

    recuperarMensajes: async function(req, res, next) {

      try {

         const {chatId} = req.body;

         //console.log('Chat id -> ', chatId);

         const chat = await recuperarChatData(chatId);

         console.log("Mensajes recuperados -> ", chat);
         res.status(200).send({ codigo: 0, chatData: chat });

         
      } catch (error) {
         
      }

    }
 }