'use strict'
// Application Dependencies
const express = require('express');
const pg = require('pg');
const methodOverride = require('method-override');
const superagent = require('superagent');
const cors = require('cors');
const send = require('send');
const { response } = require('express');

// Environment variables
require('dotenv').config();

// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;

// Express middleware
// Utilize ExpressJS functionality to parse the body of the request
app.use(express.urlencoded({ extended: true }));
// Specify a directory for static resources
app.use(express.static('./public'));
// define our method-override reference
app.use(methodOverride('_method'));
// Set the view engine for server-side templating
app.set('view engine', 'ejs')
    // Use app cors
app.use(cors());
// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
// app routes here
// -- WRITE YOUR ROUTES HERE --
app.get('/', homeHandler);
app.post('/favorite-quotes', saveCharacter);
app.get('/favorite-quotes', favoriteQuotesHandler);
app.get('/favorite-quotes/:quote_id', detailsHandler);
app.put('/favorite-quotes/:quote_id', updataHandler)
app.delete('/favorite-quotes/:quote_id', deleteHandler)
    // callback functions
function homeHandler(request, response) {
    let url = `https://thesimpsonsquoteapi.glitch.me/quotes?count=10`;
    superagent.get(url).set('User-Agent', '1.0').then(responseURL => {
        responseURL.body.forEach(element => {
            let quote = element.quote;
            let character = element.character;
            let image = element.image;
            let characterDirection = element.characterDirection;
            let newSimpsons = new Simpsons(quote, character, image, characterDirection);
        })
        response.render('index', { all_Simpsons: allSimpsons.slice(0, 40) });
        // response.send(allSimpsons)
    })
}

function saveCharacter(request, response) {
    let SQL = `INSERT INTO characters(quote, character, image, characterDirection)
    VALUES($1,$2,$3,$4);`
    let values = [request.body.saveCharacter[0], request.body.saveCharacter[1], request.body.saveCharacter[2], request.body.saveCharacter[3]];
    client.query(SQL, values).then(insertResponse => {
        response.redirect('/favorite-quotes');
    })
}

function favoriteQuotesHandler(request, response) {
    let SQL = `SELECT * FROM characters;`;
    client.query(SQL).then(dataBaseResponse => {
        let dataBaseSaved = dataBaseResponse.rows;
        response.render('favorCharacter', { allSaved: dataBaseSaved })
    })
}

function detailsHandler(request, response) {
    let characherID = request.params.quote_id;
    let SQL = `SELECT * FROM characters WHERE id=$1;`;
    let values = [characherID];
    client.query(SQL, values).then(element => {
        response.render('details', { charachter: element.rows[0] })
    })
}

function updataHandler(request, response) {
    let id = request.params.quote_id;
    let updataData = request.body.updata;
    let SQL = `UPDATE characters SET quote=$2 WHERE id=$1;`;
    let values = [id, updataData];
    client.query(SQL, values).then(updataResponse => {
        response.redirect(`/favorite-quotes/${id}`)
    })
}

function deleteHandler(request, response) {
    let id = request.params.quote_id;
    let updataData = request.body.delete;
    let SQL = `DELETE FROM characters WHERE id=$1;`;
    let values = [id];
    client.query(SQL, values).then(deleteResponse => {
        response.redirect(`/favorite-quotes`)
    })
}
// -- WRITE YOUR CALLBACK FUNCTIONS FOR THE ROUTES HERE --

// helper functions
const allSimpsons = [];

function Simpsons(quote, character, image, characterDirection) {
    this.quote = quote;
    this.character = character;
    this.image = image;
    this.characterDirection = characterDirection;
    allSimpsons.push(this);
}
// app start point
client.connect().then(() =>
    app.listen(PORT, () => console.log(`Listening on port: ${PORT}`))
);