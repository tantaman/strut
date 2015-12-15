(function () {
    var autoSLideStatus = 0;
    var bottonList = "<li id='autoplay'><img alt='Play' src='Preview-Icons/play.png'></li>"
            + "<li id='gallery'><img src='Preview-Icons/chart-gallery.png' alt='Gallery'></li>"
            + "<li id='edit'><img src='Preview-Icons/edit.png' alt='Edit'></li>"
            + "<li id='refresh'><img src='Preview-Icons/refresh.png' alt='Refresh'></li>"
            + "<li id='download'><img src='Preview-Icons/download.png' alt='Download'></li>"
            + "<li id='fullscreen'><img src='Preview-Icons/fullscreen.png' alt='Fullscreen'></li>";


    $("body").append("<div style='position:absolute; z-index:1; bottom:10px; transform:translate(-270px, 0px); left:50%; border-radius: 10px; background-color: rgba(149, 150, 153, 0.5)' id='botton-container'><ul style = 'list-style: none'>" + bottonList + "</ul></div>");

    $("#botton-container li")
            .css({
//                "position": "absolute",
                "display": "inline-block",
                "width": "50px",
                "height": "50px",
                "padding": "10px 20px",
//                "background-color": "#959699",
                "text-align": "center",
                "cursor": "pointer",
                "line-height": "30px",
            });

//    $("#botton-container").hover(
//            function () {
//                $("#botton-container li")
//                        .css({position: "static"})
//                        .hover(function () {
//                            $(this).css({"background-color": "#b0e5f4"});
//                        }, function () {
//                            $(this).css({"background-color": "#00BAF2"});
//                        });
//            },
//            function () {
//                $("#botton-container li")
//                        .css({position: "absolute"});
//            });

    $("#autoplay").click(function () {
//       Reveal.toggleAutoSlide();
        Reveal.configure({autoSlide: (autoSLideStatus = autoSLideStatus ? 0 : 2000), loop: true});
    });
//
//    $("#refresh").click(function () {
//        Reveal.slide(0);
//    });

    $("#fullscreen").click(function () {
        Reveal.fullScreen();

    });

    $("#gallery").click(function () {
        Reveal.toggleOverview();
    });

    $("#download").click(function () {
        var newURL = "?print-pdf#/";
        var win = window.open(newURL, '_blank');
        win.focus();
        win.print();
    });

//        $("body").append("<div id='hintDiv'>Use spacebar or arrow keys to navigate. </br> Hit esc for a slide overview.</div>");
//        $("#hintDiv").css({
//                    "width": "100%",
//                    "height": "10%",
//                    "text-align": "center",
//                    "background-color": "rgb(128, 128, 128)",
//                    "color": "white",
//                    "position": "absolute",
//                    "bottom": "25%",
//                    "font-size": "2em",
//                    "z-index":1000,
//                    "display": "none"
//
//                });

//    if(Reveal.isFirstSlide()){
//        $("#hintDiv").fadeIn(500);
//    }
//    
//    Reveal.addEventListener('slidechanged', function (event) {
//        if (Reveal.isFirstSlide()) {
//            $("#hintDiv").fadeIn(500);
//        }
//        
//        else{
//            $("#hintDiv").fadeOut();
//        }
//
//    });

    Reveal.configure({slideNumber: true});
    $(".slide-number").css({"text-align": "center"});

    $(document).ready(function () {
        var w = $(".slides").width();
        var l = $(".slides").offset().left;
        
        $(".left-control").css("left", l - 40);
        $(".right-control").css("left", l + w + 40);
        
        $("section.slideContainer").on("mouseenter", function(){$("#botton-container").show();});
        $("#botton-container").on("mouseenter", function(){$(this).show();});
        $("section.slideContainer").on("mouseout", function(){$("#botton-container").hide();});
         
    });

//    $(document).ready(function () {
//        var bodyHeight = $("body").height();
//        var bodyWidth = $("body").width();
//        var actualAvailableHeightforSlide = bodyHeight;
//        var actualAvailableWidthforSlide = bodyWidth - 80; // 80px as the area for two side buttons
//
//        if (actualAvailableWidthforSlide < actualAvailableHeightforSlide * (4 / 3)) {
//            actualAvailableHeightforSlide = actualAvailableWidthforSlide * (3 / 4);
//            console.log(actualAvailableHeightforSlide);
//            console.log(actualAvailableWidthforSlide);
//        }
//        
//        else {
//            actualAvailableWidthforSlide = actualAvailableHeightforSlide * (4 / 3);
//        }
//            console.log(actualAvailableWidthforSlide/actualAvailableHeightforSlide);
//        
//        $("section.slideContainer").height(actualAvailableHeightforSlide).width(actualAvailableWidthforSlide).css("margin","0 " + (bodyWidth - actualAvailableWidthforSlide)/2 + "px");
//    });

}());

//var parseQueryString = function() {
//
//    var str = window.location.search;
//    var objURL = {};
//
//    str.replace(
//        new RegExp( "([^?=&]+)(=([^&]*))?", "g" ),
//        function( $0, $1, $2, $3 ){
//            objURL[ $1 ] = $3;
//        }
//    );
//    return objURL;
//};
//
//var params = parseQueryString();
//
//if(typeof params.id !== "undefined" && params.id !== "") {
//$.ajax({
//  method: "POST",
//  url: (params.id + ".json")
//})
//  .success(function( dataStr ) {
//      var slideData = jQuery.parseJSON(dataStr);
//      var slideSection = '<div class="reveal"><div class="slides">';
//      slideData.slides.forEach(function(val, i){
//          
//          var slide = "<section>";
//          val.components.forEach(function(val, i){
//              slide += '<div class="componentContainer " style="top: ' + val.y + '; left:' + val.x + '; -webkit-transform:   ; -moz-transform:   ; transform:   ; width:'+ val.width + '; height:' + val.height + '">' + 
//'<div class="transformContainer" style="-webkit-transform: scale(' + val.scale.x + ',' + val.scale.y +'); -moz-transform: scale(' + val.scale.x + ',' + val.scale.y +'); transform: scale(' + val.scale.x + ',' + val.scale.y + ')">' + 
//'<iframe width="' + val.scale.width + '" height="' + val.scale.height + 'src="' + val.src + '"></iframe>' +
//'</div></div>';
//              
//          });
//          
//          slide += "</section>";
//          
//          slideSection += slide;
//          
//          
//      });
//      
//      slideSection += '</div></div>';
//      console.log(slideSection);
//      $("body").html(slideSection);
////      $("iframe").each(function(i, el){
////          $(el).attr("src", slideData.slides[i].components[0].src);
////          
////      });
//      
//  });

//  }