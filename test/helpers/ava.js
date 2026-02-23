'use strict'

const ava = require('ava')
const titleCounters = {}

const wrapCbImplementation = implementation => async t => {
  await new Promise((resolve, reject) => {
    let ended = false

    t.end = err => {
      if (ended) return
      ended = true
      if (err) {
        reject(err)
        return
      }
      resolve()
    }

    try {
      implementation(t)
    } catch (error) {
      reject(error)
    }
  })
}

const toArgs = (args) => {
  if (typeof args[0] === 'function') {
    return [wrapCbImplementation(args[0])]
  }

  const title = args[0]
  titleCounters[title] = (titleCounters[title] || 0) + 1
  const uniqueTitle = titleCounters[title] > 1 ? `${title} #${titleCounters[title]}` : title

  return [uniqueTitle, wrapCbImplementation(args[1])]
}

const test = (...args) => ava(...args)

Object.assign(test, ava)

test.cb = (...args) => ava(...toArgs(args))
test.cb.serial = (...args) => ava.serial(...toArgs(args))

module.exports = test
