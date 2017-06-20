// Description:
//   Display pictures of our former president
//
// Dependencies:
//   None
//
// Configuration:
//   None
//
// Notes:
//   yeta   - Displays a Piñera picture
//   piñera - Displays a Piñera picture
//
// Author:
//   @hectorpalmatellez

let images = [
  "http://s3-sa-east-1.amazonaws.com/lalegal/app/public/system/photos/4038/original/5b9.jpg",
  "http://www.gamba.cl/wp-content/uploads/2012/02/pi%C3%B1era-skate1-225x300.jpg",
  "http://www.gamba.cl/wp-content/uploads/2011/12/PI%C3%91ERA-AWEONAO.jpg",
  "https://wnfeliz.files.wordpress.com/2011/07/129100360258.jpg",
  "http://4.bp.blogspot.com/-WyfG_qQpTUw/TiEP7kXi3lI/AAAAAAAAFKE/6bmDrjjdfZY/s1600/4.jpg",
  "http://img.emol.com/2011/03/08/File_201138135519.jpg",
  "http://www.australvaldivia.cl/prontus3_fotos/site/artic/20050910/imag/FOTO4220050910232209.jpg",
  "https://pbs.twimg.com/media/Cy7cN3QWIAAP7pR.jpg"
];

module.exports = robot => {
  robot.hear(/piñera|yeta/gi, msg => msg.send(msg.random(images)));
};
