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

// ROUTE HANDLER
function getFilmRecommendations(req, res) {
  // res.status(500).send('Not Implemented');

  /* ------------------------  PARAMS ERROR HANDLING ------------------------- */
  let reqFilmId = req.params.id;
      offset = req.query.offset,
      limit = req.query.limit,
      url = req.originalUrl;

  if ( isNaN(reqFilmId) || isNaN(offset) || isNaN(limit) || reqFilmId === undefined )  {
    return res.status(422).json({ message: 'key missing' })
  }


  



}

module.exports = app;
