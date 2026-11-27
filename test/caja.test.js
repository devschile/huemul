require('coffeescript/register')
const crypto = require('crypto')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')
const nock = require('nock')

const helper = new Helper('../scripts/caja.js')
const sleep = m => new Promise(resolve => setTimeout(resolve, m))

const S3 = 'https://s3-static.devschile.cl'
const IMAGE_URL = 'https://images.example.com/fotos/foto.png'

// Cabecera PNG válida (el sniff sólo necesita los primeros bytes)
const PNG = Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), Buffer.alloc(40, 0)])
const SHA256 = crypto.createHash('sha256').update(PNG).digest('hex')

const gold = (room, value = true) => {
  room.robot.golden = { isGold: () => value }
}

const send = async (room, text, wait = 250) => {
  room.user.say('user', text)
  await sleep(wait)
}

const reply = room => room.messages[room.messages.length - 1][1]

const mockHead = (status = 404) => nock(S3).head('/static/caja/foto.png').reply(status, '', { ETag: '"x"' })

test.beforeEach(t => {
  nock.disableNetConnect()
  process.env.CAJA_S3_ACCESS_KEY_ID = 'test-key'
  process.env.CAJA_S3_SECRET_ACCESS_KEY = 'test-secret'
  t.context.room = helper.createRoom({ httpd: false })
  gold(t.context.room)
})

test.afterEach(t => {
  delete process.env.CAJA_S3_ACCESS_KEY_ID
  delete process.env.CAJA_S3_SECRET_ACCESS_KEY
  delete process.env.CAJA_TIMEOUT_MS
  nock.cleanAll()
  nock.enableNetConnect()
  return t.context.room.destroy()
})

test.serial('Sólo gold: deniega antes de tocar la red', async t => {
  gold(t.context.room, false)
  await send(t.context.room, `hubot caja ${IMAGE_URL}`)

  t.true(reply(t.context.room).includes('exclusiva para socios gold'))
})

test.serial('Sin argumentos muestra el uso', async t => {
  await send(t.context.room, 'hubot caja')
  t.is(reply(t.context.room), 'Uso: hubot caja <url de imagen> · máximo 2 MB · jpg, png, gif, webp, avif, bmp, tiff, ico')
})

test.serial('Rechaza IPs y hosts internos sin hacer request', async t => {
  await send(t.context.room, 'hubot caja http://127.0.0.1/foto.png')
  t.true(reply(t.context.room).includes('URL http(s) pública'))

  await send(t.context.room, 'hubot caja http://169.254.169.254/latest/meta-data.png')
  t.true(reply(t.context.room).includes('URL http(s) pública'))
})

test.serial('Sube una imagen válida a la caja', async t => {
  nock('https://images.example.com').get('/fotos/foto.png').reply(200, PNG, { 'Content-Type': 'image/png' })
  let captured = null
  mockHead(404)
  nock(S3)
    .put('/static/caja/foto.png')
    .reply(function (uri, body) {
      captured = {
        body: Buffer.isBuffer(body) ? body.toString('hex') : String(body),
        headers: this.req.headers
      }
      return [200, '', { ETag: '"abc"' }]
    })

  await send(t.context.room, `hubot caja ${IMAGE_URL}`, 400)

  const mensaje = reply(t.context.room)
  t.true(mensaje.includes('static.devschile.cl/caja/foto.png'))
  t.true(mensaje.includes('1 KB'))
  t.truthy(captured)
  t.is(captured.body, PNG.toString('hex'))
  t.is(String(captured.headers['content-type']), 'image/png')
  t.is(String(captured.headers['x-amz-content-sha256']), SHA256)
  t.regex(String(captured.headers.authorization), /^AWS4-HMAC-SHA256 Credential=test-key\/\d{8}\/garage\/s3\/aws4_request, SignedHeaders=/)
})

test.serial('Si el nombre ya existe, agrega sufijo con hash', async t => {
  nock('https://images.example.com').get('/fotos/foto.png').reply(200, PNG, { 'Content-Type': 'image/png' })
  mockHead(200)
  const put = nock(S3)
    .put(/^\/static\/caja\/foto-[0-9a-f]{8}\.png$/)
    .reply(200, '', { ETag: '"abc"' })

  await send(t.context.room, `hubot caja ${IMAGE_URL}`, 400)

  t.true(put.isDone())
  t.regex(reply(t.context.room), /static\.devschile\.cl\/caja\/foto-[0-9a-f]{8}\.png/)
})

test.serial('Rechaza imágenes de más de 2 MB', async t => {
  const grande = Buffer.alloc(2 * 1024 * 1024 + 1, 1)
  nock('https://images.example.com').get('/fotos/foto.png').reply(200, grande, { 'Content-Type': 'image/png' })

  await send(t.context.room, `hubot caja ${IMAGE_URL}`, 400)

  t.true(reply(t.context.room).includes('más de 2 MB'))
})

test.serial('Rechaza contenido que no es imagen', async t => {
  nock('https://images.example.com').get('/fotos/foto.png').reply(200, '<html>no</html>', { 'Content-Type': 'text/html' })

  await send(t.context.room, `hubot caja ${IMAGE_URL}`)

  t.true(reply(t.context.room).includes('no entrega una imagen'))
})

test.serial('Rechaza un archivo con cabecera desconocida aunque diga image/png', async t => {
  nock('https://images.example.com').get('/fotos/foto.png').reply(200, 'no soy una imagen', { 'Content-Type': 'image/png' })

  await send(t.context.room, `hubot caja ${IMAGE_URL}`)

  t.true(reply(t.context.room).includes('no es una imagen soportada'))
})

test.serial('HTTP 404 se informa con el status', async t => {
  nock('https://images.example.com').get('/fotos/foto.png').reply(404)

  await send(t.context.room, `hubot caja ${IMAGE_URL}`)

  t.true(reply(t.context.room).includes('HTTP 404'))
})

test.serial('Timeout de descarga configurable', async t => {
  process.env.CAJA_TIMEOUT_MS = '150'
  nock('https://images.example.com').get('/fotos/foto.png').delayConnection(600).reply(200, PNG, { 'Content-Type': 'image/png' })

  await send(t.context.room, `hubot caja ${IMAGE_URL}`, 700)

  t.true(reply(t.context.room).includes('timeout'))
})

test.serial('Sigue un redirect sólo si el destino es público', async t => {
  nock('https://images.example.com').get('/fotos/foto.png').reply(302, '', { Location: 'https://cdn.example.com/foto.png' })
  nock('https://cdn.example.com').get('/foto.png').reply(200, PNG, { 'Content-Type': 'image/png' })
  mockHead(404)
  nock(S3).put('/static/caja/foto.png').reply(200, '', { ETag: '"abc"' })

  await send(t.context.room, `hubot caja ${IMAGE_URL}`, 400)

  t.true(reply(t.context.room).includes('static.devschile.cl/caja/foto.png'))
})

test.serial('Rechaza redirect a un host interno', async t => {
  nock('https://images.example.com').get('/fotos/foto.png').reply(302, '', { Location: 'http://localhost/foto.png' })

  await send(t.context.room, `hubot caja ${IMAGE_URL}`)

  t.true(reply(t.context.room).includes('redirige a un destino que no acepto'))
})
