// Description:
//   Get detailed information about movies or series from IMDb
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot imdb <movie or serie> <year>
//   hubot movie <movie or serie> <year>
//
// Author:
//   @ravenous <hello@ravenous.io>

function checkValue(value) {
  const emptyMsg = ['NA', 'N/A'];

  if ((value != null) && emptyMsg.includes(value) === false) {
    return true;
  }

  return false;
}

module.exports = (robot) => {
  robot.respond(/(imdb|movie)\s(.*)/i, (msg) => {
    const str = msg.match[2];
    let title = str;
    let year = '';

    // Check if there's a year at the end of the string
    if (str.length > 4 && str.match(/\d{4}$/i)) {
      title = str.slice(0, -5).split(' ').join('+');
      year = str.slice(-4);
    } else {
      title = str.split(' ').join('+');
    }

    // Send request to the OMDB API
    robot.http('http://omdbapi.com/').query({
      t: title,
      y: year,
      tomatoes: true
    })
    .get()( (err, res, body) => {
      if (err || res.statusCode !== 200) {
        return robot.emit('error', err || new Error(`Status code ${res.statusCode}`), msg)
      }
      const movie = JSON.parse(body);

      if (movie.Response === 'False') {
        msg.send("¿Seguro qué ese es el nombre?\n¡Tienes que elegir una película o serie!");
      } else {

        let movieInfo = ":popcorn: *" + movie.Title + " (" + movie.Year + ")*\n\n";

        if (checkValue(movie.imdbRating)) {
          movieInfo += "IMDb Rating: `" + movie.imdbRating + "/10`\n";
        }
        if (checkValue(movie.tomatoMeter)) {
          movieInfo += "Rotten Tomatoes: `" + movie.tomatoMeter + "%`\n";
        }
        if (checkValue(movie.Plot)) {
          movieInfo += ">_" + movie.Plot + "_\n";
        }
        if (checkValue(movie.Genre)) {
          movieInfo += "Genre: `" + movie.Genre + "`\n";
        }
        if (checkValue(movie.Director)) {
          movieInfo += "Director: " + movie.Director + "\n";
        }
        if (checkValue(movie.Actors)) {
          movieInfo += "Actors: " + movie.Actors + "\n";
        }
        if (checkValue(movie.Awards)) {
          movieInfo += "Awards: " + movie.Awards + "\n";
        }
        if (checkValue(movie.imdbID)) {
          movieInfo += "URL: www.imdb.com/title/" + movie.imdbID;
        }

        msg.send(movieInfo);
      }
    });
  });
};


