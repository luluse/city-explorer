'use strict';

const express = require('express');
const app = express();

require('dotenv').config();

const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT || 3001;

app.get('/location', (request,response) => {
  try{
    console.log(request.query.city);
    let search_query = request.query.city;

    let geoData = require('./data/location.json');

    let returnTown = new Location(search_query, geoData[0]);
    console.log(returnTown);
    response.status(200).send(returnTown);
  } catch(err){
    console.log('ERROR', err);
    response.status(500).send('sorry, there is an error on location');
  }
})

function Location(searchQuery, obj){
  this.search_query = searchQuery;
  this.formatted_query = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
}

app.get('/weather', (request,response) =>{
  try{
    let weatherHeightDays = [];

    let weatherData = require('./data/weather.json');

    weatherData.data.forEach(value =>{
      let returnWeather = new Weather(value);
      weatherHeightDays.push(returnWeather);
    })
    response.status(200).send(weatherHeightDays);

  }catch(err){
    response.status(500).send('sorry, there is an error on weather');
  }
})

function Weather(obj){
  this.forecast = obj.weather.description;
  this.time = obj.valid_date;
}

app.get('*', (request, response) =>{
  response.status(404).send('sorry, this route does not exist');
})

app.listen(PORT, () =>{
  console.log(`listening on ${PORT}`);
})
