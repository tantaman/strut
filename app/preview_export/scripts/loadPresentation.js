var loadPresentation = function () {
    var presentation = localStorage.getItem('preview-string');
//    console.log(presentation);
    var config = JSON.parse(localStorage.getItem('preview-config'));

    var params = parseQueryString();

    if (typeof params.id !== "undefined" && params.id !== "") {
        presentation = '';
        $.ajax({
            method: "POST",
            url: (params.id + ".json"),
            async: false,
            success: function (data) {
                presentation = data.preview;
            }
            
        });
       
        document.body.innerHTML = presentation;
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
