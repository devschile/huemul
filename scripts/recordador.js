// Description:
//   Recordador
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot recuerdame en <tiempo> que tengo que <accion> - Establece un recordatorio
//
// Notes:
//   <tiempo> semanas, dias, horas|hrs, segundos|segs
//   <accion> comer, salir, leer ir al baño, cobrar el IVA...
//
// Author:
//   @whitman

class Reminders {
  constructor(robot) {
    this.robot = robot
    this.cache = []
    this.current_timeout = null

    this.robot.brain.on('loaded', () => {
      const reminders = this.robot.brain.get('reminders')
      if (reminders) {
        this.cache = reminders
        return this.queue()
      }
    })
  }

  add(reminder) {
    this.cache.push(reminder)
    this.cache.sort((a, b) => a.due - b.due)
    this.robot.brain.set('reminders', this.cache)
    this.robot.brain.save()
    return this.queue()
  }

  removeFirst() {
    let reminder = this.cache.shift()
    this.robot.brain.set('reminders', this.cache)
    this.robot.brain.save()
    return reminder
  }

  queue() {
    if (this.current_timeout) {
      clearTimeout(this.current_timeout)
    }
    if (this.cache.length > 0) {
      let now = new Date().getTime()
      while (this.cache.length !== 0 && !(this.cache[0].due > now)) {
        this.removeFirst()
      }
      if (this.cache.length > 0) {
        let trigger = () => {
          let reminder = this.removeFirst()
          if (reminder) {
            this.robot.reply(
              reminder.msg_envelope,
              `me pediste que te recordara que tienes que ${reminder.action}. Ahora hazlo.`
            )
          }
          return this.queue()
        }
        // setTimeout uses a 32-bit INT
        var extendTimeout = (timeout, callback) => {
          if (timeout > 0x7fffffff) {
            return (this.current_timeout = setTimeout(() => extendTimeout(timeout - 0x7fffffff, callback), 0x7fffffff))
          } else {
            return (this.current_timeout = setTimeout(callback, timeout))
          }
        }
        return extendTimeout(this.cache[0].due - now, trigger)
      }
    }
  }
}

class Reminder {
  constructor(msg_envelope, time, action) {
    this.msg_envelope = msg_envelope
    this.time = time
    this.action = action
    this.time.replace(/^\s+|\s+$/g, '')

    let periods = {
      weeks: {
        value: 0,
        regex: 'semanas?'
      },
      days: {
        value: 0,
        regex: 'dias?'
      },
      hours: {
        value: 0,
        regex: 'horas?|hrs?'
      },
      minutes: {
        value: 0,
        regex: 'minutos?|mins?'
      },
      seconds: {
        value: 0,
        regex: 'segundos?|segs?'
      }
    }

    for (let period in periods) {
      let pattern = new RegExp(`^.*?([\\d\\.]+)\\s*(?:(?:${periods[period].regex})).*$`, 'i')
      let matches = pattern.exec(this.time)
      if (matches) {
        periods[period].value = parseInt(matches[1])
      }
    }

    this.due = new Date().getTime()
    this.due +=
      (periods.weeks.value * 604800 +
        periods.days.value * 86400 +
        periods.hours.value * 3600 +
        periods.minutes.value * 60 +
        periods.seconds.value) *
      1000
  }

  dueDate() {
    let dueDate = new Date(this.due)
    return dueDate.toLocaleString()
  }
}

module.exports = robot => {
  let reminders = new Reminders(robot)

  robot.respond(
    /recu[eé]rdame en ((?:(?:\d+) (?:semanas?|dias?|horas?|hrs?|minutos?|mins?|segundos?|segs?)[ ,]*(?:and)? +)+)que tengo que (.*)/i,
    function(msg) {
      let time = msg.match[1]
      let action = msg.match[2]
      let envelope = Object.assign({}, msg.envelope)
      delete envelope.message.rawMessage
      let reminder = new Reminder(envelope, time, action)
      reminders.add(reminder)
      msg.send(`Te recordaré que tienes que ${action} a las ${reminder.dueDate()}`)
    }
  )
}
