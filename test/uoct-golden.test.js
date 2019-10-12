import 'coffee-script/register'
import test from 'ava'
import Helper from 'hubot-test-helper'
import nock from 'nock'

const helper = new Helper('../scripts/uoct-golden.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))
const nockIsDone = m =>
  new Promise(resolve => {
    const poller = setInterval(() => {
      if (nock.isDone()) {
        clearInterval(poller)
        resolve()
      }
    }, 100)
  })
nock.disableNetConnect()

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})

test.afterEach(t => {
  t.context.room.destroy()
  nock.cleanAll()
})

test('UOCT - restringido para usuarios gold', async t => {
  t.context.room.robot.golden = {
    isGold: () => false
  }
  t.context.room.user.say('user', 'hubot uoct')
  await sleep(500)

  var msglength = t.context.room.messages.length

  t.true(msglength >= 2, 'hubot no respondió')
  var responseMsg = t.context.room.messages[1][1]
  t.true(
    responseMsg ===
      'Esta funcionalidad es exclusiva para socios golden :monea: de devsChile. Dona en www.devschile.cl para participar de este selecto grupo :huemul-patitas: .'
  )
  return true
})

test('UOCT - cuando no retorna eventos, se responde todo normal', async t => {
  t.context.room.robot.golden = {
    isGold: () => true
  }

  var payload = '{"response":"ok","data":[]}'

  nock('http://www.uoct.cl')
    .post('/wp/wp-admin/admin-ajax.php')
    .times(7)
    .reply(200, payload, { 'content-type': 'text/html; charset=UTF-8' })

  t.context.room.user.say('user', 'hubot uoct')
  await nockIsDone()

  var msglength = t.context.room.messages.length

  t.true(msglength >= 3, 'hubot no respondió')
  var responseMsg = t.context.room.messages[2][1]
  t.is(responseMsg, 'Qué raro, parece que está todo normal :thinking_bachelet: . Intenta más tarde.')
})
test('UOCT - cuando hay un evento imprime correctamente', async t => {
  t.context.room.robot.golden = {
    isGold: () => true
  }

  var emptyPayload = '{"response":"ok","data":[]}'
  var payload = `{"data":[{
    "ID": 128527,
    "post_author": "5",
    "post_date": "2019-10-11 20:07:40",
    "post_date_gmt": "2019-10-11 23:07:40",
    "post_content": "",
    "post_title": "A partir de las 10:00 hrs. de este domingo 13 se realizará Corrida Brooks en Vitacura. Habrá contenciones y desvíos. Detalles del recorrido en la nota.",
    "post_excerpt": "",
    "post_status": "publish",
    "comment_status": "closed",
    "ping_status": "closed",
    "post_password": "",
    "post_name": "a-las-1000-hrs-del-domingo-se-realizara-corrida-brooks-en-vitacura-habra-contenciones-y-desvios-detalles-del-recorrido-en-la-nota",
    "to_ping": "",
    "pinged": "",
    "post_modified": "2019-10-12 14:28:26",
    "post_modified_gmt": "2019-10-12 17:28:26",
    "post_content_filtered": "",
    "post_parent": 0,
    "guid": "http://www.uoct.cl/?post_type=estado_de_transito&#038;p=128527",
    "menu_order": 0,
    "post_type": "estado_de_transito",
    "post_mime_type": "",
    "comment_count": "0",
    "filter": "raw",
    "url": "http://www.uoct.cl/estado_de_transito/a-las-1000-hrs-del-domingo-se-realizara-corrida-brooks-en-vitacura-habra-contenciones-y-desvios-detalles-del-recorrido-en-la-nota/",
    "time": "12 · 10 · 2019 - 14:28"
}]}`

  nock('http://www.uoct.cl')
    .post('/wp/wp-admin/admin-ajax.php')
    .reply(200, payload, { 'content-type': 'text/html; charset=UTF-8' })

  nock('http://www.uoct.cl')
    .post('/wp/wp-admin/admin-ajax.php')
    .times(6)
    .reply(200, emptyPayload, { 'content-type': 'text/html; charset=UTF-8' })

  t.context.room.user.say('user', 'hubot uoct')
  await nockIsDone()

  var msglength = t.context.room.messages.length

  t.true(msglength >= 3, 'hubot no respondió')
  var responseMsg = t.context.room.messages[2][1]
  t.true(
    responseMsg ===
      'Encontrado 1 resultado :bomb::fire:\n14:28: A partir de las 10:00 hrs. de este domingo 13 se realizará Corrida Brooks en Vitacura. Habrá contenciones y desvíos. Detalles del recorrido en la nota.'
  )
  return true
})
test('UOCT - cuando más de 5, solo muestra 5 ', async t => {
  t.context.room.robot.golden = {
    isGold: () => true
  }

  var payload = `{"data":[{
    "ID": 128527,
    "post_author": "5",
    "post_date": "2019-10-11 20:07:40",
    "post_date_gmt": "2019-10-11 23:07:40",
    "post_content": "",
    "post_title": "(Vitacura) tést",
    "post_excerpt": "",
    "post_status": "publish",
    "comment_status": "closed",
    "ping_status": "closed",
    "post_password": "",
    "post_name": "a-las-1000-hrs-del-domingo-se-realizara-corrida-brooks-en-vitacura-habra-contenciones-y-desvios-detalles-del-recorrido-en-la-nota",
    "to_ping": "",
    "pinged": "",
    "post_modified": "2019-10-12 14:28:26",
    "post_modified_gmt": "2019-10-12 17:28:26",
    "post_content_filtered": "",
    "post_parent": 0,
    "guid": "http://www.uoct.cl/?post_type=estado_de_transito&#038;p=128527",
    "menu_order": 0,
    "post_type": "estado_de_transito",
    "post_mime_type": "",
    "comment_count": "0",
    "filter": "raw",
    "url": "http://www.uoct.cl/estado_de_transito/a-las-1000-hrs-del-domingo-se-realizara-corrida-brooks-en-vitacura-habra-contenciones-y-desvios-detalles-del-recorrido-en-la-nota/",
    "time": "12 · 10 · 2019 - 14:28"
}]}`

  nock('http://www.uoct.cl')
    .post('/wp/wp-admin/admin-ajax.php')
    .times(7)
    .reply(200, payload, { 'content-type': 'text/html; charset=UTF-8' })

  t.context.room.user.say('user', 'hubot uoct')
  await sleep(500)

  var msglength = t.context.room.messages.length

  t.true(msglength >= 3, 'hubot no respondió')
  var responseMsg = t.context.room.messages[2][1]
  var expectedMessage =
    'Encontrados 7 resultados :bomb::fire:\n' +
    '14:28: (Vitacura) tést\n' +
    '14:28: (Vitacura) tést\n' +
    '14:28: (Vitacura) tést\n' +
    '14:28: (Vitacura) tést\n' +
    '14:28: (Vitacura) tést\n' +
    '<http://www.uoct.cl|Ver más resultados>'
  t.is(responseMsg, expectedMessage)
})
test('UOCT - cuando 404 entrega mensaje de error', async t => {
  t.context.room.robot.golden = {
    isGold: () => true
  }

  nock('http://www.uoct.cl')
    .post('/wp/wp-admin/admin-ajax.php')
    .times(7)
    .reply(404)

  t.context.room.user.say('user', 'hubot uoct')
  await nockIsDone()

  var msglength = t.context.room.messages.length

  t.true(msglength >= 3, 'hubot no respondió')
  var responseMsg = t.context.room.messages[2][1]
  t.true(responseMsg === 'Error consultando UOCT: no se pudo obtener eventos')
})

test('UOCT - cuando 500 entrega mensaje de error', async t => {
  t.context.room.robot.golden = {
    isGold: () => true
  }

  nock('http://www.uoct.cl')
    .post('/wp/wp-admin/admin-ajax.php')
    .times(7)
    .reply(500)

  t.context.room.user.say('user', 'hubot uoct')
  await nockIsDone()

  var msglength = t.context.room.messages.length

  t.true(msglength >= 3, 'hubot no respondió')
  var responseMsg = t.context.room.messages[2][1]
  t.true(responseMsg === 'Error consultando UOCT: no se pudo obtener eventos')
})
