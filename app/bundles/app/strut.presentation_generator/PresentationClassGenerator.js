/*
In order to get per-slide surface BGs
we need to generate a class for each slide to which we can
attach our background.

It would look a little like:

.strut-surface.slide-1 {
	background: ....
}

.strut-surface.slide-2 {
	background: ....
}


and we'll have to update our presentation backends to change the slide class
on the main presentation container on every step.

for background images:

.strut-surface.slide-n::after {
	background-image: ....
}

*/