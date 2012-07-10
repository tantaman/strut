
exports.snapshot = function Snapshot(frame) {
	 var window = frame.contentWindow;
	 var thumbnail = window.document.createElementNS(XHTML_NS, "canvas");
	 thumbnail.mozOpaque = true;
	 thumbnail.width = Math.ceil(window.screen.availWidth / 4.75);
	 var aspectRatio = 0.5625; // 16:9
	 thumbnail.height = Math.round(thumbnail.width * aspectRatio);
	 var ctx = thumbnail.getContext("2d");
	 var snippetWidth = window.innerWidth * .6;
	 //var snippetWidth=64;
	 var scale = thumbnail.width / snippetWidth;
	 ctx.scale(scale, scale);
	 ctx.drawWindow(window, window.scrollX, window.scrollY, snippetWidth, snippetWidth * aspectRatio, "rgb(255,255,255)");
	 return thumbnail.toDataURL("image/png");
};

exports.shoot = function (frame, g2d) {
	var wind = frame.contentWindow
	var scaleW = g2d.canvas.width / wind.innerWidth;
	var scaleH = g2d.canvas.height / wind.innerHeight;
	g2d.save();
	g2d.scale(scaleW, scaleH);
	g2d.drawWindow(wind, 0, 0, wind.innerWidth, wind.innerHeight, "rgb(255,255,255)");
	g2d.restore();
}; 