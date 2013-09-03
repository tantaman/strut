define(function() {
	return {
		render: function(deckAttrs) {
			return JST['strut.presentation_generator.reveal/RevealTemplate'](deckAttrs);
		},

		getStartPreviewFn: function(editorModel, sourceWind, previewStr) {
      function cb() {
        var previewWind = sourceWind.previewWind;
        if (!previewWind.startPres) {
          setTimeout(cb, 200);
        } else {
          previewWind.document.
            getElementsByTagName("html")[0].innerHTML = previewStr;
          if (!previewWind.presStarted) {
            previewWind.Reveal = previewWind.startPres(previewWind.document, previewWind);
            previewWind.Reveal().initialize({
              controls: true,
              progress: true,
              history: true,
              center: true,

              theme: previewWind.Reveal().getQueryHash().theme, // available themes are in /css/theme
              transition: previewWind.Reveal().getQueryHash().transition || 'default', // default/cube/page/concave/zoom/linear/fade/none

              // Optional libraries used to extend on reveal.js
              dependencies: [
                { src: 'preview_export/reveal/lib/js/classList.js', condition: function() { return !previewWind.document.body.classList; } },
                { src: 'preview_export/reveal/plugin/markdown/marked.js', condition: function() { return !!previewWind.document.querySelector( '[data-markdown]' ); } },
                { src: 'preview_export/reveal/plugin/markdown/markdown.js', condition: function() { return !!previewWind.document.querySelector( '[data-markdown]' ); } },
                { src: 'preview_export/reveal/plugin/highlight/highlight.js', async: true, callback: function() { hljs.initHighlightingOnLoad(); } },
                { src: 'preview_export/reveal/plugin/zoom-js/zoom.js', async: true, condition: function() { return !!previewWind.document.body.classList; } },
                { src: 'preview_export/reveal/plugin/notes/notes.js', async: true, condition: function() { return !!previewWind.document.body.classList; } }
                // { src: 'preview_export/reveal/plugin/search/search.js', async: true, condition: function() { return !!document.body.classList; } }
                // { src: 'preview_export/reveal/plugin/remotes/remotes.js', async: true, condition: function() { return !!document.body.classList; } }
              ]
            });
          }
        }
      }
      return cb;
    }
	};
});