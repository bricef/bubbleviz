/**
 * inject.js
 */


function createStorageObject(url, personal, anonymous, search_terms){
  return {
    url: url,
    anonymous: anonymous,
    personal:personal,
    terms: search_terms,
    timestamp: (new Date()).getTime(),
  };
}

function storeResults(object_to_store){
  console.log("[TRACE]: inject.js#storeResults()");

  chrome.storage.local.get("searches", function(store){

    if(store.searches){
      store.searches.push(object_to_store);
      chrome.storage.local.set({searches: store.searches}, function(){
        console.log("storage set OK");
      })
    }else{
      chrome.storage.local.set({searches: [object_to_store]}, function(){
        console.log("storage set OK, first time.");
      });
    }
  });

}

function convert_url_to_server_url(url){
  // What we want : https://google.com/search?q=blah+blah+blah
  // two types of document URL:
  //  - http://google.com/webhp#q=abc+def
  //  - http://google.com/webhp?q=abc+def

  var PREFIX = "https://www.google.com/search"

  var server_search_url = url;


  var parser = document.createElement('a');
  parser.href =  server_search_url;

  var index = parser.href.indexOf(parser.search);
  var query = parser.search;
  var hash = parser.href.slice(index + parser.search.length, parser.href.length);

  if(hash){
    server_search_url = PREFIX + "?" + hash.slice(1,hash.length);
  }else if(query && !hash){
    server_search_url = PREFIX + query;
  }

  return server_search_url;
}

// ---- ANON ONLY ----
// terms: results.terms,
// search_url: results.url,
// result:name,
// url: canonical_url,
// anonymous_rank: anonymous_rank,
// category: "anonymous"
//
// ---- PERSO ONLY ----
// hveid: personal_results_index[url].hveid,
// terms: results.terms,
// search_url: results.url,
// url: url,
// result: personal_results_index[url].result,
// personal_rank: personal_results_index[url].personal_rank,
// category: "personal"
//
// ---- BOTH ----
// hveid: personal_results_index[canonical_url].hveid,
// url: canonical_url,
// search_url: results.url,
// terms: results.terms,
// result: personal_results_index[canonical_url].result,
// category: "both",
// personal_rank: personal_results_index[canonical_url].personal_rank,
// anonymous_rank: anonymous_rank,
// score: anonymous_rank - personal_results_index[canonical_url].personal_rank

function showOnPage(scores){
  scores.forEach(function(score){
    var hveid = score.hveid;
    var category = score.category;
    var change = score.score;

    if(category == "personal"){
        var rc = $("[data-hveid="+hveid+"]");
        rc.addClass('persanalysed-personal-result');
    }

    if(category == "both"){
      if(Math.abs(change)>0){
        var rc = $("[data-hveid="+hveid+"]");
        rc.addClass('persanalysed-both-result');
        var annotation = $('<div class="persanalysed-result-annotation"></div>').text("Moved "+((change > 0)?"up":"down")+" by "+Math.abs(change));
        rc.append(annotation);
      }

    }

  });
}
/**
 * Scrape a page for google search results on the current page
 */
function scrapeForResults(){
    console.log("[TRACE]: inject.js#scrapeForResults()");

    console.log("[TRACE]: inject.js#scrapeForResults() - Parse Document for results");
    var personal_results = parseDocumentForResults(document);

    console.log("[TRACE]: inject.js#scrapeForResults() - Parse Document for search terms used");
    var search_terms = scrapeSearchTerms(document);

    if(personal_results.length > 0){
      // console.log("Personal results: ", personal_results.length);
      console.log("[TRACE]: inject.js#scrapeForResults() - Create background request");
      var request = {url: convert_url_to_server_url(document.URL)};

      console.log("[TRACE]: inject.js#scrapeForResults() - set up response handler for anon results");
      var onResponse = function(anon_results) {
        console.log("[TRACE]: inject.js#scrapeForResults()#onResponse() - response received frombackground process");
        if(!anon_results.error){
          console.log("Anonymous results: ", anon_results.length);
          console.log("[TRACE]: inject.js#scrapeForResults()#onResponse() - storing the results for use by display page");
          var box = createStorageObject(document.URL, personal_results, anon_results, search_terms);
          showOnPage(results_to_scores(box));
          storeResults(box);
        }else{
          console.log("ERROR: Querying server failed", anon_results.error);
        }
      };

      console.log("[TRACE]: inject.js#scrapeForResults() - send url to background process");
      chrome.runtime.sendMessage(request, onResponse );
    }
}

function main(){
  console.log("[TRACE]: inject.js#main()");

  console.log("[TRACE]: inject.js#main() - Create visual element");
  // Add visual to page to show we're active
  var bubbleviz = document.createElement("div");
  bubbleviz.className = "bubbleviz";
  document.getElementsByTagName('body')[0].appendChild(bubbleviz);

  console.log("[TRACE]: inject.js#main() - Listen to changes in the URL");
  var URL = null;
  window.setInterval(function(){
    if(URL !== document.URL){
      console.log("[TRACE]: inject.js#main() - URL Change detected.");
      console.log("OLD: ["+URL+"], NEW:["+document.URL+"]")
      URL = document.URL;
      scrapeForResults();
    }
  }, 100)

}

main();
