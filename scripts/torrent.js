// Description:
//   Search torrents from yts.ag
//
//  Dependencies:
//
// Commands:
//   hubot torrent <query> - Search torrents for query from yts.ag
//
// Author:
//   @jorgeepunan

module.exports = function(robot) {
  robot.respond(/torrent (.*)/i, function(msg) {

    msg.send('Esperando respuesta de YTS YIFY... :loading:');

    var busqueda = msg.match[1];
    var api = 'https://yts.am/api/v2/list_movies.json?limit=5&query_term=';
    var url = api + busqueda.split(' ').join('+');

    robot.http(url).get()(function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var data = JSON.parse(body);

        if (data.data.movie_count > 0) {
          var movies = [];
          data.data.movies.forEach(function (e) {
            movies.push('<' + e.url + '|' + e.title + ': año: ' + e.year + ', rating: ' + e.rating + '>');
          });

          var resultados = 'Encontradas ' + data.data.movie_count + ' coincidencias:';
          var cierre = 'Todos los resultados en *<https://yts.ag/browse-movies/'+ busqueda.split(' ').join('+') + '|yts.arg>*';
          var texto = resultados + '\n' + movies.join('\n') + '\n' + cierre;
          if (robot.adapter.constructor.name === 'SlackBot') {
            var options = {unfurl_links: false, as_user: true};
            robot.adapter.client.web.chat.postMessage(msg.message.room, texto, options);
          } else {
            msg.send(texto);
          }
        } else {
          msg.send('Nada encontrado con ' + busqueda + ', intenta con otra película.');
        }

      }
    });

  });

};
