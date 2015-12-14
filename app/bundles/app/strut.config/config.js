define(['jquery'],function ($) {
        var bodyHeight = $("body").height();
        var bodyWidth = $("body").width();
        var actualAvailableHeightforSlide = bodyHeight - 120;
        var actualAvailableWidthforSlide = bodyWidth - 230;

        if (actualAvailableWidthforSlide < (actualAvailableHeightforSlide * (16 / 9))) {
            actualAvailableHeightforSlide = actualAvailableWidthforSlide * (9 / 16);
            
        }
        
        else {
            actualAvailableWidthforSlide = actualAvailableHeightforSlide * (16 / 9);
        }
    
	var config = {
		slide: {
			size: {
				width: actualAvailableWidthforSlide,
				height: actualAvailableHeightforSlide
			},
			overviewSize: {
				width: 140,
				height: 90
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

	return config;
});