const axios=require('axios');

module.exports={
    obtenerProvincias: async (req,res,next)=>{
        try {
            let _resp=await axios.get(`https://apiv1.geoapi.es/provincias?type=JSON&key=${process.env.GEOAPI_KEY}&sandbox=0`);
            
            console.log("Datos de provincias: ", _resp);
           
            res.status(200).send(
                {
                    codigo: 0,
                    mensaje: 'provincas recuperadas desde GeoApi OKS...',
                    error: null,
                    datoscliente: null,
                    tokensesion: null,
                    otrosdatos: JSON.stringify(_resp.data.data)
                }

            )


        } catch (error) {
            console.log('error al recuperar provincias desde GeoApi...', error);
            res.status(301).send(
                {
                    codigo: 1,
                    mensaje: 'error al recuperar provincas desde GeoApi',
                    error: error.message,
                    datoscliente: null,
                    tokensesion: null,
                    otrosdatos: null
                }
            );
        }
    },
    obtenerMunicipios: async (req,res,next)=>{
        try {
            let _resp=await axios.get(`https://apiv1.geoapi.es/municipios?CPRO=${req.params.codpro}&type=JSON&key=${process.env.GEOAPI_KEY}&sandbox=0`);
           
            console.log("Respuesta municipios (back): ", _resp);
           
            res.status(200).send(
                {
                    codigo: 0,
                    mensaje: 'municipios recuperadas desde GeoApi OKS...',
                    error: null,
                    datoscliente: null,
                    tokensesion: null,
                    otrosdatos: JSON.stringify(_resp.data.data)
                }

            )


        } catch (error) {
            console.log('error al recuperar municipios desde GeoApi...', error);
            res.status(301).send(
                {
                    codigo: 1,
                    mensaje: 'error al recuperar municipios desde GeoApi',
                    error: error.message,
                    datoscliente: null,
                    tokensesion: null,
                    otrosdatos: null
                }
            );
        }
    }
} 