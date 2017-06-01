// Description:
//   Obtiene el valor de un sitio usando su URL a través de worthofweb.com
//
//  Dependencies:
//    cheerio
//    request
//
// Commands:
//   hubot cu(a|á)ntovale [url sin http:// ni www.]
//
// Author:
//   @juanbrujo

var cheerio = require('cheerio');
var http  = require('http');

module.exports = function(robot) {
  robot.respond(/cu(a|á)ntovale (.*)/i, function(msg) {
    msg.send(':timer_clock: buscando...');

    var search = msg.match[2];
    var mainUrl = 'http://www.worthofweb.com/website-value/';
    var url = mainUrl + search;
    var find_link = function(link, callback){
      var root =''; 

      var f = function(link) {
        http.get(link, function(res) {
          if (res.statusCode == 301) {
            f(res.headers.location);
          } else {
            callback(link);
          } 
        });
      }

      f(link, function(t){
        i(t,'*');
      });
    }   

    find_link(url, function(link){
      msg.robot.http(link).get()(function(err, res, body){

        var $ = cheerio.load(body);

        if( $('.fa-bell').length ) {
          msg.send('Este sitio no existe. Intenta con otro.')
        } else {
          msg.send(':monea: ' + $('title').text().trim().split(' - ')[0])
        }

      });
      
    });

  });
};
