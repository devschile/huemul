// Description:
//   Busca por restaurantes en Chile usando Yelp API 2.0.
//   Exclusivo para Huemul Bot de DevsChile.cl
//
// Dependencies:
//   "yelp": "0.1.1"
//
// Configuration:
//   Yelp tokens: http://www.yelp.com/developers/getting_started/api_access
//
// Commands:
//   hubot yelp <tipo_de_comida> en <comuna/zona>) - Busca restaurantes que entreguen la comida indicada en la zona indicada
//   hubot yelp <tipo_de_comida> cerca <comuna/zona>) - Busca restaurantes que entreguen la comida indicada en la zona indicada
//   hubot yelp <tipo_de_comida> cerca de <comuna/zona>) - Busca restaurantes que entreguen la comida indicada en la zona indicada
//
// Notes:
//   hubot yelp vegetariano en providencia
//   hubot yelp pizza cerca de el golf
//
// Author:
//   @jorgeepunan

let consumer_key    = process.env.YELP_CONSUMER_KEY;
let consumer_secret = process.env.YELP_CONSUMER_SECRET;
let token           = process.env.YELP_TOKEN;
let token_secret    = process.env.YELP_TOKEN_SECRET;


const Yelp = require("yelp");
let yelp = new Yelp({
  consumer_key,
  consumer_secret,
  token,
  token_secret
});

module.exports = robot => {
  robot.respond(/yelp( me)? (.*) (en|cerca|cerca de) (.*)/i, msg => {
    msg.send('~·~ buscando ~·~');
    let query = {
      term: msg.match[2],
      location: `${msg.match[4]}, Chile`
    };
    yelp.search(query).then(data => {
      if (data.businesses.length > 0) {
        let limiteResultados = 3;
        let i = 0;
        const results = Array.from(Array(3).keys()).map(() => {
          let business = msg.random(data.businesses);
          return `- ${`${business.name} que queda en `}${`${business.location.address}, ${business.location.city}.\n    Calificación: `}${`${business.rating}/5 por ${business.review_count} personas.\n`}${`    Categoría: ${business.categories.map((value, index) => value[0]).join(', ').toLowerCase()}.`}`;
        })
        msg.send(results.join('\n'));

      } else {
        msg.send(":huemul: algo pasó y no sé qué fue. Intenta de nuevo.");
      }
    }).catch(function(err) {
      robot.emit("error", err, msg, 'yelp');
      msg.send(":huemul: algo pasó y no sé qué fue. Intenta de nuevo.");
    });
  });
};
