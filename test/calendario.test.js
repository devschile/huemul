'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/calendario.js')

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
  Date = function() {
    this.getDate = function() {
      return 14
    }
    this.getMonth = function() {
      return 10
    }
    this.getFullYear = function() {
      return 2018
    }
    this.getDay = function() {
      return 4
    }
  }
})
test.afterEach(t => {
  t.context.room.destroy()
})

test.cb('Debe mostrar calendario del dia', t => {
  t.context.room.user.say('user', 'hubot calendario')
  setTimeout(() => {
    const calendario =
      '```\n\
 Calendario para: Noviembre/2018\n\n\
 Do Lu Ma Mi Ju Vi Sa\n\
 --------------------\n\
             01 02 03 \n\
 04 05 06 07 08 09 10 \n\
 11 12 13 () 15 16 17 \n\
 18 19 20 21 22 23 24 \n\
 25 26 27 28 29 30    \n\
                      \n\
```'

    t.deepEqual(t.context.room.messages, [['user', 'hubot calendario'], ['hubot', calendario]])
    t.end()
  }, 500)
})
