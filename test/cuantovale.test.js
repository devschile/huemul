import 'coffee-script/register'
import test from 'ava'
import Helper from 'hubot-test-helper'

const helper = new Helper('../scripts/cuantovale.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))

test.beforeEach(t => {
  t.context.room = helper.createRoom({httpd: false})
})

test.afterEach(t => t.context.room.destroy())

test('Cuanto vale devschile.cl', async t => {
  t.context.room.user.say('user', 'hubot cuantovale devschile.cl')
  await sleep(15000)

  const user = t.context.room.messages[0]
  const hubotMessage1 = t.context.room.messages[1]
  const hubotMessage2 = t.context.room.messages[2]

  // test message of user
  t.deepEqual(user, ['user', 'hubot cuantovale devschile.cl'])

  // test response messages of hubot
  t.deepEqual(hubotMessage1, ['hubot', ':timer_clock: buscando...'])
  t.is(hubotMessage2[0], 'hubot')
  t.true(/:monea: devschile.cl is worth \$\d.*/ig.test(hubotMessage2[1]))
})
