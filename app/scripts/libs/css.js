define(function() {
	var path = undefined;
	if (typeof process !== "undefined" && typeof nodeRequire !== 'undefined') {
		var fs = nodeRequire('fs');
		path = nodeRequire('path');
		var fname = null;
	}

	function loadCss(url) {
		if (typeof document === "undefined") {
			addToBuild(url);
			return;
		}

		if (isOptimized)
			return;

	    var link = document.createElement("link");
	    link.type = "text/css";
	    link.rel = "stylesheet";
	    link.href = url; // TODO: needs to be configurable.
	    document.getElementsByTagName("head")[0].appendChild(link);
	}

	function addToBuild(url) {
		var contents = fs.readFileSync('app/' + url, "utf8");
		fs.appendFileSync(fname, contents + "\n");
	}

	return {
	    load: function (name, req, onLoad, config) {
	    	if (path && !fname) {
	    		//fname = path.dirname(config.out) + "/built.css";
          		if (!fs.existsSync(".tmp"))
            		fs.mkdirSync(".tmp");
          		// if (!fs.existsSync(".tmp/styles"))
  	    			// fs.mkdirSync(".tmp/styles");
	    		fname = ".tmp/built.css";
	    	}
	    	loadCss(name);
	        onLoad(null);
	    }
	};
});
