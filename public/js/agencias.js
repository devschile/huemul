$('#agencias-404').hide();

$('.agencias-show').on('click', function() {
  var src = $(this).data('src');

  $(this).parents('li').addClass('active').siblings().removeClass('active');

  $('#agencias-message').text('Cargando...');
  $('#agencias-preview').attr('src', src)
  .on('load', function() {
    $('#agencias-message').text(src);
    $('.agencias-preview').show();
  })
  .on('error', function() {
    $('#agencias-message').text('No disponible :(');
    $('.agencias-preview').show();
  });
});
$('.agencias-delete').on('click', function() {
  var src = $(this).data('src');
  var token = $(this).data('token');
  var result = window.confirm('¿Está seguro que desea eliminar la imagen?');

  if (result) {
    window.location.href = `/agencias/delete?link=${src}&token=${token}`
  }
});
$('.agencias-fix').on('click', function() {
  var src = $(this).data('src');

  window.location.href = `/agencias/fix?link=${src}`
});

