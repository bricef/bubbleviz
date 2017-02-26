

var sizeToFit = function(){
  //var chart = $("#chart");
  //chart.width( $(window).width() );
  //chart.height( $(window).height() );
  var kids = $("#chart > *");
  kids.width( $(window).width() );
  kids.height( $(window).height() );
};



$(function(){
  chrome.storage.local.get("searches", function(store){
    var data = store.searches.map(results_to_scores);
    visualise_as_radialplot(data);
    sizeToFit();
    $(window).on('resize', sizeToFit);
  });


  $('#clear').click(function(){
    chrome.storage.local.set({searches: []}, function(){
      console.log("Cleared local storage");
      $('#chart svg').remove();
    })
  });

  $('#saveimg').click(function(){
    var opts = {
      lines: 15, // The number of lines to draw
      length: 0, // The length of each line
      width: 4, // The line thickness
      radius: 8, // The radius of the inner circle
      corners: 0.6, // Corner roundness (0..1)
      rotate: 0, // The rotation offset
      direction: 1, // 1: clockwise, -1: counterclockwise
      color: '#000', // #rgb or #rrggbb or array of colors
      speed: 1.4, // Rounds per second
      trail: 31, // Afterglow percentage
      shadow: false, // Whether to render a shadow
      hwaccel: false, // Whether to use hardware acceleration
      className: 'spinner', // The CSS class to assign to the spinner
      zIndex: 2e9, // The z-index (defaults to 2000000000)
      top: '50%', // Top position relative to parent
      left: '50%' // Left position relative to parent
    };

    var spinner = new Spinner(opts).spin();
    console.log("Saving visualisation to gallery");

    var onError = function(jqXHR, textStatus, errorThrown){
      spinner.stop();
      $("#saveimg").addClass("fail");
      $("#saveimg .spinnerContainer").hide();
    };

    var onSuccess = function(data){
      spinner.stop();
      $("#saveimg").addClass("succeed");
      $("#saveimg .spinnerContainer").hide();
    };

    $("#saveimg .spinnerContainer")[0].appendChild(spinner.el);
    $("#saveimg .spinnerContainer").show();

    $.ajax({
      dataType: "json",
      type: "POST",
      processData: false,
      url: "http://bubbleviz.herokuapp.com/api/save/visualisation",
      data: $('#chart').html(),
      success: onSuccess,
      error: onError
    })
  });
})
