define(
	round: (num, dec) ->
		dec? or (dec = 0)
		factor = Math.pow(10, dec)
		Math.round(num * factor) / factor

	toDeg: (rads) ->
		rads * 180 / Math.PI

	toRads: (deg) ->
		deg * Math.PI / 180

	compare: (v1, v2, thresh) ->
		Math.abs(v1 - v2) < thresh

	transformPt: (pt, rot) ->
		if rot > 0
			newPt =
				x: pt.x * Math.cos(rot) + pt.y * Math.sin(rot)
				y: -1 * pt.x * Math.sin(rot) + pt.y * Math.cos(rot)
		else
			newPt =
				x: pt.x * Math.cos(rot) - pt.y * Math.sin(rot)
				y: pt.x * Math.sin(rot) + pt.y * Math.cos(rot)

	transformPtE: (pt, rot) ->
		if rot > 0
			newPt =
				left: pt.left * Math.cos(rot) + pt.top * Math.sin(rot)
				top: -1 * pt.left * Math.sin(rot) + pt.top * Math.cos(rot)
		else
			newPt =
				left: pt.left * Math.cos(rot) - pt.top * Math.sin(rot)
				top: pt.left * Math.sin(rot) + pt.top * Math.cos(rot)
)