import 'coffee-script/register'
import test from 'ava'
import Helper from 'hubot-test-helper'
import nock from 'nock'

const helper = new Helper('../scripts/teleton.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})

test.afterEach(t => t.context.room.destroy())

test('Teleton - obtener cómputo válido', async t => {
  const cifra = '$58.540.000.000'

  nock('https://axtoczxlicpz.objectstorage.sa-santiago-1.oci.customer-oci.com')
    .get('/n/axtoczxlicpz/b/teleton-bucket/o/computo.json')
    .reply(200, {
      cifra
    })

  t.context.room.user.say('user', 'hubot teleton')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubot = t.context.room.messages[1]

  t.deepEqual(user, ['user', 'hubot teleton'])
  t.is(hubot[0], 'hubot')
  t.true(/Cómputo a las \d{2}:\d{2} \d{2}\/\d{2}\/\d{4}: \$58\.540\.000\.000/i.test(hubot[1]))
})

test('Teleton - error HTTP 500', async t => {
  nock('https://axtoczxlicpz.objectstorage.sa-santiago-1.oci.customer-oci.com')
    .get('/n/axtoczxlicpz/b/teleton-bucket/o/computo.json')
    .reply(500)

  t.context.room.user.say('user', 'hubot teleton')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubot = t.context.room.messages[1]

  t.deepEqual(user, ['user', 'hubot teleton'])
  t.deepEqual(hubot, [
    'hubot',
    '@user ocurrió un error al obtener el cómputo de la Teletón'
  ])
})

test('Teleton - error 404', async t => {
  nock('https://axtoczxlicpz.objectstorage.sa-santiago-1.oci.customer-oci.com')
    .get('/n/axtoczxlicpz/b/teleton-bucket/o/computo.json')
    .reply(404)

  t.context.room.user.say('user', 'hubot teleton')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubot = t.context.room.messages[1]

  t.deepEqual(user, ['user', 'hubot teleton'])
  t.deepEqual(hubot, [
    'hubot',
    '@user ocurrió un error al obtener el cómputo de la Teletón'
  ])
})

test('Teleton - datos inválidos (sin cifra)', async t => {
  nock('https://axtoczxlicpz.objectstorage.sa-santiago-1.oci.customer-oci.com')
    .get('/n/axtoczxlicpz/b/teleton-bucket/o/computo.json')
    .reply(200, {
      invalid: 'data'
    })

  t.context.room.user.say('user', 'hubot teleton')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubot = t.context.room.messages[1]

  t.deepEqual(user, ['user', 'hubot teleton'])
  t.deepEqual(hubot, [
    'hubot',
    '@user los datos no tienen el formato esperado'
  ])
})
