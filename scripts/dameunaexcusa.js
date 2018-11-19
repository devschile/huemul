// Description:
//   Muestra una excusa para faltar al trabajo al azar
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   huemul dame una excusa
//
// Author:
//   @jorgeepunan

const excuses = [
	'No tengo ropa limpia para ponerme',
	'Mi hijo(a) tiene hora al pediatra',
	'Mi mascota fue atropellada',
	'No encuentro a mi mascota',
	'Desde anoche que tengo diarrea',
	'Amanecí con náuseas, necesito un baño cerca',
	'Tengo un funeral de un familiar de mi pareja',
	'Se rompió una cañería en mi casa, necesito solucionarlo hoy',
	'Vienen a entregar una compra por Internet de 9:00 a 19:00 hrs.',
	'Me tengo que hacer exámenes médicos en ayuna',
	'Iba camino a la oficina y me chocaron; estoy bien fue poco pero tengo que ir al seguro',
	'Amanecí con fiebre :fire:',
	'Trataron de entrar a robar anoche, estoy con Carabineros',
	'Tengo reunión de apoderados',
	'Se me rompió un diente comiendo ayer; conseguí dentista para hoy',
	'No tengo Internet desde ayer; vienen hoy a arreglarlo'
]

module.exports = robot => {
  robot.respond(/dame una excusa/gi, msg => msg.send(msg.random(excuses)))
}
