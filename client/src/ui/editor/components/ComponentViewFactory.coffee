###
@author Tantaman
###
define(["./ImageView",
		"./TableView",
		"./TextBoxView"],
(ImageView, TableView, TextBoxView) ->
	ComponentViewFactory =
		createView: (model) ->
			type = model.get("type")
			switch type
				when "TextBox" then new TextBoxView({model: model})
				when "ImageModel" then new ImageView({model: model})
				when "Table" then new TableView({model: model})
)