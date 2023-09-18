import 'coffee-script/register'
import test from 'ava'
import Helper from 'hubot-test-helper'

const helper = new Helper('../scripts/fechas-importantes.js')
const sleep = m => new Promise(resolve => setTimeout(() => resolve(), m))

// eslint-disable-next-line no-global-assign
const OriginalDate = Date

/**
 * Overrides Date class to mock a specific date so we can test the accuracy of the script
 */
class MockDateClass {
  constructor (year = 2023, month = 0, day = 1) {
    this.dateObj = new OriginalDate(year, month, day)
    return this.dateObj
  }

  getFullYear () {
    return this.dateObj.getFullYear()
  }
}

test.beforeEach(t => {
  t.context.room = helper.createRoom({ httpd: false })
  // eslint-disable-next-line no-global-assign
  Date = MockDateClass
})
test.afterEach(t => t.context.room.destroy())

test('Debe mostrar la cantidad de dias al 18 de septiembre', async (t) => {
  t.context.room.user.say('user', 'hubot 18')
  await sleep(500)

  const requestedDate = '18'
  const expectedDaysLeft = 260
  const formattedDay = 'Lunes'
  const hubotMessage1 = `:hourglass: Quedan ${expectedDaysLeft} días ${requestedDate}, que será día ${formattedDay}`

  t.deepEqual(t.context.room.messages, [['user', 'hubot 18'], ['hubot', hubotMessage1]])
  t.end()
})
