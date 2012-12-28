Strut
=======

**Note:** `Strut` is being largely re-written to support 3rd party extensions and mobile devices.  You can check 
on the progress of the re-write on the rewrite branch.

`Strut` is getting a facelift too:
![Facelift](https://f.cloud.github.com/assets/1009003/26512/13d10f44-4b39-11e2-80e4-578cc6acd3b3.png)

#### GUI / Authoring Tool for ImpressJS ####

This project intends to create an extensible, maintainable, and clean editor for authoring ImpressJS presentations.
I hope this project can also serve as an example of a browser based rich client as the project matures.

Don't know what ImpressJS is?  Check out the ImpressJS demo presentation: http://bartaz.github.com/impress.js/#/bored
And here is a video of the very first version of Strut: http://www.youtube.com/watch?v=zA5s8wwme44

Strut live preview (Firefox, Chrome and Safari only): http://tantaman.github.com/Strut/dist/index.html

### Preview ###

A github hosted preview is available at: http://tantaman.github.com/Strut/dist/index.html (Firefox, Chrome and Safari only)

The preview currently points to the development version of Strut.

### Mailing List ###
strut-presentation-editor@googlegroups.com

### Pre-Built versions of Strut ###

You can get pre-built versions of strut here: https://github.com/tantaman/Strut/downloads


### Running ###

The pre-built versions of Strut can be run entirely from your local filesystem.  
Just point your browser to `file:///path/to/Strut/web/index.html` to view Strut.

To run a non pre-built version, or a zip of Master, run `yeoman server` in the root Strut directory.

Alternatively you can run `yeoman dist` in the root Strut directory and navigate to `file:///path/to/Strut/dist/index.html`

### Development/Building ###
To build your own version of Strut you'll need Yeoman v0.9.6 or later.  If Yeoman 0.9.6 has not yet been released then you can find instructions for installing the very latest version of Yeoman here: https://github.com/yeoman/yeoman/wiki/Additional-FAQ

**Note:** Yeoman from master is currently broken and Yeoman v0.9.6 was delivered with some missing features.  To install a version of Yeoman that works, follow these steps:

1. `git clone git://github.com/yeoman/yeoman.git`
2. `cd yeoman`
3. `git checkout 79e74f161559d4c4bbac2136d2b1b84961614af`
4. `cd cli`
5. `npm install -g`
6. `npm link  --skip-updater`


Building Strut

* Clone `Strut`
* cd to the root `Strut` directory
* run `npm install` to get the required node modules
* run `yeoman server` to build and start watching for updates
* If your browser didn't open Strut automatically then go to http://localhost:3501/ in a browser

Yeoman will automatically compile your coffeescript and templates and reload your browser whenever there is a code change.

To make a production build of Strut run `yeoman build`.
The resulting build will be location in `Strut/dist`.  

### Contributing ###

Strut uses a Maven directory layout so code and resource will be found in `src/main`

In ```Strut``` there is an object for each major component.  The 
[Slides](https://github.com/tantaman/Strut/blob/master/src/main/coffee/model/presentation/Slide.coffee), 
[SlidePreviews](https://github.com/tantaman/Strut/blob/master/src/main/coffee/ui/editor/transition_editor/TransitionSlideSnapshot.coffee), 
[TransitionEditor](https://github.com/tantaman/Strut/blob/master/src/main/coffee/ui/editor/transition_editor/TransitionEditor.coffee), 
[SlideEditor](https://github.com/tantaman/Strut/blob/master/src/main/coffee/ui/editor/SlideEditor.coffee),
etc. all have their own objects so it's easy to
track down and make changes to a component.  ```Strut``` uses [RequireJS](http://requirejs.org/) to keep source files small and
focused.  [BackboneJS](http://documentcloud.github.com/backbone/) is used for ```Strut's``` data model and serialization as well as for binding events in the 
view layers.  

In addition to having organized code, the [markup for Strut](https://github.com/tantaman/Strut/tree/master/src/main/resources/ui/editor/templates) is also 
split up by component and placed in [HandlebarsJS](http://handlebarsjs.com/) template files. 

Here is the basic layout of the source:

* Presentation Model: src/model/presentation
* Editor UI Layer: src/ui/editor
* Model -> ImpressJS Rendering: src/ui/impress_renderer

templates for UI components are contained in src/ui/COMPONENT_NAME/res/templates
in order to package related markup and backing UI (not model) code into modules.

### Acknowledgements ###

* ImpressJS (of course) https://github.com/bartaz/impress.js/
* BackboneJS http://documentcloud.github.com/backbone/
* CoffeeScript http://coffeescript.org/
* RequireJS http://requirejs.org/
* JQuery http://jquery.com/
* Rake http://rubyforge.org/projects/rake/
* HandlebarsJS http://handlebarsjs.com/
* DustJS http://akdubya.github.com/dustjs/
* Class class http://ejohn.org/blog/simple-javascript-inheritance/
* Impressionist https://github.com/hsivaramx/Impressionist
