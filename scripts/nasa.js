// Description:
//   Muestra quiénes están en el espacio (fuera de la tierra) AHORA
//
// Dependencies:
//   https://api.nasa.gov/
//
// Configuration:
//   None
//
// Commands:
//   hubot foto del d[ií]a
//
// Author:
//   @jorgeepunan

var request = require('request');
var url = 'https://api.nasa.gov/planetary/apod';
var apikey = 'fCSASHvV7aQWommjx56XrfPwijEpHPeDkbHIPySi';

function currentDate(){
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth()+1;
  var yyyy = today.getFullYear();

  if( dd < 10 ){
      dd = '0' + dd;
  }
  if( mm < 10 ){
      mm = '0' + mm;
  }
  var today = yyyy + '-' + mm + '-' + dd;
  return today
}

module.exports = function(robot) {
  robot.respond(/foto del d[ií]a/i, function(res) {

    var fullURL = url + '?api_key=' + apikey;

    request(fullURL, function (error, response, body) {

      if (!error && response.statusCode == 200) {

        var data = JSON.parse(body);

        res.send( data.title + ' [' + currentDate() + ']' );
        res.send( data.url );

      } else {
        res.send(":facepalm: Error: ", error);
      }

    });
  });
};
