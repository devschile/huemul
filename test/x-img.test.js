require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')
const nock = require('nock')

const helper = new Helper('../scripts/x-img.js')
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const SYNDICATION = 'https://cdn.syndication.twimg.com'
const IMAGE_URL = 'https://pbs.twimg.com/media/CfwfpnJWwAEXwe3.jpg'

test.beforeEach(t => {
  nock.disableNetConnect()
  t.context.room = helper.createRoom({ httpd: false })
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
