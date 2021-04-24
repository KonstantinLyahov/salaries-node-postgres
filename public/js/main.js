$('document').ready(function (){
    $('table#employees>tbody>tr').on('click', function() {
        location.href = $(this).data('link');
    });
});