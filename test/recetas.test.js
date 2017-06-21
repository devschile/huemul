import 'coffee-script/register'
import test from 'ava'
import Helper from 'hubot-test-helper'

const helper = new Helper('../scripts/recetas.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))

test.beforeEach(t => {
  t.context.room = helper.createRoom({httpd: false})
})

test.afterEach(t => t.context.room.destroy())

test('Recetas de empanada', async t => {
  t.context.room.user.say('user', 'hubot recetas empanadas')
  await sleep(5000)

  const user = t.context.room.messages[0]
  const hubot = t.context.room.messages[1]

  // test message of user
  t.deepEqual(user, ['user', 'hubot recetas empanadas'])

  // test response messages of hubot
  t.is(hubot[0], 'hubot')
  t.true(/receta de empanada/ig.test(hubot[1]))
})
