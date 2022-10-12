// Description:
//   Agrega ruta para callbacks de Slack
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Author:
//   @gmq

module.exports = robot => {
  robot.router.post('/slack-actions', (req, res) => {
    const payload = JSON.parse(req.body.payload)
    const action = payload.callback_id || payload.actions[0].action_id
    robot.emit(action, payload)
    res.end()
  })
}
