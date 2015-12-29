var loadPresentation = function () {
    var presentation = localStorage.getItem('preview-string');
    var config = JSON.parse(localStorage.getItem('preview-config'));

    var id = getURLParameter("code");
    if (id) {
        presentation = undefined;
        var access = accessDetails(getURLParameter("access_token"));
        $.ajax({
            url: "https://devaccounts.icharts.net/gallery2.0/rest/v1/chartbooks/" + id,
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Basic " + btoa(access.client_id + ":" + access.client_secret));
            },
            success: function (resp) {
                var presentation = resp.results;
                makePresentation(presentation);
                if (charts.length) {
                    $("body").find(".reveal").data("charts", charts);
                    addCharts(0);
                }
                revealPresentation();
            },
            error: function (err) {

            }
        });
    }
    if (presentation) {        
        document.body.className = config.surface + " " + document.body.className;
        document.body.innerHTML = presentation;        
    }
};

var charts = [];
var addCharts = function (i, chrts) {
    charts = charts || chrts;
    var chart = charts[i];
    var iframe = document.getElementById("slide-" + chart.slide + "-component-" + chart.component);
    iframe.src = iframe.dataset.url;
    iframe.onload = function () {
        i++;
        if (charts.length > i) {
            $("body").find(".reveal").data("charts", charts);
            addCharts(i);
        }
    };
};

function getURLParameter(name, loc) {
    loc = loc || location.search;
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(loc) || [, ""])[1].replace(/\+/g, '%20')) || null
}

var parseQueryString = function (url) {

    var str = url ? url : window.location.search;
    var objURL = {};

    str.replace(
            new RegExp("([^?=&]+)(=([^&]*))?", "g"),
            function ($0, $1, $2, $3) {
                objURL[ $1 ] = $3;
            }
    );
    return objURL;
};

function accessDetails(access_token) {
    access_token = "?" + atob(decodeURI(access_token));
    return parseQueryString(access_token);
}


function makePresentation(data) {
    var html = 
            '<div class="reveal strut-surface" data-transition="'+data.cannedTransition+'" >' +
            '<div class="bg innerBg">' +
            '<div class="controls left-control" style="position:fixed; height:100%; width:40px; background-color:rgb(97, 98, 101); z-index:100">' +
            '<img class = "navigate-left" src="Preview-Icons/big-left-arrow.png" alt="Left-Navigation" style="padding:10px; position:relative; top:50%; transform:translate(0,-25px)">' +
            '</div>' +
            '<div class="slides">' +
            '</div>' +
            '<div class="controls right-control" style="position:fixed; height:100%; width:40px; background-color:rgb(97, 98, 101); z-index:100">' +
            '<img class = "navigate-right" src="Preview-Icons/big-right-arrow.png" alt="Right-Navigation" style="padding:10px; position:relative; top:50%; transform:translate(0,-25px)">' +
            '</div>' +
            '</div>' +
            '</div>';
    $("body").html(html);

    $.each(data.slides, function (slideNum, slide) {
        $(".slides").append(makeSlide(slide, slideNum));
    });
}

function makeSlide(slide, slideNum) {
    var html = '<section class="' + (slide.background ? slide.background : "") + ' slideContainer strut-slide-' + slideNum + '" style="width: 100%; height: 100%"' +
            ' data-state="strut-slide-' + slideNum + '">' +
            '<div class="themedArea"></div>';
    $.each(slide.components, function (componentNum, component) {
        html += addComponent(component, componentNum, slideNum);
    });
    html += '</section>';
    return html;
}

function addComponent(component, componentNum, slideNum) {

    var html = '<div class="componentContainer component-' + componentNum + '"' +
            'style="top: ' + component.y + 'px; left: ' + component.x + 'px; -webkit-transform: rotate(' + component.rotate + 'rad) skewX(' + component.skewX + 'rad) skewY(' + component.skewY + 'rad);' +
            '-moz-transform: rotate(' + component.rotate + 'rad) skewX(' + component.skewX + 'rad) skewY(' + component.skewY + 'rad);' +
            'transform: rotate(' + component.rotate + 'rad) skewX(' + component.skewX + 'rad) skewY(' + component.skewY + 'rad); width: ' + (component.width ? component.width : "") + 'px; height:' + (component.height ? component.height : "") + 'px;">' +
            '<div class="transformContainer" style="-webkit-transform: scale(' + component.scale.x + ', ' + component.scale.y + ');' +
            '-moz-transform: scale(' + component.scale.x + ', ' + component.scale.y + ');transform: scale(' + component.scale.x + ', ' + component.scale.y + ')">';

    switch (component.type) {
        case "TextBox":
            html += '<div style="font-size: ' + component.size + ';" class="antialias">' +
                    component.text +
                    '</div>'
            break;
        case "Image":
            html += '<img src="' + component.src + '" height="' + component.scale.height + '" width="' + component.scale.width + '"></img>';
            break;
        case "Chart":
            charts.push({"slide": slideNum, "component": componentNum});
            html += '<iframe id="slide-' + slideNum + '-component-' + componentNum + '" src = "" data-url="' + component.src + '" class= "Chart" width="' + component.width + '" height="523"></iframe>';
            break;
        case "Video":
            if (component.videoType == "youtube") {
                var url = parseQueryString(component.src);
                url = "http://www.youtube.com/v/" + url.v + "&amp;hl=en&amp;fs=1"
                html += '<object width="' + component.scale.width + '" height="' + component.scale.height + '"><param name="movie" value="' + url + '"><param name="allowFullScreen" value="true"><embed src="' + url + '" type="application/x-shockwave-flash" allowfullscreen="true" width="' + component.scale.width + '" height="' + component.scale.height + '"></object>';
            }
            else if (component.videoType == "html5") {
                html += '<video controls><source src="' + component.src + '" type="video/webm" preload="metadata"></source></video>';
            }
            break;
    }
    html += '</div>' +
            '</div>';

    return html;
}

function revealPresentation() {
    if (!window.presStarted) {

        $(document).ready(function () {
            $(window).resize(function () {
                resizeWindow();
                $(".slides").css("height", slideDimention.height);
                $(".slides").css("width", slideDimention.width);
                z = $(".slides").css("height");
            });
        });
        // Full list of configuration options available here:
        // https://github.com/hakimel/reveal.js#configuration

        Reveal.initialize({
            controls: true,
            progress: true,
            history: true,
            center: true,
            width: 955,
            height: 540,
            theme: Reveal.getQueryHash().theme, // available themes are in /css/theme
            transition: Reveal.getQueryHash().transition || 'default', // default/cube/page/concave/zoom/linear/fade/none

            // Optional libraries used to extend on reveal.js
            dependencies: [
                //      { src: 'reveal/lib/js/classList.js', condition: function() { return !document.body.classList; } },
                //      { src: 'reveal/plugin/markdown/marked.js', condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
                //      { src: 'reveal/plugin/markdown/markdown.js', condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
                //      { src: 'reveal/plugin/highlight/highlight.js', async: true, callback: function() { hljs.initHighlightingOnLoad(); } },
                {src: 'scripts/jQuery.js', async: true},
                {src: 'scripts/extendedReveal.js', async: true},
                {src: 'reveal/plugin/zoom-js/zoom.js', async: true, condition: function () {
                        return !!document.body.classList;
                    }},
                {src: 'reveal/plugin/notes/notes.js', async: true, condition: function () {
                        return !!document.body.classList;
                    }}
                // { src: 'preview_export/reveal/plugin/search/search.js', async: true, condition: function() { return !!document.body.classList; } }
                // { src: 'preview_export/reveal/plugin/remotes/remotes.js', async: true, condition: function() { return !!document.body.classList; } }
            ]
        });

        var innerBg = document.querySelector('.innerBg');
        function updateSurface(step, operation) {
            if (!step)
                return;
            if (step.dataset)
                var state = step.dataset.state;
            else {
                for (var i = 0; i < step.attributes.length; ++i) {
                    if (step.attributes[i].name == 'data-state') {
                        state = step.attributes[i].value;
                        break;
                    }
                }
            }
            if (typeof state == 'string') {
                state = state.trim().split(' ');
                for (var i = 0; i < state.length; ++i) {
                    innerBg.classList[operation](state[i]);
                }
            }
        }
        function slideShown(e) {
            updateSurface(e.previousSlide, 'remove');
            updateSurface(e.currentSlide, 'add');
        }
        Reveal.addEventListener('slidechanged', slideShown);
        Reveal.addEventListener('ready', slideShown);

        window.onload = function () {
            //ToDO: Give the editor window dimention from the API
//                        var editorPanelDimention = JSON.parse(localStorage.getItem("editorPanelDimention")) || API.getDimention(); ;
            var editorPanelDimention = JSON.parse(localStorage.getItem("editorPanelDimention"));
            $(".slides").css("transform", "translate(-50%, -50%) scale(" + slideDimention.width / editorPanelDimention.width + ", " + slideDimention.height / editorPanelDimention.height + ")");
            Reveal.addEventListener('slidechanged', function (event) {
                $(".slides").css("transform", "translate(-50%, -50%) scale(" + slideDimention.width / editorPanelDimention.width + ", " + slideDimention.height / editorPanelDimention.height + ")");

            });
        };
    }

}

