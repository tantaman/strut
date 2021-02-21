![screen shot 2014-10-21 at 9 40 50 pm](https://cloud.githubusercontent.com/assets/1009003/4729733/b4ce3422-598c-11e4-8b24-c1fb9746eb7f.png)

# Status

**Strut2 is currently in development and not yet able to author a complete presentation.**

# Vision

## Rapid Authoring
Strut2 will retain the transition editor from the original, but the slide editor will be "markdown & LaTeX first." The idea is to enable rapid authoring of presentations as no system exists today to quickly create a slide deck. Keynote, Powerpoint, GoogleSlides are all cumbersome in that they force you to engage with (click into and out of) textboxes.

Authoring a slide should be as easy as writing into a notepad.

## Nonlinear Presentations
Strut2 will build on Strut classic's transition editor by allowing you do either progress linearly through a presentation or take a detour to provide more detail on a topic.

## More than Presentations
Presenting your markdown notes will really be a feature of Strut2 rather than its sole focus. Strut2 aims to be a note taking system that lets you link and organize your thoughts. If you'd like to present those thoughts, key ideas can be lifted out from your overall notes and crafter into a presentation.

Think something like Strut meets zettelkasten & [obsidian.md](obsidian.md) & remarkable.

## Local and Cloud Storage
Strut classic ran entirely via the browser's LocalStorage. Strut2 will have full support for saving presentations online.

# Roadmap

## [v0.1](https://github.com/tantaman/strut2/milestone/1) 3/21
1. Get everything building again
2. Be able to load and use existing features with latest dependency versions
3. Add typescript annotations

## [v0.2](https://github.com/tantaman/strut2/milestone/2) 4/21
1. Enable authoring of slides via Markdown
2. Enable stock transitions via Bespoke.js
3. Support drag & drop of images

## [v0.3](https://github.com/tantaman/strut2/milestone/3) 5/21
1. Re-enable the Impress.js transition editor
2. Re-add undo/redo support

## [v0.4](https://github.com/tantaman/strut2/milestone/4) 6/21
1. Add support for "sub-slides"
2. Add edges to transition editor
3. Add support for embeds (e.g., youtube, iframes, video tag)

## [v0.5](https://github.com/tantaman/strut2/milestone/5) 7/21
1. Support internal linking
2. Support text search within a presentation
3. Enable linking to other presentations from current presentation

## [v0.6](https://github.com/tantaman/strut2/milestone/5) 8/21
1. Zettlekastin transition planning

# Building & Running

1. Clone: `git@github.com:tantaman/strut2.git`
2. `yarn install`
3. Pick one of: `yarn run watch` (development) / `yarn run build-prod` (release)
4. Go to `file:///path/to/strut2/dist/index.html
