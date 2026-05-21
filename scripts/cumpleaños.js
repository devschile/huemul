// Description:
//   Calendario de cumpleaños para la comunidad devsChile
//
// Dependencies:
//   node-cron
//
// Configuration:
//   BIRTHDAY_CHANNEL
//
// Commands:
//   huemul cumple set DD/MM - Registrar tu cumpleaños
//   huemul cumple delete - Eliminar tu cumpleaños
//   huemul cumple hoy - Ver cumpleaños de hoy
//   huemul cumple mes - Ver cumpleaños del presente mes
//   huemul cumple lista - Ver lista completa de cumpleaños
//
// Author:
//   catuga

const cron = require('node-cron')
const { getClient } = require('./helpers/client')

const BIRTHDAY_CHANNEL = process.env.BIRTHDAY_CHANNEL || 'general'
const CRON_SETTINGS = '0 9 * * *'

const today = () => {
  const now = new Date()
  return { day: now.getDate(), month: now.getMonth() + 1 }
}

const getBirthdaysByDate = (robot, day, month) => {
  const birthdays = JSON.parse(robot.brain.get('birthdays') || '{}')
  return Object.values(birthdays).filter(b => b.day === day && b.month === month)
}

const getBirthdaysByMonth = (robot, month) => {
  const birthdays = JSON.parse(robot.brain.get('birthdays') || '{}')
  return Object.values(birthdays)
    .filter(b => b.month === month)
    .sort((a, b) => a.day - b.day)
}

const isValidDate = (day, month) => {
  if (month < 1 || month > 12) return false
  const daysInMonth = new Date(2000, month, 0).getDate()
  return day >= 1 && day <= daysInMonth
}

module.exports = robot => {
  let channelId = null

  robot.brain.on('loaded', () => {
    const web = getClient()
    web.conversations.list({ limit: 1000 }).then(res => {
      const ch = res.channels.find(c => c.name === BIRTHDAY_CHANNEL)
      if (ch) channelId = ch.id
    })
  })

  robot.respond(/cumple set (\d{1,2})\/(\d{1,2})/i, msg => {
    const day = parseInt(msg.match[1], 10)
    const month = parseInt(msg.match[2], 10)
    if (!isValidDate(day, month)) {
      return msg.send(`La fecha ${day}/${month} no es válida.`)
    }
    const birthdays = JSON.parse(robot.brain.get('birthdays') || '{}')
    birthdays[msg.message.user.name] = { user: msg.message.user.name, day, month }
    robot.brain.set('birthdays', JSON.stringify(birthdays))
    robot.brain.save()
    msg.send(`Listo, registré tu cumpleaños el ${day}/${month} 🎂`)
  })

  robot.respond(/cumple delete/i, msg => {
    const birthdays = JSON.parse(robot.brain.get('birthdays') || '{}')
    delete birthdays[msg.message.user.name]
    robot.brain.set('birthdays', JSON.stringify(birthdays))
    robot.brain.save()
    msg.send('Tu cumpleaños fue eliminado del calendario.')
  })

  robot.respond(/cumple hoy/i, msg => {
    const { day, month } = today()
    const matches = getBirthdaysByDate(robot, day, month)
    if (matches.length === 0) return msg.send('Nadie cumple años hoy.')
    msg.send(`Hoy cumplen años: ${matches.map(b => b.user).join(', ')}`)
  })

  robot.respond(/cumple mes/i, msg => {
    const { month } = today()
    const matches = getBirthdaysByMonth(robot, month)
    if (matches.length === 0) return msg.send('Nadie cumple años este mes.')
    const list = matches.map(b => `${b.user} (${b.day}/${b.month})`).join('\n')
    msg.send(`Cumpleaños de este mes:\n${list}`)
  })

  robot.respond(/cumple lista/i, msg => {
    const birthdays = JSON.parse(robot.brain.get('birthdays') || '{}')
    const list = Object.values(birthdays).sort((a, b) => a.month - b.month || a.day - b.day)
    if (list.length === 0) return msg.send('No hay cumpleaños registrados.')
    const text = list.map(b => `${b.user}: ${b.day}/${b.month}`).join('\n')
    msg.send(`Calendario de cumpleaños:\n${text}`)
  })

  const cronJob = cron.schedule(CRON_SETTINGS, () => {
    const { day, month } = today()
    const matches = getBirthdaysByDate(robot, day, month)
    if (matches.length > 0 && channelId) {
      const names = matches.map(b => b.user).join(', ')
      robot.send({ room: channelId }, `Feliz cumpleaños ${names}! 🎉🎂`)
    }
  })

  process.on('exit', () => cronJob.stop())
}
