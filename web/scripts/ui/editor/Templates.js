
		define(["vendor/amd/Handlebars"], function(Handlebars) {
			return {
		
"Component": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;


  buffer += "<div class=\"content-scale\">\n<div class=\"content\"></div>\n</div>\n<span class=\"topLabel label\" data-delta=\"skewX\">Skew X</span>\n<span class=\"leftLabel label\" data-delta=\"skewY\">Skew Y</span>\n<span class=\"rightLabel label\" data-delta=\"rotate\">Rotate</span>\n<span class=\"scale label\" data-delta=\"scale\">Scale</span>\n<span class=\"close-btn-red-20 removeBtn\" title=\"Remove\"></span>\n<div class=\"positioningCtrls form-inline\">\n	<span class=\"label\">x</span>\n	<input class=\"position\" type=\"text\" data-option=\"x\" value=\"";
  foundHelper = helpers['x'];
  stack1 = foundHelper || depth0['x'];
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "x", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"/>\n	<span class=\"label\">y</span>\n	<input class=\"position\" type=\"text\" data-option=\"y\" value=\"";
  foundHelper = helpers['y'];
  stack1 = foundHelper || depth0['y'];
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "y", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"/>\n </div>";
  return buffer;}

),
"Editor": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var foundHelper, self=this;


  return "<div class=\"navbar navbar-fixed-top menuBar\">\n  <div class=\"btn-inverse temp\">\n    <div class=\"container\">\n    	<a class=\"brand\" href=\"#\">Strut 0.2</a>\n     	<ul class=\"nav\">\n     		<li class=\"dropdown active\">\n     			<a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\">\n     				File<b class=\"caret\"></b>\n     			</a>\n     			<ul class=\"dropdown-menu\">\n     		 		<li data-option=\"new\"><a href=\"#\">New</a></li>\n     				<li data-option=\"open\"><a href=\"#\">Open...</a></li>\n<!--     				<li data-option=\"openRecent\"><a href=\"#\">Open Recent...</a></li> -->\n     				<li data-option=\"save\"><a href=\"#\">Save</a></li>\n     				<li data-option=\"saveAs\"><a href=\"#\">Save As...</a></li>\n     			</ul>\n     		</li>\n            <li class=\"dropdown active\">\n                <a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\">\n                    Edit<b class=\"caret\"></b>\n                </a>\n                <ul class=\"dropdown-menu\">\n                    <li data-option=\"undo\"><a href=\"#\">Undo <span class=\"undoName label\"></span></a></li>\n                    <li data-option=\"redo\"><a href=\"#\">Redo <span class=\"redoName label\"></span></a></li>\n                    <li data-option=\"cut\"><a href=\"#\">Cut</a></li>\n                    <li data-option=\"copy\"><a href=\"#\">Copy</a></li>\n                    <li data-option=\"paste\"><a href=\"#\">Paste</a></li>\n                </ul>\n            </li>\n            <li class=\"dropdown active\">\n                <a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\">\n                    Slideshow<b class=\"caret\"></b>\n                </a>\n                <ul class=\"dropdown-menu\">\n                    <li data-option=\"exportJSON\"><a href=\"#\">Export to JSON</a></li>\n                    <li data-option=\"importJSON\"><a href=\"#\">Import from JSON</a></li>\n                    <li class=\"divider\"></li>\n                    <li data-option=\"changeBackground\"><a href=\"#\">Change Background</a></li>\n                    <li class=\"divider\"></li>\n                   <!-- <li data-option=\"exportZIP\"><a href=\"#\">Zip Presentation</a></li> -->\n                </ul>\n            </li>\n     	</ul>\n    </div>\n  </div>\n</div>\n\n<div class=\"perspectives-container\">\n</div>\n";}

),
"SlideEditor": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var foundHelper, self=this;


  return "<div class=\"navbar\">\n  <div class=\"navbar-inner buttonBar\">\n    <div class=\"container\">\n    	<ul class=\"nav\">\n            <li style=\"width: 120px\">\n            	<div class=\"btn-group iconBtns newSlide\">\n            		<a class=\"btn btn btn-small menuBarOption\" data-option=\"createSlide\" href=\"#\"><i class=\"icon-plus\"></i>Slide</a>\n            	</div>\n            </li>\n            <li class=\"divider-vertical\">\n            </li>\n            <li>\n            	<div class=\"btn-group normalBtns\">\n            		<a class=\"btn btn-inverse dropdown-toggle btn-small disabled fontButton fontFamilyBtn\" data-toggle=\"dropdown\" title=\"Choose the font family\"><span class=\"text\">Lato</span><span class=\"caret\"></span></a>\n            		<ul class=\"dropdown-menu menuBarOption\" data-option=\"fontFamily\">\n            			<li>\n                                    <a class=\"lato\" href=\"#\" data-value=\"'Lato', sans-serif\">Lato</a>\n                                    <a class=\"ubuntu\" href=\"#\" data-value=\"'Ubuntu', sans-serif\">Ubuntu</a>\n                                    <a class=\"abril\" href=\"#\" data-value=\"'Abril Fatface', cursive\">Abril</a>\n                                    <a class=\"hammersmith\" href=\"#\" data-value=\"'Hammersmith One', sans-serif\">Hammersmith One</a>\n                                    <a class=\"fredoka\" href=\"#\" data-value=\"'Fredoka One', cursive\">Fredoka One</a>\n                                    <a class=\"gorditas\" href=\"#\" data-value=\"'Gorditas', cursive\">Gorditas</a>\n                                    <a class=\"pressstart\" href=\"#\" data-value=\"'Press Start 2P', cursive\">Press Start 2P</a>\n            			</li>\n            		</ul>\n            	</div>\n            </li>\n            <li>\n            	<div class=\"btn-group normalBtns\">\n            		<a class=\"btn btn-small btn-inverse dropdown-toggle disabled fontButton fontSizeBtn\" data-toggle=\"dropdown\" title=\"Choose the font size\"><span class=\"text\">72</span>\n            			<span class=\"caret\"></span></a>\n            		<ul class=\"dropdown-menu menuBarOption\" data-option=\"fontSize\">\n            			<li>\n                                    <a href=\"#\" data-value=\"144\">144</a>\n                                    <a href=\"#\" data-value=\"96\">96</a>\n                                    <a href=\"#\" data-value=\"72\">72</a>\n            				<a href=\"#\" data-value=\"64\">64</a>\n                                    <a href=\"#\" data-value=\"48\">48</a>\n                                    <a href=\"#\" data-value=\"36\">36</a>\n                                    <a href=\"#\" data-value=\"24\">24</a>\n                                    <a href=\"#\" data-value=\"16\">16</a>\n                                    <a href=\"#\" data-value=\"12\">12</a>\n                                    <a href=\"#\" data-value=\"8\">8</a>\n            			</li>\n            		</ul>\n            	</div>\n            </li>\n            <li>\n                  <div class=\"color-chooser normalBtns\"><div></div></div>\n            </li>\n            <li class=\"divider-vertical\">\n            </li>\n            <li>\n                  <div class=\"btn-group menuBarOption normalBtns\">\n                        <a class=\"btn btn-small btn-inverse disabled fontButton\" data-option=\"fontWeight\" data-value=\"bold\"><strong>B</strong></a>\n                        <a class=\"btn btn-small btn-inverse disabled fontButton\" data-option=\"fontStyle\" data-value=\"italic\"><em>I</em></a>\n                        <a class=\"btn btn-small btn-inverse underline disabled fontButton\" data-option=\"fontDecoration\" data-value=\"underline\">U</a>\n                  </div>\n            </li>\n            <li>\n                  <div class=\"btn-group menuBarOption normalBtns\">\n                        <a class=\"btn btn-small btn-inverse disabled fontButton\" data-option=\"textAlign\" data-value=\"left\"><i class=\"icon-align-left icon-white\"></i></a>\n                        <a class=\"btn btn-small btn-inverse disabled fontButton\" data-option=\"textAlign\" data-value=\"center\"><i class=\"icon-align-center icon-white\"></i></a>\n                        <a class=\"btn btn-small btn-inverse disabled fontButton\" data-option=\"textAlign\" data-value=\"right\"><i class=\"icon-align-right icon-white\"></i></a>\n                        <a class=\"btn btn-small btn-inverse disabled fontButton\" data-option=\"textAlign\" data-value=\"justify\"><i class=\"icon-align-justify icon-white\"></i></a>\n                  </div>\n            </li>\n            <li class=\"divider-vertical\">\n            </li>\n            <li>\n                  <div class=\"btn-group iconBtns\">\n                        <a class=\"btn menuBarOption\" data-option=\"textBox\"><i class=\"icon-text-width\"></i>Text</a>\n                        <a class=\"btn btn menuBarOption\" data-option=\"picture\"><i class=\"icon-picture\"></i>Image</a>\n                        <!--<a class=\"btn btn menuBarOption\" data-option=\"iframe\"><i class=\"icon-globe\"></i>Website</a>-->\n                        <a class=\"btn btn menuBarOption\" data-option=\"video\"><i class=\"icon-facetime-video\"></i>Video</a>\n                        <!-- <a class=\"btn btn menuBarOption\" data-option=\"table\"><i class=\"icon-th\"></i>Table</a>\n                        <a class=\"btn btn menuBarOption\" data-option=\"shapes\"><i class=\"icon-star\"></i>Shapes</a> -->\n                  </div>\n            </li>\n            <li class=\"divider-vertical\">\n            </li>\n        </ul>\n        <ul class=\"nav pull-right\">\n            <li>\n                  <div class=\"btn-group iconBtns\" style=\"display: inline-block\">\n                        <a class=\"btn transitionEditorBtn\" data-option=\"transitionEditor\"><i class=\"icon-th-large\"></i><span>Transitions</span></a>\n                  </div>\n                  <div class=\"btn-group iconBtns\" style=\"display: inline-block\">\n                        <a class=\"btn btn-success transitionEditorBtn\" data-option=\"preview\"><i class=\"icon-play icon-white\"></i><span>Present</span></a>\n                  </div>\n            </li>\n        </ul>\n    </div>\n  </div>\n</div>\n\n<div class=\"mainContent\">\n</div>\n";}

),
"SlideSnapshot": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var foundHelper, self=this;


  return "<canvas></canvas>\n<span class=\"close-btn-red-20 removeBtn\" title=\"Remove\"></span>\n<span class=\"badge badge-inverse\"></span>";}

),
"TransitionEditor": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var foundHelper, self=this;


  return "<div class=\"navbar\">\n  <div class=\"navbar-inner buttonBar\">\n    <div class=\"container\">\n      <ul class=\"nav cameraSettings\">\n        <li>\n         <!-- <div class=\"btn-group cameraControls\">\n            <button class=\"btn\"><i class=\"icon-camera\"></i></button>\n            <a class=\"btn active\" data-option=\"lookDownZ\">Z</a>\n            <a class=\"btn\" data-option=\"lookDownY\">Y</a>\n            <a class=\"btn\" data-option=\"lookDownX\">X</a>\n          </div> -->\n        </li>\n        <li class=\"divider-vertical\">\n        </li>\n        <li>\n          <span class=\"label label-inverse\">Interval:</span><input type=\"text\" data-option=\"interval\" value=\"0\"></input>\n        </li>\n      </ul>\n    	<ul class=\"nav pull-right\">\n    		<li>\n    			<div class=\"btn-group iconBtns\" style=\"display: inline-block\">\n                        <a class=\"btn menuBarOption\" data-option=\"slideEditor\"><i class=\"icon-th-list\"></i><span>Slides</span></a>\n          </div>\n          <div class=\"btn-group iconBtns\" style=\"display: inline-block\">\n                        <a class=\"btn btn-success menuBarOption\" data-option=\"preview\"><i class=\"icon-play icon-white\"></i><span>Present</span></a>\n          </div>\n    		</li>\n    	</ul>\n   	</div>\n  </div>\n</div>\n<div class=\"transitionSlides\">\n</div>\n";}

),
"TransitionSlideSnapshot": Handlebars.template(function (Handlebars,depth0,helpers,partials,data) {
  helpers = helpers || Handlebars.helpers;
  var buffer = "", stack1, foundHelper, self=this, functionType="function", helperMissing=helpers.helperMissing, undef=void 0, escapeExpression=this.escapeExpression;


  buffer += "<div class=\"content\">\n<canvas></canvas>\n</div>\n<div class=\"topLabel form-inline\">\n	<span class=\"label\" data-delta=\"rotateY\">Rot. Y</span>\n	<input type=\"text\" data-option=\"rotateY\" value=\"";
  foundHelper = helpers.rotateY;
  stack1 = foundHelper || depth0.rotateY;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "rotateY", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"></input>\n</div>\n<div class=\"leftLabel form-inline\">\n	<span class=\"label\" data-delta=\"rotateX\">Rot. X</span>\n	<input type=\"text\" data-option=\"rotateX\" value=\"";
  foundHelper = helpers.rotateX;
  stack1 = foundHelper || depth0.rotateX;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "rotateX", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"></input>\n</div>\n<div class=\"rightLabel form-inline\">\n	<span class=\"label\" data-delta=\"rotateZ\">Rot. Z</span>\n	<input type=\"text\" data-option=\"rotateZ\" value=\"";
  foundHelper = helpers.rotateZ;
  stack1 = foundHelper || depth0.rotateZ;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "rotateZ", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"></input>\n</div>\n<div class=\"positioningCtrls form-inline\">\n	<span class=\"label\">z</span>\n	<input class=\"position\" type=\"text\" data-option=\"z\" value=\"";
  foundHelper = helpers['z'];
  stack1 = foundHelper || depth0['z'];
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "z", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"/>\n	<span class=\"label\">scale</span>\n	<input class=\"position\" type=\"text\" data-option=\"scale\" value=\"";
  foundHelper = helpers.impScale;
  stack1 = foundHelper || depth0.impScale;
  if(typeof stack1 === functionType) { stack1 = stack1.call(depth0, { hash: {} }); }
  else if(stack1=== undef) { stack1 = helperMissing.call(depth0, "impScale", { hash: {} }); }
  buffer += escapeExpression(stack1) + "\"/>\n</div>\n<span class=\"badge badge-inverse\"></span>";
  return buffer;}

)
}});