if (window.location.href.indexOf("preview=") != -1) {
	console.log("PREVIEW URL INDeX MATCH");
	$(function() {
		console.log("onload??");
		var idx = window.location.href.indexOf("=");
		var end = window.location.href.indexOf("&");
		if (end == -1)
			end = window.location.href.length;

		var presentation = window.location.href.substring(idx+1, end);
		console.log(presentation);
		$("body").html(unescape(presentation));
	});
}

$(function() {
	console.log("STARING IMPRESS!");
	startImpress(document, window);
	impress().init();
});