Helper = require("hubot-test-helper")
expect = require("chai").expect
http = require("http")

helper = new Helper("../scripts/karma.coffee")

describe "karma", ->
  beforeEach ->
    @room = helper.createRoom()
    @room.robot.adapter.client =
      rtm:
        dataStore:
          getChannelGroupOrDMById: (room) ->
            is_channel: true
      web:
        users:
          list: () ->
            return new Promise (resolve) ->
              resolve members: [
                {name: "jorgeepunan"}
                {name: "leonardo"}
                {name: "leon"}
                {name: "cata"}
                {name: "dukuo"}
                {name: "hector"}
              ]
    @room.robot.brain.userForId "jorgeepunan",
      name: "jorgeepunan"
      id: 1
    @room.robot.brain.userForId "leonardo",
      name: "leonardo"
      id: 2
    @room.robot.brain.userForId "leon",
      name: "leon"
      id: 3
    @room.robot.brain.userForId "cata",
      name: "cata"
      id: 4
      karma: -99
    @room.robot.brain.userForId "dukuo",
      name: "dukuo"
      id: 5
    @room.robot.brain.userForId "hector",
      name: "hector"
      id: 6
    @room.robot.brain.karmaLimits =
      user:
        3: new Date()
    @room.robot.brain.data._private["karmaLog"] = [
      {name: "jorgeepunan", karma: "-1", targetName: "cata", date: "2016-07-29T15:01:30.633Z", msg: "cata--"}
    ]

  afterEach ->
    @room.destroy()

  context "Karma unico", ->
    beforeEach (done) ->
      @room.user.say("user", "jorgee-- asdf")
      setTimeout(done, 500)

    it "Debe aplicar a un usuario", ->
      expect(@room.messages).to.eql([
        ["user", "jorgee-- asdf"]
        ["hubot", "j.orgeepunan ahora tiene -1 puntos de karma."]
      ])

  context "Karma multiple", ->
    beforeEach (done) ->
      @room.user.say("user", "jorgee-- leonard++")
      setTimeout(done, 500)

    it "Debe aplicar a ambos usuarios", ->
      expect(@room.messages).to.eql([
        ["user", "jorgee-- leonard++"]
        ["hubot", "j.orgeepunan ahora tiene -1 puntos de karma."]
        ["hubot", "l.eonardo ahora tiene 1 puntos de karma."]
      ])

  context "Karma sin usuario", ->
    beforeEach (done) ->
      @room.user.say("user", "t++")
      setTimeout(done, 500)

    it "No Debe aplicar karma", ->
      expect(@room.messages).to.eql([
        ["user", "t++"]
        ["hubot", "Chaucha, no encuentro al usuario 't'."]
      ])

  context "Karma sin usuario (0 length)", ->
    beforeEach (done) ->
      @room.user.say("user", "++")
      setTimeout(done, 500)

    it "No Debe aplicar karma", ->
      expect(@room.messages).to.eql([
        ["user", "++"]
      ])

  context "Limitar karma multiple a 5 usuarios", ->
    beforeEach (done) ->
      @room.user.say("user", "leonardo++ jorgeepunan-- hector++ dukuo++ cata-- seis++")
      setTimeout(done, 500)

    it "Aplica karma sólo a 5 usuarios", ->
      expect(@room.messages).to.eql([
        ["user", "leonardo++ jorgeepunan-- hector++ dukuo++ cata-- seis++"]
        ["hubot", "l.eonardo ahora tiene 1 puntos de karma."]
        ["hubot", "j.orgeepunan ahora tiene -1 puntos de karma."]
        ["hubot", "h.ector ahora tiene 1 puntos de karma."]
        ["hubot", "d.ukuo ahora tiene 1 puntos de karma."]
        ["hubot", "c.ata ahora tiene -100 puntos de karma."]
      ])

  context "Karma sin usuario (0 length)", ->
    beforeEach (done) ->
      @room.user.say("user", "++")
      setTimeout(done, 500)

    it "No Debe aplicar karma", ->
      expect(@room.messages).to.eql([
        ["user", "++"]
      ])

  context "Karma con conflicto de nombres", ->
    beforeEach (done) ->
      @room.user.say("user", "leo++")
      setTimeout(done, 500)

    it "No Debe aplicar karma", ->
      expect(@room.messages).to.eql([
        ["user", "leo++"]
        ["hubot", "Se más específico, Hay 2 personas que se parecen a: l.eonardo, l.eon."]
      ])

  context "Karma a si mismo", ->
    beforeEach (done) ->
      @room.user.say("leonardo", "leonardo++")
      setTimeout(done, 500)

    it "No Debe aplicar karma", ->
      expect(@room.messages).to.eql([
        ["leonardo", "leonardo++"]
        ["hubot", "Oe no po, el karma es pa otros no pa ti!"]
      ])

  context "Karma excesivo", ->
    beforeEach (done) ->
      @room.user.say("user", "leon++")
      setTimeout(done, 500)

    it "No Debe aplicar karma", ->
      expect(@room.messages[0]).to.eql(["user", "leon++"])
      expect(@room.messages[1][1]).to.match(/\¡No abuses\! Intenta en \d+ minutos/)

  context "Karma todos", ->
    beforeEach (done) ->
      @room.user.say("user", "karma todos")
      setTimeout(done, 500)

    it "Debe mostrar url", ->
      expect(@room.messages).to.eql([
        ["user", "karma todos"]
        ["hubot", "Karma de todos: http://localhost:8080/hubot/karma/todos"]
      ])

  context "Karma de un usuario", ->
    beforeEach (done) ->
      @room.user.say("user", "karma leonardo")
      setTimeout(done, 500)

    it "Debe mostrar puntaje y url", ->
      expect(@room.messages).to.eql([
        ["user", "karma leonardo"]
        ["hubot", "l.eonardo tiene 0 puntos de karma. Más detalles en: http://localhost:8080/hubot/karma/log/leonardo"]
      ])

  context "Karma reset invalido", ->
    beforeEach (done) ->
      @room.user.say("user", "karma reset leonardo")
      setTimeout(done, 500)

    it "No debe resetar", ->
      expect(@room.messages).to.eql([
        ["user", "karma reset leonardo"]
        ["hubot", "Tienes que ser :hector: para realizar esta función"]
      ])

  context "Karma reset a usuario", ->
    beforeEach (done) ->
      @room.user.say("hector", "karma reset leonardo")
      setTimeout(done, 500)

    it "No debe resetar", ->
      expect(@room.messages).to.eql([
        ["hector", "karma reset leonardo"]
        ["hubot", "l.eonardo ha quedado libre de toda bendición o pecado."]
      ])

  context "Karma reset a todos", ->
    beforeEach (done) ->
      @room.user.say("hector", "karma reset todos")
      setTimeout(done, 500)

    it "No debe resetar", ->
      expect(@room.messages).to.eql([
        ["hector", "karma reset todos"]
        ["hubot", "Todo el mundo ha quedado libre de toda bendición o pecado."]
      ])

  context "GET /hubot/karma/todos", ->
    beforeEach (done) ->
      http.get "http://localhost:8080/hubot/karma/todos", (@response) => done()
      .on 'error', done

    it "Responde con status 200", ->
      @response.on "data", (chunk) ->
        expect(chunk.toString()).to.eql("Karma de todos:\n <ul> <li>-99 <strong>cata</strong></li> </ul>")
      expect(@response.statusCode).to.eql 200

  context "Karma multiple mismo usuario", ->
    beforeEach (done) ->
      @room.user.say("user", "jorgee-- jorgee-- jorgee--")
      setTimeout(done, 500)

    it "Debe aplicar un solo karma", ->
      expect(@room.messages[0]).to.eql(["user", "jorgee-- jorgee-- jorgee--"])
      expect(@room.messages[1][1]).to.eql("j.orgeepunan ahora tiene -1 puntos de karma.")
      expect(@room.messages[2][1]).to.match(/\¡No abuses\! Intenta en \d+ minutos/)
      expect(@room.messages[3][1]).to.match(/\¡No abuses\! Intenta en \d+ minutos/)

  context "GET /hubot/karma/log", ->
    beforeEach (done) ->
      http.get "http://localhost:8080/hubot/karma/log", (@response) => done()
      .on 'error', done

    it "Responde con status 200", ->
      @response.on "data", (chunk) ->
        expect(chunk.toString()).to.eql("Karmalog:\n <ul> <li>jorgeepunan le ha dado -1 karma a cata - 2016-07-29T15:01:30.633Z</li> </ul>")
      expect(@response.statusCode).to.eql 200

  context "GET /hubot/karma/log/:user", ->
    beforeEach (done) ->
      http.get "http://localhost:8080/hubot/karma/log/cata", (@response) => done()
      .on 'error', done

    it "Responde con status 200", ->
      @response.on "data", (chunk) ->
        expect(chunk.toString()).to.eql("Karmalog: <ul> <li>2016-07-29T15:01:30.633Z - jorgeepunan: cata--</li> </ul>")
      expect(@response.statusCode).to.eql 200
