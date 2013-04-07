define(function () {
	var config = {
		slide: {
			size: {
				width: 1024,
				height: 768
			}
		}
	};

	var temp = localStorage.getItem("Strut_sessionMeta");
	try {
		var sessionMeta = JSON.parse(temp);
	} catch (e) {
	}

	var sessionMeta = sessionMeta || {};

	window.config = config;
	window.sessionMeta = sessionMeta;

	return config;
});