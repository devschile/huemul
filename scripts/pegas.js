// Description:
//   Busca pegas recientes en GetOnBrd
//
//  Dependencies:
//    cheerio
//
// Commands:
//   hubot pega|trabajo <oficio>
//
// Author:
//   @jorgeepunan

var querystring = require('querystring');
var cheerio = require('cheerio');

module.exports = function(robot) {

  robot.respond(/(pega|trabajo) (.*)/i, function(msg) {

    msg.send('Buscando en GetOnBrd... :dev:');

    var busqueda = msg.match[2];
    var domain = 'https://www.getonbrd.cl/empleos-';
    var url = domain + querystring.escape(busqueda);

    robot.http(url).get()(function(err, res, body) {
      if (err || res.statusCode !== 200) {
        robot.emit('error', err || new Error(`Status code is ${res.statusCode}`), msg);
        msg.reply(':gob: tiene problemas en el servidor')
        return
      }
      var $ = cheerio.load(body);
      var resultados = [];

      $('.job-list .job').each(function() {
        var title = $(this).find('h4').text().replace(/\n|\r/g, ' ');
        var link = 'https://www.getonbrd.cl' + $(this).find('a').attr('href');

        resultados.push( '<' + link + '|' + title + '>' );
      });

      if(resultados.length > 0) {
        var limiteResultados = (resultados.length > 4) ? 3 : resultados.length;
        var plural = resultados.length > 1 ? ['n','s'] : ['',''];
        var text = 'Se ha'+plural[0]+' encontrado '+ resultados.length + ' resultado'+plural[1] + ' para *' + busqueda + '*:\n';
        for (var i=0; i < limiteResultados; i++) {
          var conteo = i + 1;
          text += conteo + ': ' + resultados[i] + '\n';
        }
        if(resultados.length > limiteResultados) {
          text += 'Otros resultados en: <'+ url + '|getonbrd>\n';
        }
        if (robot.adapter.constructor.name === 'SlackBot') {
          var options = {unfurl_links: false, as_user: true};
          robot.adapter.client.web.chat.postMessage(msg.message.room, text, options);
        } else {
          msg.send(text);
        }
      } else {
        msg.send('No se han encontrado resultados sobre '+ busqueda);
      }

    });

  });

};
