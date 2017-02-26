var containingSelector = "#searches";
var boxSelector = ".search";
var tobparSelector = "#topbar";
var original_width, original_height, aspect_ration;

/*
REAL.PerspectiveTransform();
*/



		
		   



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

//PerspectiveTransform(element_to_transform_config(element))

var PerspectiveTransform = function(config) {

  var element = config.element; // DOM element to be transformed
  var src   = config.src;   // Source points of the element
  var dst   = config.dst;   // Destiny points of the element
  
  var a = [[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0]];
  var b = [0,0,0,0,0,0,0,0];

  for( var i = 0; i < 4; i++ ){
    a[i] = [];
        a[i][0] = a[i+4][3] = src[i].x;
        a[i][1] = a[i+4][4] = src[i].y;
        a[i][2] = a[i+4][5] = 1;
        a[i][3] = a[i][4] = a[i][5] =
        a[i+4][0] = a[i+4][1] = a[i+4][2] = 0;
        a[i][6] = -src[i].x*dst[i].x;
        a[i][7] = -src[i].y*dst[i].x;
        a[i+4][6] = -src[i].x*dst[i].y;
        a[i+4][7] = -src[i].y*dst[i].y;
        
        b[i] = dst[i].x;
        b[i+4] = dst[i].y;
    }
    
  var bM = [];
  for(i=0; i<b.length; i++){
    bM[i] = [b[i]];
  }
  
  // Matrix Libraries from a Java port of JAMA: A Java Matrix Package, http://math.nist.gov/javanumerics/jama/
  // Developed by Dr Peter Coxhead: http://www.cs.bham.ac.uk/~pxc/
  // Available here: http://www.cs.bham.ac.uk/~pxc/js/
  var A = Matrix.create(a);
  var B = Matrix.create(bM);
  var X = Matrix.solve(A,B);

  $fullview = $(element).find('.fullview');
  
  $fullview.show().css({
    'transition-duration': '1s',
    //'position': 'fixed',
    'transform-origin': 'top left',
    //'top': '0px',
    //'left':'0px',
    'background-color':'#ffccff',
    'z-index': '100000'
  });

  $fullview.css('transform', "matrix3d(" + X.mat[0][0] + "," + X.mat[3][0] + ", 0," + X.mat[6][0] + "," + X.mat[1][0] + "," + X.mat[4][0] + ", 0," + X.mat[7][0] + ",0, 0, 1, 0," + X.mat[2][0] + "," + X.mat[5][0] + ", 0, 1)");
  

};








var resizeBoxes = function (){
	var containerWidth=$(containingSelector).width();
	var width_ratio = containerWidth/original_width;
	var num_boxes = Math.floor(width_ratio);
	var remainingWidth = containerWidth - (num_boxes * original_width);
	var width_increment = remainingWidth/num_boxes;
	var new_width = original_width+width_increment;
	var new_height = new_width/aspect_ration;
	//console.log(containerWidth,width_ratio,num_boxes,remainingWidth,width_increment,new_width,new_height);
	$(boxSelector).width(new_width);
	$(boxSelector).height(new_height);
};

var store_sizes = function(){
  original_width = $(boxSelector).outerWidth();
  original_height = $(boxSelector).outerHeight();
  aspect_ration = original_width / original_height;
  //console.log(original_width,original_height,aspect_ration);
}



var collapse_tile = function($fullview){
  
  console.log('Collapsing tile...');

  dotrans($fullview, $('#mainpage'));

  setTimeout(function(){ 
    $('#searches').isotope('bindResize');
    $('#mainpage').css('overflow-y', 'scroll');
    $('#dateslider').dateRangeSlider('resize');
    $('#searches').isotope('layout');
   $('#mainpage').addClass('notransition');
    //order_and_filter();

  }, 2000);


};


// expand_tile will receive a tileview element
var expand_tile = function(elem){
  console.log("Expanding tile...");
   
  //$('#mainpage').removeClass('notransition');
  $tileview = $(elem);
  $search = $tileview.parent();
  $fullview = $('[data-uid='+$tileview.data('uid')+'].search-details');
  $('#searches').isotope('unbindResize');
  
  
  $fullview.find(".collapser").click(function(){
    collapse_tile($fullview);
	 
  });
  
  
  $fullview.find('.results-personal').isotope({
    itemSelector: '.result',
  	layoutMode: 'packery',
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




	
	
 $('#mainpage').css('overflow', 'hidden');
 $fullview.css('overflow', 'hidden');

  dotrans($('#mainpage'), $fullview);
  setTimeout(function(){ 
    $fullview.find('.results-personal').isotope('layout');
  }, 1500);
 
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
        $("#top-nav").removeClass('top-nav-scrolled');
        $(window).trigger('resize');
      }
  };

  stickyNav();

  // and run it again every time you scroll
  $(window).scroll(function() {
    stickyNav();
  });

  /*$(tobparSelector).mouseenter(function(){
    $(tobparSelector).find(".folder").stop().slideDown();
  });
  $(tobparSelector).mouseleave(function(){
    var scrollTop = $(window).scrollTop();
    if (scrollTop > (stickyNavTop+5) ){
      $(tobparSelector).find(".folder").stop().slideUp();
    } 
  });*/
  

});





/*
 * search tiles behaviour
 */
$(function(){
 	store_sizes();
 	resizeBoxes();
 	$(window).resize(function(){
 		resizeBoxes();
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
  
    $(".actual-x").click(function(){
		  $('#termsearch-input').val('');
		  $('.actual-x').hide();
		  		  search_changed();
				  console.log("search");
		});
		
  $("#termsearch-input").on("keypress", search_changed);
  $("#termsearch-input").on("keyup", search_changed);
  
   $('.button-group').each( function( i, buttonGroup ) {
    var $buttonGroup = $( buttonGroup );
    $buttonGroup.on( 'click', 'button', function() {
      $buttonGroup.find('.is-checked').removeClass('is-checked');
      $( this ).addClass('is-checked');
    });
  });

  $("#sortby-most-personal").click(function(){$("#searches").isotope({sortBy:"personalisation", sortAscending:false});});
  $("#sortby-time-ascending").click(function(){$("#searches").isotope({sortBy:"timestamp", sortAscending:true});});
  $("#sortby-time-descending").click(function(){$("#searches").isotope({sortBy:"timestamp", sortAscending:false});});
  $("#sortby-alpha").click(function(){$("#searches").isotope({sortBy:"terms", sortAscending:true});});

});


function accordiondraw() {
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
  $('.accordion__title').on('click', function(e) {
    //console.log("accordion clicked", e);
    $('.accordion__content').hide();
    $(this).next().show().prev().addClass('active').siblings().removeClass('active');
    //if slider visible, trigger redraw
    $('#dateslider').dateRangeSlider('resize');
  });
}

$(accordiondraw);


function dotrans($from, $to){
      if( !$to.hasClass('effeckt-page-animating') && !$from.hasClass('effeckt-page-animating') ){
        $to.find('.collapser').hide();
        $from.find('.collapser').hide();

        $to.addClass('effeckt-page-animating effeckt-page-active ' + $to.data('transition-in'));
        $from.addClass('effeckt-page-animating '+ $from.data('transition-out'));
	
        setTimeout(function(){ 
          $from.removeClass('effeckt-page-active effeckt-page-animating '+ $from.data('transition-out'));
          $to.removeClass('effeckt-page-animating '+$to.data('transition-in'));
	

          $to.find('.collapser').show();
          $from.find('.collapser').show();
		
        }, 2000);
		     
      }
	
    }
