# Description
#   Hubot votador
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   hubot votador help
#   hubot inicio votador item1, item2, item3, ...
#   hubot voto (por) N ~ donde N es el índice de la opción
#   hubot opciones votador
#   hubot conteo votador
#   hubot fin votador
#
# Notes:
#   Base: https://github.com/joshingly/hubot-voting/blob/master/src/scripts/voting.coffee
#
# Author:
#   @antonishen
#   @juanbrujo

module.exports = (robot) ->
  robot.voting = {}

  robot.respond /inicio votador (.+)$/i, (msg) ->

    if robot.voting.votes?
      msg.send "Ya existe votación vigente"
      sendChoices (msg)
    else
      robot.voting.votes = {}
      createChoices msg.match[1]

      msg.send "Comienza votación. Recuerda que para votar tienes que escribir `huemul voto [opción].`"
      sendChoices(msg)

  robot.respond /fin votador/i, (msg) ->
    if robot.voting.votes?

      results = tallyVotes()

      response = "Resultados votación..."
      for choice, index in robot.voting.choices
        response += "\n - Opción #{index}: #{choice}: #{results[index]} votos (#{Math.round(results[index] * 100 / results.reduce (t, s) -> t + s)}%)"

      msg.send response

      delete robot.voting.votes
      delete robot.voting.choices
    else
      msg.send "No hay votador vigente"


  robot.respond /opciones votador/i, (msg) ->
    sendChoices(msg)

  robot.respond /votador help/i, (msg) ->
    msg.send "*Comandos:*"
    msg.send "Crear votación: `huemul inicio votador item1, item2, item3, ...`\n
Votar: `huemul voto (por) N` ~ donde N es el índice de la opción\n
Mostrar Opciones: `huemul opciones votador`\n
Mostrar conteo de votos actual: `huemul conteo votador`\n
Finalizar votación: `huemul fin votador`"

  robot.respond /conteo votador/i, (msg) ->
    results = tallyVotes()
    sendChoices(msg, results)

  robot.respond /voto (por )?(.+)$/i, (msg) ->
    choice = null

    re = /\d{1,2}$/i
    if re.test(msg.match[2])
      choice = parseInt msg.match[2], 10
    else
      choice = robot.voting.choices.indexOf msg.match[2]

    sender = robot.brain.usersForFuzzyName(msg.message.user['name'])[0].name

    if validChoice choice
      robot.voting.votes[sender] = choice
      msg.send "#{sender} vota por opción #{choice}: #{robot.voting.choices[choice]}"
    else
      msg.send "#{sender}: esa no es una opción válida"

  createChoices = (rawChoices) ->
    robot.voting.choices = rawChoices.split(/,/)

  sendChoices = (msg, results = null) ->

    if robot.voting.choices?
      response = ""
      for choice, index in robot.voting.choices
        response += " - Opción #{index}: #{choice}"
        if results?
          response += " -- Total votos: #{results[index]}"
        response += "\n" unless index == robot.voting.choices.length - 1
    else
      msg.send "No existe votación vigente"

    msg.send response

  validChoice = (choice) ->
    return false unless robot.voting.choices
    numChoices = robot.voting.choices.length - 1
    0 <= choice <= numChoices

  tallyVotes = () ->
    results = (0 for choice in robot.voting.choices)

    voters = Object.keys robot.voting.votes
    for voter in voters
      choice = robot.voting.votes[voter]
      results[choice] += 1

    results
