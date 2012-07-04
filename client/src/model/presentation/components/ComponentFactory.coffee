###
@author Tantaman
###
define(["./Image",
		"./Table",
		"./TextBox",
		"./WebFrame",
		"./Video"],
(Image, Table, TextBox, WebFrame, Video) ->
	ComponentFactory =
		createTextBox: (configuration) ->
			new TextBox(configuration)
		createImage: (configuration) ->
			new Image(configuration)
		createWebFrame: (configuration) ->
			new WebFrame(configuration)
		createVideo: (configuration) ->
			new Video(configuration)

		create: (rawComp) ->
			switch rawComp.type
				when "ImageModel"
					new Image(rawComp)
				when "TextBox"
					new TextBox(rawComp)
				when "Video"
					new Video(rawComp)
)