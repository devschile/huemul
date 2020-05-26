// Description:
//   Muestra las portadas de hoy de diversos diarios de Chile.
//
// Dependencies:
//   moment, axios
//
// Configuration:
//   hubot portada <diario> - Muestra las portada de hoy del diario seleccionado.
//   hubot portada <lista|help> - Muestra el listado de portadas.
//
// Author:
//   @rotvulpix, @pottersys
const axios = require('axios')
const moment = require('moment')

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
    (hoyxhoy|hxh)( lpm)?
    (la)? segunda
    lun
    (el)? mercurio
    (la)? tercera
    (la)? cuarta
    (el)? tip(o|ó)grafo (de rancagua)?
    (el)? trabajo (de san felipe)?
  *Uruguay:*
    (el)? pa(í|i)s (uruguay|uru|uy)
  *Brasil:*
    (o)? globo
    folha
  *Colombia:*
    (el)? tiempo
    (el)? espectador
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

const buildNewspaperUrl = (url, noSlashes, forcePortada = null) => {
  const output = { url, noSlashes }
  return forcePortada ? Object.assign(output, { forcePortada }) : output
}

const buildSoyChileUrl = periodico => buildNewspaperUrl(
  `http://edicionimpresa.soychile.cl/portadas/${periodico}/01-550.jpg?fecha=#DATE#`, true
)

const buildKioskoUrl = periodico => buildNewspaperUrl(
  `http://img.kiosko.net/#DATE#/${periodico}.750.jpg`, false
)

const diarios = {
  /* Soy Chile - Medios Regionales */
  australlosrios: buildSoyChileUrl('AustralValdivia'),
  australosorno: buildSoyChileUrl('AustralOsorno'),
  australtemuco: buildSoyChileUrl('AustralTemuco'),
  australvaldivia: buildSoyChileUrl('AustralValdivia'),
  cronicachillan: buildSoyChileUrl('CronicaChillan'),
  diarioatacama: buildSoyChileUrl('DiarioAtacama'),
  estrellaantofa: buildSoyChileUrl('EstrellaAntofagasta'),
  estrellaarica: buildSoyChileUrl('EstrellaArica'),
  estrellachiloe: buildSoyChileUrl('EstrellaChiloe'),
  estrellaconce: buildSoyChileUrl('EstrellaConcepcion'),
  estrellaiquique: buildSoyChileUrl('EstellaIquique'),
  estrellaloa: buildSoyChileUrl('EstrellaLoa'),
  estrellaquillota: buildSoyChileUrl('EstrellaQuillota'),
  estrellatocopilla: buildSoyChileUrl('EstrellaTocopilla'),
  estrellavalpo: buildSoyChileUrl('EstrellaValparaiso'),
  hoyxhoy: buildNewspaperUrl(endpointHxh, false),
  hoyxhoylpm: buildNewspaperUrl(endpointHxh, false, true),
  hxh: buildNewspaperUrl(endpointHxh, false),
  hxhlpm: buildNewspaperUrl(endpointHxh, false, true),
  lider: buildSoyChileUrl('LiderSanAntonio'),
  lidersanantonio: buildSoyChileUrl('LiderSanAntonio'),
  llanquihue: buildSoyChileUrl('Llanquihue'),
  mercurioantofa: buildSoyChileUrl('ElMercuriodeAntofagasta'),
  mercuriocalama: buildSoyChileUrl('MercurioCalama'),
  mercuriovalpo: buildSoyChileUrl('MercurioValparaiso'),
  sur: buildSoyChileUrl('ElSur'),

  /* Kiosko */
  corriere: buildKioskoUrl('it/corriere_della_sera'),
  corrieredellasera: buildKioskoUrl('it/corriere_della_sera'),
  espectador: buildKioskoUrl('co/co_espectador'),
  financiero: buildKioskoUrl('mx/mx_financiero'),
  folha: buildKioskoUrl('br/br_folha_spaulo'),
  globo: buildKioskoUrl('br/br_oglobo'),
  lun: buildKioskoUrl('cl/cl_ultimas_noticias'),
  mercurio: buildKioskoUrl('cl/cl_mercurio'),
  pais: buildKioskoUrl('es/elpais'),
  segunda: buildKioskoUrl('cl/cl_segunda'),
  tiempo: buildKioskoUrl('co/co_eltiempo'),
  times: buildKioskoUrl('uk/the_times'),
  tipografo: buildKioskoUrl('cl/cl_tipografo'),
  usatoday: buildKioskoUrl('us/usa_today'),
  wallstreetjournal: buildKioskoUrl('eur/wsj'),
  washingtonpost: buildKioskoUrl('us/washington_post'),
  wsj: buildKioskoUrl('eur/wsj'),

  trabajo: buildNewspaperUrl('http://www.eltrabajo.cl/slide/eltrabajo%20(1).jpg', false),
  trabajosanfelipe: buildNewspaperUrl('http://www.eltrabajo.cl/slide/eltrabajo%20(1).jpg', false),
  tercera: buildNewspaperUrl('https://kiosco.latercera.com/latest-issue-cover-image?collection=lt_diario_la_tercera_6_30', true),
  cuarta: buildNewspaperUrl('https://kiosco.lacuarta.com/latest-issue-cover-image?collection=lc_diario_la_cuarta', true),

  paisuruguay: buildNewspaperUrl('http://www.elpais.com.uy/printed-home/#DATE#/portada_impresa.jpg', true),
  paisuru: buildNewspaperUrl('http://www.elpais.com.uy/printed-home/#DATE#/portada_impresa.jpg', true),
  paisuy: buildNewspaperUrl('http://www.elpais.com.uy/printed-home/#DATE#/portada_impresa.jpg', true),
  monde: buildNewspaperUrl('http://www.lemonde.fr/journalelectronique/donnees/libre/#DATE#/QUO/img_pleinepage/1.jpg', true),
  nyt: buildNewspaperUrl('https://static01.nyt.com/images/#DATE#/nytfrontpage/scan.jpg', false)
}

const formatDate = (date, noSlashes = false) => date.format(noSlashes ? 'YYYYMMDD' : 'YYYY/MM/DD')

const sendPortadaDate = (res, date) => {
  const portadaDate = moment(date).calendar(null, {
    today: '[hoy]',
    lastDay: '[de ayer]',
    lastWeek: '[del] DD/MM/YYYY',
    sameElse: '[del] DD/MM/YYYY'
  })
  // Solo se muestra la fecha de la portada si no es del dia actual
  portadaDate.indexOf('hoy a las') === -1 && res.send(`Esta portada es ${portadaDate}`)
}

const getPortada = async (res, diario) => {
  let daysPast = 0
  let ready = false
  let url = 'No existe portada de este diario por los últimos 5 días.'
  let fecha, testUrl, response, dateFromHxh

  while (!ready) {
    fecha = moment().subtract(daysPast, 'days')
    if (daysPast > 5) {
      ready = true
      url = 'No existe portada de este diario por los últimos 5 días.'
    } else {
      testUrl = diario.url.replace('#DATE#', formatDate(fecha, diario.noSlashes))

      try {
        response = await axios.get(testUrl, { timeout: 2000 })
        switch (response.status) {
          /* Se encontró una portada */
          case 200:
            ready = true

            if (diario.url === endpointHxh) {
              var jsonHxh = response.data
              testUrl = jsonHxh[0].esPortadaFalsa || diario.forcePortada ? jsonHxh[3].img : jsonHxh[0].img

              dateFromHxh = testUrl && testUrl.split('/')[4]
              fecha = moment(dateFromHxh, 'DDMMYY').toDate()
              url = testUrl
            } else {
              url = response.request.res.responseUrl
            }

            sendPortadaDate(res, fecha)
            break

          /* De lo contrario (sea cual sea el motivo) se intenta con un día anterior. */
          default:
            daysPast++
            break
        }
      } catch (e) {
        /* Digamos que nos azotó un a catástrofe, como un 500 o un 404 */
        daysPast++
      }
    }
  }
  return url
}

module.exports = robot => {
  robot.respond(/portada (.*)/i, res => {
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
          robot.emit('error', err, res, 'portadas')
        })
    } else {
      res.send('No conozco ese diario o revista :retard:')
    }
  })
}
