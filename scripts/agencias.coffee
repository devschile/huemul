# Description:
#   muestra un gif relacionado con la asombrosa experiencia de trabajar en agencia
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   None
#
# Author:
#   @jorgeepunan

images = [
  'http://i.imgur.com/IW6O268.gif'
  'http://data.whicdn.com/images/66984539/large.gif'
  'http://stream1.gifsoup.com/view6/4649173/disaster-movie-chipmunk-rabies-o.gif'
  'https://media.giphy.com/media/x13saNuWqUPPW/giphy.gif'
  'http://i.imgur.com/PimcI7P.gif'
  'http://i.imgur.com/f6iwaCk.gif'
  'http://i.imgur.com/b1YkaV3.gif'
  'http://31.media.tumblr.com/f08f0922da3d090269f5b90c7cea6cbb/tumblr_inline_o4d5eeZRfB1raprkq_500.gif'
]

module.exports = (robot) ->
  robot.hear /#agencia|#agencias (.*)/gi, (msg) ->
    msg.send 'agencias... :point_down::skin-tone-4:'
    msg.send msg.random images
