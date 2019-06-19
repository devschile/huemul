// Description:
//   Trae recetas de recetasgratis.net
//
//  Dependencies:
//    cheerio
//
// Commands:
//   hubot receta <ingrediente> - Trae recetas de recetasgratis.net
//   hubot recetas <ingrediente> - Trae recetas de recetasgratis.net
//
// Author:
//   @jorgeepunan

var cheerio = require('cheerio');

module.exports = function(robot) {
  robot.respond(/(receta|recetas) (.*)/i, function(msg) {

    var busqueda = msg.match[2];
    var domain = 'https://www.recetasgratis.net/busqueda';
    var url = domain + '?q=' + busqueda.split(' ').join('+');

    robot.http(url).get()(function(err, res, body) {

      if (err) {
        robot.emit('error', err, msg, 'recetas');
      } else {
        var $ = cheerio.load(body);
        var resultados  = [];
        var resNum      = $('.titulo.titulo--search').text();

        $('.resultado').each(function() {
          var title = $(this).find('.titulo.titulo--resultado').text();
          var link  = $(this).find('.titulo.titulo--resultado').attr('href');

          resultados.push(`<${link}|${title}>`);
        });

        if(resNum.length) {
          var limiteResultados = (resultados.length > 4) ? 3 : resultados.length;
          var recetas = resultados.slice(0, limiteResultados).map((v, i) => `${i + 1}: ${v}`).join('\n');
          var more = resultados.length > limiteResultados ? `\n<${url}|Ver más resultados>` : '';
          var text = `${resNum}\n${recetas}${more}`;
          if (robot.adapter.constructor.name === 'SlackBot') {
            var options = {unfurl_links: false, as_user: true};
            robot.adapter.client.web.chat.postMessage(msg.message.room, text, options);
          } else {
            msg.send(text);
          }
        } else {
          msg.send('No se han encontrado resultados sobre '+ busqueda + '. Intenta con otro ingrediente.');
        }

      }

    });

  });
};
