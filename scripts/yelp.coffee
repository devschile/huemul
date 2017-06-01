# Description:
#   Busca por restaurantes en Chile usando Yelp API 2.0.
#   Exclusivo para Huemul Bot de DevsChile.cl
#
# Dependencies:
#   "yelp": "0.1.1"
#
# Configuration:
#   Yelp tokens: http://www.yelp.com/developers/getting_started/api_access
#
# Commands:
#   hubot yelp <tipo_de_comida> en/cerca/cerca de <comuna/zona>)?
#
# Notes:
#   hubot yelp vegetariano en providencia
#   hubot yelp pizza cerca de el golf
#
# Author:
#   @jorgeepunan

consumer_key    = process.env.YELP_CONSUMER_KEY
consumer_secret = process.env.YELP_CONSUMER_SECRET
token           = process.env.YELP_TOKEN
token_secret    = process.env.YELP_TOKEN_SECRET


Yelp = require("yelp")
yelp = new Yelp
  consumer_key: consumer_key
  consumer_secret: consumer_secret
  token: token
  token_secret: token_secret

module.exports = (robot) ->
  robot.respond /yelp( me)? (.*) (en|cerca|cerca de) (.*)/i, (msg) ->
    msg.send '~·~ buscando ~·~'
    query =
      term: msg.match[2]
      location: "#{msg.match[4]}, Chile"
    yelp.search(query).then (data) ->
      if data.businesses.length > 0
        limiteResultados = 3
        i = 0
        while i < limiteResultados
          business = msg.random data.businesses
          template = "- " + "#{business.name} que queda en " + "#{business.location.address}, #{business.location.city}.\n    Calificación: " + "#{business.rating}/5 por #{business.review_count} personas.\n" + "    Categoría: #{business.categories.map((value, index) -> value[0] ).join(', ').toLowerCase()}."
          msg.send template
          i++

      else
        msg.send ":huemul: algo pasó y no sé qué fue. Intenta de nuevo."
    .catch (err) ->
      msg.emit "error", err
      msg.send ":huemul: algo pasó y no sé qué fue. Intenta de nuevo."
