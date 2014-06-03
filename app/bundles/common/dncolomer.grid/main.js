define(['tantaman/web/widgets/MenuItem',
		'lang'],
function(MenuItem, lang) {
	'use strict';

	function toggleGrid(editorModel) {
		if ($('.gridArea').length) {
			$('.gridArea').remove();
		} else {
			var gridArea = $('<div class="gridArea"></div>');
			var hLine = '<div class="hSeparator"></div>';
			var vLine = '<div class="vSeparator"></div>';
			
			var hSep = 3; //TODO: user inputed
			var vSep = 3; //TODO: user inputed
			var height = $('.markdownArea').height();
			var width = $('.markdownArea').width();

			for (var i = 0; i < height; i += height/hSep) {
				gridArea.append($(hLine).css({'top':i+'px'}));
			}

			for (var i = 0; i < width; i += width/vSep) {
				gridArea.append($(vLine).css({'left':i+'px'}));
			}

			$('.slideContainer').append(gridArea);
		}
	}

	var menuProvider = {
		createMenuItems: function(editorModel) {
			return new MenuItem({ title: lang.show_hide_grid, handler: toggleGrid, model: editorModel});	
		}
	};

	return {
		initialize: function(registry) {
			registry.register({
				interfaces: 'strut.LogoMenuItemProvider'
			}, menuProvider);
		}
	};
});