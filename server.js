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

// movies data

app.get('/movies', (request,response) =>{
  try{
    const movieQuery = request.query.search_query;
    const url = `https://api.themoviedb.org/3/search/movie?api_key=${process.env.MOVIES_KEY_API}&language=en-US&page=1&query=${movieQuery}&limit=20`;

    superagent.get(url).then(resultsFromSuperAgent =>{
      const data = resultsFromSuperAgent.body.results;
      console.log(data);
      const moviesResults = data.map(value => new Movies(value));
      console.log(moviesResults);
      response.status(200).send(moviesResults);
    })
  } catch(err) {
    console.log('ERROR', err);
    response.status(500).send('sorry, there is an error on movies');
  }
})

function Movies(obj){
  this.title = obj.title;
  this.overview = obj.overview;
  this.average_votes = obj.vote_average;
  this.total_votes = obj.vote_count;
  this.image_url = `https://image.tmdb.org/t/p/w500${obj.poster_path}`;
  this.popularity = obj.popularity;
  this.released_on = obj.release_date;
}

// yelp data

app.get('/yelp', (request,response) =>{
  try{
    console.log('request query', request.query);
    const url = 'https://api.yelp.com/v3/businesses/search';

    const yelpQuery = request.query.page;
    const numPerPage = 5;
    const start = (yelpQuery -1) * numPerPage;


    const queryParams = {
      latitude: request.query.latitude,
      longitude: request.query.longitude,
      start: start,
      limit: numPerPage
    }

    superagent.get(url)
      .set('Authorization', `Bearer ${process.env.RESTAURANTS_KEY_API}`)
      .query(queryParams)
      .then(resultsFromSuperAgent =>{
        const data = resultsFromSuperAgent.body.businesses;
        console.log(data);
        const yelpResults = data.map(value => new Yelp(value));
        console.log(yelpResults);
        response.status(200).send(yelpResults);
      })
  } catch(err) {
    console.log('ERROR', err);
    response.status(500).send('sorry, there is an error on restaurants');
  }
})

function Yelp(obj){
  this.name = obj.name;
  this.image_url = obj.image_url;
  this.price = obj.price;
  this.rating = obj.rating;
  this.url = obj.url;
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

