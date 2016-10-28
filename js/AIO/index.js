
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
    
    $('.pictures').slick({
        dots: true,  
        slidesToShow: 2,
        autoplay: true,
        autoplaySpeed: 2000,
        responsive: [
            {
              breakpoint: 1024,
              settings: {
                slidesToShow: 3,
                slidesToScroll: 3,
                infinite: true,
                dots: true
              }
            },
            {
              breakpoint: 600,
              settings: {
                slidesToShow: 2,
                slidesToScroll: 2
              }
            },
            {
              breakpoint: 480,
              settings: {
                slidesToShow: 1,
                slidesToScroll: 1
              }
            }
          ]
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
