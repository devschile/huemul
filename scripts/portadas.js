// Description:
//   Muestra las portadas de hoy de diversos diarios de Chile.
//
// Dependencies:
//   moment, whilst
//
// Configuration:
//   hubot portada <diario> - Muestra las portada de hoy del diario seleccionado.
//   hubot portada <lista|help> - Muestra el listado de portadas.
//
// Author:
//   @rotvulpix, @pottersys

const moment = require('moment')
const whilst = require('whilst')
// const cheerio = require('cheerio')

// Los textos de fecha ("hoy a las...", "de ayer") dependen del locale global
moment.locale('es')

const endpointHxh = 'https://www.hoyxhoy.cl/endpoints/for-soy.php?action=get-latest&size=550'
const endpointMonde = 'https://lmo-lmo-production-api.twipecloud.net/Data/DataService.svc/getcontentpackagelist/TWPLMOLMO/0/30'
const endpointMondePortadas = 'https://lmo-lmo-webreader-production.twipemobile.com'
const endpointTimes = 'https://api.replica.pagesuite.com/publication/111e127c-8cff-40e5-a905-86951d4b0ea0/editions/list?maxnumber=30&month='

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
    (el)? trabajo (de san felipe)?
  *Uruguay:*
    (el)? pa(í|i)s (uruguay|uru|uy)
  *Brasil:*
    folha
  *Colombia:*
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

const diarios = {
  segunda: {
    // Edición digital (reader Emol): la portada es la primera página de la sección A
    url: 'https://digital.lasegunda.com/#DATE#/A',
    noSlashes: false,
    emolDigital: true
  },
  trabajo: {
    url: 'http://www.eltrabajo.cl/slide/eltrabajo%20(1).jpg',
    noSlashes: false
  },
  trabajosanfelipe: {
    url: 'http://www.eltrabajo.cl/slide/eltrabajo%20(1).jpg',
    noSlashes: false
  },
  lun: {
    // Impreso de LUN: páginas en images.lun.com; la ruta lleva la fecha en dos
    // formatos (#DATE# = YYYY/MMM/DD minúscula, #DATEISO# = YYYY-MM-DD) y pag1 es la portada
    url: 'https://images.lun.com/luncontents/NewsPaperPages/#DATE#/p_#DATEISO#_pag1_550.jpg',
    noSlashes: 'lun'
  },
  mercurio: {
    url: 'http://img.kiosko.net/#DATE#/cl/cl_mercurio.750.jpg',
    noSlashes: false
  },
  tercera: {
    url: 'http://img.kiosko.net/#DATE#/cl/cl_tercera.750.jpg',
    noSlashes: false
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
  hoyxhoylpm: {
    url: endpointHxh,
    noSlashes: false,
    forcePortada: true
  },
  hxh: {
    url: endpointHxh,
    noSlashes: false
  },
  hxhlpm: {
    url: endpointHxh,
    noSlashes: false,
    forcePortada: true
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
  folha: {
    url: 'http://img.kiosko.net/#DATE#/br/br_folha_spaulo.750.jpg',
    noSlashes: false
  },
  espectador: {
    url: 'http://img.kiosko.net/#DATE#/co/co_espectador.750.jpg',
    noSlashes: false
  },
  paisuruguay: {
    url: 'http://img.kiosko.net/#DATE#/uy/uy_elpais.750.jpg',
    noSlashes: false
  },
  paisuru: {
    url: 'http://img.kiosko.net/#DATE#/uy/uy_elpais.750.jpg',
    noSlashes: false
  },
  paisuy: {
    url: 'http://img.kiosko.net/#DATE#/uy/uy_elpais.750.jpg',
    noSlashes: false
  },
  financiero: {
    url: 'http://img.kiosko.net/#DATE#/mx/mx_financiero.750.jpg',
    noSlashes: false
  },
  wallstreetjournal: {
    url: 'http://img.kiosko.net/#DATE#/us/wsj.750.jpg',
    noSlashes: false
  },
  wsj: {
    url: 'http://img.kiosko.net/#DATE#/us/wsj.750.jpg',
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
    url: endpointMonde,
    twipe: true
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
    // ePaper de PageSuite: la lista pública de ediciones trae el guid de cada día
    url: endpointTimes,
    pagesuite: true
  }
}

// Diarios sin portada pública actual: mejor un aviso que "no conozco ese diario"
const descontinuados = ['cuarta', 'globo', 'tiempo']

// El impreso de LUN usa meses en 3 letras en español en su ruta (sep, abr, ago...)
const mesesLun = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const formatDate = (date, formato = false) => {
  if (formato === 'lun') return `${date.format('YYYY')}/${mesesLun[date.month()]}/${date.format('DD')}`
  return formato ? date.format('YYYYMMDD') : date.format('YYYY/MM/DD')
}

const MAX_DIAS_ATRAS = 5
const MAX_REDIRECTS = 3
const CODIGOS_REDIRECT = [301, 302, 303, 307, 308]

const timeoutPortadas = () => Number(process.env.HUBOT_PORTADAS_TIMEOUT_MS) || 2000

// GET simple que sigue redirects (scoped-http-client no los sigue por sí solo).
// Devuelve { statusCode, body, finalUrl }; finalUrl es la última url visitada.
const fetchUrl = (res, url) => {
  const visit = (currentUrl, redirects) =>
    new Promise((resolve, reject) => {
      res
        .http(currentUrl)
        .timeout(timeoutPortadas())
        .get()((err, response, body) => {
          if (err) return reject(err)
          const { statusCode, headers } = response
          if (CODIGOS_REDIRECT.includes(statusCode) && headers.location && redirects < MAX_REDIRECTS) {
            try {
              return resolve(visit(new URL(headers.location, currentUrl).toString(), redirects + 1))
            } catch (error) {
              return reject(error)
            }
          }
          resolve({ statusCode, body, finalUrl: currentUrl, contentType: headers['content-type'] || '' })
        })
    })
  return visit(url, 0)
}

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

// The Times (ePaper PageSuite): busca en la lista pública de ediciones la más
// reciente de la fecha pedida o de hasta 5 días atrás. Cada edición trae el
// editionguid con el que get_image.aspx renderiza su primera página (portada).
const getPortadaPagesuite = (res, diario) =>
  fetchUrl(res, diario.url).then(({ statusCode, body }) => {
    if (statusCode !== 200) throw new Error(`PageSuite respondió ${statusCode}`)
    const ediciones = JSON.parse(body)
    for (let daysPast = 0; daysPast <= MAX_DIAS_ATRAS; daysPast++) {
      const fecha = moment().subtract(daysPast, 'days')
      const edicion = ediciones.find(e => e.date === fecha.format('DD/MM/YYYY'))
      if (edicion) {
        sendPortadaDate(res, fecha.toDate())
        return `https://edition.pagesuite-professional.co.uk/get_image.aspx?w=600&eid=${edicion.editionguid}`
      }
    }
    return undefined
  })

const getPortada = (res, diario) => {
  if (diario.pagesuite) return getPortadaPagesuite(res, diario)
  // Los diarios con endpoint fijo sin #DATE# (APIs) se consultan una sola vez
  const maxDiasAtras = diario.url.includes('#DATE#') ? MAX_DIAS_ATRAS : 0
  let daysPast = 0
  let ready = true
  let testUrl = 'No existe portada de este diario por los últimos 5 días.'
  return whilst(
    () => ready,
    () => {
      if (daysPast > maxDiasAtras) {
        ready = false
        return Promise.resolve()
      }
      const fecha = moment().subtract(daysPast, 'days')
      testUrl = diario.url.replace('#DATE#', formatDate(fecha, diario.noSlashes)).replace('#DATEISO#', fecha.format('YYYY-MM-DD'))
      return fetchUrl(res, testUrl).then(({ statusCode, body, finalUrl, contentType }) => {
        switch (statusCode) {
          case 200:
            if (diario.twipe) {
              ready = false
              const paquetes = JSON.parse(body)
              const paquete = paquetes && paquetes[0]
              return paquete && `${endpointMondePortadas}/data/${paquete.ContentPackageId}/covers/Preview-MEDIUM-${paquete.ThumbnailId}.jpg`
            }
            if (testUrl === endpointHxh) {
              ready = false
              const jsonHxh = JSON.parse(body)
              const fuente = jsonHxh[0].esPortadaFalsa || diario.forcePortada ? jsonHxh[3] : jsonHxh[0]
              const url = fuente && fuente.img
              const dateFromHxh = url && url.split('/')[4]
              dateFromHxh && sendPortadaDate(res, moment(dateFromHxh, 'DDMMYY').toDate())
              return url
            }
            if (diario.emolDigital) {
              // La edición del día puede no existir (p.ej. fin de semana): el
              // reader muestra la última edición y su título queda con OTRA fecha;
              // si no calza con la pedida se prueba el día anterior. La portada
              // es la primera página (Portada) de la sección A; su imagen vive
              // en segreader.emol.cl (acceso público).
              const titulo = body.match(/<title>([^<]*)<\/title>/)
              if (!titulo || titulo[1].trim().indexOf(fecha.format('YYYY-MM-DD')) !== 0) {
                daysPast++
                return undefined
              }
              const pagina = body.match(/href="\/\d{4}\/\d{2}\/\d{2}\/A\/([A-Z0-9]+)"/)
              const id = pagina && pagina[1]
              ready = false
              sendPortadaDate(res, fecha)
              return id && `https://segreader.emol.cl/${formatDate(fecha)}/content/pages/img/mid/${id}.webp`
            }
            if (contentType && !contentType.startsWith('image/')) {
              // el sitio redirigió a una página web: no es una portada, probar otro día
              daysPast++
              return undefined
            }
            ready = false
            sendPortadaDate(res, fecha)
            return finalUrl
          case 404:
          default:
            // 404 esperado: se prueba con el día anterior. Cualquier otro status
            // (3xx sin location válida, 403, 5xx...) también avanza un día: antes
            // se quedaba en un loop infinito martillando la misma url.
            daysPast++
            return undefined
        }
      })
    }
  )
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
          res.send('No pude obtener la portada (error consultando el diario)')
        })
    } else if (descontinuados.includes(nombre)) {
      res.send('Ese diario ya no está disponible: su edición impresa fue descontinuada o ya no se publica.')
    } else {
      res.send('No conozco ese diario o revista :retard:')
    }
  })
}
