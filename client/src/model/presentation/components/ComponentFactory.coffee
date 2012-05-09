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
		createImage: (configuration) ->
			new Image(configuration)
)