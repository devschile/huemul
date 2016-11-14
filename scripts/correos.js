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

module.exports = function(robot) {
  robot.respond(/correos (.*)/i, function(msg) {
    msg.send(':mailbox_closed: buscando...');

    var search = msg.match[1];
    var mainUrl = 'http://api-correos.herokuapp.com/';
    var url = mainUrl + search;

    msg.robot.http(url).get()(function(err, res, body) {

    try {
      data = JSON.parse(body);
      msg.send(data.registros[0].estado + ' ' + data.registros[0].fecha);
    } catch (error) {
      console.log(error);
      msg.send(body);
    }
      
    });
  });
};
