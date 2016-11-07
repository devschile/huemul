// Description:
//   Get the latest status of a shipment from Correos de Chile
//
// Dependencies:
//   none
//
// Commands:
//   hubot correos [envio]
//
// Author:
//   @hectorpalmatellez

var cheerio = require('cheerio');

module.exports = function(robot) {
  robot.respond(/correos (.*)/i, function(msg) {
    msg.send(':mailbox_closed: buscando...');

    var search = msg.match[1];
    var mainUrl = 'http://api-correos.herokuapp.com/';
    var url = mainUrl + search;

    msg.robot.http(url).get()(function(err, res, body){
      data = JSON.parse(body)
      
      msg.send(data.registros[1].estado + ' ' + data.registros[1].fecha)
    });
  });
};
