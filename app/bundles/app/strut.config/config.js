define(['jquery'], function ($) {


    /*Function to calculate operating table to be in 16/9 ratio */
    function aspectRatio() {
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
        return {height: actualAvailableHeightforSlide, width: actualAvailableWidthforSlide}
    }

    var operatinTableDimension = aspectRatio();
    var config = {
        slide: {
            size: {
                width: operatinTableDimension.width,
                height: operatinTableDimension.height,
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

    localStorage.setItem("editorPanelDimention", JSON.stringify({height: parseInt(operatinTableDimension.height), width: parseInt(operatinTableDimension.width)}));
    window.config = config;
    window.sessionMeta = sessionMeta;
    window.aspectRatio = aspectRatio;

    return config;
});