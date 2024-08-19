const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const configrouting = require('./configRoutingMAIN');

module.exports = function(servExp, io) {
    //Configuración de multer para manejar la carga de archivos
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            cb(null, path.join(__dirname, '../pdfs')); 
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, 'pdf_' + req.body.paymentId + '_' + uniqueSuffix + path.extname(file.originalname));
        }
    });
    const upload = multer({ storage: storage });

    //Configuración de middlewares
    servExp.use(cors());
    servExp.use(cookieParser());
    servExp.use(bodyParser.json({ limit: '50mb' }));
    servExp.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

    //Socket.io
    io.on("connection", (socket) => {
        console.log(`Usuario conectado: ${socket.id}`);

        socket.on('disconnect', () => {
            console.log(`Usuario desconectado: ${socket.id}`);
        });

        socket.on('joinChat', (chatId) => {
            socket.join(chatId);
        });

        socket.on('send_message', (data) => {
            socket.broadcast.emit("receive_message", data)
            //console.log(data);

        });

        
    });

    // Enrutamiento y otras configuraciones
    configrouting(servExp, io);
};