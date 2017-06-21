// Description:
//   Muestra las portadas de hoy de diversos diarios de Chile.
//
// Dependencies:
//   moment
//
// Configuration:
//   hubot portada <diario>
//   hubot portada <lista|help>
//
// Author:
//   @rotvulpix

const moment = require('moment')
const {whilst} = require('async')

const endpointHxh = 'http://www.hoyxhoy.cl/endpoints/for-soy.php?action=get-latest&size=550'

const listaPortadas = () => {
  return `
  *Chile:*
    (el)? mercurio ((de)? calama|antofa(gasta)?|valpara(í|i)so|valpo)?
    (la)? estrella ((del?)? arica|iquique|loa|antofa(gasta)?|tocopilla|valpara(í|i)so|valpo|quillota|concepci(ó|o)n|chilo(é|e))
    (el)? sur
    (el)? austral ((de)? temuco|valdivia|osorno)
    (el)? llanquihue
    (el)? l(í|i)der (de san antonio)?
    (el)? diario (de)? atacama
    cr(ó|o)nica chill(á|a)n
    (hoyxhoy|hxh)
  *Uruguay:*
    (el)? pais (uruguay|uru|uy)
  *Brasil:*
    (o)? globo
  *Colombia:*
    (el)? tiempo
  *Mexico:*
    (el)? financiero
  *USA*
    ((the)? wall street journal)|wsj
    (the)? washington post
    usa today
  *Francia:*
    (le)? monde
  *España:*
    (el)? pais
  *United Kingdom:*
    (the)? times
  *Italia:*
    (il)? corriere (della sera)?
  `
}

const formatDate = (date, noSlashes = false) => {
  if (noSlashes) {
    return date.format('YYYYMMDD')
  } else {
    return date.format('YYYY/MM/DD')
  }
}

const getPortada = (res, diario, daysPast, cb) => {
  let ready = true
  let testUrl = 'No existe portada de este diario por los últimos 5 días.'
  whilst(
    () => ready,
    callback => {
      if (daysPast > 5) {
        ready = false
        callback(null)
      } else {
        const fecha = moment().subtract(daysPast, 'days')
        testUrl = diario.url.replace('#DATE#', formatDate(fecha, diario.noSlashes))
        res.http(testUrl).get()((err, response, body) => {
          if (err) return callback(err)
          if (response.statusCode === 404) {
            daysPast++
            callback(null, testUrl)
          } else if (response.statusCode === 200) {
            ready = false
            if (testUrl === endpointHxh) {
              try {
                testUrl = JSON.parse(body)[0].img
                callback(null, testUrl)
              } catch (err) {
                callback(err)
              }
            } else {
              callback(null, testUrl)
            }
          } else {
            callback(new Error(`Status code is ${response.statusCode} with url ${testUrl}`))
          }
        })
      }
    },
    err => cb(err, testUrl)
  )
}

module.exports = robot => {
  robot.respond(/portada (.*)/i, res => {
    const nombre = res.match[1]
      .replace(/^(las |la |el |le |the |o |il )/, '')
      .replace(/( de | del | de la )/, '').replace(/( )/g, '')
      .replace(/antofagasta$/, 'antofa')
      .replace(/valpara(?:í|i)so$/, 'valpo')
      .replace(/líder/, 'lider')
      .replace(/concepci(?:ó|o)n$/, 'conce')
      .replace(/crónica/, 'cronica')
      .replace(/chillán$/, 'chillan')
      .replace(/losríos$/, 'losrios')
      .replace(/chiloé$/, 'chiloe')

    const diarios = {
      estrellaarica: {
        url: 'http://edicionimpresa.soychile.cl/portadas/EstrellaArica/01-550.jpg',
        noSlashes: false
      },
      estrellaiquique: {
        url: 'http://edicionimpresa.soychile.cl/portadas/EstellaIquique/01-550.jpg',
        noSlashes: false
      },
      mercuriocalama: {
        url: 'http://edicionimpresa.soychile.cl/portadas/MercurioCalama/01-550.jpg',
        noSlashes: false
      },
      estrellaloa: {
        url: 'http://edicionimpresa.soychile.cl/portadas/EstrellaLoa/01-550.jpg',
        noSlashes: false
      },
      estrellatocopilla: {
        url: 'http://edicionimpresa.soychile.cl/portadas/EstrellaTocopilla/01-550.jpg',
        noSlashes: false
      },
      mercurioantofa: {
        url: 'http://edicionimpresa.soychile.cl/portadas/ElMercuriodeAntofagasta/01-550.jpg',
        noSlashes: false
      },
      estrellaantofa: {
        url: 'http://edicionimpresa.soychile.cl/portadas/EstrellaAntofagasta/01-550.jpg',
        noSlashes: false
      },
      diarioatacama: {
        url: 'http://edicionimpresa.soychile.cl/portadas/DiarioAtacama/01-550.jpg',
        noSlashes: false
      },
      mercuriovalpo: {
        url: 'http://edicionimpresa.soychile.cl/portadas/MercurioValparaiso/01-550.jpg',
        noSlashes: false
      },
      estrellavalpo: {
        url: 'http://edicionimpresa.soychile.cl/portadas/EstrellaValparaiso/01-550.jpg',
        noSlashes: false
      },
      estrellaquillota: {
        url: 'http://edicionimpresa.soychile.cl/portadas/EstrellaQuillota/01-550.jpg',
        noSlashes: false
      },
      lider: {
        url: 'http://edicionimpresa.soychile.cl/portadas/LiderSanAntonio/01-550.jpg',
        noSlashes: false
      },
      lidersanantonio: {
        url: 'http://edicionimpresa.soychile.cl/portadas/LiderSanAntonio/01-550.jpg',
        noSlashes: false
      },
      hoyxhoy: {
        url: endpointHxh,
        noSlashes: false
      },
      hxh: {
        url: endpointHxh,
        noSlashes: false
      },
      sur: {
        url: 'http://edicionimpresa.soychile.cl/portadas/ElSur/01-550.jpg',
        noSlashes: false
      },
      estrellaconce: {
        url: 'http://edicionimpresa.soychile.cl/portadas/EstrellaConcepcion/01-550.jpg',
        noSlashes: false
      },
      cronicachillan: {
        url: 'http://edicionimpresa.soychile.cl/portadas/CronicaChillan/01-550.jpg',
        noSlashes: false
      },
      australtemuco: {
        url: 'http://edicionimpresa.soychile.cl/portadas/AustralTemuco/01-550.jpg',
        noSlashes: false
      },
      australlosrios: {
        url: 'http://edicionimpresa.soychile.cl/portadas/AustralValdivia/01-550.jpg',
        noSlashes: false
      },
      australvaldivia: {
        url: 'http://edicionimpresa.soychile.cl/portadas/AustralValdivia/01-550.jpg',
        noSlashes: false
      },
      australosorno: {
        url: 'http://edicionimpresa.soychile.cl/portadas/AustralOsorno/01-550.jpg',
        noSlashes: false
      },
      llanquihue: {
        url: 'http://edicionimpresa.soychile.cl/portadas/Llanquihue/01-550.jpg',
        noSlashes: false
      },
      estrellachiloe: {
        url: 'http://edicionimpresa.soychile.cl/portadas/EstrellaChiloe/01-550.jpg',
        noSlashes: false
      },
      globo: {
        url: 'http://img.kiosko.net/#DATE#/br/br_oglobo.750.jpg',
        noSlashes: false
      },
      tiempo: {
        url: 'http://img.kiosko.net/#DATE#/co/co_eltiempo.750.jpg',
        noSlashes: false
      },
      paisuruguay: {
        url: 'http://www.elpais.com.uy/printed-home/#DATE#/portada_impresa.jpg',
        noSlashes: true
      },
      paisuru: {
        url: 'http://www.elpais.com.uy/printed-home/#DATE#/portada_impresa.jpg',
        noSlashes: true
      },
      paisuy: {
        url: 'http://www.elpais.com.uy/printed-home/#DATE#/portada_impresa.jpg',
        noSlashes: true
      },
      financiero: {
        url: 'http://img.kiosko.net/#DATE#/mx/mx_financiero.750.jpg',
        noSlashes: false
      },
      wallstreetjournal: {
        url: 'http://img.kiosko.net/#DATE#/eur/wsj.750.jpg',
        noSlashes: false
      },
      wsj: {
        url: 'http://img.kiosko.net/#DATE#/eur/wsj.750.jpg',
        noSlashes: false
      },
      washingtonpost: {
        url: 'http://img.kiosko.net/#DATE#/us/washington_post.750.jpg',
        noSlashes: false
      },
      usatoday: {
        url: 'http://img.kiosko.net/#DATE#/us/usa_today.750.jpg',
        noSlashes: false
      },
      monde: {
        url: 'http://www.lemonde.fr/journalelectronique/donnees/libre/#DATE#/QUO/img_pleinepage/1.jpg',
        noSlashes: true
      },
      pais: {
        url: 'http://img.kiosko.net/#DATE#/es/elpais.750.jpg',
        noSlashes: false
      },
      corrieredellasera: {
        url: 'http://img.kiosko.net/#DATE#/it/corriere_della_sera.750.jpg',
        noSlashes: false
      },
      corriere: {
        url: 'http://img.kiosko.net/#DATE#/it/corriere_della_sera.750.jpg',
        noSlashes: false
      },
      times: {
        url: 'http://img.kiosko.net/#DATE#/uk/the_times.750.jpg',
        noSlashes: false
      }
    }
    if (['lista', 'help'].includes(nombre)) {
      res.send(listaPortadas())
    } else if (nombre in diarios) {
      getPortada(res, diarios[nombre], 0, (err, result) => {
        if (err) return robot.emit('error', err, res)
        res.send(result)
      })
    }
  })
}
