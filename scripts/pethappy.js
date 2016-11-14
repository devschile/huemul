// Description:
//   Get available products from PetHappy
//
//  Dependencies:
//    cheerio
//
// Commands:
//   hubot pethappy [producto]
//
// Author:
//   @hectorpalmatellez

var cheerio = require('cheerio');

module.exports = function(robot) {
  robot.respond(/pethappy (.*)/i, function(msg) {
    msg.send(':perro: buscando...');

    var search = msg.match[1];
    var mainUrl = 'https://www.pethappy.cl';
    var url = mainUrl + '/search/' + search.replace(' ', '%20');

    msg.robot.http(url).get()(function(err, res, body){
      var $ = cheerio.load(body);
      var results = [];

      $('.nodisponible').parents('.producto-box').addClass('no');

      $('.producto-box:not(.no)').each(function(){
        var $productName = $(this).find('h1 a').text();
        var $productUrl = $(this).find('.comprar a').attr('href');
        var $productPrice = $(this).find('.precio').text().trim();
        results.push($productName + ' → ' + mainUrl + $productUrl + ' (_' + $productPrice + '_)');
      });

      if (results.length > 0) {
        for (var i = 0; i<results.length; i++) {
          msg.send(results[i]);
        }
      } else {
        msg.send('No hay de lo que buscas, habla con :pinceleart:');
      }
    });
  });
};
