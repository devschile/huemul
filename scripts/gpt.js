// Description:
//   This script uses the OpenAI API to generate text using GPT-3
//
// Dependencies:
//   openai
//
// Configuration:
//   OPENAI_API_KEY
//   HUBOT_AUTH_ADMIN
//
// Commands:
//   hubot gpt <text> - Generates text using GPT-3
//   hubot gpt-set-time-limit <minutes> - Sets the time limit for the gpt command
//   hubot gpt-code <code> - Generates code using GPT-3
//
// Author:
//   @gmq

const { Configuration, OpenAIApi } = require('openai')
const client = require('./helpers/client')
const web = client.getClient()

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
})
const openai = new OpenAIApi(configuration)
const admins = process.env.HUBOT_AUTH_ADMIN ? process.env.HUBOT_AUTH_ADMIN.split(',') : []

function checkRateLimit (robot, res) {
  const rateLimitTime = robot.brain.get('GPTrateLimitTime') || 0
  const rateLimit = robot.brain.get('GPTrateLimit') || {}
  const timeLimit = robot.golden.isGold(res.message.user.name) ? rateLimitTime / 2 : rateLimitTime
  const now = new Date()
  const user = res.message.user.id
  if (rateLimit[user] && rateLimit[user] > now && admins.indexOf(user) === -1) {
    const approximateTime = Math.round((rateLimit[user] - now) / 1000 / 60)
    res.send(`No puedes usar este comando tan seguido, intenta de nuevo en ${approximateTime} minutos aprox.`)
    return true
  }
  rateLimit[user] = new Date(now.getTime() + timeLimit)
  robot.brain.set('GPTrateLimit', rateLimit)
  return false
}

async function isFlagged (message, res) {
  const moderation = await openai.createModeration({
    input: message
  })

  if (moderation.data.results[0].flagged) {
    res.send('Que mala persona, ofendiste mis sensibilidades y las de OpenAI.')
    return true
  }
  return false
}

module.exports = function (robot) {
  robot.respond(/gpt-set-time-limit (.*)/, function (res) {
    if (admins.indexOf(res.message.user.id) !== -1) {
      const time = res.match[1]
      const rateLimitTime = 1000 * 60 * time
      robot.brain.set('GPTrateLimitTime', rateLimitTime)
      res.send(`Se ha establecido el límite de tiempo a ${time} minutos.`)
    } else {
      res.send('No tienes permisos para ejecutar este comando.')
    }
  })

  robot.respond(/gpt (.*)/i, async function (res) {
    web.conversations.info({ channel: res.envelope.room }).then(async convInfo => {
      if (convInfo.channel && convInfo.channel.is_channel) {
        const prompt = `${res.match[1]}.`

        if (checkRateLimit(robot, res)) {
          return
        }

        try {
          if (await isFlagged(prompt, res)) {
            return
          }

          const completion = await openai.createCompletion({
            model: 'text-davinci-003',
            prompt: prompt,
            max_tokens: 512,
            user: res.message.user.id
          })

          const finalMessage = `**${res.match[1]}**\n${completion.data.choices[0].text}`
          res.send(finalMessage)
        } catch (error) {
          res.send(error.message)
        }
      }
    })
  })

  robot.respond(/gpt-code([^]*)/mi, async function (res) {
    web.conversations.info({ channel: res.envelope.room }).then(async convInfo => {
      if (convInfo.channel && convInfo.channel.is_channel) {
        const prompt = res.match[1].trim()

        if (checkRateLimit(robot, res)) {
          return
        }

        try {
          if (await isFlagged(prompt, res)) {
            return
          }

          const completion = await openai.createCompletion({
            model: 'code-davinci-002',
            prompt: prompt,
            temperature: 0,
            max_tokens: 512,
            frequency_penalty: 1,
            echo: true,
            user: res.message.user.id
          })

          res.send(`\`\`\`${completion.data.choices[0].text}\`\`\``)
        } catch (error) {
          res.send(error.message)
        }
      }
    })
  })
}
