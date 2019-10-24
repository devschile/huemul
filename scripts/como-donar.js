// Description:
//   Huemul explica con peras y manzanas cómo donar a la comunidad
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot como donar - Muestra las instrucciones de cómo donar
//   hubot cómo donar - Muestra las instrucciones de cómo donar
//
// Author:
//   @jorgeepunan

const WALLET_BTC = process.env.WALLET_BTC
const WALLET_ETH = process.env.WALLET_ETH

module.exports = robot => {
  robot.respond(/c(o|ó)mo donar/i, msg => {
    msg.send(
      `Para mantener el servidor donde se aloja el :robot: :huemul: y otros proyectos que creamos desde y para la comunidad, se reciben donaciones desde US$10 por diferentes medios:\n \
 · *Paypal*: desde el mismo sitio www.devschile.cl, abajo hay 2 botones: pago de impuesto por cambio de trabajo y compra de stickers. Todos por PayPal.\n \
 . *Transferencia*: puedes transferir en pesos chilenos lo equivalente a los US$10 a través de la cuenta del tesorero :gmq:, DM con él para su info bancaria.\n \
 · *Débito, Crédito*: desde el mismo sitio www.devschile.cl, abajo hay 1 botón para donar a través de Kushki. A menudo vendemos _swags_ de la comunidad (tazones, stickers, posavasos, etc.) y en esos casos el mejor admin @jorgeepunan entrega un botón de pago correspondiente, siempre a través de Kushki.\n \
 . *Cryptos*: recibimos lo equivalente a US$10 en algunos wallets:\n \
   - BTC: ${WALLET_BTC}\n \
   - ETH: ${WALLET_ETH}\n \
Gracias :pray: por el interés y por las ganas de aportar :gold: a que siga creciendo la comunidad devsChile. Hacemos buen uso de las donaciones, desde el pago de los _servers_ hasta concursos y sorteos de cursos Udemy entre otros. :heartbeat:`
    )
  })
}
