// Description:
//   Publica las imágenes o el video de un post de X cuando el enlace lleva #img.
//
// Commands:
//   <URL de x.com/.../status/...> #img - Publica el contenido multimedia del post.
//
// Configuration:
//   HUBOT_X_IMG_TIMEOUT_MS - Tiempo máximo de consulta (por defecto: 8000 ms).
//   HUBOT_X_IMG_VIDEO_MAX_BYTES - Tamaño máximo de video (por defecto: 25 MiB).

const https = require('https')
const { WebClient } = require('@slack/web-api')

const SYNDICATION_URL = 'https://cdn.syndication.twimg.com/tweet-result'
const DEFAULT_TIMEOUT_MS = 8000
const DEFAULT_VIDEO_MAX_BYTES = 25 * 1024 * 1024
const POST_URL = /https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/(?:[A-Za-z0-9_]+|i)\/status\/(\d+)(?:[/?#][^\s<>]*)?/i
const defaultWeb = new WebClient(process.env.HUBOT_SLACK_TOKEN)

const timeoutMs = () => Number(process.env.HUBOT_X_IMG_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS
const maxVideoBytes = () => Number(process.env.HUBOT_X_IMG_VIDEO_MAX_BYTES) || DEFAULT_VIDEO_MAX_BYTES

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

const videoUrl = variant => {
  if (!variant || variant.content_type !== 'video/mp4' || typeof variant.url !== 'string') return null

  try {
    const url = new URL(variant.url)
    return url.protocol === 'https:' && url.hostname === 'video.twimg.com' ? url.toString() : null
  } catch (err) {
    return null
  }
}

const videoOf = tweet => {
  if (!tweet || !Array.isArray(tweet.mediaDetails)) return null

  const videos = tweet.mediaDetails
    .filter(media => media && ['video', 'animated_gif'].includes(media.type) && media.video_info && Array.isArray(media.video_info.variants))
    .flatMap(media => media.video_info.variants)
    .map(variant => ({ url: videoUrl(variant), bitrate: Number(variant && variant.bitrate) || 0 }))
    .filter(video => video.url)
    .sort((left, right) => right.bitrate - left.bitrate)

  return videos[0] ? videos[0].url : null
}

const downloadVideo = url => new Promise((resolve, reject) => {
  let finished = false
  const done = (err, value) => {
    if (finished) return
    finished = true
    if (err) reject(err)
    else resolve(value)
  }

  const request = https.get(url, { headers: { Accept: 'video/mp4' } }, response => {
    const contentType = response.headers['content-type'] || ''
    const contentLength = Number(response.headers['content-length'])
    const maxBytes = maxVideoBytes()

    if (response.statusCode !== 200 || !contentType.toLowerCase().startsWith('video/mp4')) {
      response.resume()
      return done(new Error('video no disponible'))
    }

    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      response.resume()
      return done(new Error('video demasiado grande'))
    }

    const chunks = []
    let total = 0

    response.on('data', chunk => {
      total += chunk.length
      if (total > maxBytes) {
        request.destroy()
        return done(new Error('video demasiado grande'))
      }
      chunks.push(chunk)
    })
    response.on('error', done)
    response.on('end', () => done(null, Buffer.concat(chunks)))
  })

  request.setTimeout(timeoutMs(), () => request.destroy(new Error('timeout')))
  request.on('error', done)
})

const sendUpload = (uploadUrl, content) => new Promise((resolve, reject) => {
  let url
  try {
    url = new URL(uploadUrl)
  } catch (err) {
    reject(err)
    return
  }

  if (url.protocol !== 'https:') {
    reject(new Error('URL de carga insegura'))
    return
  }

  const request = https.request(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Length': content.length
    }
  }, response => {
    response.resume()
    if (response.statusCode >= 200 && response.statusCode < 300) resolve()
    else reject(new Error('carga rechazada'))
  })

  request.setTimeout(timeoutMs(), () => request.destroy(new Error('timeout')))
  request.on('error', reject)
  request.end(content)
})

const uploadVideo = async (web, url, tweetId, channelId, threadTs) => {
  const content = await downloadVideo(url)
  const filename = `x-${tweetId}.mp4`
  const created = await web.apiCall('files.getUploadURLExternal', {
    filename,
    length: content.length,
    alt_txt: 'Video del post en X'
  })

  if (!created || !created.ok || typeof created.file_id !== 'string' || typeof created.upload_url !== 'string') {
    throw new Error('Slack no entregó una URL de carga')
  }

  await sendUpload(created.upload_url, content)

  const completed = await web.apiCall('files.completeUploadExternal', {
    files: JSON.stringify([{ id: created.file_id, title: 'Video del post en X' }]),
    channel_id: channelId,
    initial_comment: 'Video del post en X',
    ...(threadTs ? { thread_ts: threadTs } : {})
  })

  if (!completed || !completed.ok) throw new Error('Slack no confirmó el video')
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

module.exports = (robot, web = defaultWeb) => {
  robot.hear(/#img\b/i, msg => {
    const text = msg.message.rawText || msg.message.text || ''
    const match = text.match(POST_URL)
    if (!match) return

    fetchTweet(robot, match[1], (err, tweet) => {
      if (err) return msg.reply('no pude obtener las imágenes de ese post.')

      const video = videoOf(tweet)
      if (video) {
        uploadVideo(web, video, match[1], msg.message.room, msg.message.thread_ts)
          .catch(() => msg.reply(`no pude publicar el video de ese post. <https://x.com/i/status/${match[1]}|Abrir post en X>`))
        return
      }

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
module.exports.videoOf = videoOf
