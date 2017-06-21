import 'coffee-script/register'
import test from 'ava'
import Helper from 'hubot-test-helper'

const helper = new Helper('../scripts/dameunatarjeta.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))

test.beforeEach(t => {
  t.context.room = helper.createRoom({httpd: false})
})

test.afterEach(t => t.context.room.destroy())

test('Dame una tarjeta via', async t => {
  t.context.room.user.say('user', 'hubot dame una visa')
  await sleep(5000)

  const user = t.context.room.messages[0]
  const hubot = t.context.room.messages[1]

  // test message of user
  t.deepEqual(user, ['user', 'hubot dame una visa'])

  // test response messages of hubot
  t.is(hubot[0], 'hubot')
  t.true(/Nº: \d+/ig.test(hubot[1]))
})
