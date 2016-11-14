
# Description:
#   Muestra las portadas de hoy de diversos diarios de Chile.
#
# Dependencies:
#   moment
#
# Configuration:
#   None
#
# Commands:
#   hubot portada <diario>
#
# Diarios Disponibles:
#   la segunda|segunda
#   la tercera|tercera
#   la cuarta|cuarta
#   el mercurio|mercurio
#   las ultimas noticias|lun
#   publimetro
#   le monde|monde
#   el pais|pais
#
# Author:
#   @rotvulpix

moment = require("moment");
intentos = 0

format_date = (date, no_slashes = false) ->
  if no_slashes
    date.format 'YYYYMMDD'
  else
    date.format 'YYYY/MM/DD'

get_portada = (msg, diario, days_past = 0) ->
  if days_past > 5
    msg.send "No existe portada de este diario por los últimos 5 días."
  else
    fecha = moment().subtract(days_past, 'days')
    test_url = diario.url.replace("#DATE#", format_date(fecha, diario.no_slashes))
    msg.http(test_url).get() (err, res, body) ->
      if res.statusCode == 404
        get_portada(msg, diario, days_past + 1)
      else
        msg.send test_url

module.exports = (robot) ->
  robot.respond /portada (.*)/i, (msg) ->
    nombre = msg.match[1].replace(/^(las |la |el |le )/, "").replace(" ", "")
    diario = switch(nombre)
      when "segunda" then { url: "http://www.portadaschilenas.com/#DATE#/Lasegunda_grande.jpg", no_slashes: false }
      when "tercera" then { url: "http://cache-img1.pressdisplay.com/pressdisplay/docserver/getimage.aspx?file=2044#DATE#00000000001001&page=1", no_slashes: true }
      when "cuarta" then { url: "http://www.portadaschilenas.com/#DATE#/Lacuarta_grande.jpg", no_slashes: false }
      when "publimetro" then { url: "http://www.portadaschilenas.com/#DATE#/pm_grande.jpg", no_slashes: false }
      when "mercurio" then { url: "http://www.portadaschilenas.com/#DATE#/Emol_grande.jpg", no_slashes: false }
      when "ultimasnoticias" then { url: "http://www.portadaschilenas.com/#DATE#/Lun_grande.jpg", no_slashes: false }
      when "lun" then { url: "http://www.portadaschilenas.com/#DATE#/Lun_grande.jpg", no_slashes: false }
      when "monde" then { url: "http://www.lemonde.fr/journalelectronique/donnees/libre/#DATE#/QUO/img_pleinepage/1.jpg", no_slashes: true}
      when "pais" then { url: "http://img.kiosko.net/#DATE#/es/elpais.750.jpg", no_slashes: false }

    get_portada(msg, diario)
