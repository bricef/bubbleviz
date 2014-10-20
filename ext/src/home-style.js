var containingSelector = "#searches";
var boxSelector = ".search";
var tobparSelector = "#topbar";


var element_to_transform_config = function (elem){
  $elem = $(elem);
  var top = $elem.position().top - $(document).scrollTop();
  var left = $elem.position().left - $(document).scrollLeft();
  var _width = $elem.outerWidth();
  var _height = $elem.outerHeight();
  var new_width = $(window).width();
  var new_height = $(window).height();

  return {
    element: elem,
    src: [
      {x:0, y:0}, 
      {x:_width, y:0}, 
      {x:_width, y:_height}, 
      {x:0, y:_height}
    ],
    dst: [
      {x:-left, y:-top}, 
      {x:new_width, y:-top}, 
      {x:new_width, y:new_height}, 
      {x:-left, y:new_height}]
  }
};


var expended = false;

var collapse_tile = function(elem){
  if(!expended){return;}

  console.log('Collapsing tile...');
  $fullview = $(elem);
  $search = $fullview.parent();
  $tileview = $search.find('.tileview');
  $('#searches').isotope('bindResize');
  $('#searches').isotope('layout');
  //order_and_filter();

  $('body').css('overflow-y', 'auto');
  var new_settings = {
    position: 'fixed',
    top: ($search.position().top - $(document).scrollTop()) +'px',
    left: ($search.position().left - $(document).scrollLeft()) +'px',
    width: $search.width()+'px',
    height: $search.height()+'px',
    'z-index': 10,
  };  

  $fullview.animate(new_settings,1000, function(){
    $(this).css({
      top: 'auto',
      left: 'auto',
      bottom: 'auto',
      width:'100%',
      height:'100%',
      position: 'relative',
      'z-index':1
    });
    $fullview.hide();
    //$fullview;
    //$elem.find('.tileview').fadeIn();
    
    //$elem.click(function(){
    //  expand_tile($tileview);
    //});
    $('#dateslider').dateRangeSlider('resize');
    expended = false;
  });
};

// expand_tile will receive a tileview element
var expand_tile = function(elem){
  if(expended){return;}
  expended = true;
  console.log("Expanding tile...");
  $tileview = $(elem);
  $search = $tileview.parent();
  $fullview = $search.find('.fullview');
  $('#searches').isotope('unbindResize');
  
  $fullview.find(".collapser").click(function(){
    collapse_tile($fullview);
  });
  
  // viewport positions
  var initial_settings = {
    position: 'fixed',
    top: ($search.position().top - $(document).scrollTop()) +'px',
    left: ($search.position().left - $(document).scrollLeft()) +'px',
    width: $search.outerWidth()+'px',
    height: $search.outerHeight()+'px',
    'z-index': 10
  };

  $fullview.show().css(initial_settings);
  
  $fullview.find('.results-personal').isotope({
    itemSelector: '.result',
  	layoutMode: 'masonry',
  	packery: {
      gutter: 0
    },
    getSortData: {
      rank: function(elem){
        return parseInt($(elem).find('.rank').text());
      }
    },
    filter : function(){
      if($(this).hasClass('anonymous')){
        return false;
      }
      return true;
    },
    sortBy: 'rank',

	
    
  }); 
  
 

  $fullview.animate({
    width:'98%', 
    height:'96%',
    top:'2%',
    left:'1%', 
    bottom:'2%',
    'z-index': '10000',
  }, 1000, "swing", function(){
    $fullview.find('.results-personal').isotope('layout');
  });

  //$search.find('.tileview').fadeOut();

  $('body').css('overflow', 'hidden');
};


//==========================================================
// ONLOAD
//==========================================================

/*
 * Topbar hide and slide up/down on mouseover behaviour
 */
$(function(){
  
  // grab the initial top offset of the navigation 
  var stickyNavTop = $(tobparSelector).offset().top;

    // our function that decides weather the navigation bar should have "fixed" css position or not.
    var stickyNav = function(){
      var scrollTop = $(window).scrollTop(); // our current vertical position from the top

      // if we've scrolled more than the navigation, change its position to fixed to stick to top,
      // otherwise change it back to relative
      if (scrollTop > (stickyNavTop+5) ){ 
        $(tobparSelector).addClass('sticky');
        $(tobparSelector).find(".folder").slideUp();
        //$("#top-nav").css('border-bottom','1px solid #ddd');
        $("#top-nav").addClass('top-nav-scrolled');
      } else {
        $(tobparSelector).removeClass('sticky'); 
        $(tobparSelector).find(".folder").slideDown();
        $("#top-nav").css('border-bottom','1px solid #eee');
        $("#top-nav").removeClass('top-nav-scrolled');
        $(window).trigger('resize');
      }
  };

  stickyNav();

  // and run it again every time you scroll
  $(window).scroll(function() {
    stickyNav();
  });

});

/*
 * Filtering logic
 */
$(function(){

  var months = new Array("Jan", "Feb", "Mar", 
"Apr", "May", "Jun", "Jul", "Aug", "Sep", 
"Oct", "Nov", "Dec");
  var today = new Date();

  $("#dateslider").dateRangeSlider({
    //step:{
    //  days: 1
    //},
    valueLabels:"show",
    durationIn: 1000,
    durationOut: 1000,
    defaultValues: {
      max: today,
      min: (new Date()).setDate(today.getDate()-7)
    },
    bounds:{
      min: (new Date()).setMonth(today.getMonth()-3),
      max: new Date()
    },
    scales: [{
      first: function(value){ return value; },
      end: function(value) {return new Date(); },
      next: function(value){
        var next = new Date(value);
        return new Date(next.setMonth(value.getMonth() + 1));
      },
      label: function(){return "";},
      format: function(tickContainer, tickStart, tickEnd){
        tickContainer.addClass("month-ticker");
      }
    },
    {
      first: function(value){ return value; },
      end: function(value) {return new Date(); },
      next: function(value){
        var next = new Date(value);
        next.setDate(value.getDate() + 1);
        return next
      },
      label: function(){return "";},
      format: function(tickContainer, tickStart, tickEnd){
        tickContainer.addClass("date-ticker");
      }
    }],
    formatter:function(val){
        var days = val.getDate(),
          month = val.getMonth(),
          year = val.getFullYear();
        if(today.getDate() == days && today.getMonth() == month &&today.getFullYear() == year){
          return "Today";
        }else{
          return days + " " + months[month];// + " " + year;
        }
      }
  });

  $("#dateslider").on('valuesChanging', function(ev, data){
    var max = data.values.max;
    var min = data.values.min;
    if(min.getDate() == max.getDate() && min.getMonth() == max.getMonth() && min.getFullYear() == max.getFullYear()){
        min.setDate(min.getDate()-1);
        //$('#dateslider').dateRangeSlider('values', min,max);
    }
    current_date_filter = make_filter_date(data.values.min, max);
    order_and_filter();
  });

  var search_changed = function(){
    var searched = $("#termsearch-input").val();
    current_term_filter = make_filter_terms(searched);
    order_and_filter()
  };
  $("#termsearch-input").on("keypress", search_changed);
  $("#termsearch-input").on("keyup", search_changed);

  $("#sortby-most-personal").click(function(){$("#searches").isotope({sortBy:"personalisation", sortAscending:false});});
  $("#sortby-time-ascending").click(function(){$("#searches").isotope({sortBy:"timestamp", sortAscending:true});});
  $("#sortby-time-descending").click(function(){$("#searches").isotope({sortBy:"timestamp", sortAscending:false});});
  $("#sortby-alpha").click(function(){$("#searches").isotope({sortBy:"terms", sortAscending:true});});

});

$(function() {
  if($(window).width() > 768){
    // Hide all but first tab content on larger viewports
    $('.accordion__content:not(:first)').hide();
    // Activate first tab
    $('.accordion__title:first-child').addClass('active');
  } else {
    
    // Hide all content items on narrow viewports
    $('.accordion__content').hide();
  };

  // Wrap a div around content to create a scrolling container which we're going to use on narrow viewports
  $( ".accordion__content" ).wrapInner( "<div class='overflow-scrolling'></div>" );

  // The clicking action
  $('.accordion__title').on('click', function() {
    $('.accordion__content').hide();
    $(this).next().show().prev().addClass('active').siblings().removeClass('active');
    //if slider visible, trigger redraw
    $('#dateslider').dateRangeSlider('resize');
  });
});

function dotrans($from, $to){
  if( !$to.hasClass('effeckt-page-animating') && !$from.hasClass('effeckt-page-animating') ){
    $to.find('.collapser').hide();
    $from.find('.collapser').hide();
    $to.addClass('effeckt-page-animating effeckt-page-active ' + $to.data('transition-in'));
    $from.addClass('effeckt-page-animating');
    setTimeout(function(){ 
      $from.removeClass('effeckt-page-active effeckt-page-animating');
      $to.removeClass('effeckt-page-animating '+$to.data('transition-in'));
      $to.find('.collapser').show();
      $from.find('.collapser').hide();
    }, 2000);
  }
}

