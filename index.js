const sqlite = require('sqlite'),
      Sequelize = require('sequelize'),
      request = require('request'),
      express = require('express'),
      app = express();

const { PORT=3000, NODE_ENV='development', DB_PATH='./db/database.db' } = process.env;

// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .catch((err) => { if (NODE_ENV === 'development') console.error(err.stack); });

// sequelize instance with referencing the sqlite3 DB
// no authentication is required hence no user info was passed to the instance
let sequelize = new Sequelize(null, null, null, {
  dialect: 'sqlite',
  storage: DB_PATH
});

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
  let reqFilmId = req.params.id;
      offset = req.query.offset,
      limit = req.query.limit;
      
  // req.params error handling
  if ( isNaN(reqFilmId) || reqFilmId === undefined )  {
    return res.status(422).json({ message: 'key missing' });
  };

  //req.query error handling
  if( (offset && limit) && (isNaN(offset) || isNaN(limit)) ) {
    return res.status(422).json({ message: 'key missing' });    
  };
  /* -------------------------------------------------------------------------- */




};


module.exports = app;
