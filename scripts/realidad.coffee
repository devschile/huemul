# Description:
#   Te muestra la realidad de la vida real realística
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Notes:
#   respond tristeza|triste|aburrido|aburrimiento|fomingo|realidad
#
# Author:
#   @jorgeepunan

images = [
  'https://media.giphy.com/media/3oEdv1MUT7aVetT61i/giphy.gif'
  'https://media.giphy.com/media/10tIjpzIu8fe0/giphy.gif'
  'https://media.giphy.com/media/qkWsZIQUJ1Yyc/giphy.gif'
  'https://media.giphy.com/media/x8uKroNI3ScDu/giphy.gif'
  'https://media.giphy.com/media/1ivWO3aPGfZy8/giphy.gif'
  'https://media.giphy.com/media/o9d7tR1682rxC/giphy.gif'
  'https://media.giphy.com/media/2FazfWOd7WPJuYqHe/giphy.gif'
  'https://media.giphy.com/media/hu6cihoTjZgR2/giphy.gif'
  'https://media.giphy.com/media/jou4Cd2mx1lGU/giphy.gif'
  'https://media.giphy.com/media/Si0y1N03JhCx2/giphy.gif'
  'https://media.giphy.com/media/KyG9W2Qncd1PG/giphy.gif'
  'https://media.giphy.com/media/33iqmp5ATXT5m/giphy.gif'
  'https://media.giphy.com/media/6gDSyjaOPwZ4A/giphy.gif'
  'https://media.giphy.com/media/1BXa2alBjrCXC/giphy.gif'
  'https://media.giphy.com/media/yGesXBuMnMSdi/giphy.gif'
  'https://media.giphy.com/media/xJOc1SJU5F7aM/giphy.gif'
  'https://media.giphy.com/media/pVAMI8QYM42n6/giphy.gif'
  'https://media.giphy.com/media/123yhXdwobrTnW/giphy.gif'
  'https://media.giphy.com/media/rxnhSy4J3KyXe/giphy.gif'
  'https://media.giphy.com/media/AYKv7lXcZSJig/giphy.gif'
]

module.exports = (robot) ->
  robot.respond /tristeza|triste|aburrido|aburrimiento|fomingo/gi, (msg) ->
    msg.send msg.random images
