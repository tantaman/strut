var loadPresentation = function () {
    var presentation = localStorage.getItem('preview-string');
//    console.log(presentation);
    var config = JSON.parse(localStorage.getItem('preview-config'));



    var params = parseQueryString();
    console.log(params);

    if (typeof params.id !== "undefined" && params.id !== "") {
        $.ajax({
            method: "POST",
            url: (params.id + ".json"),
            async: false,
        })
                .success(function (dataStr) {
                    var slideData = jQuery.parseJSON(dataStr);
                    presentation = '<div class="reveal"><div class="slides">';
                    slideData.slides.forEach(function (val, i) {

                        var slide = "<section>";
                        val.components.forEach(function (val, i) {
                            slide += '<div class="componentContainer " style="top: ' + val.y + '; left:' + val.x + '; -webkit-transform:   ; -moz-transform:   ; transform:   ; width:' + val.width + '; height:' + val.height + '">' +
                                    '<div class="transformContainer" style="-webkit-transform: scale(' + val.scale.x + ',' + val.scale.y + '); -moz-transform: scale(' + val.scale.x + ',' + val.scale.y + '); transform: scale(' + val.scale.x + ',' + val.scale.y + ')">' +
                                    '<iframe width="' + val.scale.width + '" height="' + val.scale.height + '" src="' + val.src + '"></iframe>' +
                                    '</div></div>';

                        });

                        slide += "</section>";

                        presentation += slide;


                    });

                    presentation += '</div></div>';
//                    console.log(slideSection);
//                    $("body").html(slideSection);
//      $("iframe").each(function(i, el){
//          $(el).attr("src", slideData.slides[i].components[0].src);
//          
//      });


                });
                
                    console.log(presentation);
                if (presentation) {
        //	document.body.className = config.surface + " " + document.body.className;
    }

    };
        document.body.innerHTML = presentation;

    
}


var parseQueryString = function () {

    var str = window.location.search;
    var objURL = {};

    str.replace(
            new RegExp("([^?=&]+)(=([^&]*))?", "g"),
            function ($0, $1, $2, $3) {
                objURL[ $1 ] = $3;
            }
    );
    return objURL;
};
