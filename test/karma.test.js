'use strict'

require('coffee-script/register')
const test = require('ava')
const Helper = require('hubot-test-helper')

const helper = new Helper('../scripts/karma.js')

test.beforeEach(t => {
  t.context.room = helper.createRoom({httpd: true})
  t.context.room.robot.golden = {
    isGold: () => false
  }
  t.context.room.robot.adapter.client = {
    rtm: {
      dataStore: {
        getChannelGroupOrDMById: function () {
          return {is_channel: true}
        }
      }
    },
    //{name: 'leonardo', slack: {profile: {display_name: 'leonardo'}}}
    web: {
      users: {
        list: function () {
          return new Promise(function (resolve) {
            resolve({
              members: [
                {name: 'jorgeepunan', slack: {profile: {display_name: 'jorgeepunan'}}},
                {name: 'leonardo', slack: {profile: {display_name: 'leonardo'}}},
                {name: 'leon', slack: {profile: {display_name: 'leon'}}},
                {name: 'cata', slack: {profile: {display_name: 'cata'}}},
                {name: 'dukuo', slack: {profile: {display_name: 'dukuo'}}},
                {name: 'hector', slack: {profile: {display_name: 'hector'}}},
                {name: 'ienc', slack: {profile: {display_name: 'ienc'}}},
                {name: 'chrisdelcaos', slack: {profile: {display_name: 'chrisdelcaos'}}}
              ]
            })
          })
        }
      }
    }
  }
  t.context.room.robot.brain.userForId('jorgeepunan', {
    name: 'jorgeepunan', id: 1, slack: {profile: {display_name: 'jorgeepunan'}}
  })
  t.context.room.robot.brain.userForId('leonardo', {
    name: 'leonardo', id: 2, slack: {profile: {display_name: 'leonardo'}}
  })
  t.context.room.robot.brain.userForId('leon', {
    name: 'leon', id: 3, slack: {profile: {display_name: 'leon'}}
  })
  t.context.room.robot.brain.userForId('cata', {
    name: 'cata', id: 4, karma: -99, slack: {profile: {display_name: 'cata'}}
  })
  t.context.room.robot.brain.userForId('dukuo', {
    name: 'dukuo', id: 5, slack: {profile: {display_name: 'dukuo'}}
  })
  t.context.room.robot.brain.userForId('hector', {
    name: 'hector', id: 6, slack: {profile: {display_name: 'hector'}}
  })
  t.context.room.robot.brain.userForId('ienc', {
    name: 'ienc', id: 7, slack: {profile: {display_name: 'ienc'}}
  })
  t.context.room.robot.brain.userForId('chrisdelcaos', {
    name: 'chrisdelcaos', id: 8, slack: {profile: {display_name: 'chrisdelcaos'}}
  })
  t.context.room.robot.brain.karmaLimits = {
    user: {3: new Date()}
  }
  t.context.room.robot.brain.data._private['karmaLog'] = [
    {
      name: 'jorgeepunan',
      karma: '-1',
      targetName: 'cata',
      date: '2016-07-29T15:01:30.633Z',
      msg: 'cata--'
    }
  ]
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
      ['hubot', 'c.ata ahora tiene -98 puntos de karma.']
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
    t.deepEqual(t.context.room.messages, [
      ['user', 't++'],
      ['hubot', 'Chaucha, no encuentro al usuario \'t\'.']
    ])
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
      ['hubot', 'c.ata ahora tiene -100 puntos de karma.']
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
test.cb.serial('Aplica karma solo si es menos a uno mismo', t => {
  t.context.room.user.say('ienc', 'ienc--')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['ienc', 'ienc--'],
      ['hubot', 'i.enc ahora tiene -1 puntos de karma.'],
    ])
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
      ['hubot', 'Karma de todos: http://localhost:8080/hubot/karma/todos']
    ])
    t.end()
  }, 500)
})
test.cb.serial('Debe mostrar puntaje y url', t => {
  t.context.room.user.say('user', 'karma leonardo')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'karma leonardo'],
      ['hubot', 'l.eonardo tiene 0 puntos de karma. Más detalles en: http://localhost:8080/hubot/karma/log/leonardo']
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
