// Description:
//   Obtiene valores de los distintos fondos de la AGF Fintual
//
// Dependencies:
//   numberToCLPFormater
//
// Configuration:
//   None
//
// Commands:
//   hubot fintual help - Imprime la ayuda
//   hubot fintual risky-a|risky-apv|clooney-a|clooney-apv|Very Conservative Streep - Obtiene el valor del fondo seleccionado
//
// Author:
//   @cvallejos

const CLP = require('numbertoclpformater').numberToCLPFormater
const API_URL = process.env.API_URL || 'https://fintual.cl/api/real_assets/'
const mensajes = [
  'Aunque te esfuerces, seguirás siendo pobre. :poop:',
  'Los políticos ganan más que tú y más encima nos roban. Y no pueden irse presos. ¡Ánimo! :monkey:',
  'La economía seguirá mal para ti, pero no para tu AFP. :moneybag:',
  'Algún día saldrás de la clase media. Partiste a jugarte un LOTO. :alien:',
  'Todos los días suben los precios, y no tu sueldo. :money_with_wings:'
]

const NORRIS_A = 'norris-a';
const NORRIS_APV = 'norris-apv';
const PITT_A = 'pitt-a';
const PITT_APV = 'pitt-apv';
const CLOONEY_A = 'clooney-a';
const CLOONEY_APV = 'clooney-apv';
const STREEP_A = 'streep-a';

const series = {
    NORRIS_A : 186,
    NORRIS_APV: 245,
    PITT_A: 187,
    PITT_APV: 246,
    CLOONEY_A: 188,
    CLOONEY_APV: 247,
    STREEP_A : 15077,
};

  const comands = [  NORRIS_A,NORRIS_APV,PITT_A,PITT_APV,CLOONEY_A,CLOONEY_APV,STREEP_A]

const numberWithCommas = number => number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')

const numberSplitDecimal = number => {
  const d = Math.pow(10, 2)
  return (parseInt(number * d, 10) / d).toFixed(number)
}

module.exports = robot => {
  robot.respond(/fintual (\w+)/i, res => {
    let uri
    const indicador = res.match[1].toLowerCase()

    if (indicadores.includes(indicador)) {
      uri = API_URL + series[indicador] + '/'
    } else {
      res.send(
        'Mis comandos son:\n\n * `fintual '+NORRIS_A+'|'+ NORRIS_APV +'`\n * `fintual '+PITT_A+'|'+PITT_APV+'`\n * `fintual '+ CLOONEY_A +'|'+CLOONEY_APV+'`\n * `fintual '+STREEP_A+'`\n'
      )
      return false
    }

    robot.http(uri).get()((err, response, body) => {
      if (err) {
        robot.emit('error', err, res, 'fintual')
        res.send(`Ocurrió un error: ${err.message}`)
        return
      }

      response.setEncoding('utf-8')
      let data = JSON.parse(body)
      const lastDate =new Date(data[0].attributes.date.split('T')[0]) 
      const lastDate = lastDate

      if (!data && comands.includes(indicador)) {
        return res.send('Sin resultados')
      }
      switch(indicador){
        case NORRIS_A:
            data = CLP(data.attribute.last_day.valor)
            break;
        case NORRIS_APV:
            data = CLP(data.uf.valor)
            break;          
        case PITT_A:
            data = CLP(data.uf.valor)
            break;          
        case PITT_APV:
            data = CLP(data.uf.valor)
            break;
        case CLOONEY_A:
            data = CLP(data.uf.valor)
            break;
        case CLOONEY_APV:
            data = CLP(data.uf.valor)
            break;
        case STREEP_A:
            data = CLP(data.uf.valor)
            break;
        default:
            data = '`fintual help` para ayuda.'

      }       
      if (data !== null && typeof data !== 'object') {
        data = data.toString().split(',', 1)
        const mensaje = res.random(mensajes)
        res.send(`${indicador.toUpperCase()}: ${data} (${date}). ${mensaje}`)
      } else {
        res.send('Error, intenta nuevamente *:c3:*.')
      }
    })
  })
}
