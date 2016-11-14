# Description:
#   muestra un gif relacionado con la asombrosa experiencia de trabajar en agencia
#
# Dependencies:
#   express
#   uuid
#
# Configuration:
#   HUBOT_USERS
#   HEROKU_OAUTH_ID
#   HEROKU_OAUTH_SECRET
#
# Commands:
#   hubot agencias add <url> -> Add new gif to agencias
#
# Author:
#   @jorgeepunan

express = require "express"
path = require "path"
uuid = require "uuid"
querystring = require "querystring"

images = [
  'http://i.imgur.com/IW6O268.gif'
  'http://data.whicdn.com/images/66984539/large.gif'
  'http://stream1.gifsoup.com/view6/4649173/disaster-movie-chipmunk-rabies-o.gif'
  'https://media.giphy.com/media/x13saNuWqUPPW/giphy.gif'
  'http://i.imgur.com/PimcI7P.gif'
  'http://i.imgur.com/f6iwaCk.gif'
  'http://i.imgur.com/b1YkaV3.gif'
  'http://31.media.tumblr.com/f08f0922da3d090269f5b90c7cea6cbb/tumblr_inline_o4d5eeZRfB1raprkq_500.gif'
  'https://i.imgur.com/czGiyVX.gif'
  'http://www.gifbin.com/bin/022013/1361304798_dominoes_launch_fail.gif'
  'https://media.giphy.com/media/d71sJZ0RQAPOo/giphy.gif'
  'http://www.gif-king.com/files/uSers/gif-king-e60d7560ccdde09ca0bee3ec54807731.gif'
  'https://i.uploadly.com/2x4tok3k.gif'
]
giphyPattern = /^http\:\/\/giphy\.com\/gifs\/(\w+)/

module.exports = (robot) ->
  hubotHost = process.env.HEROKU_URL or process.env.HUBOT_URL or "http://localhost:8080"

  robot.hear /#agencia|#agencias (.*)/gi, (msg) ->
    msg.send 'agencias... :point_down::skin-tone-4:'
    agencias = robot.brain.get("agencias")
    agencias = "[]" if agencias is null
    agencias = JSON.parse(agencias)
    agencias = agencias.concat(images)
    msg.send(msg.random(agencias))

  robot.respond /agencias add ((https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?)/, (res) ->
    uri = res.match[1]
    agencias = robot.brain.get("agencias")
    agencias = "[]" if agencias is null
    agencias = JSON.parse(agencias)
    uri = fix(uri) if giphyPattern.test(uri)
    agencias.push(uri)
    robot.brain.set("agencias", JSON.stringify(agencias))
    res.send("New image saved :ok_hand:")

  robot.respond /agencias all/, (res) ->
    res.send("Go to #{hubotHost}/agencias/all")

  robot.router.use(express.static(path.join(__dirname, "..", "public")))
  robot.router.set("views", path.join(__dirname, "..", "views"))
  robot.router.set("view engine", "pug")

  robot.router.get "/agencias/all", (req, res) ->
    agencias = robot.brain.get("agencias")
    agencias = "[]" if agencias is null
    agencias = JSON.parse(agencias)
    state = uuid.v4()
    if /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(req.query.token)
      token = req.query.token
    else
      token = ""
    res.render("agencias", {
      agencias: agencias,
      clientId: process.env.HEROKU_OAUTH_ID,
      scope: "identity",
      state: state,
      token: token
    })

  robot.router.get "/agencias/delete", (req, res) ->
    agencias = robot.brain.get("agencias")
    users = process.env.HUBOT_USERS or ""
    users = users.split(",")
    getUser req.query.token, (err, user) ->
      return res.redirect("/agencias/all") if err
      return res.redirect("/agencias/all?token=#{req.query.token}") if user.email not in users
      agencias = "[]" if agencias is null
      agencias = JSON.parse(agencias)
      agencias = agencias.filter((x) -> x isnt req.query.link)
      robot.brain.set("agencias", JSON.stringify(agencias))
      res.redirect("/agencias/all?token=#{req.query.token}")

  fix = (url) ->
    url.replace(giphyPattern, "http://i.giphy.com/$1.gif")

  robot.router.get "/agencias/fix", (req, res) ->
    agencias = robot.brain.get("agencias")
    agencias = "[]" if agencias is null
    agencias = JSON.parse(agencias)
    agencias = agencias.filter((x) -> x isnt req.query.link)
    agencias.push(fix(req.query.link))
    robot.brain.set("agencias", JSON.stringify(agencias))
    res.redirect("/agencias/all")

  robot.router.get "/auth/callback", (req, res) ->
    data = querystring.stringify({
      grant_type: "authorization_code",
      code: req.query.code,
      client_secret: process.env.HEROKU_OAUTH_SECRET
    })
    robot.http("https://id.heroku.com/oauth/token")
      .header("Content-Type", "application/x-www-form-urlencoded")
      .post(data) (err, resp, body) ->
        return res.redirect("/agencias/all") if err
        body = JSON.parse(body)
        res.redirect("/agencias/all?token=#{body.access_token}")

  getUser = (token, cb) ->
    robot.http("https://api.heroku.com/account")
      .header("Authorization", "Bearer #{token}")
      .header("Accept", "application/vnd.heroku+json; version=3")
      .get() (err, resp, body) ->
        return cb(err) if err
        cb(null, JSON.parse(body))
