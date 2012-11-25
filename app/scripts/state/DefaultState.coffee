###
@author Matt Crinklaw-Vogt
###
define(["common/MapResolver"],
(MapResolver) ->
	stateMap =
		editor:
			slideEditor:
				buttonBar:
					fontSize: 72
					fontFamily: "'Lato', sans-serif"
					fontColor: "grey"
					fontStyle: ""
					fontWeight: ""

	iface = 
		get: (key) ->
			MapResolver.resolveItem(stateMap, key)
)