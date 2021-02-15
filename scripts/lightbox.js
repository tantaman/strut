(function() {
	$('[data-toggle="lightbox"]').click(function(e) {
		$('#lightbox-blur').removeClass('hide');
		var t = $(e.currentTarget).attr('data-target');
		var $t = $(t);
		$t.removeClass('hide');

		var vid = $t.find("video");
		if (vid.length > 0)
			vid[0].play();
	});

	$('.lightbox-content').click(function(e) {
		e.stopPropagation();
	});

	$('.lightbox, #lightbox-blur').click(function() {
		var $box = $('.lightbox:not(.hide)')
		var vid = $box.find("video");
		if (vid.length > 0) {
			vid[0].pause();
		}
		$box.addClass('hide');
		$('#lightbox-blur').addClass('hide');
	})
})();