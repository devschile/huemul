// Description:
//   Muestra quiénes están en el espacio (fuera de la tierra) AHORA
//
// Dependencies:
//   http://api.open-notify.org/
//
// Configuration:
//   None
//
// Commands:
//   hubot en el espacio
//
// Author:
//   @jorgeepunan

var url = 'http://api.open-notify.org/astros.json';

var emojis = [":space_invader:",":stars:",":alien:",":star2:"]

function rand(items){
  return emojis[~~(Math.random() * emojis.length)];
}

module.exports = function(robot) {
  robot.respond(/en el espacio/i, function(res) {

    robot.http(url).get()(function (error, response, body) {

      if (!error && response.statusCode == 200) {

        var data = JSON.parse(body);
        var cuantos = data.number;

        res.send( "En este momento hay *" + cuantos + "* personas en el espacio " + rand(emojis) );

        data.people.forEach(function(d) {

          var donde = d.craft;
          var quien = d.name;

          res.send( " · " + quien + " (" + donde + ")" );

        });


      } else {
        res.send(":facepalm: Error: ", error);
      }

    });
  });
};
