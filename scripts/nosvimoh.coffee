# Description:
#   zapatilladeclavo.jpg
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Notes:
#   echo nosvimo   - Displays a chao nos vimos picture

#
# Author:
#   @pinceleart

images = [
  "https://memecrunch.com/meme/B521D/chao-nos-vimo/image.gif",
  "http://cdn.memegenerator.es/imagenes/memes/full/21/79/21797606.jpg",
  "http://66.media.tumblr.com/884bd93f973ef44ba90f3f47f8ac87d2/tumblr_njguz3If0q1rw80ozo1_400.gif",
  "https://img.memesuper.com/5eb17d610488ba4e80c2d446df957074_-chao-ctm-negrero-de-mierda-chao-ctm-meme_305-215.jpeg",
  "https://i.giphy.com/VsXhOdCYnpw1q.gif",
  "https://media.tenor.co/images/35cafed5203a17c7a80d2263842752a1/tenor.gif",
  "http://do0.pslabs.cl/noh-vimo-gil-ql.gif"
]

module.exports = (robot) ->
  robot.respond /nosvimo/gi, (msg) ->
    msg.send msg.random images
