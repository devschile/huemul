import 'coffee-script/register'
import test from 'ava'
import Helper from 'hubot-test-helper'
import path from 'path'
import nock from 'nock'

const helper = new Helper('../scripts/dameunatarjeta.js')
const nockIsDone = n =>
  new Promise(resolve => {
    const poller = setInterval(() => {
      if (n.isDone()) {
        clearInterval(poller)
        resolve()
      }
    }, 100)
  })
test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
})

test.afterEach(t => t.context.room.destroy())

test('Dame una tarjeta via', async t => {
  const n = nock('https://generatarjetasdecredito.com')
    .get('/generador-tarjetas-visa.php')
    .replyWithFile(200, path.join(__dirname, 'html', 'dameunatarjeta-200.html'))
  t.context.room.user.say('user', 'hubot dame una visa')
  await nockIsDone(n)

  const user = t.context.room.messages[0]
  const hubot = t.context.room.messages[1]

  // test message of user
  t.deepEqual(user, ['user', 'hubot dame una visa'])

  // test response messages of hubot
  t.is(hubot[0], 'hubot')
  t.true(/Nº: \d+/gi.test(hubot[1]))
})
