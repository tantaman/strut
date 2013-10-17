define(function () {
	var config = {
		slide: {
			size: {
				width: 1024,
				height: 768
			},
			overviewSize: {
				width: 75,
				height: 50
			}
		}
	};

	var temp = localStorage.getItem("Strut_sessionMeta");
	try {
		var sessionMeta = JSON.parse(temp);
	} catch (e) {
	}

	var sessionMeta = sessionMeta || {
		generator_index: 0
	};

	window.config = config;
	window.sessionMeta = sessionMeta;

	if (window.sessionMeta.lastProvider == 'localstorage') {
		// This is a check to upgrade our storage mechanisms
		window.sessionMeta.lastProvider = 'largelocalstorage';
		window.__requiresStorageConversion = true;
	}

	return config;
});