// Description:
//   Dice cuanto tienes que pagarle al SII por impuestos y cotizaciones
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot impuestos <sueldoMensual> - Dice cuanto tendrás que pagarle all SII en la próxima operación renta
//
// Author:
//   Nicolás Gómez <ngomez@hey.com>

const { calcular, obtenerTramoImpositivo } = require('tax-cl')
const { numberToCLPFormater } = require('numbertoclpformater')

module.exports = robot => {
  robot.respond(/impuestos (\d+)$/i, msg => {
    const income = parseInt(msg.match[1], 10)

    const {
      deuda,
      retencion,
      impuestos,
      montoCotizacionesObligatorias: cotizaciones,
      deudaModalidadParcial: parcial,
      sueldoTributable
    } = calcular(income)

    const tramoImpositivo = obtenerTramoImpositivo(sueldoTributable)
    const emoji = tramoImpositivo.factor > 0.04 ? ':patrones:' : ':c3:'

    const messages = [
      deuda > 0
        ? `Tendrás que pagar ~ *${numberToCLPFormater(deuda)}* ${emoji}`
        : `Recibirás una devolución de *${numberToCLPFormater(-deuda)}*`,
      `A favor tienes tu retención de boletas (10.75%): *${numberToCLPFormater(retencion)}*`,
      `En contra tienes los impuestos (*${numberToCLPFormater(impuestos)}*) y las cotizaciones (*${numberToCLPFormater(cotizaciones)}*)`,
      parcial > 0
        ? `Si optas por modalidad parcial, tendrás que pagar ~ *${numberToCLPFormater(parcial)}*`
        : `Si optas por modalidad parcial, recibirás una devolución de ~ *${numberToCLPFormater(-parcial)}*`
    ]

    msg.send(messages.join('\n- '))
  })
}
