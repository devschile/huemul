// Description:
//   Obtiene proveedores y URL de justwatch de servicio para ver la peli / serie
//
// Dependencies:
//   None
//
// Commands:
//   hubot donde ver <NOMBRE>
//
// Author:
//   @joseglego

const JustWatch = require('justwatch-api')

// Providers List is just a key:value with `id` and `clear_name`.
// Why?
//   - Avoid doing n times for semi static data.
//   - Fastests
//   - Not official API. So, not overcrow
// More Info: https://www.npmjs.com/package/justwatch-api
// Got with: `jw.getProviders()`
const providers = {
  2: 'Apple iTunes',
  3: 'Google Play Movies',
  8: 'Netflix',
  11: 'Mubi',
  31: 'HBO Go',
  43: 'Starz',
  67: 'Blim',
  119: 'Amazon Prime Video',
  167: 'Claro video',
  190: 'Curiosity Stream',
  269: 'Funimation Now',
  274: 'QubitTV',
  283: 'Crunchyroll',
  300: 'Pluto TV',
  315: 'Hoichoi',
  337: 'Disney Plus',
  339: 'Movistar Play',
  350: 'Apple TV Plus',
  384: 'HBO Max',
  444: 'Dekkoo',
  464: 'Kocowa',
  467: 'DIRECTV GO',
  475: 'DOCSVILLE',
  521: 'Spamflix',
  531: 'Paramount Plus',
  546: 'WOW Presents Plus',
  551: 'Magellan TV',
  554: 'BroadwayHD',
  559: 'Filmzie',
  567: 'True Story',
  569: 'DocAlliance Films',
  575: 'KoreaOnDemand',
  619: 'Star Plus',
  677: 'Eventive',
  692: 'Cultpix',
  701: 'FilmBox+',
  1771: 'Takflix'
}

const url = 'https://www.justwatch.com'
const locale = 'es_CL'

module.exports = robot => {
  robot.respond(/donde ver (.*)/i, async res => {
    const jw = new JustWatch({ locale })

    const toSearch = res.match[1]
    const response = await jw.search(toSearch)
    let message = ''

    if (response?.items.length) {
      const item = response.items[0]
      const offers = Array.from(new Set(item.offers?.map(offer => offer.provider_id) || [])).map(providerId => providers[providerId])
      const availabilityMessage =
        offers.length
        ? `Puedes ver ${item.title} en: ${offers.join(', ')}`
          : `Actualmente, NO hay opciones para ver ${item.title} en Chile`

      message = [availabilityMessage, `Puedes ver más info en la página de JustWatch: ${url + item.full_path}`].join('\n')
    } else {
      message = `No he podido encontrar sugerencia para ${toSearch}. Intenta alguna variación u otro nombre.`
    }
    return res.send(message)
  })
}
