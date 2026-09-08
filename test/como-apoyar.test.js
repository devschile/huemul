'use strict'

require('coffeescript/register')
const test = require('./helpers/ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/como-apoyar.js')

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

// El adaptador falso de hubot-test-helper se llama "Room", uno de los nombres
// que el script usa para decidir si responde con attachments de Slack
// (`robot.adapter.client.web.chat.postMessage`). Sin este stub, el handler
// revienta porque el Room de prueba no tiene `.client`.
test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
  t.context.room.robot.adapter.client = {
    web: {
      chat: {
        postMessage: (channel, text, options) => {
          t.context.postMessage = { channel, text, options }
        }
      }
    }
  }
})
test.afterEach(t => {
  t.context.room.destroy()
})

const attachment = t => t.context.postMessage.options.attachments[0]

test('cómo donar responde con el aviso de suscripción obligatoria', async t => {
  t.context.room.user.say('user', 'hubot cómo donar')
  await sleep(300)
  const att = attachment(t)
  t.deepEqual(att.title, 'Cómo donar')
  t.true(att.text.includes('ya no recibimos donaciones'))
  t.true(att.text.includes('suscripción'))
  t.true(att.text.includes('cómo apoyar'))
  t.deepEqual(att.footer, 'Gracias :pray: por el interés en aportar :gold: a que siga creciendo la comunidad devsChile.')
})

test('como donar sin tilde responde igual', async t => {
  t.context.room.user.say('user', 'hubot como donar')
  await sleep(300)
  t.deepEqual(attachment(t).title, 'Cómo donar')
})

test('cómo donar no gatilla la respuesta de apoyar', async t => {
  t.context.room.user.say('user', 'hubot cómo donar')
  await sleep(300)
  t.false(attachment(t).text.includes('Para mantener el servidor'))
  t.deepEqual(attachment(t).fields, undefined)
})

test('cómo apoyar sigue mostrando las vías de suscripción', async t => {
  t.context.room.user.say('user', 'hubot cómo apoyar')
  await sleep(300)
  const att = attachment(t)
  t.deepEqual(att.title, 'Cómo apoyar')
  const titles = att.fields.map(field => field.title)
  t.deepEqual(titles, ['devsChile gold', 'Suscripción mensual', 'Transferencia'])
  t.true(att.text.includes(process.env.SUBSCRIPTION_AMOUNT || '$4.000'))
})

test('cómo apoyar no menciona donaciones', async t => {
  t.context.room.user.say('user', 'hubot cómo apoyar')
  await sleep(300)
  const { text, fields, footer } = attachment(t)
  const blob = [text, footer, ...fields.map(field => `${field.title} ${field.value}`)].join(' ')
  t.false(/donativ|donaci/i.test(blob))
})
