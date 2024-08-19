const bcrypt = require('bcrypt');
const jsonwebtoken = require('jsonwebtoken');

var Concierto = require('../models/concierto');
var Artista = require('../models/artista');
var Genero  = require('../models/genero');
const axios = require('axios');

async function accessTokenSpotify() {
  try {
    const apiKeys = `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`;
    const urlApi = 'https://accounts.spotify.com/api/token';

    const base64Credenciales = Buffer.from(apiKeys).toString('base64');

    const response = await axios.post(urlApi, 
      'grant_type=client_credentials', 
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${base64Credenciales}`
        }
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('Error al obtener el token de acceso:', error);
  }
}


module.exports = {

 recuperarConciertos: async(req, res, next) => {

    try {
    
    console.log(`Entra en conciertos...`);

    const conciertos = await Concierto.find()
    .populate('artistaPrincipal')
    .populate('artistasSecundarios');

    console.log(`Conciertos en el back: ${conciertos} `)

        res.json(conciertos)
    } catch (error) {
        console.log('Error recuperando las categorias:', error);
        res.status(500).json({ message: 'Error recuperando conciertos' });   
    }

 },

 recuperarConcierto: async(req, res, next) => {
 
    try {

        var id = req.params.id;
        var _evento = await Concierto.findOne({_id: id})
        .populate({
            path: 'artistaPrincipal',
            populate: { path: 'generos' }
        })
        .populate({
            path: 'artistasSecundarios',
            populate: { path: 'generos' }
        });
        //console.log(`Evento recuperado ${_evento}`);

        res.status(200).send(_evento);
        

    } catch (error) {
        
        console.log(`Error al recuperar el evento ${error}`);
        res.status(500).json({ message: 'Error recuperando concierto' });   
    }

 },

 recuperarTopTracksArtista: async (req, res, next) => {
    try {
      let nombreArtista = req.params.nombreArtista;
      console.log('LLega como object? Serializo -> ', JSON.stringify(nombreArtista));
      const accessToken = await accessTokenSpotify();
      //console.log('AccessToken -> ', accessToken);
      console.log('Nombre artista cuando llega del front: ', nombreArtista);  
      //nombreArtista = 'Rojuu';
      //const encodedNombreArtista = encodeURIComponent(nombreArtista);
      //console.log('Cambia el nombre -> ', nombreArtista);
      
      const urlApi = `https://api.spotify.com/v1/search?q=${nombreArtista}&type=artist`;

      console.log('url API -> ', urlApi);
      const response = await axios.get(urlApi, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (response.status === 200 && response.data.artists.items.length > 0) {
           
        
        const idArtista = response.data.artists.items[0].id;
        //const idArtista = '60uh2KYYSCqAgJNxcU4DA0';
        console.log('Id del artista -> ', idArtista);
        //Recupero los tracks mas populares del artista
        const urlTopTracks = `https://api.spotify.com/v1/artists/${idArtista}/top-tracks?country=ES`;
        const topTracksResponse = await axios.get(urlTopTracks, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
        //const topTracks = topTracksResponse.data.tracks;
        const topTracksURIS = topTracksResponse.data.tracks.map(track => track.uri);
        console.log('URIS de los tracks -> ', topTracksURIS);
        //Devuelvo la ID del artista y los top tracks
        

        res.send({ idArtista, topTracksURIS });
      } else {
        console.log('No se encontró ningún artista con ese nombre...');
        res.status(404).json({ message: 'No se encontró ningún artista con ese nombre' });
      }
    } catch (error) {
      console.log('Error al recuperar la ID del artista y los top tracks:', error);
      res.status(500).json({ message: 'Error al recuperar la ID del artista y los top tracks' });
    }
  },

  recuperarDatosTiempo: async (req, res, next) => {
    try {
      //API: WEATHER API (TRIAL VERSION [PRO])
      const { latitud, longitud, fecha } = req.body;
      let tiempoData = {} 
      // Formatear la fecha 2022-08-3
      const newFecha = fecha.replace(/^2022/, '2023');
 
      const apiUrl = `http://api.weatherapi.com/v1/history.json?key=${process.env.WEATHER_API_KEY}&q=${latitud},${longitud}&dt=${newFecha}&lang=es`;     
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data && !data.error) {
       // Filtrar los datos para obtener solo las horas 15:00 y 22:00
       const datosFiltrados = data.forecast.forecastday[0].hour.filter(hora => {
        const horaNumerica = parseInt(hora.time.split(' ')[1].split(':')[0]); 
        // Obtener la parte de la hora en formato numérico
        return horaNumerica === 15 || horaNumerica === 22;
       });
      
        tiempoData = {
          dia: datosFiltrados[0],
          noche: datosFiltrados[1],
          localizacion: data.location
        }

        //console.log("Datos del tiempo: ", tiempoData);
        res.send({ data: tiempoData });

      } else {
          console.log('Error: No se recibieron datos válidos');
          res.status(200).send({ data: null });
      }
  } catch (error) {
      console.log('Error fatal: ', error);
      res.status(500).send({ data: null });

  }
 }
 



}