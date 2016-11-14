// Description:
//   Emite por #random los textos respectivos para concursar y ganar HuemulCoins ℌℭ
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot concurso (txt|inicio|reglas|ganador|fin) <mensaje>
//    - txt <mensaje>: despliega un mensaje
//    - inicio: da la intro de bienvenida
//    - reglas: muestra las reglas
//    - ganador <usuario sin @>: muestra al ganador con fanfarria y weas
//    - fin: datos finales de contacto para cobrar el premio
//
// Author:
//   @jorgeepunan

module.exports = function(robot) {

	return robot.respond(/concurso (txt|inicio|reglas|ganador|fin)?(.*)/i, function(msg) {
		var opcion 		= msg.match[1];
		var mensaje 	= msg.match[2];
		var userName	= msg.message.user;
		var userClean = userName.name.toLowerCase();
		var room 			= '#comunidad';

		// textos
		var inicio 		= '*¡Nuevo concurso en devsChile!* ​_Adivina Quién_​ y ganarás 1 HuemulCoin gentileza de tu grupo favorito de _Slack_';
		var reglas  	= [
		'Quienes quieran concursar tendrán que seguir las siguientes simples reglas:\n',
'- Se darán hasta 3 pistas identificando a alguien que pertenezca a este grupo\n',
'- Si crees saber quién es, debes etiquetar esta publicación (no en las pistas mismas) el ícono de quién crees que es la persona\n',
'- El ganador no será el más rápido, sino por un sorteo a través de `huemul-azar` entre todos quienes etiquetaron correctamente\n',
'- El ganador se llevará 1 HuemulCoin ℌℭ (`huemul finvox huemulcoin`) pagado mediante PayPal. (Si no tiene PayPal, se consigue uno o aprovecha de sacar una cuenta)\n',
'- Comienza ahora, *¡ya!*'];
		var fin 			= 'Envíe ASAP un email a huemul@devschile.cl para reclamar su premio. :huemul: :mailbox_closed: :moneybag:';


		// sanitiza output para evitar abuso de malulos. prestado de karma.coffee
		var words = ['@here', '@channel', '@group', '@everyone'];

		for (var i = 0; i < words.length; i++) {
			if (mensaje.indexOf(words[i]) !== -1) {
				msg.send('¡No puedes usar! @');
			}
		}

		// verifica si usuario es uno de los 3 admin. muy rústica la validación, lo sé. prestado de karma.coffee
		//if( userClean !== 'shell' ) { // localhost test
		if( userClean !== 'jorgeepunan' ) {

			msg.send('Tienes que ser admin para usar este script.');

		} else {

			if ( opcion === 'txt' ) {
				// return robot.messageRoom('Shell', "🎉 *¡CONCURSO!* 🎉 " + mensaje); // localhost test
				return robot.messageRoom(room, '🎉 *¡CONCURSO!* 🎉 ' + mensaje);
			}  else if ( opcion === 'inicio' ) {
				return robot.messageRoom(room, '🎉 *¡CONCURSO!* 🎉 \n' + inicio);
			} else if ( opcion === 'reglas' ) {
				return robot.messageRoom(room, '🎉 *¡CONCURSO!* 🎉 Reglas:\n' + reglas.join(''));
			} else if ( opcion === 'ganador' ) {
				return robot.messageRoom(room, '🎉 *¡CONCURSO!* 🎉 :parrot: ¡TENEMOS UN GANADOR! :parrot: \n\n :trophy: :trophy: :trophy: *' + mensaje + '* :trophy: :trophy: :trophy: \n\n ¡ F E L I C I D A D E S !');
			} else if ( opcion === 'fin' ) {
				return robot.messageRoom(room, '🎉 *¡CONCURSO!* 🎉 ' + fin);
			}

		}

	});

};

