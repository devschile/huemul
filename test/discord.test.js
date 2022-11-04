import 'coffee-script/register'
import Helper from 'hubot-test-helper'
import test from 'ava'

const helper = new Helper('../scripts/discord.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))


test('Devuelve string con el link al discord de devsChile', async t => {
  t.context.room = helper.createRoom({ httpd: false })
  t.context.room.user.say('user', 'hubot discord')
  await sleep(500)
  const hubotResponse = t.context.room.messages[1][1]
  t.true(hubotResponse.includes('https://discord.gg/'))
  t.context.room.destroy()
})
