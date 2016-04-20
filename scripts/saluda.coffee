# Description:
#   Hubot saluda cuando hay gente nueva por DM
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   None
#
# Author:
#   @jorgeepunan

module.exports = (robot) ->
  robot.enter (msg) ->
  #robot.hear /hola/i, (msg) -> #test local
    if msg.message.room == 'anuncios'
      robot.send {room: msg.message.user.name}, '¡Hola, *{msg.message.user.name}*! :wave:
        Soy #{robot.name} el :robot: de este grupo y te doy la bienvenida a *devsChile*, la comunidad chilena de desarrolladores web.
        Entre los canales que te pueden interesar están: <#C0R6E10LC|frontend>, <#C0R7P17AQ|backend>, <#C0R6AM4DP|pegas> y otros que puedes seleccionar a tu izquierda :point_left:.
        Te sugerimos presentarte en <#C0R6E19QS|random> y te daremos la bienvenida como corresponde. Para conocer mis comandos puedes enviarme un `huemul help` y te mostraré lo que puedo hacer.
        No dejes de leer nuestro Código de Conducta http://www.devschile.cl/coc/ y cualquier duda o consulta sobre el CdC o el grupo puedes hacerla en <#C0TFU7ZJA|comunidad>.
        ¡Esperamos tu participación!'
