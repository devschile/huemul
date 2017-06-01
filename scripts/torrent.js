// Description:
//   Search torrents from torrentproject.se
//
//  Dependencies:
//    cheerio
//    cloudscraper
//
// Commands:
//   hubot torrent <query>
//
// Author:
//   @jorgeepunan

var cheerio = require('cheerio');
var cloudscraper = require('cloudscraper');

module.exports = function(robot) {
  robot.respond(/torrent (.*)/i, function(msg) {

    msg.send('Esperando respuesta de Torrent Project... :clock830:');

    var busqueda = msg.match[1];
    var domain = 'https://torrentproject.se/';
    var url = domain + '?t=' + busqueda.split(' ').join('+');

    cloudscraper.get(url, function(error, response, body) {
      if (error) {
        robot.emit('error', error, response);
      } else {
        var $ = cheerio.load(body);
        var resultados = [];

        $('#similarfiles > div:not(.gac_bb)').each(function() {
          var title = $(this).find('a').text();
          var link = $(this).find('a').attr('href');

          resultados.push(`<${domain}${link}|${title}>`);
        });

        if(resultados.length > 0) {
          var limiteResultados = (resultados.length > 4) ? 3 : resultados.length;
          var plural = resultados.length > 1 ? ['n','s'] : ['',''];
          var resume = 'Se ha'+plural[0]+' encontrado '+ resultados.length + ' resultado'+plural[1];
          var links = resultados
            .slice(0, limiteResultados)
            .map((result, index) => `${index + 1}: ${result}`)
            .join('\n');
          var more = resultados.length > limiteResultados ? `\n<${url}|Ver más resultados>` : '';
          var text = `${resume}\n${links}${more}`;
          if (robot.adapter.constructor.name === 'SlackBot') {
            var options = {unfurl_links: false, as_user: true};
            robot.adapter.client.web.chat.postMessage(msg.message.room, text, options);
          } else {
            msg.send(text);
          }
        } else {
          msg.send('No se han encontrado resultados sobre '+ busqueda);
        }

      }
    });

  });

};
