function zeroPad(num, size){ 
  return ('000000000' + num).substr(-size); 
}

function format_date(date){
  var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  var hours  = (date.getHours() % 12).toString();
  var minutes = date.getMinutes()

  var datestring = ((hours == 0)?"12":hours) + ":" + zeroPad(minutes,2);
  datestring += " " + (date.getHours()/12 > 1)?"pm":"am";
  datestring += " " + days[date.getDay()];
  datestring += " " + date.getDate();
  datestring += " " + months[date.getMonth()];
  datestring += " " + date.getFullYear(); 

  return datestring;
}

function augment_data(data){

  data.date = format_date(new Date(data.timestamp));
  
  data.percentage = Math.round(data.score * 100);

  return data;
}

$(function(){
  console.log("Home.js");
  
  var search_item_template = Handlebars.compile($("#search-template").html());
  

  var onSuccess = function(searches){
    var earliest_search_date = new Date();

    searches.forEach(function(search){
      var data = search;

      // find the earliest timestamp for filtering on
      if(search.timestamp < earliest_search_date.getTime() ){
        earliest_search_date.setTime(search.timestamp);
      }

      data.personalScores = scores_to_data_template(results_to_scores(search));
      
      var $search = $($.parseHTML(search_item_template(augment_data(data))));

      $search.data("search", data);
      
      $search.css({'background-color': score2color(search.score)});

      $('#searches').append($search);
    });

    $(".tileview").click(function(){
      expand_tile(this);
    });

    reset_slider_bounds(earliest_search_date, new Date());
    store_sizes();
    resizeBoxes();
    order_and_filter();
  };
  
  get_searches(onSuccess);

});