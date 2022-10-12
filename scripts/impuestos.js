// Description:
//   Dice cuanto tienes que pagarle al SII por impuestos y cotizaciones
//
// Dependencies:
//   numbertoclpformater
//   tax-cl
//
// Configuration:
//   None
//
// Commands:
//   hubot impuestos <sueldoMensual> - Dice cuanto tendrás que pagarle al SII en la próxima operación renta
//
// Author:
//   Nicolás Gómez <ngomez@hey.com>

const { calcular, obtenerTramoImpositivo } = require('tax-cl')
const { numberToCLPFormater } = require('numbertoclpformater')

/**
 * Convierte currency string a numero.
 *
 * @param {string} stringNumber -
 * @returns {number} -
 */
const parseLocaleNumber = stringNumber => {
  const thousandSeparator = '.'
  const decimalSeparator = ','

  return parseFloat(stringNumber
    .replace(new RegExp('\\' + thousandSeparator, 'g'), '')
    .replace(new RegExp('\\' + decimalSeparator), '.')
  )
}

module.exports = robot => {
  robot.respond(/impuestos \$?\s?(\d+[.,\dk]+)$/i, msg => {
    const rawIncome = msg.match[1]
    const income = parseLocaleNumber(rawIncome.toString())
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
    const prefix = `Para el sueldo ${numberToCLPFormater(income)}`
    const messages = [
      deuda > 0
        ? `${prefix} tendrás que pagar ~ *${numberToCLPFormater(deuda)}* ${emoji}`
        : `${prefix} recibirás una devolución de *${numberToCLPFormater(-deuda)}*`,
      `A favor tienes tu retención de boletas (10.75%): *${numberToCLPFormater(retencion)}*`,
      `En contra tienes los impuestos (*${numberToCLPFormater(impuestos)}*) y las cotizaciones (*${numberToCLPFormater(cotizaciones)}*)`,
      parcial > 0
        ? `Si optas por modalidad parcial, tendrás que pagar ~ *${numberToCLPFormater(parcial)}*`
        : `Si optas por modalidad parcial, recibirás una devolución de ~ *${numberToCLPFormater(-parcial)}*`
    ]

    msg.send(messages.join('\n- '))
  })
}
