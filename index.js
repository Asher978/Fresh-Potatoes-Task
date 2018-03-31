const sqlite3 = require('sqlite3'),
      Sequelize = require('sequelize'),
      request = require('request'),
      express = require('express'),
      app = express(),
      url = require('url'),
      http = require('http'),
      db = new sqlite3.Database("./db/database.db");

const { PORT=3000, NODE_ENV='development', DB_PATH='./db/database.db' } = process.env;

// response to requests with error codes
function sendError(key, code, response) {
  response.statusCode = code;
  response.setHeader('Content-Type', 'application/json');
  let error = {};
  switch (code) {
    case 404:
    error = { message: "key missing" };
    break;
    case 422:
    error = { message: "key missing" };
    break;
  };
  response.end( JSON.stringify(error) );
};

// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .catch((err) => { if (NODE_ENV === 'development') console.error(err.stack); });

// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations);

// Handler for bad routes
app.get('*', function(req, res) {
  sendError('route', 404, res);
});

// ROUTE HANDLER
function getFilmRecommendations(request, response) {

  // params validation
  let filmId = request.params.id;
  if ( isNaN(parseInt(filmId)) ) {
    sendError('id', 422, response);
  }

  // query validations
  let parsedQuery = url.parse(request.url, true).query;
  // validate offset
  let offset = parsedQuery.offset;
  if (typeof(offset) == 'undefined') {
    offset = 0;
  } else {
    if ( isNaN(parseInt(offset)) ) {
      sendError('offset', 422, response);
    }
  }

  // validate limit
  let limit = parsedQuery.limit;
  if (typeof(limit) == 'undefined') {
    limit = 10;
  } else {
    if ( isNaN(parseInt(limit)) ) {
      sendError('limit', 422, response);
    }
  }


  let dbFetch = [];
  // inner join query that returns the same genre films filtered by + / - 15 years of the parent film
  let query = `SELECT films.id, films.title, films.release_date AS releaseDate, genres.name AS genre FROM films 
  INNER JOIN genres ON films.genre_id=genres.id 
  WHERE genre_id = (SELECT genre_id FROM films WHERE id = ${filmId}) AND 
  release_date >= date((SELECT release_date FROM films WHERE id = ${filmId}), '-15 years') AND
  release_date <= date((SELECT release_date FROM films WHERE id = ${filmId}), '+15 years')`;

  db.serialize(() => {
    db.all(query, (err, rows) => {
      if (err) { console.error(err) };
      dbFetch = rows;

      // API request string
      let filmIdsQuery = '';
      for (let i = 0; i < dbFetch.length; i++) {
        filmIdsQuery += dbFetch[i].id.toString() + ',';
      }
      reviewApi = 'http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1?films=' + filmIdsQuery;

      let recommendations = []

      // get the reviews for the recommended films
      http.get(reviewApi, function(resApi) {
        body = '';
        resApi.on('data', function(chunk) {
          body += chunk;
        });

        resApi.on('end', function() {
          apiReviews = JSON.parse(body);

          // 
          for (let i = 0; i < apiReviews.length; i++) {
            // Get number of reviews and average rating from the results
            numReviews = apiReviews[i].reviews.length;

            // check for more than or = 5 reviews
            if (numReviews >= 5) { 
              avgRating = 0;
              for (let j = 0; j < numReviews; j++) {
                avgRating += apiReviews[i].reviews[j].rating;
              }
              avgRating = parseFloat((avgRating / numReviews).toFixed(2));
              
              // check is rating is above 4.0
              if (avgRating >= 4.0) { 
                recommendation = {
                  id: dbFetch[i].id,
                  title: dbFetch[i].title,
                  releaseDate: dbFetch[i].releaseDate,
                  genre: dbFetch[i].genre,
                  averageRating: avgRating,
                  reviews: numReviews
                };
                recommendations.push(recommendation);
              }
            }
          }
          
          // sort by ids
          recommendations.sort((a, b) => a.id - b.id);

          // pagination
          recommendations = recommendations.slice(offset, offset+limit);

          var fullRes = {
            recommendations: recommendations,
            meta: {limit: limit, offset: offset}
          };

          // repsonse to the client
          response.statusCode = 200;
          response.setHeader('Content-Type', 'application/json');
          response.end( JSON.stringify(fullRes) );

        });

      }).on('error', function(e){
        console.log("Got an API error: ", e);
      });
    });
  }); 
}

module.exports = app;