'use strict';

const express = require('express');
const app = express();
const superagent = require('superagent');
const pg = require('pg');

require('dotenv').config();

const cors = require('cors');

const PORT = process.env.PORT || 3001;
app.use(cors());

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));

// loction data
app.get('/location', (request,response) => {
  try{
    let city = request.query.city;
    console.log(city);

    let url = `https://us1.locationiq.com/v1/search.php?key=${process.env.LOCATION_KEY_API}&q=${city}&format=json`;

    let sqlQuery = 'SELECT * FROM location WHERE search_query =$1;';
    let safeValue = [city];

    client.query(sqlQuery, safeValue)
      .then(sqlResults =>{
        console.log(sqlResults);
        if (sqlResults.rowCount){
          console.log(sqlResults.rows);
          response.status(200).send(sqlResults.rows[0]);
        } else {
          superagent.get(url).then(resultsFromSuperAgent =>{
            let returnTown = new Location(city, resultsFromSuperAgent.body[0]);

            let sqlQuery = 'INSERT INTO location (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4);';
            let safeValue = [city, returnTown.formatted_query, returnTown.latitude, returnTown.longitude];

            client.query(sqlQuery, safeValue)

            console.log(returnTown);
            response.status(200).send(returnTown);
          })
        }})
  } catch(err) {
    console.log('ERROR', err);
    response.status(500).send('sorry, there is an error on location');
  }
});

function Location(searchQuery, obj){
  this.search_query = searchQuery;
  this.formatted_query = obj.display_name;
  this.latitude = obj.lat;
  this.longitude = obj.lon;
}


// weather data
app.get('/weather', (request,response) =>{
  try{
    let search_query = request.query.search_query;
    let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${search_query}&key=${process.env.WEATHER_KEY_API}&days=8`;

    superagent.get(url).then(resultsFromSuperAgent =>{
      const data = resultsFromSuperAgent.body.data;
      console.log(data);
      const weatherResults = data.map(value => new Weather(value));
      console.log(weatherResults);
      response.status(200).send(weatherResults);
    })
  } catch(err) {
    console.log('ERROR', err);
    response.status(500).send('sorry, there is an error on weather');
  }
})

function Weather(obj){
  this.forecast = obj.weather.description;
  this.time = obj.valid_date;
}

// trail data

app.get('/trails', (request,response) =>{
  try{
    const { latitude, longitude } = request.query;
    const url = `https://www.hikingproject.com/data/get-trails?lat=${latitude}&lon=${longitude}&maxDistance=10&key=${process.env.TRAILS_KEY_API}`;

    superagent.get(url).then(resultsFromSuperAgent =>{
      const data = resultsFromSuperAgent.body.trails;
      console.log(data);
      const trailsResults = data.map(value => new Trails(value));
      console.log(trailsResults);
      response.status(200).send(trailsResults);
    })
  } catch(err) {
    console.log('ERROR', err);
    response.status(500).send('sorry, there is an error on trails');
  }
})

function Trails(obj){
  this.name = obj.name;
  this.location = obj.location;
  this.length = obj.length;
  this.stars = obj.stars;
  this.star_votes = obj.starVotes;
  this.summary = obj.summary;
  this.trail_url = obj.url;
  this.conditions = obj.conditionDetails;
  this.condition_date = obj.conditionDate.slice(0,10);
  this.condition_time = obj.conditionDate.slice(11);


}

app.get('*', (request, response) =>{
  response.status(404).send('sorry, this route does not exist');
})

client.connect()
  .then(()=> {
    app.listen(PORT, () =>{
      console.log(`listening on ${PORT}`);
    })
  })

