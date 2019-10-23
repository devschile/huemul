// Description:
//   Hubot saluda cuando hay gente nueva por DM
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   None
//
// Author:
//   @jorgeepunan

module.exports = robot => {
  robot.enter(msg => {
    // robot.hear(/hola/i, msg => {
    const channel = robot.adapter.client.rtm.dataStore.getChannelByName('#comunidad')
    if (msg.message.room === channel.id) {
      robot.send(
        { room: channel.members.pop() },
        `¡Hola! :wave: \n \
Soy ${
          robot.name
        } el :robot: de este grupo y te doy la bienvenida a *devsChile*, la mejor y más activa comunidad chilena de desarrolladores y diseñadores web.\n\n \
Entre los canales que te pueden interesar están:\n \
- #anuncios: el canal que alberga todos los usuarios y donde se realizan anuncios oficiales por los admins sobre temas relacionados con la comunidad. Aquí también se anuncia las inscripciones a la famosa BeerJS Santiago, mes a mes.\n \
- #backend: server-side, BD, devops y lenguajes compilados.\n \
- #cerveceros: somos wenos pa la chela y aquí se comparte todo lo relacionado con este delicioso brebaje, desde fabricantes a consumidores y promociones.\n \
- #comunidad: temas relacionados con todos y que no cabe en ningún otro canal o quizás en varios.\n \
- #cultura: películas, series, libros, exposiciones, historia y temas contingentes.\n \
- #eventos-juntas: como humanos a veces nos juntamos y aquí lo organizamos, además de meetups y conferencias nerds.\n \
- #frontend: web standards, librerías y frameworks de moda. ¿Tienes un problema en tu código? Aquí varios pueden ayudarte.\n \
- #hardware: placas, impresoras 3D y demases.\n \
- #huemul-devs: nuestro bot es ejemplo mundial de desarrollo open-source, y aquí lo lustramos todos los días.\n \
- #lifehacks: tips, reviews, promociones, ofertas y todo lo que permita una vida mejor y más barata.\n \
- #datascience: el nombre lo dice todo.\n \
- #mascotas: cuidado, tenencia responsable, tips, compra y promociones de productos para mascotas.\n \
- #mobile: desarrollo nativo e híbrido para dispositivos móviles.\n \
- #moneas: criptomonedas, blockchain y demases.\n \
- #musiqueria: bandas, discos, playlists para codear, white noise y reviews de audífonos.\n \
- #pegas: avisos de trabajo y ~conversación~ pelambre del mundo laboral.\n \
- #persa: compra / venta de todo lo que quieras, descuentos especiales para negocios dentro de la comunidad.\n \
- #ux: diseño web, experiencia de usuario, UI y recursos gráficos.\n \
- #uwu: cultura asiática, sus costumbres, intercambiar conocimientos, imágenes, reviews, links entre otros sobre manga y anime :uwu:\n \
- #random: todo lo que no cabe en otros canales, o que puede ir en todos, va aquí; generalmente el canal con más movimiento y procrastinador.\n\n \
\
Te sugerimos presentarte en #comunidad y te daremos la bienvenida como corresponde. Para conocer mis comandos puedes enviarme un \`help\` por DM o escribir \`huemul help\` en algún canal y te mostraré lo que puedo hacer.\n\n \
\
Esta comunidad es libre y abierta y se aceptan donaciones voluntarias para mantener el servidor en el cual reside el sitio web y :huemul: ; se venden stickers en http://www.devschile.cl \
\
No dejes de leer nuestro Código de Conducta http://www.devschile.cl/coc/ y cualquier duda o consulta sobre el CdC o el grupo puedes hacerla en #comunidad o directo a los admins :gmq: :hector: o :jorge: \n\n \
\
¡Esperamos tu participación!`
      )
    }
  })
}
