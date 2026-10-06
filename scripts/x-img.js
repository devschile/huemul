// Description:
//   Publica las imágenes de un post de X cuando el enlace lleva #img.
//
// Commands:
//   <URL de x.com/.../status/...> #img - Publica las imágenes del post.
//
// Configuration:
//   HUBOT_X_IMG_TIMEOUT_MS - Tiempo máximo de consulta (por defecto: 8000 ms).

const SYNDICATION_URL = 'https://cdn.syndication.twimg.com/tweet-result'
const DEFAULT_TIMEOUT_MS = 8000
const POST_URL = /https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/(?:[A-Za-z0-9_]+|i)\/status\/(\d+)(?:[/?#][^\s<>]*)?/i

const timeoutMs = () => Number(process.env.HUBOT_X_IMG_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS

const imageUrl = photo => {
  if (!photo || typeof photo.url !== 'string') return null

  try {
    const url = new URL(photo.url)
    return url.protocol === 'https:' && url.hostname === 'pbs.twimg.com' ? url.toString() : null
  } catch (err) {
    return null
  }
}

const photosOf = tweet => {
  if (!tweet || !Array.isArray(tweet.photos)) return []

  return tweet.photos
    .map(imageUrl)
    .filter(Boolean)
    .filter((url, index, photos) => photos.indexOf(url) === index)
    .slice(0, 4)
}

const fetchTweet = (robot, tweetId, done) => {
  const url = `${SYNDICATION_URL}?id=${encodeURIComponent(tweetId)}&lang=es&token=1`

  robot
    .http(url)
    .header('Accept', 'application/json')
    .timeout(timeoutMs())
    .get()((err, response, body) => {
      if (err) return done(err)
      if (!response || response.statusCode !== 200) return done(new Error('respuesta no disponible'))
      if (!body) return done(new Error('respuesta vacía'))

      try {
        done(null, JSON.parse(body))
      } catch (error) {
        done(error)
      }
    })
}

module.exports = robot => {
  robot.hear(/#img\b/i, msg => {
    const text = msg.message.rawText || msg.message.text || ''
    const match = text.match(POST_URL)
    if (!match) return

    fetchTweet(robot, match[1], (err, tweet) => {
      if (err) return msg.reply('no pude obtener las imágenes de ese post.')

      const photos = photosOf(tweet)
      if (photos.length === 0) return msg.reply('ese post no trae imágenes públicas.')

      const blocks = photos.map((url, index) => ({
        type: 'image',
        image_url: url,
        alt_text: `Imagen ${index + 1} del post en X`
      }))

      msg.send({
        text: 'Imagen del post en X',
        blocks: JSON.stringify(blocks),
        unfurl_links: false,
        unfurl_media: false
      })
    })
  })
}

module.exports.photosOf = photosOf
