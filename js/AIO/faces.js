
class VisualModule {
    constructor(){
        this.renderedSVG = new SVGMorpheus('#svg-assets', {iconId: 'full-opened-eyes'});
        this.animateFace = function(animationName){
            var renderedSVG = new SVGMorpheus('#svg-assets', {iconId: 'full-opened-eyes'});
            switch(animationName){
                case "BLINK":
                  var toRender = [
                      {
                          id:'full-opened-eyes',
                          properties: {
                              duration: 500,
                              easing: 'linear',
                              rotation: 'none'
                          },
                          delay: 500
                      },{
                          id:'full-closed-eyes',
                          properties: {
                              duration: 250,
                              easing: 'quint-in',
                              rotation: 'none'
                          },
                          delay: 0
                      },{
                          id:'full-opened-eyes',
                          properties: {
                              duration: 250,
                              easing: 'quint-in',
                              rotation: 'none'
                          },
                          delay: 0
                      }
                  ];
                  utils_renderSVGSet(toRender,this.renderedSVG, this, this.animate);
              break;
            }
        };
        
        this.animate = function(module){
            var num = Math.floor((Math.random() * 10) + 1);
            if(num > 8){
                console.log("Reirse");
                setTimeout(function(){
                    module.animateFace("BLINK");
                }, 3000);
            }else{
                setTimeout(function(){
                    module.animateFace("BLINK");
                }, 3000);
            }
        }
        
        this.init = function(module){
            module.animateFace("BLINK");
        }
    }
}

$( document ).ready(function() {
    var visualModule = new VisualModule();
    visualModule.init(visualModule);
});
