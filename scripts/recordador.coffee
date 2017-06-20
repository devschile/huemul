# Description:
#   Recordador
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   hubot recuerdame en <tiempo> que tengo que <accion>
#
# Notes:
#   <tiempo> semanas, dias, horas|hrs, segundos|segs
#   <accion> comer, salir, leer ir al baño, cobrar el IVA...
#
# Author:
#   @whitman

class Reminders
  constructor: (@robot) ->
    @cache = []
    @current_timeout = null

    @robot.brain.on 'loaded', =>
      if @robot.brain.data.reminders
        @cache = @robot.brain.data.reminders
        @queue()

  add: (reminder) ->
    @cache.push reminder
    @cache.sort (a, b) -> a.due - b.due
    @robot.brain.data.reminders = @cache
    @queue()

  removeFirst: ->
    reminder = @cache.shift()
    @robot.brain.data.reminders = @cache
    return reminder

  queue: ->
    clearTimeout @current_timeout if @current_timeout
    if @cache.length > 0
      now = new Date().getTime()
      @removeFirst() until @cache.length is 0 or @cache[0].due > now
      if @cache.length > 0
        trigger = =>
          reminder = @removeFirst()
          if reminder
            @robot.reply reminder.msg_envelope, 'me pediste que te recordara que tienes que ' + reminder.action + '. Ahora hazlo.'
          @queue()
        # setTimeout uses a 32-bit INT
        extendTimeout = (timeout, callback) ->
          if timeout > 0x7FFFFFFF
            @current_timeout = setTimeout ->
              extendTimeout (timeout - 0x7FFFFFFF), callback
            , 0x7FFFFFFF
          else
            @current_timeout = setTimeout callback, timeout
        extendTimeout @cache[0].due - now, trigger

class Reminder
  constructor: (@msg_envelope, @time, @action) ->
    @time.replace(/^\s+|\s+$/g, '')

    periods =
      weeks:
        value: 0
        regex: "semanas?"
      days:
        value: 0
        regex: "dias?"
      hours:
        value: 0
        regex: "horas?|hrs?"
      minutes:
        value: 0
        regex: "minutos?|mins?"
      seconds:
        value: 0
        regex: "segundos?|segs?"

    for period of periods
      pattern = new RegExp('^.*?([\\d\\.]+)\\s*(?:(?:' + periods[period].regex + ')).*$', 'i')
      matches = pattern.exec(@time)
      periods[period].value = parseInt(matches[1]) if matches

    @due = new Date().getTime()
    @due += ((periods.weeks.value * 604800) + (periods.days.value * 86400) + (periods.hours.value * 3600) + (periods.minutes.value * 60) + periods.seconds.value) * 1000

  dueDate: ->
    dueDate = new Date @due
    dueDate.toLocaleString()

module.exports = (robot) ->

  reminders = new Reminders robot

  robot.respond /recu[eé]rdame en ((?:(?:\d+) (?:semanas?|dias?|horas?|hrs?|minutos?|mins?|segundos?|segs?)[ ,]*(?:and)? +)+)que tengo que (.*)/i, (msg) ->
    time = msg.match[1]
    action = msg.match[2]
    reminder = new Reminder msg.envelope, time, action
    reminders.add reminder
    msg.send 'Te recordaré que tienes que ' + action + ' a las ' + reminder.dueDate()
