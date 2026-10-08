require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')
const Hubot = require('hubot-test-helper/node_modules/hubot/es2015')
const nock = require('nock')
const xImg = require('../scripts/x-img.js')

const helper = new Helper([])
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const SYNDICATION = 'https://cdn.syndication.twimg.com'
const IMAGE_URL = 'https://pbs.twimg.com/media/CfwfpnJWwAEXwe3.jpg'
const LOW_VIDEO_URL = 'https://video.twimg.com/ext_tw_video/video-low.mp4'
const VIDEO_URL = 'https://video.twimg.com/ext_tw_video/video.mp4'
const VIDEO_BODY = Buffer.from('video-data')
const UPLOAD_URL = 'https://uploads.slack.test/upload'

const fakeWeb = () => {
  const calls = []

  return {
    calls,
    apiCall: async (method, params) => {
      calls.push({ method, params })

      if (method === 'files.getUploadURLExternal') {
        return { ok: true, file_id: 'F123', upload_url: UPLOAD_URL }
      }

      if (method === 'files.completeUploadExternal') return { ok: true }

      throw new Error(`método inesperado: ${method}`)
    }
  }
}

test.beforeEach(t => {
  nock.disableNetConnect()
  t.context.room = helper.createRoom({ httpd: false })
  t.context.web = fakeWeb()
  xImg(t.context.room.robot, t.context.web)
})

test.afterEach(t => {
  nock.cleanAll()
  nock.enableNetConnect()
  return t.context.room.destroy()
})

test.serial('Publica la imagen del post de X cuando el enlace lleva #img', async t => {
  nock(SYNDICATION)
    .get('/tweet-result')
    .query({ id: '719484841172054016', lang: 'es', token: '1' })
    .reply(200, { photos: [{ url: IMAGE_URL }] })

  t.context.room.user.say('hector', 'https://x.com/edent/status/719484841172054016 #img')
  await sleep(100)

  t.is(t.context.room.messages.length, 2)
  const payload = t.context.room.messages[1][1]
  t.is(payload.text, 'Imagen del post en X')
  t.false(payload.unfurl_links)
  t.false(payload.unfurl_media)
  t.deepEqual(JSON.parse(payload.blocks), [
    {
      type: 'image',
      image_url: IMAGE_URL,
      alt_text: 'Imagen 1 del post en X'
    }
  ])
})

test.serial('Sube el MP4 del post de X sin publicar su enlace', async t => {
  nock(SYNDICATION)
    .get('/tweet-result')
    .query({ id: '20', lang: 'es', token: '1' })
    .reply(200, {
      mediaDetails: [{
        type: 'video',
        video_info: {
          variants: [
            { content_type: 'application/x-mpegURL', url: 'https://video.twimg.com/video.m3u8' },
            { content_type: 'video/mp4', bitrate: 256000, url: LOW_VIDEO_URL },
            { content_type: 'video/mp4', bitrate: 832000, url: VIDEO_URL }
          ]
        }
      }]
    })

  nock('https://video.twimg.com')
    .get('/ext_tw_video/video.mp4')
    .reply(200, VIDEO_BODY, { 'Content-Type': 'video/mp4' })

  nock('https://uploads.slack.test')
    .post('/upload', VIDEO_BODY)
    .reply(200)

  const message = new Hubot.TextMessage(
    new Hubot.User('hector', { room: 'room1' }),
    'https://x.com/jack/status/20 #img'
  )
  message.thread_ts = '1700000000.000001'
  t.context.room.user.say('hector', message)
  await sleep(100)

  t.is(t.context.room.messages.length, 1)
  t.deepEqual(t.context.web.calls, [
    {
      method: 'files.getUploadURLExternal',
      params: {
        filename: 'x-20.mp4',
        length: VIDEO_BODY.length,
        alt_txt: 'Video del post en X'
      }
    },
    {
      method: 'files.completeUploadExternal',
      params: {
        files: JSON.stringify([{ id: 'F123', title: 'Video del post en X' }]),
        channel_id: 'room1',
        initial_comment: 'Video del post en X',
        thread_ts: '1700000000.000001'
      }
    }
  ])
})

test.serial('Enlaza el post sólo cuando no logra subir el video', async t => {
  nock(SYNDICATION)
    .get('/tweet-result')
    .query({ id: '20', lang: 'es', token: '1' })
    .reply(200, {
      mediaDetails: [{
        type: 'video',
        video_info: {
          variants: [{ content_type: 'video/mp4', bitrate: 832000, url: VIDEO_URL }]
        }
      }]
    })

  nock('https://video.twimg.com')
    .get('/ext_tw_video/video.mp4')
    .reply(503)

  t.context.room.user.say('hector', 'https://x.com/jack/status/20 #img')
  await sleep(100)

  t.is(t.context.room.messages.length, 2)
  t.is(t.context.room.messages[1][1], '@hector no pude publicar el video de ese post. <https://x.com/i/status/20|Abrir post en X>')
  t.deepEqual(t.context.web.calls, [])
})

test.serial('Limita la respuesta a las cuatro imágenes máximas de un post', async t => {
  const photos = [1, 2, 3, 4, 5].map(index => ({
    url: `https://pbs.twimg.com/media/imagen-${index}.jpg`
  }))

  nock(SYNDICATION)
    .get('/tweet-result')
    .query({ id: '20', lang: 'es', token: '1' })
    .reply(200, { photos })

  t.context.room.user.say('hector', 'https://x.com/jack/status/20 #img')
  await sleep(100)

  const blocks = JSON.parse(t.context.room.messages[1][1].blocks)
  t.is(blocks.length, 4)
  t.is(blocks[3].image_url, 'https://pbs.twimg.com/media/imagen-4.jpg')
})

test.serial('Indica cuando el post no trae imágenes públicas', async t => {
  nock(SYNDICATION)
    .get('/tweet-result')
    .query({ id: '20', lang: 'es', token: '1' })
    .reply(200, { photos: [] })

  t.context.room.user.say('hector', 'https://x.com/jack/status/20 #img')
  await sleep(100)

  t.is(t.context.room.messages.length, 2)
  t.is(t.context.room.messages[1][1], '@hector ese post no trae imágenes públicas.')
})

test.serial('No consulta ni responde si el enlace no lleva #img', async t => {
  t.context.room.user.say('hector', 'https://x.com/edent/status/719484841172054016')
  await sleep(50)

  t.is(t.context.room.messages.length, 1)
})

test.serial('No publica URLs de imagen fuera de pbs.twimg.com', async t => {
  nock(SYNDICATION)
    .get('/tweet-result')
    .query({ id: '20', lang: 'es', token: '1' })
    .reply(200, { photos: [{ url: 'https://ejemplo.test/imagen.jpg' }] })

  t.context.room.user.say('hector', 'https://x.com/jack/status/20 #img')
  await sleep(100)

  t.is(t.context.room.messages[1][1], '@hector ese post no trae imágenes públicas.')
})

test.serial('Da un error breve si la respuesta no es JSON válido', async t => {
  nock(SYNDICATION)
    .get('/tweet-result')
    .query({ id: '20', lang: 'es', token: '1' })
    .reply(200, 'no es JSON')

  t.context.room.user.say('hector', 'https://x.com/jack/status/20 #img')
  await sleep(100)

  t.is(t.context.room.messages[1][1], '@hector no pude obtener las imágenes de ese post.')
})

test.serial('Da un error breve si la consulta falla', async t => {
  nock(SYNDICATION)
    .get('/tweet-result')
    .query({ id: '20', lang: 'es', token: '1' })
    .replyWithError('falló la conexión')

  t.context.room.user.say('hector', 'https://x.com/jack/status/20 #img')
  await sleep(100)

  t.is(t.context.room.messages[1][1], '@hector no pude obtener las imágenes de ese post.')
})

test.serial('Da un error breve si el servicio responde HTTP no exitoso', async t => {
  nock(SYNDICATION)
    .get('/tweet-result')
    .query({ id: '20', lang: 'es', token: '1' })
    .reply(503)

  t.context.room.user.say('hector', 'https://x.com/jack/status/20 #img')
  await sleep(100)

  t.is(t.context.room.messages[1][1], '@hector no pude obtener las imágenes de ese post.')
})

test.serial('Da un error breve si el servicio responde vacío', async t => {
  nock(SYNDICATION)
    .get('/tweet-result')
    .query({ id: '20', lang: 'es', token: '1' })
    .reply(200, '')

  t.context.room.user.say('hector', 'https://x.com/jack/status/20 #img')
  await sleep(100)

  t.is(t.context.room.messages[1][1], '@hector no pude obtener las imágenes de ese post.')
})

test.serial('No responde a #img sin URL de post de X', async t => {
  t.context.room.user.say('hector', 'https://ejemplo.test/post #img')
  await sleep(50)

  t.is(t.context.room.messages.length, 1)
})
