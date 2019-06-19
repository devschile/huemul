// Description:
//   muestra un gif relacionado con la asombrosa experiencia de trabajar en agencia
//
// Dependencies:
//   express
//   uuid
//
// Configuration:
//   HUBOT_USERS
//   HEROKU_OAUTH_ID
//   HEROKU_OAUTH_SECRET
//
// Commands:
//   hubot agencias add <url> - Add new gif to #agencias
//   hubot agencias all - Show all gifs of #agencias
//   #agencias - Get a new gif of #agencias
//   #agencia - Get a new gif of #agencias
//
// Author:
//   @jorgeepunan

const express = require('express')
const path = require('path')
const uuidV4 = require('uuid/v4')
const querystring = require('querystring')

const images = [
  'http://i.imgur.com/IW6O268.gif',
  'http://stream1.gifsoup.com/view6/4649173/disaster-movie-chipmunk-rabies-o.gif',
  'https://media.giphy.com/media/x13saNuWqUPPW/giphy.gif',
  'http://i.imgur.com/PimcI7P.gif',
  'http://i.imgur.com/f6iwaCk.gif',
  'http://i.imgur.com/b1YkaV3.gif',
  'http://31.media.tumblr.com/f08f0922da3d090269f5b90c7cea6cbb/tumblr_inline_o4d5eeZRfB1raprkq_500.gif',
  'https://i.imgur.com/czGiyVX.gif',
  'http://www.gifbin.com/bin/022013/1361304798_dominoes_launch_fail.gif',
  'https://media.giphy.com/media/d71sJZ0RQAPOo/giphy.gif',
  'http://www.gif-king.com/files/uSers/gif-king-e60d7560ccdde09ca0bee3ec54807731.gif',
  'https://i.uploadly.com/2x4tok3k.gif'
]

const giphyPattern = /^http:\/\/giphy\.com\/gifs\/(\w+)/

module.exports = robot => {
  const hubotHost = process.env.HEROKU_URL || process.env.HUBOT_URL || 'http://localhost:8080'

  robot.hear(/#agencia|#agencias (.*)/gi, res => {
    let agencias = robot.brain.get('agencias')
    if (agencias === null) agencias = '[]'
    agencias = JSON.parse(agencias)
    agencias = agencias.concat(images)
    res.send('agencias... :point_down::skin-tone-4:\n' + res.random(agencias))
  })

  robot.respond(/agencias add ((https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?)/, res => {
    let uri = res.match[1]
    let agencias = robot.brain.get('agencias')
    if (agencias === null) agencias = '[]'
    agencias = JSON.parse(agencias)
    if (giphyPattern.test(uri)) uri = fix(uri)
    agencias.push(uri)
    robot.brain.set('agencias', JSON.stringify(agencias))
    res.send('New image saved :ok_hand:')
  })

  robot.respond(/agencias all/, res => {
    res.send(`Go to ${hubotHost}/agencias/all`)
  })

  robot.router.use(express['static'](path.join(__dirname, '..', 'public')))
  robot.router.set('views', path.join(__dirname, '..', 'views'))
  robot.router.set('view engine', 'pug')

  robot.router.get('/agencias/all', (req, res) => {
    let token
    let agencias = robot.brain.get('agencias')
    if (agencias === null) agencias = '[]'
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(req.query.token)) {
      token = req.query.token
    } else {
      token = ''
    }
    return res.render('agencias', {
      agencias: JSON.parse(agencias),
      clientId: process.env.HEROKU_OAUTH_ID,
      scope: 'identity',
      state: uuidV4(),
      token: token
    })
  })

  const getUser = (token, cb) => {
    robot
      .http('https://api.heroku.com/account')
      .header('Authorization', `Bearer ${token}`)
      .header('Accept', 'application/vnd.heroku+json; version=3')
      .get()((err, resp, body) => cb(err, JSON.parse(body)))
  }

  robot.router.get('/agencias/delete', (req, res) => {
    let users = process.env.HUBOT_USERS || ''
    users = users.split(',')
    getUser(req.query.token, (err, user) => {
      if (err) return res.redirect('/agencias/all')
      if (!users.includes(user.email)) {
        return res.redirect('/agencias/all?token=' + req.query.token)
      }
      let agencias = robot.brain.get('agencias')
      if (agencias === null) agencias = '[]'
      agencias = JSON.parse(agencias)
      agencias = agencias.filter(link => link !== req.query.link)
      robot.brain.set('agencias', JSON.stringify(agencias))
      res.redirect(`/agencias/all?token=${req.query.token}`)
    })
  })

  const fix = url => {
    url.replace(giphyPattern, 'http://i.giphy.com/$1.gif')
  }

  robot.router.get('/agencias/fix', (req, res) => {
    let agencias = robot.brain.get('agencias')
    if (agencias === null) agencias = '[]'
    agencias = JSON.parse(agencias)
    agencias = agencias.filter(link => link !== req.query.link)
    agencias.push(fix(req.query.link))
    robot.brain.set('agencias', JSON.stringify(agencias))
    res.redirect('/agencias/all')
  })

  robot.router.get('/auth/callback', (req, res) => {
    const data = querystring.stringify({
      grant_type: 'authorization_code',
      code: req.query.code,
      client_secret: process.env.HEROKU_OAUTH_SECRET
    })
    robot
      .http('https://id.heroku.com/oauth/token')
      .header('Content-Type', 'application/x-www-form-urlencoded')
      .post(data)((err, resp, body) => {
      if (err) return res.redirect('/agencias/all')
      body = JSON.parse(body)
      res.redirect(`/agencias/all?token=${body.access_token}`)
    })
  })
}
