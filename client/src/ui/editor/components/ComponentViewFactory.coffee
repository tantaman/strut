###
@author Tantaman
###
define(["./ImageView",
		"./TableView",
		"./TextBoxView",
		"./WebFrameView",
		"./VideoView"],
(ImageView, TableView, TextBoxView, WebFrameView, VideoView) ->
	ComponentViewFactory =
		createView: (model) ->
			type = model.get("type")
			switch type
				when "TextBox" then new TextBoxView(model: model)
				when "ImageModel" then new ImageView(model: model)
				when "Table" then new TableView(model: model)
				when "WebFrame" then new WebFrameView(model: model)
				when "Video" then new VideoView(model: model)
)