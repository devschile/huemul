// Description:
//   Huemul muestra saldo tarjeta BIP! ázì nòmá
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   Huemul bip <numero>
//
// Notes:
//   API prestada de alguien más q no lo sabe (aún)
//
// Author:
//   @jorgeepunan

module.exports = function(robot) {

  robot.respond(/bip (\w+)/i, function(msg) {

    let indicador = msg.match[1];
    msg.send('La consulta va en la micro... espere harto... :clock5:');

    if (isNaN(indicador)) {
      msg.send('El identificador de tu BIP! son sólo números.');
    } else {
      let url = `http://bip-servicio.herokuapp.com/api/v1/solicitudes.json?bip=${indicador}`;

      robot.http(url).get()(function(err, res, body) {
        if (err || res.statusCode !== 200) {
          msg.send('Algo pasó, intente nuevamente.');
          return robot.emit('error', err || new Error(`Status code ${res.statusCode}`), msg)
        }
        if (body.indexOf('<') > -1) {
          msg.send('Error, intente con otro número.');
        } else {
          res.setEncoding('utf-8');
          let data = JSON.parse(body);
          if (data) {
            return (() => {
              let result = [];
              for (let prop in data) {
                result.push( msg.send(`${prop} => ${data[prop]}`) );
              }
              return result;
            })();
          } else {
            msg.send('Error!');
          }
        }
      });
    }

  });

};
