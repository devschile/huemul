// Description:
//   Entrega una tarjeta de crédito autogenerada
//
// Dependencies:
//   cheerio
//
// Configuration:
//   None
//
// Commands:
//   hubot dame una visa
//   hubot dame una mastercard
//   hubot dame una american express
//   hubot dame una discover
//
// Author:
//   @victorsanmartin

const {load} = require('cheerio');

module.exports = robot => {
  robot.respond(/dame una (visa|mastercard|discover|american express)/i, msg => {
    const quequiere = msg.match[1].toLowerCase();
    let url;

    if (quequiere === 'visa') {
      url = 'http://generatarjetasdecredito.com/generador-tarjetas-visa.php';
    } else if (quequiere === 'american express') {
      url = 'http://generatarjetasdecredito.com/generador-tarjetas-american-express.php';
    } else if (quequiere === 'discover') {
      url = 'http://generatarjetasdecredito.com/generador-tarjetas-discover.php';
    } else if (quequiere === 'mastercard') {
      url = 'http://generatarjetasdecredito.com/generador-tarjetas-mastercard.php';
    } else {
      return false;
    }

    robot.http(url).get()((err, res, body) => {
      if (err) {
        robot.emit('error', err, msg);
      } else {
        const dom = load(body);
        const section = dom(dom('section').get(3));

        msg.send(
          `Nº: ${section.find('p.resalta').html()}, CVV2/VCV2: ${dom(section.find('p.centrado em').get(0)).html().split(': ')[1]}, Vence: ${dom(section.find('p.centrado em').get(1)).html().split(': ')[1]}`
        );
      }
    });
  });
};
