// Description:
//   Muestra las portadas de hoy de diversos diarios de Chile.
//
// Dependencies:
//   moment, whilst
//
// Configuration:
//   hubot portada <diario>
//   hubot portada <lista|help>
//
// Author:
//   @rotvulpix, @pottersys

const moment = require('moment')
const whilst = require('whilst')
const cheerio = require('cheerio')

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
    (la)? segunda
    lun
    (club)? nintendo
    (harper's)? bazaar
    vanidades
    cosmo(politan)?
    condorito
    condorito de oro
    national geographic
    muy interesante
    muy interesante jr
    tu
    ser padres
    con(e|é)
    (el)? mercurio
    (la)? tercera
    (la)? cuarta
    (el)? tip(o|ó)grafo (de rancagua)?
  *Uruguay:*
    (el)? pa(í|i)s (uruguay|uru|uy)
  *Brasil:*
    (o)? globo
    folha
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
    (el)? pa(í|i)s  (españa|es)
  *United Kingdom:*
    (the)? times
  *Italia:*
    (il)? corriere (della sera)?
  `
}

const diarios = {
  segunda: {
    url: 'http://img.kiosko.net/#DATE#/cl/cl_segunda.750.jpg',
    noSlashes: false
  },
  tipografo: {
    url: 'http://img.kiosko.net/#DATE#/cl/cl_tipografo.750.jpg',
    noSlashes: false
  },
  lun: {
    url: 'http://img.kiosko.net/#DATE#/cl/cl_ultimas_noticias.750.jpg',
    noSlashes: false
  },
  mercurio: {
    url: 'http://img.kiosko.net/#DATE#/cl/cl_mercurio.750.jpg',
    noSlashes: false
  },
  tercera: {
    url:
      'https://edition.pagesuite-professional.co.uk/get_image.aspx?w=550&pbid=33084897-397a-48cc-b3c0-3ce1ec447137&pnum=01&nocache=#DATE#',
    noSlashes: true
  },
  cuarta: {
    url:
      'https://edition.pagesuite-professional.co.uk/get_image.aspx?w=550&pbid=a94a1c16-2ebc-4ecc-b2bc-d60709ea4c26&pnum=01&nocache=#DATE#',
    noSlashes: true
  },
  estrellaarica: {
    url: 'http://edicionimpresa.soychile.cl/portadas/EstrellaArica/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  estrellaiquique: {
    url: 'http://edicionimpresa.soychile.cl/portadas/EstellaIquique/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  mercuriocalama: {
    url: 'http://edicionimpresa.soychile.cl/portadas/MercurioCalama/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  estrellaloa: {
    url: 'http://edicionimpresa.soychile.cl/portadas/EstrellaLoa/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  estrellatocopilla: {
    url: 'http://edicionimpresa.soychile.cl/portadas/EstrellaTocopilla/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  mercurioantofa: {
    url: 'http://edicionimpresa.soychile.cl/portadas/ElMercuriodeAntofagasta/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  estrellaantofa: {
    url: 'http://edicionimpresa.soychile.cl/portadas/EstrellaAntofagasta/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  diarioatacama: {
    url: 'http://edicionimpresa.soychile.cl/portadas/DiarioAtacama/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  mercuriovalpo: {
    url: 'http://edicionimpresa.soychile.cl/portadas/MercurioValparaiso/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  estrellavalpo: {
    url: 'http://edicionimpresa.soychile.cl/portadas/EstrellaValparaiso/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  estrellaquillota: {
    url: 'http://edicionimpresa.soychile.cl/portadas/EstrellaQuillota/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  lider: {
    url: 'http://edicionimpresa.soychile.cl/portadas/LiderSanAntonio/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  lidersanantonio: {
    url: 'http://edicionimpresa.soychile.cl/portadas/LiderSanAntonio/01-550.jpg?fecha=#DATE#',
    noSlashes: true
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
    url: 'http://edicionimpresa.soychile.cl/portadas/ElSur/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  estrellaconce: {
    url: 'http://edicionimpresa.soychile.cl/portadas/EstrellaConcepcion/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  cronicachillan: {
    url: 'http://edicionimpresa.soychile.cl/portadas/CronicaChillan/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  australtemuco: {
    url: 'http://edicionimpresa.soychile.cl/portadas/AustralTemuco/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  australlosrios: {
    url: 'http://edicionimpresa.soychile.cl/portadas/AustralValdivia/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  australvaldivia: {
    url: 'http://edicionimpresa.soychile.cl/portadas/AustralValdivia/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  australosorno: {
    url: 'http://edicionimpresa.soychile.cl/portadas/AustralOsorno/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  llanquihue: {
    url: 'http://edicionimpresa.soychile.cl/portadas/Llanquihue/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  estrellachiloe: {
    url: 'http://edicionimpresa.soychile.cl/portadas/EstrellaChiloe/01-550.jpg?fecha=#DATE#',
    noSlashes: true
  },
  globo: {
    url: 'http://img.kiosko.net/#DATE#/br/br_oglobo.750.jpg',
    noSlashes: false
  },
  folha: {
    url: 'http://img.kiosko.net/#DATE#/br/br_folha_spaulo.750.jpg',
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

const MAGAZINES_EXPECTED_NAMES = {
  nintendo: 'club nintendo',
  harper: "harper's bazaar",
  vanidades: 'vanidades',
  cosmo: 'cosmopolitan',
  womensHealth: 'womens health',
  tu: 'tu it girl',
  national: 'national geographic',
  condorito: 'condorito',
  condoritoOro: 'condorito de oro',
  cone: 'coné',
  muy: 'muy interesante',
  muyJr: 'muy interesante jr',
  serPadres: 'ser padres',
  men: "men's health"
}

// In here we should put the possible magazine spellings with its
// correct name
const MAGAZINES_DICTIONARY = [
  { ['club nintendo']: MAGAZINES_EXPECTED_NAMES.nintendo },
  { ['clubnintendo']: MAGAZINES_EXPECTED_NAMES.nintendo },
  { ['nintendo']: MAGAZINES_EXPECTED_NAMES.nintendo },
  { ["harper's bazaar"]: MAGAZINES_EXPECTED_NAMES.harper },
  { ["harper'sbazaar"]: MAGAZINES_EXPECTED_NAMES.harper },
  { ['harpers bazaar']: MAGAZINES_EXPECTED_NAMES.harper },
  { ['harpersbazaar']: MAGAZINES_EXPECTED_NAMES.harper },
  { ['harper']: MAGAZINES_EXPECTED_NAMES.harper },
  { ['harpers']: MAGAZINES_EXPECTED_NAMES.harper },
  { ['bazaar']: MAGAZINES_EXPECTED_NAMES.harper },
  { ['vanidades']: MAGAZINES_EXPECTED_NAMES.vanidades },
  { ['vanidad']: MAGAZINES_EXPECTED_NAMES.vanidades },
  { ['cosmopolitan']: MAGAZINES_EXPECTED_NAMES.cosmo },
  { ['cosmo']: MAGAZINES_EXPECTED_NAMES.cosmo },
  { ['womenshealth']: MAGAZINES_EXPECTED_NAMES.womensHealth },
  { ['womens health']: MAGAZINES_EXPECTED_NAMES.womensHealth },
  { ['womens']: MAGAZINES_EXPECTED_NAMES.womensHealth },
  { ['women']: MAGAZINES_EXPECTED_NAMES.womensHealth },
  { ['tu']: MAGAZINES_EXPECTED_NAMES.tu },
  { ['tú']: MAGAZINES_EXPECTED_NAMES.tu },
  { ['nationalgeographic']: MAGAZINES_EXPECTED_NAMES.national },
  { ['national geographic']: MAGAZINES_EXPECTED_NAMES.national },
  { ['national']: MAGAZINES_EXPECTED_NAMES.national },
  { ['geographic']: MAGAZINES_EXPECTED_NAMES.national },
  { ['natgeo']: MAGAZINES_EXPECTED_NAMES.national },
  { ['geo']: MAGAZINES_EXPECTED_NAMES.national },
  { ['condorito']: MAGAZINES_EXPECTED_NAMES.condorito },
  { ['condoritooro']: MAGAZINES_EXPECTED_NAMES.condoritoOro },
  { ['condoritodeoro']: MAGAZINES_EXPECTED_NAMES.condoritoOro },
  { ['oro']: MAGAZINES_EXPECTED_NAMES.condoritoOro },
  { ['cone']: MAGAZINES_EXPECTED_NAMES.cone },
  { ['coné']: MAGAZINES_EXPECTED_NAMES.cone },
  { ['muy interesante']: MAGAZINES_EXPECTED_NAMES.muy },
  { ['muyinteresante']: MAGAZINES_EXPECTED_NAMES.muy },
  { ['interesante']: MAGAZINES_EXPECTED_NAMES.muy },
  { ['muy interesante jr']: MAGAZINES_EXPECTED_NAMES.muyJr },
  { ['muyinteresantejr']: MAGAZINES_EXPECTED_NAMES.muyJr },
  { ['ser padres']: MAGAZINES_EXPECTED_NAMES.serPadres },
  { ['serpadres']: MAGAZINES_EXPECTED_NAMES.serPadres },
  { ["men's health"]: MAGAZINES_EXPECTED_NAMES.men },
  { ["men'shealth"]: MAGAZINES_EXPECTED_NAMES.men },
  { ['mens health']: MAGAZINES_EXPECTED_NAMES.men },
  { ['menshealth']: MAGAZINES_EXPECTED_NAMES.men },
  { ['men']: MAGAZINES_EXPECTED_NAMES.men }
]

const formatDate = (date, noSlashes = false) => {
  return noSlashes ? date.format('YYYYMMDD') : date.format('YYYY/MM/DD')
}

const sendPortadaDate = (res, date) => {
  const portadaDate = moment(date).calendar(null, {
    today: '[hoy]',
    lastDay: '[de ayer]',
    lastWeek: '[del] DD/MM/YYYY',
    sameElse: '[del] DD/MM/YYYY'
  })
  // Solo se muestra la fecha de la portada si no es del dia actual
  portadaDate.indexOf('hoy a las') === -1 ? res.send(`Esta portada es ${portadaDate}`) : undefined
}

const getPortada = (res, diario) => {
  let daysPast = 0
  let ready = true
  let testUrl = 'No existe portada de este diario por los últimos 5 días.'
  return whilst(
    () => ready,
    () => {
      if (daysPast > 5) {
        ready = false
        Promise.resolve()
      } else {
        const fecha = moment().subtract(daysPast, 'days')
        testUrl = diario.url.replace('#DATE#', formatDate(fecha, diario.noSlashes))
        return new Promise((resolve, reject) => {
          res.http(testUrl).get()((err, response, body) => {
            if (err) return reject(err)
            switch (response.statusCode) {
              case 404:
                daysPast++
                resolve(testUrl)
                break
              case 200:
                ready = false
                if (testUrl === endpointHxh) {
                  try {
                    var jsonHxh = JSON.parse(body)
                    testUrl = jsonHxh[0].esPortadaFalsa ? jsonHxh[3].img : jsonHxh[0].img
                    const dateFromHxh = testUrl && testUrl.split('/')[4]
                    dateFromHxh && sendPortadaDate(res, moment(dateFromHxh, 'DDMMYY').toDate())
                    resolve(testUrl)
                  } catch (err) {
                    reject(err)
                  }
                } else {
                  sendPortadaDate(res, fecha)
                  resolve(testUrl)
                }
                break
              default:
                resolve()
                break
            }
          })
        })
      }
    }
  )
}

/** Tries to find the correct magazine name based on magazines array
 * @description
 * @param  {string} magazineName
 */
const normalizeMagazineName = (magazineName, magazineList) => {
  const magazineObject = magazineList.find(magazine => Object.keys(magazine)[0] === magazineName)
  if (!magazineObject) return null
  return magazineObject[magazineName]
}

/**
 * @description televisa.cl load their images to a proxy endpoint in order to
 * resize images. The image path is like this: resize.php?src=../../img_miniatura/20180126130752000000.png&h=360&w=262&q=99
 * This function convert that path into a absolute URL image like this: http://televisa.cl/img_miniatura/20180126130752000000.png
 * @param  {string} imageURL
 */
const getFullCoverMagazineImage = (imageURL = '') => {
  const splitStrings = ['resize.php?src=../../img_miniatura/', '.']
  if (imageURL.indexOf(splitStrings[0]) === -1 || imageURL.indexOf(splitStrings[1]) === -1) {
    throw 'Unexpected magazine imageURL'
  }
  // TODO: Improve this by using regex
  const imageId = imageURL.split(splitStrings[0])[1].split(splitStrings[1])[0]
  return `http://televisa.cl/img_miniatura/${imageId}.png`
}

/**
 * @param  {any} res: Hubot res object
 * @param  {string} magazineName: Name of the magazine
 */
const getMagazineCover = (res, magazineName) => {
  const FAIL_ERROR_MESSAGE = "Magazines script it's failing"
  const magazines = []
  return new Promise((resolve, reject) => {
    res.http('https://www.televisa.cl/revistas').get()((err, response, body) => {
      if (err) throw FAIL_ERROR_MESSAGE
      const $ = cheerio.load(body)
      $('.tienda_producto').each((index, element) => {
        const magazine = {}
        // I know it's an awful selector but currently it's the only way to get the magazine name
        const name = $(element).find('span.size14.width100.mt10')
        const image = $(element).find('img')
        if (!name || !image) return
        magazine.name = name.text().toLowerCase()
        magazine.image = getFullCoverMagazineImage(image.attr('src'))
        magazines.push(magazine)
      })
      const magazineImage = magazines.find(magazine => magazine.name === magazineName)
      resolve(magazineImage)
    })
  })
}

module.exports = robot => {
  robot.respond(/portada (.*)/i, res => {
    getMagazineCover(res)
    const nombre = res.match[1]
      .toLowerCase()
      .replace(/^(las |la |el |le |the |o |il )/, '')
      .replace(/( de | del | de la )/, '')
      .replace(/( )/g, '')
      .replace(/antofagasta$/, 'antofa')
      .replace(/valpara(?:í|i)so$/, 'valpo')
      .replace(/líder/, 'lider')
      .replace(/concepci(?:ó|o)n$/, 'conce')
      .replace(/crónica/, 'cronica')
      .replace(/chillán$/, 'chillan')
      .replace(/losríos$/, 'losrios')
      .replace(/chiloé$/, 'chiloe')
      .replace(/tipógrafo$/, 'tipografo')
      .replace(/rancagua$/, '')

    if (['lista', 'help'].includes(nombre)) {
      res.send(listaPortadas())
    } else if (nombre in diarios) {
      getPortada(res, diarios[nombre])
        .then(result => {
          if (!result) return res.send('No hay portada disponible')
          res.send(result)
        })
        .catch(err => {
          robot.emit('error', err, res)
        })
    } else if (normalizeMagazineName(nombre, MAGAZINES_DICTIONARY)) {
      getMagazineCover(res, normalizeMagazineName(nombre, MAGAZINES_DICTIONARY))
        .then(result => {
          res.send(result.image)
        })
        .catch(err => {
          robot.emit('error', err, res)
        })
    } else {
      res.send('No conozco ese diario o revista :retard:')
    }
  })
}
