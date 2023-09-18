import 'coffee-script/register'
import test from 'ava'
import Helper from 'hubot-test-helper'

const helper = new Helper('../scripts/fechas-importantes.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})
test.afterEach(t => t.context.room.destroy())

test('Debe mostrar una respuesta válida sin NaN, Undefined o Invalid date para el 18 de septiembre', async (t) => {
  t.context.room.user.say('user', 'hubot 18')
  await sleep(500)

  const hubotMessageResponse = t.context.room.messages[1]
  t.is(hubotMessageResponse[0], 'hubot')
  t.false(/(NaN|undefined|Invalid date)/g.test(hubotMessageResponse[1]))
})

test('Debe mostrar una respuesta válida sin NaN, Undefined o Invalid date para navidad', async (t) => {
  t.context.room.user.say('user', 'hubot navidad')
  await sleep(500)

  const hubotMessageResponse = t.context.room.messages[1]
  t.is(hubotMessageResponse[0], 'hubot')
  t.false(/(NaN|undefined|Invalid date)/g.test(hubotMessageResponse[1]))
})

test('Debe mostrar una respuesta válida sin NaN, Undefined o Invalid date para año nuevo', async (t) => {
  t.context.room.user.say('user', 'hubot año nuevo')
  await sleep(500)

  const hubotMessageResponse = t.context.room.messages[1]
  t.is(hubotMessageResponse[0], 'hubot')
  t.false(/(NaN|undefined|Invalid date)/g.test(hubotMessageResponse[1]))
})

test('Debe mostrar una respuesta válida sin NaN, Undefined o Invalid date para aniversario', async (t) => {
  t.context.room.user.say('user', 'hubot aniversario')
  await sleep(500)

  const hubotMessageResponse = t.context.room.messages[1]
  t.is(hubotMessageResponse[0], 'hubot')
  t.false(/(NaN|undefined|Invalid date)/g.test(hubotMessageResponse[1]))
})
