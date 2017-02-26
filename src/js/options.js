

var handleFiles = function(){
    console.log("file set changed");
   var filelist = this.files;
   var file = filelist[0];
   var reader = new FileReader();
   var fileLoadedHandler = function(event){
       var fileData = event.target.result;
       var jsonData = JSON.parse(fileData);
       console.log(jsonData); 
       chrome.storage.local.set({"searches": jsonData.search_history}, function(store){
           if(runtime.lastError){
               console.log(runtime.lastError);
           }else{
               console.log("set searches locally to", jsonData);
           }
       });
   };
   reader.onload = fileLoadedHandler;
   reader.readAsBinaryString(file);
};


$(function(){
    $("#clear-profile").click(function(){
        chrome.storage.local.set({searches: []}, function(){
            console.log("Cleared extension profile");
        });
    });

    $("#profile-download").click(function(){
        build_history_dataset(function(items){
            chrome.storage.local.get("searches", function(store){
                var user_profile = {
                    view_history : items,
                    search_history : store.searches
                };
                downloadAsJSON(user_profile, "profile.json");
            });
        });
    });
$(function(){
		$('#upload-button').click(function(){
   $("input[type='file']").trigger('click');
})

$("input[type='file']").change(function(){
   $('#val').text(this.value.replace(/C:\\fakepath\\/i, ''))
})    
 });
    
    
    document.getElementById("upload-fake").addEventListener("change", handleFiles, false);
});