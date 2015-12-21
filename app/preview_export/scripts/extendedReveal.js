(function () {
    var autoSLideStatus = 0;
    var bottonList = "<li id='autoplay' class='hastip' data-title='Autoplay'><img alt='Play' src='Preview-Icons/play.png'></li>"
            + "<li id='gallery' class='hastip' data-title='Gallery'><img src='Preview-Icons/chart-gallery.png' alt='Gallery'></li>"
            + "<li id='edit' class='hastip' data-title='Edit'><img src='Preview-Icons/edit.png' alt='Edit'></li>"
            + "<li id='refresh' class='hastip' data-title='Refresh'><img src='Preview-Icons/refresh.png' alt='Refresh'></li>"
            + "<li id='download' class='hastip' data-title='Download'><img src='Preview-Icons/download.png' alt='Download'></li>"
            + "<li id='fullscreen' class='hastip' data-title='Fullscreen'><img src='Preview-Icons/fullscreen.png' alt='Fullscreen'></li>";


    $("body").append("<div style= ' display: none; position:absolute; z-index:1; bottom:10px; transform:translate(-50%, 0px); left:50%; border-radius: 10px; background-color: rgba(149, 150, 153, 0.5)' id='botton-container'><ul style = 'list-style: none'>" + bottonList + "</ul></div>");
    $("#botton-container").css("bottom", ($("body").height() - slideDimention.height) / 2 + 20);

    $("#botton-container li")
            .css({
                "position": "relative",
                "display": "inline-block",
                "text-align": "center",
                "cursor": "pointer",
                "line-height": "30px",
                })
            .append(function(){return "<div class='toolTip'><div>" + $(this).attr("data-title") + "</div></div>"})
            .hover(function(){$(this).find("div.toolTip").show()}, function(){$(this).find("div.toolTip").hide()});
//            <div class='pointer'></div>
//            $(".pointer").css("transform", function(){
//                console.log("translateX(" + $(this).closest("li").innerWidth()/2 + ")");
//                return "translateX(" + $(this).closest("li").innerWidth()/2 + "px)";
//            })
            
            //Calculating for fullscreen
            var bodyHeight = screen.height;
                var bodyWidth = screen.width;
                var actualAvailableHeightforSlide = bodyHeight;
                var actualAvailableWidthforSlide = bodyWidth - 80; // 80px as the area for two side buttons

                if (actualAvailableWidthforSlide < actualAvailableHeightforSlide * (16 / 9)) {
                    actualAvailableHeightforSlide = actualAvailableWidthforSlide * (9 / 16);
                }

                else {
                    actualAvailableWidthforSlide = actualAvailableHeightforSlide * (16 / 9);
                }
            
    var editorPanelDimention = JSON.parse(localStorage.getItem("editorPanelDimention"));

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

     var editorPanelDimention = JSON.parse(localStorage.getItem("editorPanelDimention"));
    $("#autoplay").click(function () {
        //If autoplay timer is not defined the default'll be 3sec
       var autoPlayTimer = parseInt(window.localStorage.getItem("autoPlayTimer")) || 3000;
       Reveal.toggleAutoSlide();
       Reveal.configure({autoSlide: autoPlayTimer, loop: true});
       $(".slides").css("transform", "translate(-50%, -50%) scale(" + slideDimention.width / editorPanelDimention.width + ", " + slideDimention.height / editorPanelDimention.height + ")");
                        
    });
//
//    $("#refresh").click(function () {
//        Reveal.slide(0);
//    });

    $("#fullscreen").click(function () {
        Reveal.fullScreen();
        
        //TODO: Remove setTimeout
        setTimeout(function(){
                $(".slides").css("transform", "translate(-50%, -50%) scale(" + actualAvailableWidthforSlide / editorPanelDimention.width + ", " + actualAvailableHeightforSlide / editorPanelDimention.height + ")");

//                $(".slides").css({"top" : (bodyHeight - actualAvailableHeightforSlide) / 2 + "px", height:actualAvailableHeightforSlide + "px", width:actualAvailableWidthforSlide+"px"});
////                    $(".controls.right-control").css({"right": 0, "left":""});
////                    $(".controls.left-control").css("left", 0);
        }, 100);
        
//Call Back eqivalant of above issue for remove setTimeout but not working.        
//        (function(fullScreenFunc){
//                    $(".slides").css({"top" : (bodyHeight - actualAvailableHeightforSlide) / 2 + "px", height:actualAvailableHeightforSlide + "px", width:actualAvailableWidthforSlide+"px"});
//                    $(".controls.right-control").css({"right": 0, "left":""});
//                    $(".controls.left-control").css("left", 0);
//                    fullScreenFunc();
//        })(Reveal.fullScreen);
        
//Added promises to the above function      
//        if (window.Promise) {
//            console.log('Promise found');
//
//            var promise = new Promise(function (resolve, reject) {
//                var bodyHeight = screen.height;
//                console.log(screen.height);
//                var bodyWidth = screen.width;
//                var actualAvailableHeightforSlide = bodyHeight;
//                var actualAvailableWidthforSlide = bodyWidth - 80; // 80px as the area for two side buttons
//
//                if (actualAvailableWidthforSlide < actualAvailableHeightforSlide * (16 / 9)) {
//                    actualAvailableHeightforSlide = actualAvailableWidthforSlide * (9 / 16);
//                    console.log(actualAvailableHeightforSlide);
//                    console.log(actualAvailableWidthforSlide);
//                }
//
//                else {
//                    actualAvailableWidthforSlide = actualAvailableHeightforSlide * (16 / 9);
//                }
//                resolve({width: actualAvailableWidthforSlide, height: actualAvailableHeightforSlide});
//
//            });
//
//            promise.then(function (dimensions) {
//                console.log($(".slides"));
//                $(".slides").height(dimensions.height).width(dimensions.width).css("margin", "0 " + ($("body").width() - dimensions.width) / 2 + "px");
//                Reveal.fullScreen();
//                
//                console.log($(".slides"));
//                
//            }, function () {
//            });
//
//        }
    });

    var isOnGallery = false;
    $("#gallery").click(function () {
        Reveal.toggleOverview();
        
        if (isOnGallery) {
        ($(".slides").css("transform", "translate(-50%, -50%) scale(" + slideDimention.width / editorPanelDimention.width + ", " + slideDimention.height / editorPanelDimention.height + ")"));
        isOnGallery = false;
        }
        
        else
        isOnGallery = true; 
            
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

    $(document).ready(function () {
//        var w = $(".slides").width();
//        var l = $(".slides").offset().left;
//        
//        $(".left-control").css("left", 0);
//        $(".right-control").css("right", -40);

        $("section.slideContainer").on("mouseenter", function () {
            $("#botton-container").show();
        });
        $("#botton-container").on("mouseenter", function () {
            $(this).show();
        });
        $("section.slideContainer").on("mouseleave", function () {
            $("#botton-container").hide();
        });

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