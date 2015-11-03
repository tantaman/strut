(function () {
    var autoSLideStatus = 0;
    var bottonList = "<li style='z-index: 100'><i class='fa fa-bars'></i></li>"
            + "<li id='autoplay'><i class='fa fa-play'></i></li>"
            //+ "<li id='refresh'><i class='fa fa-refresh'></i></li>"
            + "<li id='fullscreen'><i class='fa fa-arrows-alt'></i></li>"
            + "<li id='allSlide'><h3><i class='fa fa-map-o'></i></li>"
            + "<li id='download'><i class='fa fa-download'></i></li>";


    $("body").append("<div style='position:absolute; top:0; right:0;width:30px' id='botton-container'><ul style = 'list-style: none'>" + bottonList + "</ul></div>");

    $("#botton-container li")
            .css({
                "position": "absolute",
                "width": "30px",
                "height": "30px",
                "font-size": "15px",
                "background-color": "#00BAF2",
                "text-align": "center",
                "cursor": "pointer",
                "line-height": "30px",
            });
            
    $("#botton-container").hover(
            function () {
                $("#botton-container li")
                        .css({position: "static"})
                        .hover(function () {
                            $(this).css({"background-color": "#b0e5f4"});
                        }, function () {
                            $(this).css({"background-color": "#00BAF2"});
                        });
            },
            function () {
                $("#botton-container li")
                        .css({position: "absolute"});
            });

    $("#autoplay").click(function () {
        Reveal.configure({autoSlide: (autoSLideStatus = autoSLideStatus ? 0 : 2000)});
    });
//
//    $("#refresh").click(function () {
//        Reveal.slide(0);
//    });

    $("#fullscreen").click(function () {
       Reveal.fullScreen();
    });

    $("#allSlide").click(function () {
        Reveal.toggleOverview();
    });

    $("#download").click(function () {
       
        var newURL = "?print-pdf#/";
        var win = window.open(newURL, '_blank');
        win.focus();
        win.print();

    });

}());