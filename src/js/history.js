
/*
HistoryItem Doc: https://developer.chrome.com/extensions/history#type-HistoryItem

<table>
  <tr>
    <td>John</td>
    <td>Doe</td>
  </tr>
  <tr>
    <td>Jane</td>
    <td>Doe</td>
  </tr>
</table>
*/



var data;

chrome.history.search({
    'text':'',
    'maxResults':5000,
    'startTime': (new Date(2012,01,01)).getTime(),
    'endTime': (new Date()).getTime()
}, function(items){
   data = items;

   items.forEach(function(item){

       //console.log(item);

       var row = $("<tr>");
       var countCell = $("<td>").html(item.visitCount);

       if(item.title){
         var titleCell = $("<td>").html(item.title);
       }else{
           titleCell = $("<td>").html(item.url);
       }
       row.append(countCell).append(titleCell);
       $("#history-items").append(row);
   });
});





var handleFiles = function(){
    console.log("file set changed");
   var filelist = this.files;
   var file = filelist[0];
   var reader = new FileReader();

   var fileLoadedHandler = function(event){
       console.log("file loaded");
       console.log(event);
       var fileData = event.target.result;
       var jsonData = JSON.parse(fileData);
       console.log(jsonData);
   }

   reader.onload = fileLoadedHandler;
   reader.readAsBinaryString(file);

};

$(function(){
    $("#pressme").click(function(){
      downloadAsJSON(data, "view-history.json");
    });

    document.getElementById("historyUpload").addEventListener("change", handleFiles, false);
});
