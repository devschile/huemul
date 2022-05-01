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

  // test user's message
  t.deepEqual(user, ['user', 'hubot neeks game boy'])
  // test hubot's response messages
  t.deepEqual(hubotMessage1, ['hubot', ':joystick: cargando Neeks.cl...'])
  t.deepEqual(hubotMessage2, ['hubot', '@user :pinceleart: mató al animal'])
})

test('Neeks 301', async (t) => {
  nock('https://neeks.cl/')
    .get('?s=301&post_type=product')
    .reply(301)
  t.context.room.user.say('user', 'hubot neeks 301')
  await sleep(500)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  // test user's message
  t.deepEqual(user, ['user', 'hubot neeks 301'])

  // test hubot's response messages
  t.deepEqual(hubotMessage1, ['hubot', ':joystick: cargando Neeks.cl...'])
  t.deepEqual(hubotMessage2, ['hubot', '@user :pinceleart: mató al animal'])
})
