define(['strut/editor/EditorView',
        'strut/editor/EditorModel'],
function(EditorView, EditorModel,Iterator) {
	var registry = null;
	var editorStartup = {
		run: function() {
			var model = new EditorModel(registry);
    		//var editor = new EditorView({model: model, registry: registry});
    		//editor.render();
			//$('body').append(editor.$el);

			
			
			
			var pres ={
					"slides": [
					  {
						"num": 1,
						"components": [
						  {
							"TextBox": {},
							"x": 341.3333333333333,
							"y": 256,
							"scale": {
							  "x": 1,
							  "y": 1
							},
							"type": "TextBox",
							"text": "Die geladene Prezi<br>",
							"size": 72,
							"selected": false
						  }
						],
						"z": 0,
						"impScale": 3,
						"rotateX": 0,
						"rotateY": 0,
						"rotateZ": 0,
						"selected": false,
						"active": false,
						"x": 30,
						"y": 80
					  },
					  {
						"num": 0,
						"components": [
						  {
							"TextBox": {},
							"x": 341.3333333333333,
							"y": 256,
							"scale": {
							  "x": 1,
							  "y": 1
							},
							"type": "TextBox",
							"text": "Die dicke  Folie<br>",
							"size": 72,
							"selected": false
						  }
						],
						"z": 0,
						"impScale": 3,
						"rotateX": 0,
						"rotateY": 0,
						"rotateZ": 0,
						"selected": true,
						"active": true,
						"x": 281,
						"y": 172
					  }
					],
					"background": "solid-bg-smoke",
					"activeSlide": {
					  "num": 0,
					  "components": [
						{
						  "TextBox": {},
						  "x": 341.3333333333333,
						  "y": 256,
						  "scale": {
							"x": 1,
							"y": 1
						  },
						  "type": "TextBox",
						  "text": "Die duenne  Folie<br>",
						  "size": 72,
						  "selected": false
						}
					  ],
					  "z": 0,
					  "impScale": 3,
					  "rotateX": 0,
					  "rotateY": 0,
					  "rotateZ": 0,
					  "selected": true,
					  "active": true,
					  "x": 281,
					  "y": 172
					},
					"fileName": "loaded.strut"
				  }

    					
    				model.importPresentation(pres);
    		
		}
	};

	var welcome = {
		run: function() {
			// If no previous presentation was detected, show the welcome screen.
		}
	};

	return {
		initialize: function(reg) {
			
			registry = reg;
			registry.register({
				interfaces: 'rpi.LoaderTask'
			}, editorStartup);

			registry.register({
				interfaces: 'rpi.LoaderTask'
			}, welcome);
		}
	};
});