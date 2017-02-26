/*
 * js/common.js
 */

$(function(){
$(window).load(function() {
  $("#status").delay(1000).fadeOut("slow");
			$(".loading").delay(1000).fadeOut("slow");
			console.log("fading out");
		})
		 	});
	$(function(){
			$('.modal-toggle').on('click', function(e) {
  e.preventDefault();
  $('.modal').toggleClass('is-visible');
});
});

function getHash(url){
  var e = document.createElement('a');
  e.href = url;
  return e.hash.slice(1, e.hash.length);
}

function getParameterByName(query_string, name) {

  name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
  var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
    results = regex.exec(query_string);
  return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

var anonymous_url_to_canonical_url = function(anonymous_url){
  var query_string = anonymous_url.slice(4,anonymous_url.length);
  return getParameterByName(query_string, 'q');
};

var scores_to_data_template = function(scores){
  // we need: per result - anonrank indicatorclass[indicator-{promoted,demoted,stable}]
  scores.forEach(function(score){

    if(score.anonymous_rank && score.personal_rank){
      if(score.anonymous_rank < score.personal_rank){
        score.indicatorclass = "indicator-demoted";
      }else if (score.anonymous_rank > score.personal_rank){
        score.indicatorclass = "indicator-promoted";
      }else{
        score.indicatorclass = "indicator-stable";
      }
    }
    score.show_rank = true;

    if(!score.personal_rank){
      score.anonymous_rank = "+";
      score.indicatorclass = "indicator-unique";
      score.show_rank = false;
    }

    if(!score.anonymous_rank){
      score.anonymous_rank = "+";
      score.indicatorclass = "indicator-unique";
      score.show_rank = false;
    }

  });

  return scores;
};

var results_to_scores = function(results){
  var scores = [
    /*
    {result: "", category: "both"|"anonymous"|"personal", score: 0.654},
    */
  ];

  var personal_results_index = {};

  results.personal.forEach(function(result, i){
    result.personal_rank = i+1;
    personal_results_index[result.url] = result;
  });

  results.anonymous.forEach(function(result, i){
    var anonymous_rank = i+1;
      var name = result.result;
      var canonical_url = anonymous_url_to_canonical_url(result.url);

      if (canonical_url in personal_results_index){
        scores.push({
          hveid: personal_results_index[canonical_url].hveid,
          url: canonical_url,
          search_url: results.url,
          terms: results.terms,
          result: personal_results_index[canonical_url].result,
          category: "both",
          personal_rank: personal_results_index[canonical_url].personal_rank,
          anonymous_rank: anonymous_rank,
          score: anonymous_rank - personal_results_index[canonical_url].personal_rank
        });

        delete personal_results_index[canonical_url];

      }else{
        scores.push({
          terms: results.terms,
          search_url: results.url,
          result:name,
          url: canonical_url,
          anonymous_rank: anonymous_rank,
          category: "anonymous"
        });
      }
  });

  for(var url in personal_results_index){
    scores.push({
      hveid: personal_results_index[url].hveid,
      terms: results.terms,
      search_url: results.url,
      url: url,
      result: personal_results_index[url].result,
      personal_rank: personal_results_index[url].personal_rank,
      category: "personal"
    });
  }

  return scores;
};


var result_comparator = function(a,b){
  // Category filtering
  if(a.category == "personal" && b.category == "anonymous"){ return -1; }
  if(a.category == "personal" && b.category == "both"){ return -1; }
  if(a.category == "both" && b.category == "personal"){ return 1; }
  if(a.category == "both" && b.category == "anonymous"){ return -1; }
  if(a.category == "anonymous" && b.category == "personal"){ return 1; }
  if(a.category == "anonymous" && b.category == "both"){ return 1; }

  // Simple case of one category only
  if(a.category == "personal" && b.category == "personal"){ return a.personal_rank - b.personal_rank; }
  if(a.category == "anonymous" && b.category == "anonymous"){ return a.anonymous_rank - b.anonymous_rank; }

  // We prefer the personal rank for sorting, since we want more personal items to be closer to the center.
  if(a.category == "both" && b.category == "both"){ return a.personal_rank - b.personal_rank; }

  return 0;

};

/*
 * Score between 0 and 1 inclusive
 */
var score2color = function(score){
  /*
  Lightest blue #4390d9
  #3c7ad5
  #3764d0
  #324eb3
  #303fa0
  Darkest blue #2f318e
  */
  colors = ["#4390d9", "#3c7ad5", "#3764d0", "#324eb3", "#303fa0", "#2f318e"];
  if(score == 0.0){ return colors[0];}
  return colors[Math.floor((score * colors.length)-0.001)]
}



function url2host(url){
  var parser = document.createElement('a');
  parser.href = url;
  return parser.hostname;
}

function history2indexedHistory (history){
    var ret = _.reduce(history, function(indexedHistory, historyItem){
      var host = url2host(historyItem.url);
      var count = 1;
      if(host in indexedHistory){
        indexedHistory[host] += count;
      }else{
        indexedHistory[host] = count;
      }
      return indexedHistory;
    }, {});
    return ret;
}


/**
 * Convert a NodeList to an array
 */
function toArray(obj) {
  var array = [];
  // iterate backwards ensuring that length is an UInt32
  for (var i = obj.length >>> 0; i--;) {
    array[i] = obj[i];
  }
  return array;
}

function identity(i){
  return i;
}

function grabRawText(elem){
    var buf = "";
    for(var i = 0; i < elem.childNodes.length; i++){
      var node = elem.childNodes[i];
      if(node.nodeValue){
        buf += " " + node.nodeValue;
      }else{
        buf += " " +  grabRawText(node);
      }
    }
    return buf;
}

function parseDocumentForResults(element){
    var elems = element.querySelectorAll(".g");

    var results = [];

    toArray(elems).forEach(function(elem){
      var container = elem.querySelector('.rc');
      var innerElem = elem.querySelector('.r');
      var snippetElem = elem.querySelector('.st');
        if(innerElem){
          var link = innerElem.querySelector('a');
          if(link){
            // console.log("container element: ", container);
            results.push({
              hveid: (container)?container.dataset.hveid:null,
              result: link.text,
              snippet: (snippetElem)?grabRawText(snippetElem):"",
              url: link.getAttribute('href')
            });
          }
        }
      });
    return results;
}

function scrapeSearchTerms(element){
  // We're looking for the search terms in the search bar
  var elem = element.querySelector('#lst-ib');
  return elem.value;
}

function downloadAsJSON(obj, filename){
    var jsonHeader = "data:application/json;charset=utf-8,";
    var fileString = jsonHeader + JSON.stringify(obj, null, '\t') + '\n';
	var encodedURI = encodeURI(fileString);
	chrome.downloads.download({ 'url':encodedURI, filename:filename}, function(){});
}

function searches2results(searches){
    var results = [];
    var counter = 0;
    searches.forEach(function(search){
        var search_unique = {
            terms: search.terms,
            timestamp: search.timestamp,
            url: search.url,
        };
        search.personal.forEach(function(result){
          result.search = search_unique;
          result.id = ""+counter;
          counter += 1;
          results.push(result);
        });
        search.anonymous.forEach(function(result){
          result.search = search_unique;
          result.id = ""+counter;
          counter+=1;
          results.push(result);
        });
    });
    return results;
}

function get_searches(onSuccess){
  chrome.storage.local.get("searches", function(store){

    // We add the search score here to support legacy searches that didn't
    // get the score calculated when they were stored.
    store.searches.forEach(function(search){
      search.score = search_to_personalisation_score(search);
    });
    //console.log(store.searches);

    if(onSuccess && typeof onSuccess == "function"){
      onSuccess(store.searches);
    }
  });
}

/**
  Building the raw dataset

  !1) fetch searches from chrome storage
  !2) flatten searches into results
  !3) cluster results using carrot2 server
  !4) add category information to results

  The `onDone()` function will be called with a list
  of results in the following format:

    {
      "search": {
        "terms": "freefonts",
        "timestamp": 1409347561516,
        "url": "https://www.google.co.uk/search?q=freefonts&oq=freefonts&aqs=chrome..69i57j0l5.1478j0j7&sourceid=chrome&es_sm=93&ie=UTF-8"
      },
      "type": "anon",
      "category":"fonts",
      "categoryScore": 45.3434,
      "result": "1001 Free Fonts - Download Free Fonts",
      "snippet": " 1001   Free Fonts  offers a huge selection of   free fonts . Download   free fonts  for   \nWindows and Macintosh. License fonts for commercial use.",
      "url": "/url?q=http://www.1001freefonts.com/&sa=U&ei=5e8AVI-wF8WI7AbFx4D4Aw&ved=0CBQQFjAA&usg=AFQjCNH1j3w3qieMIxAqtJNRhv5w1e3xeA"
    }

 */
function build_results_dataset(onDone, onFail, filter){
  //console.log("Loading raw dataset");
  chrome.storage.local.get("searches", function(store){
    //console.log("-> Loaded searches");

    var results = [];
    if(filter && typeof filter === "function"){
      console.log("filtering before clusting...");
      results = searches2results(store.searches.filter(filter));
    } else {
      console.log("getting everything...");
      results = searches2results(store.searches);
    }

    //console.log("-> Converted searches to results");

    function _onSuccess(data, textStatus, jqXHR){
      //console.log("-> Loaded category clusters", data);

      // We grab the document ids from carrot to be able to match
      // document to cluster, then we tag every document
      data.clusters.forEach(function(cluster){
        cluster.documents.forEach(function(docID){
          results.forEach(function(result){
            if(docID == result.id){
              result.category = cluster.phrases[0];
              result.categoryScore = cluster.score;
              return;
            }
          });
        });
      });

      if (onDone && (typeof onDone) == "function"){
        onDone(results);
      }
    }

    function _onError(jqXHR, textStatus, errorThrown){
      //alert("Error occured on request: "+ textStatus + ", "+ errorThrown);
      if (onFail && (typeof onFail) == "function"){
        onFail("Error occured while fetching cluster information");
      }
      return;
    }

    carrot_fetch_clusters(
      results,
      _onSuccess,
      _onError
    );

  });
}


function searches_to_categorised_results(searches, onSuccess, onFailure){
    var results = searches2results(searches);
    console.log("searches -> categories")

    function _onSuccess(data, textStatus, jqXHR){
      console.log("carrot_fetch success!");
      // We grab the document ids from carrot to be able to match
      // document to cluster, then we tag every document
      data.clusters.forEach(function(cluster){
        cluster.documents.forEach(function(docID){
          results.forEach(function(result){
            if(docID == result.id){
              result.category = cluster.phrases[0];
              result.categoryScore = cluster.score;
              return;
            }
          });
        });
      });

      if (onSuccess && (typeof onSuccess) == "function"){
        onSuccess(results.filter(function(res){return res.category}));
      }
    }
    function _onError(jqXHR, textStatus, errorThrown){
      console.log("carrot_fetch FAILURE!");
      //alert("Error occured on request: "+ textStatus + ", "+ errorThrown);
      if (onFailure && (typeof onFailure) == "function"){
        onFailure("Error occured while fetching cluster information");
      }
      return;
    }
    carrot_fetch_clusters(
      results,
      _onSuccess,
      _onError
    );
}

function build_history_dataset(onDone, onFail){
  if(onDone && (typeof onDone) == "function"){
    chrome.history.search({
      'text':'',
      'maxResults':10000,
      'startTime': (new Date(2012,01,01)).getTime(),
      'endTime': (new Date()).getTime()
    }, onDone);
  }
}

function search_to_personalisation_score(search){
  var scores = results_to_scores(search);
  // [
  //   {anonymous_rank: x, personal_rank:y, score:x-y},
  //   {anonymous_rank: x},
  //   {personal_rank:y},
  // ]
  var personal_results = scores.filter(function(result){
    return result.category === "both" || result.category === "personal";
  });

  var max_total = 0;
  personal_results.forEach(function(e,i){
    max_total+= (i+1);
  });
  var max_normalised = max_total;

  var total = personal_results.map(function(result){
    if(result.score){
      return Math.abs(result.score);
    }else if (result.personal_rank){
      return Math.abs(personal_results.length - result.personal_rank);
    }else{
      console.err(result, "Result had neither score nor personal_rank");
      return 0;
    }
  }).reduce(function(a,b){
    return a+b
  });
  return total/max_total;
}


/**
 * Creates a date filter to use in filtering the tiles on the homepage
 */
var make_filter_date = function(startDate, endDate){
  var filter = function(){
    var data = $(this).data("search");
    if (startDate.getTime() < data.timestamp && data.timestamp < endDate.getTime()){
      return true;
    }else{
      return false;
    }
  };
  return filter;
};

/**
 * Creates a string filter on the search terms to use in filtering the tiles on the homepage
 */
var make_filter_terms = function(str){
  var filter = function(){
    var data = $(this).data("search");
    if(data.terms.toUpperCase().indexOf(str.toUpperCase()) > -1){
      return true;
    }else{
      return false;
    }
  };
  return filter;
};

/**
 * Combine filters sensibly
 */
var combine_filters = function (filters) {
  var filter = function(){
    var that = this;
    return filters.map(function(filter){
      if(filter){
        return filter.call(that);
      }else{
        return true;
      }
    }).every(identity);
  };
  return filter;
};


/**
 * Filter search results by date.
 */
function results_by_date(startDate, endDate){
  var filter = function(item){
    if(item.search.timestamp > startDate.getTime() && item.search.timestamp < endDate.getTime()){
     return true;
    }else{
      return false;
    }
  };
  return filter;
}

/*
 *
 */
function weigh_by_date(item){
  return $(item).data('search').timestamp;
}

/*
 * string comparison function
 */
function strcmp( a, b ) {
    if((a+'').toLowerCase() > (b+'').toLowerCase()) return 1
    if((a+'').toLowerCase() < (b+'').toLowerCase()) return -1
    return 0
}


/**
 * Filtering and ordering...
 */
var current_date_filter = null;
var current_term_filter = null;




var order_and_filter = function(){
	var itemReveal = Isotope.Item.prototype.reveal;
    Isotope.Item.prototype.reveal = function() {
        itemReveal.apply( this, arguments );
        $( this.element ).removeClass('isotope-hidden');
    };
    var itemHide = Isotope.Item.prototype.hide;
    Isotope.Item.prototype.hide = function() {
        itemHide.apply( this, arguments );
        $( this.element ).addClass('isotope-hidden');
    };
  var $container = $('#searches');
    $container.isotope({
    itemSelector: '.search',
    layoutMode: 'masonry',
  transitionDuration:'0.8s',
    filter: combine_filters([current_term_filter, current_date_filter]),
    getSortData:{
      timestamp: weigh_by_date,
      terms: function(elem){ return $(elem).find('.tileview').find('.search-terms').text().toUpperCase(); },
      personalisation: function(elem){return search_to_personalisation_score($(elem).data('search'));}
    },
    sortAscending: {
      terms: true,
      timestamp: false,
      personalisation:false
    },
    sortBy:"rank",
  });
  var noItemsAlert = $('#alert');
	$container.isotope( 'on', 'layoutComplete', function() {
		var numItems = $container.find('.search:not(.isotope-hidden)').length;
		if (numItems == 0) {
	        noItemsAlert.show(250);
	    } else {
	        noItemsAlert.hide(250);
	    }
	});

};



$(function(){
$( "#termsearch-input" ).focus(function() {
			$('.actual-x').show();
	});

});







var reset_slider_bounds = function(min, max){
  $("#dateslider").dateRangeSlider({
    bounds:{
      min: min,
      max: max
    },
	arrows:false
  });
};
