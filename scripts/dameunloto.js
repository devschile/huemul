// Description:
// Devuelve 6 números ganadores para el Loto
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Command:
//   hubot dame un loto - Devuelve 6 números ganadores para el Loto
//
// Author:
//   @raerpo

const MAX_NUMBER = 41
const lotoNumbers = [...Array(MAX_NUMBER).keys()].map(i => i + 1)

const getRandomLotoNumbers = lotoNumbers => {
  const lotoNumbersCopy = lotoNumbers.concat([])
  const winningNumbers = []
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * lotoNumbersCopy.length)
    const winningNumber = lotoNumbersCopy[randomIndex]
    winningNumbers.push(winningNumber)
    lotoNumbersCopy.splice(randomIndex, 1)
  }
  return winningNumbers.sort((a, b) => a - b)
}

module.exports = robot => {
  robot.respond(/dame un loto/gi, msg =>
    msg.send(
      `:huemul: Estos son los números ganadores: \`${getRandomLotoNumbers(
        lotoNumbers
      )}\`\nTodo nuevo millonario paga impuesto :monea:`
    )
  )
}
