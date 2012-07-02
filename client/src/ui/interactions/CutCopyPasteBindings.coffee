define(["vendor/amd/keymaster"],
(Keymaster) ->
	funcs = ["cut", "copy", "paste"]

	result =
		applyTo: (obj, scope) ->
			_.bindAll(obj, funcs)

			Keymaster("ctrl+x, ⌘+x", scope, obj.cut)
			Keymaster("ctrl+c, ⌘+c", scope, obj.copy)
			Keymaster("ctrl+v, ⌘+v", scope, obj.paste)
)