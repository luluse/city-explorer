'use strict';

const express = require('express');
const app = express();

require('dotenv').config();

const cors = require('cors');
app.use(cors());

const PORT = process.env.PORT || 3001;

app.get('/', (request,response) => {
  console.log('hello');
  response.send('I like pizza');
})

app.listen(PORT, () =>{
  console.log(`listening on ${PORT}`);
})
