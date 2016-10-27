
var typed = false;
$( document ).ready(function() {
    var visualModule = new VisualModule();
    visualModule.init(visualModule);
    AOS.init();
    
    $(window).scroll(function() {    
        if(typed == false && isScrolledIntoView($('#intro')))
        {
            typed = true;
            $('#pregunta_generadora').typeIt({
                 speed: 50,
                 autoStart: false,
                 cursor:false,
            })
            .tiType('¿Cómo debe ser la <span class="span_h2"> arquitectura lógica y física </span> de una plataforma robótica enfocada a la <span class="span_h2"> dramatización </span>?');
        }    
    });
});

function isScrolledIntoView(elem)
{
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();
    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();
    return ((elemBottom >= docViewTop) && (elemTop <= docViewBottom) && (elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}
