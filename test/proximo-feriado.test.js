/* eslint-disable no-global-assign */
const test = require('ava')
const Helper = require('hubot-test-helper')
const nock = require('nock')
const sinon = require('sinon')

const helper = new Helper('../scripts/proximo-feriado.js')

const HOLIDAYS_2022 = [
  { nombre: 'A\u00f1o Nuevo', comentarios: null, fecha: '2022-01-01', irrenunciable: '1', tipo: 'Civil' },
  { nombre: 'Viernes Santo', comentarios: null, fecha: '2022-04-15', irrenunciable: '0', tipo: 'Religioso' },
  { nombre: 'Sabado Santo', comentarios: null, fecha: '2022-04-16', irrenunciable: '0', tipo: 'Religioso' },
  {
    nombre: 'D\u00eda Nacional del Trabajo',
    comentarios: null,
    fecha: '2022-05-01',
    irrenunciable: '1',
    tipo: 'Civil'
  },
  {
    nombre: 'D\u00eda de las Glorias Navales',
    comentarios: null,
    fecha: '2022-05-21',
    irrenunciable: '0',
    tipo: 'Civil'
  },
  {
    nombre: 'D\u00eda Nacional de los Pueblos Ind\u00edgenas',
    comentarios: null,
    fecha: '2022-06-21',
    irrenunciable: '0',
    tipo: 'Civil'
  },
  { nombre: 'San Pedro y San Pablo', comentarios: null, fecha: '2022-06-27', irrenunciable: '0', tipo: 'Religioso' },
  {
    nombre: 'D\u00eda de la Virgen del Carmen',
    comentarios: null,
    fecha: '2022-07-16',
    irrenunciable: '0',
    tipo: 'Religioso'
  },
  {
    nombre: 'Asunci\u00f3n de la Virgen',
    comentarios: null,
    fecha: '2022-08-15',
    irrenunciable: '0',
    tipo: 'Religioso'
  },
  { nombre: 'Independencia Nacional', comentarios: null, fecha: '2022-09-18', irrenunciable: '1', tipo: 'Civil' },
  {
    nombre: 'D\u00eda de las Glorias del Ejercito',
    comentarios: null,
    fecha: '2022-09-19',
    irrenunciable: '1',
    tipo: 'Civil'
  },
  { nombre: 'Encuentro de Dos Mundos', comentarios: null, fecha: '2022-10-10', irrenunciable: '0', tipo: 'Civil' },
  {
    nombre: 'D\u00eda de las Iglesias Evang\u00e9licas y Protestantes',
    comentarios: null,
    fecha: '2022-10-31',
    irrenunciable: '0',
    tipo: 'Religioso'
  },
  {
    nombre: 'D\u00eda de Todos los Santos',
    comentarios: null,
    fecha: '2022-11-01',
    irrenunciable: '0',
    tipo: 'Religioso'
  },
  {
    nombre: 'Inmaculada Concepci\u00f3n',
    comentarios: null,
    fecha: '2022-12-08',
    irrenunciable: '0',
    tipo: 'Religioso'
  },
  { nombre: 'Navidad', comentarios: null, fecha: '2022-12-25', irrenunciable: '1', tipo: 'Religioso' }
]

test.beforeEach(t => {
  nock('https://apis.digital.gob.cl')
    .get('/fl/feriados/2022')
    .reply(200, HOLIDAYS_2022)
  t.context.room = helper.createRoom({ httpd: false })
})

test.afterEach(t => {
  t.context.room.destroy()
})

test.cb('debe mostrar que el dia es feriado cuando la fecha es 21-06-2022 y el siguiente feriado', t => {
  const clock = sinon.useFakeTimers({ now: new Date(2022, 5, 21).getTime(), shouldAdvanceTime: true })
  t.context.room.user.say('user', 'hubot proximo feriado')
  setTimeout(() => {
    t.deepEqual(t.context.room.messages, [
      ['user', 'hubot proximo feriado'],
      ['hubot', '*¡HOY es feriado!* Se celebra: *Día Nacional de los Pueblos Indígenas (_civil_)*. ¡Disfrútalo!'],
      ['hubot', 'El próximo feriado es el *Lunes 27 de Junio*, quedan *6 días*. Se celebra: *San Pedro y San Pablo (_religioso_)*']
    ])
    t.end()
    clock.restore()
  }, 500)
})
