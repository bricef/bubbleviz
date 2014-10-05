
if (!String.prototype.encodeHTML) {
  String.prototype.encodeHTML = function () {
    return this.replace(/&/g, '&amp;')
               .replace(/</g, '&lt;')
               .replace(/>/g, '&gt;')
               .replace(/"/g, '&quot;')
               .replace(/'/g, '&apos;');
  };
}

function results2xml(results){
	var xw = new XMLWriter('UTF-8');
	xw.formatting = 'indented';//add indentation and newlines
	xw.indentChar = ' ';//indent with spaces
	xw.indentation = 2;//add 2 spaces per level

	xw.writeStartDocument();
	xw.writeStartElement('searchresult');

	xw.writeElementString('query', "Not applicable");

	results.forEach(function(result){
		xw.writeStartElement('document');
			xw.writeAttributeString("id", result.id);
			xw.writeElementString('title', result.result.encodeHTML());
			xw.writeElementString('snippet', result.snippet.encodeHTML());
			xw.writeElementString('url', result.url.encodeHTML());
		xw.writeEndElement();
	});
	xw.writeEndElement();
	xw.writeEndDocument();
	return xw.flush();
}



function carrot_fetch_clusters(results, onSuccess, onError){
	var xml = results2xml(results);
	if(!results || results.length < 1){
		if(onSucces && typeof onsuccess == "function"){
			onSuccess();
		}
		return;
	}

	//console.log(xml);
	$.ajax({
		type: "POST",
		url: "http://bubbleviz-carrot.herokuapp.com/dcs/rest",
		data: {
			"dcs.c2stream": xml,
			"dcs.algorithm": "lingo",
			"dcs.output.format": "JSON",
			"dcs.clusters.only": true,
		},
		success: onSuccess,
		error: onError,
		dataType: 'json',
	});
}




