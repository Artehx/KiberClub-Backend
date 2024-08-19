const routingCliente = require('./routingCliente');
const routingGeoApi = require('./routingGeoApi');
const routingTienda = require('./routingTienda');
const routingPedido = require('./routingPedido');
const routingChat = require('./routingChats');

module.exports = function(servExpress, io){

   servExpress.use('/api/Cliente', routingCliente);

   servExpress.use('/api/GeoApi', routingGeoApi);

   servExpress.use('/api/Tienda', routingTienda);

   servExpress.use('/api/Pedido', routingPedido);

   servExpress.use('/api/Chat', routingChat(io))
}