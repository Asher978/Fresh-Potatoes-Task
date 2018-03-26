const sqlite = require('sqlite'),
      Sequelize = require('sequelize'),
      request = require('request'),
      express = require('express'),
      app = express();
const sqlite3 = require('sqlite3').verbose();
      

const { PORT=3000, NODE_ENV='development', DB_PATH='./db/database.db' } = process.env;



// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .catch((err) => { if (NODE_ENV === 'development') console.error(err.stack); });


// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations);

// incorrect url handling
// maybe the message here should be that the user had hit an invalid route
// however the test wriiten for this is expecting a message ({ message: 'key missing' })
// therefore i left the message per the test
app.get('/films/:id/recommendations/*', (req, res, next) => {
  return res.status(404).json({ message: 'key missing' });
});


// ROUTE HANDLER
function getFilmRecommendations(req, res, next) {
  // res.status(500).send('Not Implemented');

  /* ------------------------  PARAMS ERROR HANDLING ------------------------- */
  const { id } = req.params;
  const { offset, limit } = req.query;
      
  // req.params error handling
  if ( isNaN(id) || id === undefined )  {
    return res.status(422).json({ message: 'key missing' });
  };

  //req.query error handling
  if( (offset && limit) && (isNaN(offset) || isNaN(limit)) ) {
    return res.status(422).json({ message: 'key missing' });    
  };
  /* -------------------------------------------------------------------------- */


  // open database by providing the path
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log('Connected to the SQlite database.');
  });

  // variable to store the db response
  let dbFetch = [];

  // inner join query that returns the same genre films filtered by + / - 15 years of the parent film
  let query = `SELECT films.id, films.title, films.release_date AS releaseDate, genres.name AS genre FROM films 
  INNER JOIN genres ON films.genre_id=genres.id 
  WHERE genre_id = (SELECT genre_id FROM films WHERE id = ${id}) AND 
  release_date >= date((SELECT release_date FROM films WHERE id = ${id}), '-15 years') AND
  release_date <= date((SELECT release_date FROM films WHERE id = ${id}), '+15 years')`;
  
  // fetch from the DB using inner Join
  db.serialize(() => {
    db.all(query, (err, rows) => {
      if (err) { console.error(err) };

      dbFetch = rows;

    })
  })
  
};


module.exports = app;
