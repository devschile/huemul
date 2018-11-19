// Description:
//   zapatilladeclavo.jpg
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Command:
//   hubot nosvimo - Displays a chao nos vimos picture
//
// Author:
//   @pinceleart

const images = [
  'https://memecrunch.com/meme/B521D/chao-nos-vimo/image.gif',
  'https://pm1.narvii.com/6532/1d99d75c75aae454513d0212c4a9d2d3076688af_hq.jpg',
  'http://66.media.tumblr.com/884bd93f973ef44ba90f3f47f8ac87d2/tumblr_njguz3If0q1rw80ozo1_400.gif',
  'https://pbs.twimg.com/media/DGMK-Y4W0AAykBK.jpg',
  'https://i.ytimg.com/vi/Mpg8Lbfc62k/hqdefault.jpg',
  'https://cdn.dopl3r.com/memes_files/hecho-en-regionelite-y-recuerden-amigos-que-la-hayas-hecho-reir-no-significa-que-sienta-algo-por-ti-rlos-hasta-la-proxima-amigos-oVlYi.jpg',
  'http://pa1.narvii.com/6479/0518a785aafb86cfb2a10be7151d58c944d10019_hq.gif',
  'https://storify.com/services/proxy/2/jb3HsupBuXaw4uaziN_DwQ/http/pbs.twimg.com/media/CVvCNuMWwAAF_OI.jpg',
  'https://i.imgur.com/l9tiizT.jpg'
]

module.exports = robot => {
  robot.respond(/nosvimo/gi, msg => msg.send(msg.random(images)))
}
