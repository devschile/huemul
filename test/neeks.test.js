import 'coffee-script/register'
import test from 'ava'
import Helper from 'hubot-test-helper'
import path from 'path'
import nock from 'nock'

const helper = new Helper('../scripts/neeks.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})

test.afterEach(t => t.context.room.destroy())

test('Neeks Game Boy 200', async t => {
  nock('https://neeks.cl/')
    .get('?s=game+boy&post_type=product')
    .replyWithFile(200, path.join(__dirname, 'html', 'neeks-200.html'))
  t.context.room.user.say('user', 'hubot neeks game boy')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  // test message of user
  t.deepEqual(user, ['user', 'hubot neeks game boy'])

  // test response messages of hubot
  t.deepEqual(hubotMessage1, ['hubot', ':joystick: buscando game boy...'])
  t.deepEqual(hubotMessage2, [
    'hubot',
    ' - Dock de Carga Apple Watch: _$14.990_\n  https://neeks.cl/producto/dock-de-carga-apple-watch/\n' +
    ' - Multiconsola RETRO Emuelec G5 HDMI: _$99.990_\n  https://neeks.cl/producto/multiconsola-retro-gamebox-g5-hdmi/'
  ])
})

test('Neeks 301', async t => {
  nock('https://neeks.cl/')
    .get('?s=dildo_301&post_type=product')
    .reply(301)
  t.context.room.user.say('user', 'hubot neeks dildo')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  // test message of user
  t.deepEqual(user, ['user', 'hubot neeks 301'])

  // test response messages of hubot
  t.deepEqual(hubotMessage1, ['hubot', ':joystick: buscando dildo...'])
  t.deepEqual(hubotMessage2, ['hubot', ':pinceleart: mató al animal'])
})
