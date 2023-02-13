// Description:
//   Obtiene calidad del aire en ICA de Estados Unidos
//
// Dependencies:
//   None
//
// Commands:
//   hubot iqair <ciudad> - devuelve el AQI US y la calificación de calidad
//
// Author:
//   @hectorpalmatellez

const url = 'https://api.airvisual.com/v2/city?city=*CITY*&state=*STATE*&country=*COUNTRY*&key=*KEY*'
const key = process.env.IQAIR_API_KEY
const getAirQualityCategory = (qualification) => {
  switch (true) {
    case (qualification < 50): {
      return 'BUENO'
    }
    case qualification < 100:
      return 'MODERADO'
    case qualification < 150:
      return 'MALO PARA GRUPOS SENSIBLES'
    case qualification < 200:
      return 'MALO'
    case qualification < 300:
      return 'MUY MALO'
    default:
      return 'PELIGROSO'
  }
}
const cities = {
  santiago: {
    state: 'santiago-metropolitan',
    country: 'chile'
  },
  'la-serena': {
    state: 'coquimbo',
    country: 'chile'
  },
  concepcion: {
    state: 'biobio',
    country: 'chile'
  },
  chillan: {
    state: 'biobio',
    country: 'chile'
  },
  temuco: {
    state: 'araucania',
    country: 'chile'
  },
  valdivia: {
    state: 'los-rios',
    country: 'chile'
  },
  'puerto-montt': {
    state: 'los-lagos',
    country: 'chile'
  },
  'san-antonio': {
    state: 'valparaiso',
    country: 'chile'
  },
  valparaiso: {
    state: 'valparaiso',
    country: 'chile'
  },
  'vina-del-mar': {
    state: 'valparaiso',
    country: 'chile'
  },
  mumbai: {
    state: 'maharashtra',
    country: 'india'
  },
  shanghai: {
    state: 'shanghai',
    country: 'china'
  },
  'mexico-city': {
    state: 'mexico-city',
    country: 'mexico'
  },
  lima: {
    state: 'lima',
    country: 'peru'
  },
  tokyo: {
    state: 'tokyo',
    country: 'japan'
  },
  'sao-paulo': {
    state: 'sao-paulo',
    country: 'brazil'
  },
  bogota: {
    state: 'bogota-dc',
    country: 'colombia'
  },
  'buenos-aires': {
    state: 'buenos-aires',
    country: 'argentina'
  },
  montevideo: {
    state: 'montevideo',
    country: 'uruguay'
  },
  'la-paz': {
    state: 'la-paz',
    country: 'bolivia'
  },
  asuncion: {
    state: 'asuncion',
    country: 'paraguay'
  }
}

module.exports = robot => {
  robot.respond(/iqair (.*)/i, async (msg) => {
    const city = String(msg.match[1]).toLowerCase()
    if (!key) {
      throw new Error('No hay key')
    }
    if (city === 'help') {
      msg.send(`Las ciudades que tenemos ahora son ${String(Object.keys(cities)).replace(/,/g, ', ')}`)
    }
    const searchUrl = url.replace('*CITY*', city)
      .replace('*STATE*', cities[city].state)
      .replace('*COUNTRY*', cities[city].country)
      .replace('*KEY*', key)

    robot.http(searchUrl).get()((err, res, body) => {
      if (err) console.log(err)
      if (body) {
        const data = JSON.parse(body)
        const { status, data: result } = data
        const { aqius } = result.current.pollution
        const quality = getAirQualityCategory(aqius)
        const toDecent = (cityName) => {
          const name = cityName.replace(/-/g, ' ')
          return String(cityName[0]).toUpperCase() + name.substring(1, cityName.length)
        }

        if (status === 'success') {
          msg.send(`La calidad del aire en ${toDecent(city)} es ${result.current.pollution.aqius}, lo que califica como ${quality}`)
        }
      }
    })
  })
}
