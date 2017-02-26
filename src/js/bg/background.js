/**
 * background.js
 */

chrome.browserAction.onClicked.addListener(function(tab) {
  chrome.tabs.create({url:chrome.extension.getURL("home.html")});
});


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse){
  console.log("[TRACE]: background.js#addListener()");

  console.log("New request for ", request);

  var onSuccess = function(data){
    console.log("Received data from server successfully");

    // 1. turn data into element
    var content = data.content;
    console.log("REPLY:", data);
    var parser = new DOMParser();
    var doc = parser.parseFromString(content, "text/html");

    // 2. grab results from data
    var results = parseDocumentForResults(doc);

    // 3. reply with our results.
    sendResponse(results);
  };

  var onError = function(jqXHR, textStatus, errorThrown ){
    console.log("ERROR making ajax request: "+errorThrown);
  };


  if(request.url){
    // TODO: Check if search engine URL...
    $.ajax({
      dataType: "json",
      type: "POST",
      url: "http://bubbleviz.herokuapp.com/api/anon-search",
      data: {url: request.url},
      success: onSuccess,
      error: onError,
      timeout: 5000
    });

  } else {
    sendResponse({error: "NO URL"});
  }

  /*
   * We must return true to let the chrome extension framework know that
   * we will be replying asynchronously. If we fail to do so, the framework
   * will invalidate the sendResponse callback and the content script will
   * never receive our reply.
   */
  return true;
});
