###
@author Tantaman
###
define(["./Image",
		"./Table",
		"./TextBox"],
(Image, Table, TextBox) ->
	ComponentFactory =
		createTextBox: (configuration) ->
			new TextBox(configuration)
		createImage: (src) ->
			new Image({src: src})
)