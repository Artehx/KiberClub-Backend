require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const configServer = require('./config/configPipeline'); 

const serverExpress = express();

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(serverExpress);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Configuración del servidor Express
configServer(serverExpress, io);

// Iniciar el servidor
server.listen(5000, () => console.log('...servidor web express escuchando por puerto 5000...'));

// Conexión a MongoDB
mongoose.connect(process.env.CONNECTION_MONGODB)
    .then(() => console.log('...conexion al servidor de BD mongo establecido de forma correcta....'))
    .catch((err) => console.log('fallo al conectarnos al servidor de bd de mongo:', err));