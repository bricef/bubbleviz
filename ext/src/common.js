/*
 * js/common.js 
 */

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
    var innerElem = elem.querySelector('.r');
    var snippetElem = elem.querySelector('.st');
      if(innerElem){
        var link = innerElem.querySelector('a');
        if(link){
          results.push({
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
  var elem = element.querySelector('#gbqfq');
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
function build_results_dataset(onDone, onFail){
  //console.log("Loading raw dataset");
  chrome.storage.local.get("searches", function(store){
    //console.log("-> Loaded searches");
    
    var results = searches2results(store.searches);
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
    }

    carrot_fetch_clusters(
      results,
      _onSuccess, 
      _onError
    );
    
  });
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