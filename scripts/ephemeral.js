// Description:
//   Permite enviar mensajes efimeros
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   None

module.exports = robot => {
  /**
   * Envia un mensaje efimero usando slack.
   * @param  {string} text
   * @param  {string} channelId
   * @param  {string} userId
   * @return {void}
   * @see {@link https://api.slack.com/methods/chat.postEphemeral|chat.postEphemeral}
   * @example
   * sendEphemeral('hola mundo', 'C1234567890', 'U0G9QF9C6')
   */
  const sendEphemeral = (text, channelId, userId) => {
    const options = {
      link_names: true,
      attachments: [{ text }],
      as_user: true
    }
    robot.adapter.client.web.chat.postEphemeral(
      channelId, null, userId, options
    )
  }

  /**
   * Listener para enviar mensajes efimeros.
   * @example
   * const channelId = res.message.room
   * const userId = res.message.user.id
   * robot.emit('slack.ephemeral', 'hola mundo', channelId, userId)
   */
  robot.on('slack.ephemeral', sendEphemeral)
}
