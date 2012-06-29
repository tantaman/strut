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
)