# Description:
#   Obtiene indicadores económicos para Chile
#
# Dependencies:
#   none
#
# Configuration:
#   None
#
# Commands:
#   hubot finvox help
#   hubot finvox dolar|usd
#   hubot finvox bitcoin
#   hubot finvox uf
#   hubot finvox euro
#   hubot finvox ipc
#   hubot finvox utm
#   hubot finvox huemulcoin
#
# Author:
#   @jorgeepunan

#process.env.API_URL ||= 'http://mindicador.cl/api' # old, slow and shitty
process.env.API_URL ||= 'http://indicadoresdeldia.cl/webservice/indicadores.json'
process.env.BIT_API_URL ||= 'https://blockchain.info/es/ticker'

mensajes = ['Aunque te esfuerces, seguirás siendo pobre. :poop:','Los políticos ganan más que tú y más encima nos roban. Y no pueden irse presos. ¡Ánimo! :monkey: ','La economía seguirá mal para ti, pero no para tu AFP. :moneybag:','Algún día saldrás de la clase media. Partiste a jugarte un LOTO. :alien: ','Todos los días suben los precios, y no tu sueldo. :money_with_wings: ']

numberWithCommas = (x) ->
  x.toString().replace /\B(?=(\d{3})+(?!\d))/g, '.'
numberSplitDecimal = (x) ->
  d = Math.pow 10,2
  (parseInt(x * d) / d).toFixed x

module.exports = (robot) ->
  robot.respond /finvox (\w+)/i, (msg) ->
    indicador = msg.match[1].toLowerCase()

    if indicador == 'help' || !indicador
      msg.send 'Mis comandos son:\n\n * `finvox dolar|usd`\n * `finvox euro|eur`\n * `finvox bitcoin|btc`\n * `finvox uf`\n * `finvox utm`\n * `finvox ipc`\n * `finvox getonbrd`\n * `finvox huemulcoin`\n'
      return false
    if indicador == 'uf' or indicador == 'dolar' or indicador == 'usd' or indicador == 'euro' or indicador == 'eur' or indicador == 'ipc' or indicador == 'utm' or indicador == 'getonbrd' or indicador == 'huemulcoin'
      url = process.env.API_URL
    else if indicador == 'bitcoin' or indicador == 'btc'
      url = process.env.BIT_API_URL

    msg.robot.http(url).get() (err, res, body) ->
      res.setEncoding('utf-8')
      data = JSON.parse(body)

      date = ' (' + data.date + ')'

      if indicador == 'uf'
        data = data.indicador.uf
      else if indicador == 'dolar' or indicador == 'usd'
        data = data.moneda.dolar
      else if indicador == 'getonbrd'
        complexGetonbrdCalculus = (parseInt(data.moneda.dolar.split('$')[1]) * 1231)
        data = '1₲ = $' + numberWithCommas(complexGetonbrdCalculus)
      else if indicador == 'euro' or indicador == 'eur'
        data = data.moneda.euro
      else if indicador == 'ipc'
        data = data.indicador.ipc + '%'
      else if indicador == 'utm'
        data = data.indicador.utm
      else if indicador == 'bitcoin' or indicador == 'btc'
        date = ''
        flatNumber = data.CLP.last.toString().split('.')[0]
        data = '$' + numberWithCommas(flatNumber)
      else if indicador == 'huemulcoin'
        complexHuemulCoinCalculus = (1000 / parseInt(data.moneda.dolar.split('$')[1]))
        data = '1ℌℭ = US$' + numberSplitDecimal(complexHuemulCoinCalculus)
      else
        data = '`finvox help` para ayuda.'

      if data != null and typeof data != 'object'
        data = data.toString().split ',', 1
        msg.send indicador.toUpperCase() + ': ' + data + date
        msg.send msg.random mensajes
      else
        msg.send "Error, intenta nuevamente *zopenco*."

#FIN
