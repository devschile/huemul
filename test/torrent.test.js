import 'coffee-script/register'
import test from 'ava'
import Helper from 'hubot-test-helper'

const helper = new Helper('../scripts/torrent.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))

test.beforeEach(t => {
  t.context.room = helper.createRoom({httpd: false})
})

test.afterEach(t => t.context.room.destroy())

test('Torrent de Mia Khalifa', async t => {
  t.context.room.user.say('user', 'hubot torrent mia khalifa')
  await sleep(5000)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  // test message of user
  t.deepEqual(user, ['user', 'hubot torrent mia khalifa'])

  // test response messages of hubot
  t.deepEqual(hubotMessage1, ['hubot', 'Esperando respuesta de Torrent Project... :clock830:'])
  t.is(hubotMessage2[0], 'hubot')
  t.true(/Mia Khalifa/ig.test(hubotMessage2[1]))
})
