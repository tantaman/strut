define(['handlebars',
	'strut/config/config',
	'lang',
	'./PublishHandler',
	'./ShareHandler'],
function(Handlebars, config, lang, PublishHandler, ShareHandler) {
	Handlebars.registerHelper("shareType", function() {
		if (config.shareType == 'publish') {
			return new Handlebars.SafeString('<i class="icon-upload icon-white"></i>' + lang.publish);
		} else {
			return new Handlebars.SafeString('<i class="icon-share icon-white"></i>' + lang.share);
		}
	});

	if (config.shareType == 'publish')
		var handler = PublishHandler;
	else
		var handler = ShareHandler;

	return {
		wireTo: function($btn, editorModel) {
			new handler($btn, editorModel);
		}
	};
});