// Description:
//   Returns local time in given city.
//
// Dependencies:
//   worldweatheronline.com API
//
// Configuration:
//   HUBOT_WWO_API_KEY
//   HUBOT_WWO_API_URL
//
// Commands:
//   hubot hora en <ciudad>
//
// Notes
//   Request an WWO API KEY in http://www.worldweatheronline.com/
//   The url is likely to be something like http://api.worldweatheronline.com/free/v2/tz.ashx
//
//   City parameter can be:
//     city
//     city, country
//     ip address
//     latitude and longitude (in decimal)
//
// Author:
//   @gtoroap

process.env.HUBOT_WWO_API_KEY = '07b73143eac944fba54171910181107';
process.env.HUBOT_WWO_API_URL = 'https://api.worldweatheronline.com/premium/v1/tz.ashx';

module.exports = robot => {
  robot.respond(/hora en (.*)/i, msg => {
    if (!process.env.HUBOT_WWO_API_KEY) {
      msg.send('Please, set HUBOT_WWO_API_KEY environment variable');
      return;
    }
    if (!process.env.HUBOT_WWO_API_URL) {
      msg.send('Please, set HUBOT_WWO_API_URL environment variable');
      return;
    }
    robot.http(process.env.HUBOT_WWO_API_URL)
      .query({
        q: msg.match[1],
        key: process.env.HUBOT_WWO_API_KEY,
        format: 'json'
      })
      .get()((err, res, body) => {
        if (err || res.statusCode !== 200) {
          return robot.emit('error', err || new Error(`Status code ${res.statusCode}`), msg)
        }
        try {
          let result = JSON.parse(body)['data'];
          let city = result['request'][0]['query'];
          let currentTime = result['time_zone'][0]['localtime'].slice(11);
          msg.send(`Son las *${currentTime}* en *${city}* :clock1030:`);
        } catch (error) {
          msg.send("No entendi esa ciudad, intenta con otra si quieres. Si no, no me importa.");
        }
    });
  });
};
