this["JST"] = this["JST"] || {};

this["JST"]["editor/Component"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"content-scale\">\n<div class=\"content\"></div>\n</div>\n<span class=\"topLabel label skewx\" data-delta=\"skewX\">↔</span>\n<span class=\"leftLabel label skewy\" data-delta=\"skewY\">↔</span>\n<span class=\"rightLabel label rotate\" data-delta=\"rotate\">↻</span>\n<span class=\"scale label\" data-delta=\"scale\">↔</span>\n<span class=\"close-btn-red-20 removeBtn\" title=\"Remove\"></span>\n<div class=\"positioningCtrls form-inline\">\n	<span class=\"label leftposition\">→</span>\n	<input class=\"position\" type=\"text\" data-option=\"x\" value=\"";
  if (stack1 = helpers['x']) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0['x']; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"/>\n	<span class=\"label bottomposition\">↑</span>\n	<input class=\"position\" type=\"text\" data-option=\"y\" value=\"";
  if (stack1 = helpers['y']) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0['y']; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"/>\n</div>\n";
  return buffer;
  };

this["JST"]["editor/Editor"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<div class=\"navbar navbar-fixed-top menuBar\">\n  <div class=\"btn-inverse temp\">\n    <div class=\"container\">\n    	<a class=\"brand\" href=\"#\"><img src=\"img/strut-logo-32-light.png\" alt=\"Strut 0.2\"/></a>\n     	<ul class=\"nav\">\n     		<li class=\"dropdown active\">\n     			<a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\">\n     				File<b class=\"caret\"></b>\n     			</a>\n     			<ul class=\"dropdown-menu\">\n     		 		<li data-option=\"new\"><a href=\"#\">New</a></li>\n     				<li data-option=\"open\"><a href=\"#\">Open...</a></li>\n<!--     				<li data-option=\"openRecent\"><a href=\"#\">Open Recent...</a></li> -->\n     				<li data-option=\"save\"><a href=\"#\">Save</a></li>\n     				<li data-option=\"saveAs\"><a href=\"#\">Save As...</a></li>\n     			</ul>\n     		</li>\n            <li class=\"dropdown active\">\n                <a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\">\n                    Edit<b class=\"caret\"></b>\n                </a>\n                <ul class=\"dropdown-menu\">\n                    <li data-option=\"undo\"><a href=\"#\">Undo <span class=\"undoName label\"></span></a></li>\n                    <li data-option=\"redo\"><a href=\"#\">Redo <span class=\"redoName label\"></span></a></li>\n                    <li data-option=\"cut\"><a href=\"#\">Cut</a></li>\n                    <li data-option=\"copy\"><a href=\"#\">Copy</a></li>\n                    <li data-option=\"paste\"><a href=\"#\">Paste</a></li>\n                </ul>\n            </li>\n            <li class=\"dropdown active\">\n                <a href=\"#\" class=\"dropdown-toggle\" data-toggle=\"dropdown\">\n                    Slideshow<b class=\"caret\"></b>\n                </a>\n                <ul class=\"dropdown-menu\">\n                    <li data-option=\"exportWebpage\"><a href=\"#\">Export as Webpage</a></li>\n                    <li data-option=\"exportZIP\"><a href=\"#\">Zip Presentation</a></li>\n                    <li class=\"divider\"></li>\n                    <li data-option=\"exportJSON\"><a href=\"#\">Export to JSON</a></li>\n                    <li data-option=\"importJSON\"><a href=\"#\">Import from JSON</a></li>\n                    <li class=\"divider\"></li>\n                    <li data-option=\"changeBackground\"><a href=\"#\">Change Background</a></li>\n                </ul>\n            </li>\n     	</ul>\n    </div>\n  </div>\n</div>\n\n<div class=\"perspectives-container\">\n</div>\n\n<div class=\"modal hide\" id=\"exportModal\">\n  <div class=\"modal-header\">\n    <button type=\"button\" class=\"close\" data-dismiss=\"modal\">×</button>\n    <h3>Export as Webpage</h3>\n  </div>\n  <div class=\"modal-body\">\n    <p>Currently the best way to export your presentation\n    as a webpage is to use your browser's built in \"save page\" feature.\n    <ol>\n        <li>Click <em>Preview</em> to view your presentation</li>\n        <li>Press <code>Ctrl+S</code> or <code>⌘+s</code></li>\n        <li>Choose <code>Webpage, Complete</code> for your save as type</li>\n        <li>Click <code>Save</code></li>\n    </ol>\n    </p>\n  </div>\n  <div class=\"modal-footer\">\n    <a href=\"#\" class=\"btn btn-inverse\" data-dismiss=\"modal\">Ok</a>\n  </div>\n</div>\n\n<div class=\"modal hide\" id=\"zipModal\">\n  <div class=\"modal-header\">\n    <button type=\"button\" class=\"close\" data-dismiss=\"modal\">×</button>\n    <h3>Export as Webpage</h3>\n  </div>\n  <div class=\"modal-body\">\n    Zip Created!\n  </div>\n  <div class=\"modal-footer\">\n    <p id=\"downloadify\">\n        You must have Flash 10 installed to download this file.\n    </p>\n  </div>\n</div>\n";
  };

this["JST"]["editor/SlideEditor"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<div class=\"navbar\">\n  <div class=\"navbar-inner buttonBar\">\n    <div class=\"container\">\n        <ul class=\"nav\">\n            <li style=\"width: 120px\">\n            	<div class=\"btn-group iconBtns newSlide\">\n            		<a class=\"btn btn btn-small menuBarOption\" data-option=\"createSlide\" href=\"#\"><i class=\"icon-plus\"></i>Slide</a>\n            	</div>\n            </li>\n            <li class=\"divider-vertical\">\n            </li>\n            <li style=\"width: 120px\"></li>\n            <li>\n                  <div class=\"btn-group iconBtns\">\n                        <a class=\"btn menuBarOption\" data-option=\"textBox\"><i class=\"icon-text-width\"></i>Text</a>\n                        <a class=\"btn menuBarOption\" data-option=\"picture\"><i class=\"icon-picture\"></i>Image</a>\n                        <a class=\"btn menuBarOption\" data-option=\"video\"><i class=\"icon-facetime-video\"></i>Video</a>\n                        <a class=\"btn menuBarOption\" data-option=\"iframe\"><i class=\"icon-globe\"></i>Website</a>\n                        <!-- <a class=\"btn btn menuBarOption\" data-option=\"table\"><i class=\"icon-th\"></i>Table</a>\n                        <a class=\"btn btn menuBarOption\" data-option=\"shapes\"><i class=\"icon-star\"></i>Shapes</a> -->\n                  </div>\n            </li>\n            <li class=\"divider-vertical\">\n            </li>\n        </ul>\n        <ul class=\"nav pull-right\">\n            <li>\n                  <div class=\"btn-group iconBtns\" style=\"display: inline-block\">\n                        <a class=\"btn transitionEditorBtn\" data-option=\"transitionEditor\"><i class=\"icon-th-large\"></i><span>Overview</span></a>\n                  </div>\n                  <div class=\"btn-group iconBtns\" style=\"display: inline-block\">\n                        <a class=\"btn btn-success transitionEditorBtn\" data-option=\"preview\"><i class=\"icon-play icon-white\"></i><span>Present</span></a>\n                  </div>\n            </li>\n        </ul>\n    </div>\n  </div>\n</div>\n\n<div class=\"mainContent\">\n</div>\n";
  };

this["JST"]["editor/SlideSnapshot"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<canvas></canvas>\n<span class=\"close-btn-red-20 removeBtn\" title=\"Remove\"></span>\n<span class=\"badge badge-inverse\"></span>";
  };

this["JST"]["editor/TransitionEditor"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<div class=\"navbar\">\n  <div class=\"navbar-inner buttonBar\">\n    <div class=\"container\">\n      <ul class=\"nav cameraSettings\">\n        <li>\n         <!-- <div class=\"btn-group cameraControls\">\n            <button class=\"btn\"><i class=\"icon-camera\"></i></button>\n            <a class=\"btn active\" data-option=\"lookDownZ\">Z</a>\n            <a class=\"btn\" data-option=\"lookDownY\">Y</a>\n            <a class=\"btn\" data-option=\"lookDownX\">X</a>\n          </div> -->\n        </li>\n        <li class=\"divider-vertical\">\n        </li>\n        <li>\n          <span class=\"label label-inverse\">Interval:</span><input type=\"text\" data-option=\"interval\" value=\"0\"></input>\n        </li>\n      </ul>\n    	<ul class=\"nav pull-right\">\n    		<li>\n    			<div class=\"btn-group iconBtns\" style=\"display: inline-block\">\n                        <a class=\"btn menuBarOption\" data-option=\"slideEditor\"><i class=\"icon-th-list\"></i><span>Slides</span></a>\n          </div>\n          <div class=\"btn-group iconBtns\" style=\"display: inline-block\">\n                        <a class=\"btn btn-success menuBarOption\" data-option=\"preview\"><i class=\"icon-play icon-white\"></i><span>Present</span></a>\n          </div>\n    		</li>\n    	</ul>\n   	</div>\n  </div>\n</div>\n<div class=\"transitionSlides\">\n</div>\n";
  };

this["JST"]["editor/TransitionSlideSnapshot"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"content\">\n<canvas></canvas>\n</div>\n<div class=\"topLabel form-inline\">\n	<span class=\"label rotates\" data-delta=\"rotateY\">↻Y</span>\n	<input type=\"text\" data-option=\"rotateY\" value=\"";
  if (stack1 = helpers.rotateY) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.rotateY; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"></input>\n</div>\n<div class=\"leftLabel form-inline\">\n	<span class=\"label rotates\" data-delta=\"rotateX\">↻X</span>\n	<input type=\"text\" data-option=\"rotateX\" value=\"";
  if (stack1 = helpers.rotateX) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.rotateX; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"></input>\n</div>\n<div class=\"rightLabel form-inline\">\n	<span class=\"label rotates\" data-delta=\"rotateZ\">↻Z</span>\n	<input type=\"text\" data-option=\"rotateZ\" value=\"";
  if (stack1 = helpers.rotateZ) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.rotateZ; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"></input>\n</div>\n<div class=\"positioningCtrls form-inline\">\n	<span class=\"label layer\">z</span>\n	<input class=\"position\" type=\"text\" data-option=\"z\" value=\"";
  if (stack1 = helpers['z']) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0['z']; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"/>\n	<span class=\"label scales\">↔</span>\n	<input class=\"position\" type=\"text\" data-option=\"scale\" value=\"";
  if (stack1 = helpers.impScale) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.impScale; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"/>\n</div>\n<span class=\"badge badge-inverse\"></span>\n";
  return buffer;
  };

this["JST"]["etch/align"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<a href=\"#\" \n	class=\"btn btn-small etch-";
  if (stack1 = helpers.button) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.button; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" title=\"";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"><i class=\"icon-align-";
  if (stack1 = helpers.icon) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.icon; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"></i></a>";
  return buffer;
  };

this["JST"]["etch/colorChooser"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<div class=\"color-chooser etch-";
  if (stack1 = helpers.button) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.button; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"><div></div></div>";
  return buffer;
  };

this["JST"]["etch/defaultButton"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression;


  buffer += "<a href=\"#\" \n	class=\"btn btn-small etch-";
  if (stack1 = helpers.button) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.button; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" title=\"";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"><span>";
  if (stack1 = helpers.display) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.display; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</span></a>";
  return buffer;
  };

this["JST"]["etch/fontFamilySelection"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<div class=\"btn-group\">\n	<button class=\"btn btn-inverse dropdown-toggle btn-small fontFamilyBtn\" data-toggle=\"dropdown\" title=\"Choose the font family\"><span class=\"text\">Lato</span><span class=\"caret\"></span></button>\n	<ul class=\"dropdown-menu menuBarOption\" data-option=\"fontFamily\">\n		<li>\n                  <a class=\"lato\" href=\"#\" data-value=\"'Lato', sans-serif\">Lato</a>\n                  <a class=\"ubuntu\" href=\"#\" data-value=\"'Ubuntu', sans-serif\">Ubuntu</a>\n                  <a class=\"abril\" href=\"#\" data-value=\"'Abril Fatface', cursive\">Abril</a>\n                  <a class=\"hammersmith\" href=\"#\" data-value=\"'Hammersmith One', sans-serif\">Hammersmith One</a>\n                  <a class=\"fredoka\" href=\"#\" data-value=\"'Fredoka One', cursive\">Fredoka One</a>\n                  <a class=\"gorditas\" href=\"#\" data-value=\"'Gorditas', cursive\">Gorditas</a>\n                  <a class=\"pressstart\" href=\"#\" data-value=\"'Press Start 2P', cursive\">Press Start 2P</a>\n		</li>\n	</ul>\n</div>";
  };

this["JST"]["etch/fontSizeSelection"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<div class=\"btn-group\">\n	<a class=\"btn btn-small btn-inverse dropdown-toggle\" data-toggle=\"dropdown\" title=\"Choose the font size\"><span class=\"text\">72</span>\n		<span class=\"caret\"></span></a>\n	<ul class=\"dropdown-menu menuBarOption\" data-option=\"fontSize\">\n		<li>\n                  <a href=\"#\" data-value=\"144\">144</a>\n                  <a href=\"#\" data-value=\"96\">96</a>\n                  <a href=\"#\" data-value=\"72\">72</a>\n			<a href=\"#\" data-value=\"64\">64</a>\n                  <a href=\"#\" data-value=\"48\">48</a>\n                  <a href=\"#\" data-value=\"36\">36</a>\n                  <a href=\"#\" data-value=\"24\">24</a>\n                  <a href=\"#\" data-value=\"16\">16</a>\n                  <a href=\"#\" data-value=\"12\">12</a>\n                  <a href=\"#\" data-value=\"8\">8</a>\n		</li>\n     	</ul>\n</div>";
  };

this["JST"]["impress_renderer/ComponentContainer"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; partials = partials || Handlebars.partials; data = data || {};
  var buffer = "", stack1, stack2, options, self=this, helperMissing=helpers.helperMissing;

function program1(depth0,data) {
  
  var buffer = "";
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "scale(";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  stack2 = ((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = depth0.scale),stack1 == null || stack1 === false ? stack1 : stack1['x']), options) : helperMissing.call(depth0, "round", ((stack1 = depth0.scale),stack1 == null || stack1 === false ? stack1 : stack1['x']), options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += ", ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  stack2 = ((stack1 = helpers.round),stack1 ? stack1.call(depth0, ((stack1 = depth0.scale),stack1 == null || stack1 === false ? stack1 : stack1['y']), options) : helperMissing.call(depth0, "round", ((stack1 = depth0.scale),stack1 == null || stack1 === false ? stack1 : stack1['y']), options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += ")";
  return buffer;
  }

  buffer += "<div class=\"componentContainer\" style=\"top: ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  stack2 = ((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0['y'], options) : helperMissing.call(depth0, "round", depth0['y'], options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "px; left: ";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  stack2 = ((stack1 = helpers.round),stack1 ? stack1.call(depth0, depth0['x'], options) : helperMissing.call(depth0, "round", depth0['x'], options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "px;\n-webkit-transform: ";
  stack2 = helpers['if'].call(depth0, depth0.scale, {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += ";\n-moz-transform: ";
  stack2 = helpers['if'].call(depth0, depth0.scale, {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += ";\ntransform: ";
  stack2 = helpers['if'].call(depth0, depth0.scale, {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\">\n";
  stack2 = self.invokePartial(partials.TransformContainer, 'TransformContainer', depth0, helpers, partials, data);
  if(stack2 || stack2 === 0) { buffer += stack2; }
  return buffer;
  };

this["JST"]["impress_renderer/Image"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; partials = partials || Handlebars.partials; data = data || {};
  var buffer = "", stack1, self=this, functionType="function", escapeExpression=this.escapeExpression;


  stack1 = self.invokePartial(partials.ComponentContainer, 'ComponentContainer', depth0, helpers, partials, data);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n<img src=\"";
  if (stack1 = helpers.src) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.src; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"></img>\n</div>\n</div>";
  return buffer;
  };

this["JST"]["impress_renderer/ImpressTemplate"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, stack2, options, self=this, helperMissing=helpers.helperMissing, functionType="function", escapeExpression=this.escapeExpression, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  var buffer = "";
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = "", stack1, options;
  buffer += "\n";
  options = {hash:{},inverse:self.noop,fn:self.program(4, program4, data),data:data};
  if (stack1 = helpers.attributes) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.attributes; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.attributes) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n</div>\n";
  return buffer;
  }
function program4(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n<div class=\"step\" data-x=\"";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  stack2 = ((stack1 = helpers.scaleX),stack1 ? stack1.call(depth0, depth0['x'], options) : helperMissing.call(depth0, "scaleX", depth0['x'], options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\" data-y=\"";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  stack2 = ((stack1 = helpers.scaleY),stack1 ? stack1.call(depth0, depth0['y'], options) : helperMissing.call(depth0, "scaleY", depth0['y'], options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\" ";
  stack2 = helpers['if'].call(depth0, depth0.rotateX, {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "  ";
  stack2 = helpers['if'].call(depth0, depth0.rotateY, {hash:{},inverse:self.noop,fn:self.program(7, program7, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += " ";
  stack2 = helpers['if'].call(depth0, depth0.rotateZ, {hash:{},inverse:self.noop,fn:self.program(9, program9, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += " ";
  stack2 = helpers['if'].call(depth0, depth0['z'], {hash:{},inverse:self.noop,fn:self.program(11, program11, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += " ";
  stack2 = helpers['if'].call(depth0, depth0.impScale, {hash:{},inverse:self.noop,fn:self.program(13, program13, data),data:data});
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += ">\n<div style=\"width: 1024px; height: 768px\">\n";
  options = {hash:{},inverse:self.noop,fn:self.program(15, program15, data),data:data};
  if (stack2 = helpers.components) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.components; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.components) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n</div>\n";
  return buffer;
  }
function program5(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "data-rotate-x=\"";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  stack2 = ((stack1 = helpers.toDeg),stack1 ? stack1.call(depth0, depth0.rotateX, options) : helperMissing.call(depth0, "toDeg", depth0.rotateX, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\"";
  return buffer;
  }

function program7(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "data-rotate-y=\"";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  stack2 = ((stack1 = helpers.toDeg),stack1 ? stack1.call(depth0, depth0.rotateY, options) : helperMissing.call(depth0, "toDeg", depth0.rotateY, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\"";
  return buffer;
  }

function program9(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "data-rotate-z=\"";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  stack2 = ((stack1 = helpers.toDeg),stack1 ? stack1.call(depth0, depth0.rotateZ, options) : helperMissing.call(depth0, "toDeg", depth0.rotateZ, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\"";
  return buffer;
  }

function program11(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "data-z=\"";
  if (stack1 = helpers['z']) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0['z']; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  return buffer;
  }

function program13(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "data-scale=\"";
  if (stack1 = helpers.impScale) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.impScale; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"";
  return buffer;
  }

function program15(depth0,data) {
  
  var buffer = "", stack1, stack2, options;
  buffer += "\n";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  stack2 = ((stack1 = helpers.renderComponent),stack1 ? stack1.call(depth0, depth0, options) : helperMissing.call(depth0, "renderComponent", depth0, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n";
  return buffer;
  }

function program17(depth0,data) {
  
  var buffer = "";
  buffer += "\n<script>\nvar interval = "
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + ";\nif (interval >= 1000) {\n    setInterval(function() {\n        impress().next();\n    }, interval);\n}\n</script>\n";
  return buffer;
  }

  buffer += "<head>\n<meta charset=\"utf-8\" />\n<meta name=\"viewport\" content=\"width=1024\" />\n<meta name=\"apple-mobile-web-app-capable\" content=\"yes\" />\n<title>Deck Title</title>\n\n<meta name=\"description\" content=\"TODO\" />\n<meta name=\"author\" content=\"TODO\" />\n\n<style>\n.componentContainer {\n    position: absolute;\n    -webkit-transform-origin: 0 0;\n    -moz-transform-origin: 0 0;\n    transform-origin: 0 0;\n}\n\n.bg {\n    width: 100%;\n    height: 100%;\n}\n</style>\n<link href=\"preview_export/css/main.css\" rel=\"stylesheet\" />\n<link href='preview_export/css/web-fonts.css' rel='stylesheet' type='text/css'>\n<script type=\"text/javascript\" src=\"preview_export/scripts/impress.js\"></script>\n\n<link rel=\"shortcut icon\" href=\"favicon.png\" />\n<link rel=\"apple-touch-icon\" href=\"apple-touch-icon.png\" />\n</head>\n<body class=\"impress-not-supported\">\n\n<!-- This is a work around / hack to get the user's browser to download the fonts \n if they decide to save the presentation. -->\n<div style=\"visibility: hidden; width: 0px; height: 0px\">\n<img src=\"preview_export/css/Lato-Bold.woff\" />\n<img src=\"preview_export/css/HammersmithOne.woff\" />\n<img src=\"preview_export/css/Gorditas-Regular.woff\" />\n<img src=\"preview_export/css/FredokaOne-Regular.woff\" />\n<img src=\"preview_export/css/Ubuntu.woff\" />\n<img src=\"preview_export/css/Ubuntu-Bold.woff\" />\n<img src=\"preview_export/css/PressStart2P-Regular.woff\" />\n<img src=\"preview_export/css/Lato-BoldItalic.woff\" />\n<img src=\"preview_export/css/AbrilFatface-Regular.woff\" />\n<img src=\"preview_export/css/Lato-Regular.woff\" />\n</div>\n\n<div class=\"fallback-message\">\n    <p>Your browser <b>doesn't support the features required</b> by impress.js, so you are presented with a simplified version of this presentation.</p>\n    <p>For the best experience please use the latest <b>Chrome</b>, <b>Safari</b> or <b>Firefox</b> browser.</p>\n</div>\n<div class=\"bg\" style=\"";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  stack2 = ((stack1 = helpers.extractBG),stack1 ? stack1.call(depth0, ((stack1 = depth0.background),stack1 == null || stack1 === false ? stack1 : stack1.styles), options) : helperMissing.call(depth0, "extractBG", ((stack1 = depth0.background),stack1 == null || stack1 === false ? stack1 : stack1.styles), options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\">\n<div id=\"impress\">\n\n";
  stack2 = ((stack1 = ((stack1 = ((stack1 = depth0.slides),stack1 == null || stack1 === false ? stack1 : stack1.models)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1)),blockHelperMissing.call(depth0, stack1, {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data}));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n\n<div id=\"overview\" class=\"step active\" data-x=\"";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  stack2 = ((stack1 = helpers.scaleX),stack1 ? stack1.call(depth0, depth0.overviewX, options) : helperMissing.call(depth0, "scaleX", depth0.overviewX, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\" data-y=\"";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  stack2 = ((stack1 = helpers.scaleY),stack1 ? stack1.call(depth0, depth0.overviewY, options) : helperMissing.call(depth0, "scaleY", depth0.overviewY, options));
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\" data-scale=\"9\"></div>\n</div>\n<div class=\"hint\">\n    <p>Use a spacebar or arrow keys to navigate</p>\n</div>\n<script>\nif (\"ontouchstart\" in document.documentElement) { \n    document.querySelector(\".hint\").innerHTML = \"<p>Tap on the left or right to navigate</p>\";\n}\n</script>\n\n";
  options = {hash:{},inverse:self.noop,fn:self.program(17, program17, data),data:data};
  if (stack2 = helpers.interval) { stack2 = stack2.call(depth0, options); }
  else { stack2 = depth0.interval; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  if (!helpers.interval) { stack2 = blockHelperMissing.call(depth0, stack2, options); }
  if(stack2 || stack2 === 0) { buffer += stack2; }
  buffer += "\n</div>\n<script>\nif (!window.impressStarted) {\n    startImpress(document, window);\n    impress().init();   \n}\n</script>\n</body>";
  return buffer;
  };

this["JST"]["impress_renderer/SVGContainer"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; partials = partials || Handlebars.partials; data = data || {};
  var buffer = "", stack1, stack2, functionType="function", escapeExpression=this.escapeExpression, self=this;


  buffer += "<div class=\"componentContainer\" style=\"top: ";
  if (stack1 = helpers['y']) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0['y']; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "px; left: ";
  if (stack1 = helpers['x']) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0['x']; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "px; width: "
    + escapeExpression(((stack1 = ((stack1 = depth0.scale),stack1 == null || stack1 === false ? stack1 : stack1.width)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "px; height: "
    + escapeExpression(((stack1 = ((stack1 = depth0.scale),stack1 == null || stack1 === false ? stack1 : stack1.height)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "px;\">\n";
  stack2 = self.invokePartial(partials.TransformContainer, 'TransformContainer', depth0, helpers, partials, data);
  if(stack2 || stack2 === 0) { buffer += stack2; }
  return buffer;
  };

this["JST"]["impress_renderer/SVGImage"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; partials = partials || Handlebars.partials; data = data || {};
  var buffer = "", stack1, self=this, functionType="function", escapeExpression=this.escapeExpression;


  stack1 = self.invokePartial(partials.SVGContainer, 'SVGContainer', depth0, helpers, partials, data);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n<img src=\"";
  if (stack1 = helpers.src) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.src; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" style=\"width: 100%; height: 100%\"></img>\n</div>\n</div>";
  return buffer;
  };

this["JST"]["impress_renderer/TextBox"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; partials = partials || Handlebars.partials; data = data || {};
  var buffer = "", stack1, self=this, functionType="function", escapeExpression=this.escapeExpression;


  stack1 = self.invokePartial(partials.ComponentContainer, 'ComponentContainer', depth0, helpers, partials, data);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n<div style=\"font-family: ";
  if (stack1 = helpers.family) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.family; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "; font-size: ";
  if (stack1 = helpers.size) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.size; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "px;\n			font-weight: ";
  if (stack1 = helpers.weight) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.weight; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "; font-style: ";
  if (stack1 = helpers.style) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.style; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "; color: #";
  if (stack1 = helpers.color) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.color; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "; text-align: ";
  if (stack1 = helpers.align) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.align; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\">\n";
  if (stack1 = helpers.text) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.text; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\n</div>\n</div>\n</div>";
  return buffer;
  };

this["JST"]["impress_renderer/TransformContainer"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "rotate(";
  if (stack1 = helpers.rotate) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.rotate; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "rad)";
  return buffer;
  }

function program3(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "skewX(";
  if (stack1 = helpers.skewX) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.skewX; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "rad)";
  return buffer;
  }

function program5(depth0,data) {
  
  var buffer = "", stack1;
  buffer += "skewY(";
  if (stack1 = helpers.skewY) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.skewY; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "rad)";
  return buffer;
  }

  buffer += "<div class=\"transformContainer\" style=\"-webkit-transform: ";
  stack1 = helpers['if'].call(depth0, depth0.rotate, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " ";
  stack1 = helpers['if'].call(depth0, depth0.skewX, {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " ";
  stack1 = helpers['if'].call(depth0, depth0.skewY, {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "; -moz-transform: ";
  stack1 = helpers['if'].call(depth0, depth0.rotate, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " ";
  stack1 = helpers['if'].call(depth0, depth0.skewX, {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " ";
  stack1 = helpers['if'].call(depth0, depth0.skewY, {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "; transform: ";
  stack1 = helpers['if'].call(depth0, depth0.rotate, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " ";
  stack1 = helpers['if'].call(depth0, depth0.skewX, {hash:{},inverse:self.noop,fn:self.program(3, program3, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += " ";
  stack1 = helpers['if'].call(depth0, depth0.skewY, {hash:{},inverse:self.noop,fn:self.program(5, program5, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\">";
  return buffer;
  };

this["JST"]["impress_renderer/Video"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; partials = partials || Handlebars.partials; data = data || {};
  var buffer = "", stack1, self=this, functionType="function", escapeExpression=this.escapeExpression;


  stack1 = self.invokePartial(partials.ComponentContainer, 'ComponentContainer', depth0, helpers, partials, data);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n<video controls>\n	<source src=\"";
  if (stack1 = helpers.src) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.src; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\" type=\"";
  if (stack1 = helpers.videoType) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.videoType; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"></source>\n</video>\n</div>\n</div>";
  return buffer;
  };

this["JST"]["impress_renderer/WebFrame"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; partials = partials || Handlebars.partials; data = data || {};
  var buffer = "", stack1, self=this, functionType="function", escapeExpression=this.escapeExpression;


  stack1 = self.invokePartial(partials.ComponentContainer, 'ComponentContainer', depth0, helpers, partials, data);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n<iframe width=\"960\" height=\"768\" src=\"";
  if (stack1 = helpers.src) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.src; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "\"></iframe>\n</div>\n</div>";
  return buffer;
  };

this["JST"]["impress_renderer/Youtube"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; partials = partials || Handlebars.partials; data = data || {};
  var buffer = "", stack1, stack2, self=this, functionType="function", escapeExpression=this.escapeExpression;


  stack1 = self.invokePartial(partials.SVGContainer, 'SVGContainer', depth0, helpers, partials, data);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n<object width=\""
    + escapeExpression(((stack1 = ((stack1 = depth0.scale),stack1 == null || stack1 === false ? stack1 : stack1.width)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" height=\""
    + escapeExpression(((stack1 = ((stack1 = depth0.scale),stack1 == null || stack1 === false ? stack1 : stack1.height)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"><param name=\"movie\" value=\"http://www.youtube.com/v/";
  if (stack2 = helpers.shortSrc) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.shortSrc; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "&hl=en&fs=1\"><param name=\"allowFullScreen\" value=\"true\"><embed src=\"http://www.youtube.com/v/";
  if (stack2 = helpers.shortSrc) { stack2 = stack2.call(depth0, {hash:{},data:data}); }
  else { stack2 = depth0.shortSrc; stack2 = typeof stack2 === functionType ? stack2.apply(depth0) : stack2; }
  buffer += escapeExpression(stack2)
    + "&hl=en&fs=1\" type=\"application/x-shockwave-flash\" allowfullscreen=\"true\" width=\""
    + escapeExpression(((stack1 = ((stack1 = depth0.scale),stack1 == null || stack1 === false ? stack1 : stack1.width)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\" height=\""
    + escapeExpression(((stack1 = ((stack1 = depth0.scale),stack1 == null || stack1 === false ? stack1 : stack1.height)),typeof stack1 === functionType ? stack1.apply(depth0) : stack1))
    + "\"></object>\n</div>\n</div>";
  return buffer;
  };

this["JST"]["impress_renderer/YoutubeContainer"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; partials = partials || Handlebars.partials; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;


  buffer += "<div class=\"componentContainer\" style=\"top: ";
  if (stack1 = helpers['y']) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0['y']; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "px; left: ";
  if (stack1 = helpers['x']) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0['x']; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "px;\">\n";
  stack1 = self.invokePartial(partials.TransformContainer, 'TransformContainer', depth0, helpers, partials, data);
  if(stack1 || stack1 === 0) { buffer += stack1; }
  return buffer;
  };

this["JST"]["widgets/BackgroundPicker"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<div class=\"modal-header\">\n	<button class=\"close\" data-dismiss=\"modal\">×</button>\n	<h3>Change Background</h3>\n</div>\n<div class=\"modal-body\">\n	<div class=\"pull-left\">\n		<div><h4>Gradient</h4></div>\n		<div class=\"gradientPicker\">\n		</div>\n		<div class=\"gradientOptions\">\n			<div class=\"btn-group\">\n	  			<button class=\"btn\">Type</button>\n	  			<button class=\"btn dropdown-toggle\" data-toggle=\"dropdown\">\n	    			<span class=\"caret\"></span>\n	  			</button>\n	  			<ul class=\"dropdown-menu\" data-option=\"type\">\n	    			<li><a href=\"#\" data-value=\"linear\">Linear</a></li>\n	    			<li><a href=\"#\" data-value=\"radial\">Radial</a></li>\n	  			</ul>\n			</div>\n			<div class=\"btn-group\">\n	  			<button class=\"btn\">Direction</button>\n	  			<button class=\"btn dropdown-toggle\" data-toggle=\"dropdown\">\n	    			<span class=\"caret\"></span>\n	  			</button>\n	  			<ul class=\"dropdown-menu\" data-option=\"direction\">\n	    			<li><a href=\"#\" data-value=\"top\">Top</a></li>\n	    			<li><a href=\"#\" data-value=\"left\">Left</a></li>\n	    			<li><a href=\"#\" data-value=\"15deg\">15&deg;</a></li>\n	    			<li><a href=\"#\" data-value=\"30deg\">30&deg;</a></li>\n	    			<li><a href=\"#\" data-value=\"45deg\">45&deg;</a></li>\n	    			<li><a href=\"#\" data-value=\"105deg\">105&deg;</a></li>\n	    			<li><a href=\"#\" data-value=\"120deg\">120&deg;</a></li>\n	    			<li><a href=\"#\" data-value=\"135deg\">135&deg;</a></li>\n	  			</ul>\n			</div>\n		</div>\n	</div>\n	<div class=\"pull-left bgPreview\">\n		<div><h4>Background Preview</h4></div>\n		<div class=\"gradientPreview\">\n		</div>\n	</div>\n	<div style=\"clear: both\"></div>\n</div>\n<div class=\"modal-footer\">\n	<a href=\"#\" class=\"btn btn-inverse ok\">OK</a>\n	<a href=\"#\" class=\"btn\" data-dismiss=\"modal\">Cancel</a>\n</div>";
  };

this["JST"]["widgets/DownloadDialog"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<div class=\"modal-header\">\n	<button class=\"close\" data-dismiss=\"modal\">×</button>\n	<h3>Download Ready</h3>\n</div>\n<div class=\"modal-body\">\n	<h4>Click below to download</h4>\n</div>\n<div class=\"modal-footer\">\n	<a class=\"downloadLink btn btn-inverse\" target=\"_blank\" title=\"Download\"><i class=\"icon-download-alt icon-white\"></i></a>\n</div>";
  };

this["JST"]["widgets/ItemGrabber"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, options, functionType="function", escapeExpression=this.escapeExpression, self=this, blockHelperMissing=helpers.blockHelperMissing;

function program1(depth0,data) {
  
  
  return "<div data-option=\"browse\" class=\"btn\">Browse</div>";
  }

  buffer += "<div class=\"modal-header\">\n	<button class=\"close\" data-dismiss=\"modal\">×</button>\n	<h3>";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</h3>\n</div>\n<div class=\"modal-body\">\n	<div class=\"alert alert-error disp-none\">\n  		<button class=\"close\" data-dismiss=\"alert\">×</button>\n  		The image URL you entered appears to be incorrect\n	</div>\n	<h4>URL:</h4><div class=\"form-inline\"><input type=\"text\" name=\"itemUrl\"></input>&nbsp;";
  options = {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data};
  if (stack1 = helpers.browsable) { stack1 = stack1.call(depth0, options); }
  else { stack1 = depth0.browsable; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  if (!helpers.browsable) { stack1 = blockHelperMissing.call(depth0, stack1, options); }
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "</div>\n	<input type=\"file\" style=\"display:none\"></input>\n	<h4>Preview:</h4>\n	<ul class=\"thumbnails\">\n		<li class=\"span4\">\n			<div class=\"thumbnail\">\n				<";
  if (stack1 = helpers.tag) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.tag; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + " class=\"preview\" width=\"360\" height\"268\"></";
  if (stack1 = helpers.tag) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.tag; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + ">\n			</div>\n		</li>\n	</ul>\n</div>\n<div class=\"modal-footer\">\n	<a href=\"#\" class=\"btn btn-primary ok btn-inverse\">";
  if (stack1 = helpers.title) { stack1 = stack1.call(depth0, {hash:{},data:data}); }
  else { stack1 = depth0.title; stack1 = typeof stack1 === functionType ? stack1.apply(depth0) : stack1; }
  buffer += escapeExpression(stack1)
    + "</a>\n</div>";
  return buffer;
  };

this["JST"]["widgets/NoDownloadDialog"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<div class=\"modal-header\">\n	<button class=\"close\" data-dismiss=\"modal\">×</button>\n	<h3>Download Ready</h3>\n</div>\n<div class=\"modal-body\">\n	<textarea class=\"download-txt\" style=\"width: 500px; height: 200px\"></textarea>\n</div>\n<div class=\"modal-footer\">\n	<a class=\"btn btn-plast\" data-dismiss=\"modal\">Close</a>\n</div>";
  };

this["JST"]["widgets/OpenDialog"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "";
  buffer += "\n			<li><a href=\"#\"><span>"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</span><button class=\"close\">x</button></a></li>\n		";
  return buffer;
  }

  buffer += "<div class=\"modal-header\">\n	<button class=\"close\" data-dismiss=\"modal\">×</button>\n	<h3>Open</h3>\n</div>\n<div class=\"modal-body\">\n	<ul class=\"nav nav-list\">\n		";
  stack1 = helpers.each.call(depth0, depth0.fileNames, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n	</ul>\n</div>\n<div class=\"modal-footer\">\n	<a href=\"#\" class=\"btn btn-inverse ok\">OK</a>\n	<a href=\"#\" class=\"btn\" data-dismiss=\"modal\">Cancel</a>\n</div>";
  return buffer;
  };

this["JST"]["widgets/RawTextImporter"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  


  return "<div class=\"modal-header\">\n	<button class=\"close\" data-dismiss=\"modal\">×</button>\n	<h3>Import/Export Show (from/to JSON)</h3>\n</div>\n<div class=\"modal-body\">\n	<h4>JSON string</h4>\n	<textarea style=\"width: 100%; height: 100%\" rows=\"10\"></textarea>\n</div>\n<div class=\"modal-footer\">\n	<a href=\"#\" class=\"btn btn-inverse ok\">OK</a>\n</div>";
  };

this["JST"]["widgets/SaveAsDialog"] = function (Handlebars,depth0,helpers,partials,data) {
  this.compilerInfo = [2,'>= 1.0.0-rc.3'];
helpers = helpers || Handlebars.helpers; data = data || {};
  var buffer = "", stack1, functionType="function", escapeExpression=this.escapeExpression, self=this;

function program1(depth0,data) {
  
  var buffer = "";
  buffer += "\n					<li><a href=\"#\"><span>"
    + escapeExpression((typeof depth0 === functionType ? depth0.apply(depth0) : depth0))
    + "</span><button class=\"close\">x</button></a></li>\n				";
  return buffer;
  }

  buffer += "<div class=\"modal-header\">\n	<button class=\"close\" data-dismiss=\"modal\">×</button>\n	<h3>Save as...</h3>\n</div>\n<div class=\"modal-body\">\n	<!-- <ul class=\"nav nav-tabs\">\n  		<li class=\"active\"><a href=\"#saveLocalTab\">Local</a></li>\n  		<li><a href=\"#saveRemoteTab\">Remote</a></li>\n	</ul> -->\n\n	<!-- <div class=\"tab-content\">\n  		<div class=\"tab-pane active\" id=\"saveLocalTab\"> -->\n		  	<h4>Name</h4>\n			<input type=\"text\"></input>\n			<ul class=\"nav nav-list\">\n				";
  stack1 = helpers.each.call(depth0, depth0.fileNames, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n			</ul>\n  		<!-- </div>\n  		<div class=\"tab-pane\" id=\"saveRemoteTab\">\n  			<h4>Name</h4>\n			<input type=\"text\"></input>\n			<ul class=\"nav nav-list\">\n				";
  stack1 = helpers.each.call(depth0, depth0.fileNames, {hash:{},inverse:self.noop,fn:self.program(1, program1, data),data:data});
  if(stack1 || stack1 === 0) { buffer += stack1; }
  buffer += "\n			</ul>\n  		</div>\n	</div> -->\n</div>\n<div class=\"modal-footer\">\n	<a href=\"#\" class=\"btn btn-inverse ok\">OK</a>\n	<a href=\"#\" class=\"btn\" data-dismiss=\"modal\">Cancel</a>\n</div>";
  return buffer;
  };