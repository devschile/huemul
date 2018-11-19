'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/karma.js')
const hubotHost = process.env.HEROKU_URL || process.env.HUBOT_URL || 'http://localhost:8080'

test.beforeEach(t => {
  t.context.room = helper.createRoom()
  t.context.room.robot.golden = {
    isGold: () => false
  }
  t.context.room.robot.adapter.client = {
    rtm: {
      dataStore: {
        getChannelGroupOrDMById: function() {
          return { is_channel: true }
        }
      }
    },
    web: {
      users: {
        list: function() {
          return new Promise(function(resolve) {
            resolve({
              members: [
                { name: 'jorgeepunan' },
                { name: 'leonardo' },
                { name: 'leon' },
                { name: 'cata' },
                { name: 'dukuo' },
                { name: 'hector' },
                { name: 'ienc' }
              ]
            })
          })
        }
      }
    }
  }
  t.context.room.robot.brain.userForId('jorgeepunan', {
    name: 'jorgeepunan',
    id: 1
  })
  t.context.room.robot.brain.userForId('leonardo', {
    name: 'leonardo',
    id: 2
  })
  t.context.room.robot.brain.userForId('leon', {
    name: 'leon',
    id: 3
  })
  t.context.room.robot.brain.userForId('cata', {
    name: 'cata',
    id: 4
  })
  t.context.room.robot.brain.userForId('dukuo', {
    name: 'dukuo',
    id: 5
  })
  t.context.room.robot.brain.userForId('hector', {
    name: 'hector',
    id: 6
  })
  t.context.room.robot.brain.userForId('ienc', {
    name: 'ienc',
    id: 7
  })
  const karmaLimits = {
    user: { 3: new Date() }
  }

  t.context.room.robot.brain.set('karmaLimits', karmaLimits)

  const karmaLog = [
    {
      name: 'jorgeepunan',
      karma: -1,
      targetName: 'cata',
      targetId: 4,
      date: '2016-07-29T15:01:30.633Z',
      msg: 'cata--'
    },
    {
      name: 'jorgeepunan',
      karma: -1,
      targetName: 'cata',
      targetId: 4,
      date: '2016-07-29T15:01:30.633Z',
      msg: 'cata--'
    },
    {
      name: 'jorgeepunan',
      karma: -1,
      targetName: 'cata',
      targetId: 4,
      date: '2016-07-29T15:01:30.633Z',
      msg: 'cata--'
    },
    {
      name: 'jorgeepunan',
      karma: -1,
      targetName: 'cata',
      targetId: 4,
      date: '2016-07-29T15:01:30.633Z',
      msg: 'cata--'
    },
    {
      name: 'jorgeepunan',
      karma: -1,
      targetName: 'cata',
      targetId: 4,
      date: '2016-07-29T15:01:30.633Z',
      msg: 'cata--'
    }
  ]

  t.context.room.robot.brain.set('karmaLog', karmaLog)
})

test.afterEach(t => {
  t.context.room.destroy()
})

test.cb.serial('Debe añadir karma con @ y comas después del user', t => {
  t.context.room.user.say('user', '@dukuo++, cata++')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', '@dukuo++, cata++'],
      ['hubot', 'd.ukuo ahora tiene 1 puntos de karma.'],
      ['hubot', 'c.ata ahora tiene -4 puntos de karma.']
    ])
    t.end()
  }, 500)
})
test.cb.serial('Debe aplicar a un usuario', t => {
  t.context.room.user.say('user', 'jorgee-- asdf')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'jorgee-- asdf'],
      ['hubot', 'j.orgeepunan ahora tiene -1 puntos de karma.']
    ])
    t.end()
  }, 500)
})
test.cb.serial('Debe aplicar a ambos usuarios', t => {
  t.context.room.user.say('user', 'jorgee-- leonard++')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'jorgee-- leonard++'],
      ['hubot', 'j.orgeepunan ahora tiene -1 puntos de karma.'],
      ['hubot', 'l.eonardo ahora tiene 1 puntos de karma.']
    ])
    t.end()
  }, 500)
})
test.cb.serial('No Debe aplicar karma', t => {
  t.context.room.user.say('user', 't++')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [['user', 't++'], ['hubot', "Chaucha, no encuentro al usuario 't'."]])
    t.end()
  }, 500)
})
test.cb.serial('No Debe aplicar karma', t => {
  t.context.room.user.say('user', '++')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [['user', '++']])
    t.end()
  }, 500)
})
test.cb.serial('Aplica karma sólo a 5 usuarios', t => {
  t.context.room.user.say('user', 'leonardo++ jorgeepunan-- hector++ dukuo++ cata-- seis++')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'leonardo++ jorgeepunan-- hector++ dukuo++ cata-- seis++'],
      ['hubot', 'l.eonardo ahora tiene 1 puntos de karma.'],
      ['hubot', 'j.orgeepunan ahora tiene -1 puntos de karma.'],
      ['hubot', 'h.ector ahora tiene 1 puntos de karma.'],
      ['hubot', 'd.ukuo ahora tiene 1 puntos de karma.'],
      ['hubot', 'c.ata ahora tiene -6 puntos de karma.']
    ])
    t.end()
  }, 500)
})
test.cb.serial('No intenta aplicar karma a URL que tengan "++" o "--"', t => {
  t.context.room.user.say(
    'user',
    'https://i.pinimg.com/564x/7c/23/0c/7c230c754f30d6a44ed7a4aad9025a94--feels-meme-bodybuilding.jpg'
  )
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'https://i.pinimg.com/564x/7c/23/0c/7c230c754f30d6a44ed7a4aad9025a94--feels-meme-bodybuilding.jpg']
    ])
    t.end()
  }, 500)
})
test.cb.serial('Aplica karma a usuarios y omitir url con "++" y "--"', t => {
  t.context.room.user.say(
    'user',
    'http://placehold.it/200x200/t=++hello leonardo++ jorgeepunan-- https://i.pinimg.com/564x/7c/23/0c/7c230c754f30d6a44ed7a4aad9025a94--meme.jpg'
  )
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      [
        'user',
        'http://placehold.it/200x200/t=++hello leonardo++ jorgeepunan-- https://i.pinimg.com/564x/7c/23/0c/7c230c754f30d6a44ed7a4aad9025a94--meme.jpg'
      ],
      ['hubot', 'l.eonardo ahora tiene 1 puntos de karma.'],
      ['hubot', 'j.orgeepunan ahora tiene -1 puntos de karma.']
    ])
    t.end()
  }, 500)
})
test.cb.serial('No Debe aplicar karma', t => {
  t.context.room.user.say('user', 'leo++')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'leo++'],
      ['hubot', 'Se más específico, hay 2 personas que se parecen a: leonardo, leon.']
    ])
    t.end()
  }, 500)
})
test.cb.serial('No Debe aplicar karma', t => {
  t.context.room.user.say('leonardo', 'leonardo++')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['leonardo', 'leonardo++'],
      ['hubot', '¡Oe no po, el karma es pa otros no pa ti!']
    ])
    t.end()
  }, 500)
})
test.cb.serial('No Debe aplicar karma para excepciones explícitas', t => {
  t.context.room.user.say('user', 'c++')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [['user', 'c++']])
    t.end()
  }, 500)
})
test.cb.serial('No Debe quitar karma para excepciones explícitas', t => {
  t.context.room.user.say('user', 'c--')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [['user', 'c--']])
    t.end()
  }, 500)
})
test.cb.serial('Aplica karma solo si es menos a uno mismo', t => {
  t.context.room.user.say('ienc', 'ienc--')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [['ienc', 'ienc--'], ['hubot', 'i.enc ahora tiene -1 puntos de karma.']])
    t.end()
  }, 500)
})
test.cb.serial('No Debe aplicar karma', t => {
  t.context.room.user.say('user', 'leon++')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages[0], ['user', 'leon++'])
    t.regex(t.context.room.messages[1][1], /¡No abuses! Intenta en \d+ minutos./)
    t.end()
  }, 500)
})
test.cb.serial('Debe mostrar url', t => {
  t.context.room.user.say('user', 'karma todos')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'karma todos'],
      ['hubot', `Karma de todos: ${hubotHost}/hubot/karma/todos`]
    ])
    t.end()
  }, 500)
})
test.cb.serial('Debe mostrar puntaje y url', t => {
  t.context.room.user.say('user', 'karma leonardo')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'karma leonardo'],
      ['hubot', `l.eonardo tiene 0 puntos de karma. Más detalles en: ${hubotHost}/hubot/karma/log/leonardo`]
    ])
    t.end()
  }, 500)
})
test.cb.serial('No debe resetar', t => {
  t.context.room.user.say('user', 'karma reset leonardo')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'karma reset leonardo'],
      ['hubot', 'Tienes que ser :hector: para realizar esta función.']
    ])
    t.end()
  }, 500)
})
test.cb.serial('Debe resetar', t => {
  t.context.room.user.say('hector', 'karma reset leonardo')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['hector', 'karma reset leonardo'],
      ['hubot', 'l.eonardo ha quedado libre de toda bendición o pecado.']
    ])
    t.end()
  }, 500)
})
test.cb.serial('Debe resetar', t => {
  t.context.room.user.say('hector', 'karma reset todos')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['hector', 'karma reset todos'],
      ['hubot', 'Todo el mundo ha quedado libre de toda bendición o pecado.']
    ])
    t.end()
  }, 500)
})
test.cb.serial('No debe tirar todos los usuarios con --', t => {
  t.context.room.user.say('hector', 'T-------T')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [['hector', 'T-------T'], ['hubot', "Chaucha, no encuentro al usuario 'T-'."]])
    t.end()
  }, 500)
})
