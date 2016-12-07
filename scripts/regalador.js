// Description:
//   Hubot script que sugiere un set de 3 regalos para hombre / mujer
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Commands:
//   hubot regalos hombre|mujer
//
// Author:
//   @jorgeepunan

hombre = [
  'Copete (Vino, Whisky, Pisco)',
  'Cerveza Artesanal',
  'Pack de 12 condones',
  'Disco en CD / Película en DVD o BlueRay',
  'Giftcard en Amazon',
  'Descorchador',
  'Lentes de VR (de esos chinos)',
  'Pendrive / Tarjeta SD de muchos gigas',
  'Batería de carga para dispositivos móviles',
  
]

mujer = [
  'Perfume',
  'Pañuelo para el cuello',
  'Caja de Chocolates / Bombones',
  'Crema Corporal / Facial'
]

mixto = [
  'Libro',
  'Café / Caja de Te',
  'Audífonos',
  'Cargador Celular',
  'Giftcard en retail nacional'
]

function escogeRegalo(n, sexo, prefix) {
  prefix = prefix || ' - ';
  sexo = eval(sexo);

  var _regalos = new Array();

  for (var i = 1; i < n; i++) {
    _regalos.push( prefix + sexo[Math.floor(Math.random() * sexo.length)] );
  }
  _regalos.push( prefix + mixto[Math.floor(Math.random() * mixto.length)] );

  return _regalos;
}

module.exports = function(robot) {

  robot.respond(/(regalo|regalos) (.*)/i, function(res) { // debo arreglar ese regex

    var sexo = res.match[2];
    var num = 3;
    
    if( sexo.match(/hombre|mujer/) ) {
      res.send( 'Aquí hay ' + num + ' sugerencias de parte de :huemul: de regalos para ' + sexo + ': \n' + escogeRegalo(num, sexo, ' :point_right: ').join('\n') );
    } else {
      res.send('Debes elegir un género para elegir regalo: hombre o mujer.');
    }

  });
};
