/*if (window.location.href.indexOf("preview=") != -1) {
	$(function() {
		var idx = window.location.href.indexOf("=");
		var end = window.location.href.indexOf("&");
		if (end == -1)
			end = window.location.href.length;

		var presentation = window.location.href.substring(idx+1, end);
		$("body").html(decodeURIComponent(presentation));
	});
}*/

$(function() {
	startImpress(document, window);
	impress().init();
});