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
    anuncios = robot.adapter.client.rtm.dataStore.getChannelByName '#anuncios'
    if msg.message.room == anuncios.id
      robot.send {room: msg.message.user.id}, "¡Hola, *#{msg.message.user.name}*! :wave: \n
        Soy #{robot.name} el :robot: de este grupo y te doy la bienvenida a *devsChile*, la comunidad chilena de desarrolladores y diseñadores web.\n\n

        Entre los canales que te pueden interesar están: \n
          - #frontend: web standards y frameworks de moda.\n
          - #backend: hardware, BD y lenguajes compilados.\n
          - #pegas: avisos de trabajo y conversación del mundo laboral.\n
          - #cultura: películas, series, libros, exposiciones.\n
          - #mobile: desarrollo nativo e híbrido para dispositivos móviles.\n
          - #ux: diseño web, experiencia de usuario, ui y recursos gráficos.\n
          - #eventos-juntas: como humanos a veces nos juntamos, y aquí lo organizamos, además de meetups y conferencias nerds\n
          - #mascotas: cuidado, tenencia responsable y productos para mascotas.\n
          - #random: todo lo que no cabe en otros canales, o que puede ir en todos, va aquí. Generalmente el canal con más movimiento.\n\n

        Te sugerimos presentarte en #comunidad y te daremos la bienvenida como corresponde. Para conocer mis comandos puedes enviarme un `help` por MD o decir `huemul help` en algún canal y te mostraré lo que puedo hacer.\n
        No dejes de leer nuestro Código de Conducta http://www.devschile.cl/coc/ y cualquier duda o consulta sobre el CdC o el grupo puedes hacerla en #comunidad.\n
        ¡Esperamos tu participación!"
