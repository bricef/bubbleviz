 $(function(){
    $('#slider-id').liquidSlider({
      dynamicTabs:false,
      crossLinks:true,
      continuous:false,
      dynamicArrows:false,
      keyboardNavigation:true,
      slideEaseFunction:'animate.css',
      slideEaseDuration:1000,
       heightEaseDuration:1000,
      animateIn:"rotateInUpRight",
      animateOut:"rotateOutUpLeft",
      panelKeys:{},
      hashLinking:true,
      firstPanelToLoad:1,
      preloader:false,
      panelTitleSelector:'h1.title',
      hashTitleSelector:'h1.title',
      preload: function() {
        var self = this;
        //$('.ls-preloader').html('<div class="liquid-slider-preloader"><div id="blockG_1" class="blockG"></div><div id="blockG_2" class="blockG"></div><div id="blockG_3" class="blockG"></div></div>');
        self.adjustHeight(false, self.getHeight());
        setTimeout(function() {
          self.finalize();
          }, 2000);
      },
      pretransition: function() {
        if (this.nextPanel === 3) {
          $('.right-btn').fadeOut();
        } else {
          $('.right-btn').fadeIn();
        }
        this.transition();
      },
      onload: function() {
        setTimeout(function() {
          $('.ls-wrapper').css('overflow', 'auto');
        }, 1000);
      }
    });

    var api = $.data( $('#slider-id')[0], 'liquidSlider');
    if (api.nextPanel === 3) {
      $('.right-btn').css('display', 'none');
    }

    $('.menu-toggle').on('click', function() {
      $('.menu').toggleClass('open');
    });
    $('.menu a').on ('click', function() {
      $('.menu').removeClass('open');
    })
  });