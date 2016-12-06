// Description:
//   Busca productos en Knasta.cl
//
//  Dependencies:
//    phantom
//    Q
//    cheerio
//
// Commands:
//   hubot knasta <producto>
//
// Author:
//   @jorgeepunan

var phantom = require('phantom');
var Q = require('q');
var cheerio = require('cheerio');
var _ph, _page, _outObj;

function textPopulated() {
    return _page.evaluate(function() {
        return document.querySelector('#app').outerHTML;
    }).then(function(html) {
        return html;
    });
}

function waitState(state, timeout) {  // timeout in seconds is optional

    var limitTime = timeout * 1000 || 20000;
    var startTime = new Date();

    return wait();

    function wait() {
        return state().then(function(result) {
            if (result) {
                return;
            } else if (new Date() - startTime > limitTime) {
                var errorMessage = 'Timeout state: ' + state.name;
                throw new Error(errorMessage);
            } else {
                return Q.delay(50).then(wait);
            }
        }).catch(function(error) {
            throw error;
        });
    }
}

module.exports = function(robot) {

  robot.respond(/knasta (.*)/i, function(msg) {

    msg.send('Buscando en Knasta... :gift:');

    var busqueda = msg.match[1];
    var domain = 'http://knasta.cl/results/';
    var url = domain + busqueda.split(' ').join('%20');

    msg.robot.http(url).get()(function(err, res, body) {

      phantom.create().then(ph => {
        _ph = ph;
        return _ph.createPage();
      }).then(page => {
        _page = page;
        return _page.open(url);
      }).then(status => {
        return waitState(textPopulated, 3);
      }).then(() => {
          return _page.property('content');
      }).then(content => {

        var $ = cheerio.load(content);
        var resultados = [];

        $('.item.linio.panel.panel-default').each(function() {
            var title = $(this).find('.title').text();
            var link = 'http://knasta.cl' + $(this).find('a').attr('href');

            resultados.push( '<' + link + '|' + title + '>' );
        });

        if(resultados.length > 0) {
          var limiteResultados = (resultados.length > 4) ? 3 : resultados.length;
          var plural = resultados.length > 1 ? ['n','s'] : ['',''];
          var text = 'Se ha'+plural[0]+' encontrado '+ resultados.length + ' resultado'+plural[1] + '\n';
          for (var i=0; i < limiteResultados; i++) {
            var conteo = i + 1;
            text += conteo + ': ' + resultados[i] + '\n';
          }
          if(resultados.length > limiteResultados) {
            text += 'Otros resultados en: <'+ url + '|knasta>\n';
          }
          msg.send(text);
        } else {
          msg.send('No se han encontrado resultados sobre '+ busqueda);
        }

        _page.close();
        _ph.exit();
      }).catch(e => console.log(e));

    });

  });

};
