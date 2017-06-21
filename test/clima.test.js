import 'coffee-script/register'
import test from 'ava'
import Helper from 'hubot-test-helper'

const helper = new Helper('../scripts/clima.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))

test.beforeEach(t => {
  t.context.room = helper.createRoom({httpd: false})
})

test.afterEach(t => t.context.room.destroy())

test('Clima Santiago, Chile', async t => {
  t.context.room.user.say('user', 'hubot clima')
  await sleep(5000)

  const user = t.context.room.messages[0]
  const hubot = t.context.room.messages[1]

  t.deepEqual(user, ['user', 'hubot clima'])
  t.is(hubot[0], 'hubot')
  t.true(/Weather report: Santiago, Chile/ig.test(hubot[1]))
})

test('Clima Paris, France', async t => {
  t.context.room.user.say('user', 'hubot clima paris')
  await sleep(5000)

  const user = t.context.room.messages[0]
  const hubot = t.context.room.messages[1]

  t.deepEqual(user, ['user', 'hubot clima paris'])
  t.is(hubot[0], 'hubot')
  t.true(/Weather report: Paris, France/ig.test(hubot[1]))
})
