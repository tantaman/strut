/* ============================================================
 * bootstrap-dropdown.js v2.0.3
 * http://twitter.github.com/bootstrap/javascript.html#dropdowns
 * ============================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ============================================================ */


!function ($) {

  "use strict"; // jshint ;_;


 /* DROPDOWN CLASS DEFINITION
  * ========================= */
  var hoverOpen = false;
  var toggle = '[data-toggle="dropdown"]'
    , Dropdown = function (element) {
        var self = this;
        var $el = $(element).on('click.dropdown.data-api', function(e) {
          self.clickToggle.call(self, e, this);
        })
                            .on('mouseover.dropdown.data-api', function(e) { self.hoverToggle.call(self, e, this); });
        $('html').on('click.dropdown.data-api', function () {
          $el.parent().removeClass('open');
        });
        $('html').on('click', function () {
          hoverOpen = false;
        });
      }

  Dropdown.prototype = {

    constructor: Dropdown,

   hoverToggle: function(e, elem) {
    if (hoverOpen)
      this.toggle.call(elem, e);
   },

   clickToggle: function(e, elem) {
    this.toggle.call(elem, e, true);
   },

   toggle: function (e, isClick) {
      var $this = $(this)
        , $parent
        , selector
        , isActive
      if ($this.is('.disabled, :disabled')) return

      selector = $this.attr('data-target')

      if (!selector) {
        selector = $this.attr('href')
        selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') //strip for ie7
      }

      $parent = $(selector)
      $parent.length || ($parent = $this.parent())

      isActive = $parent.hasClass('open');

      if (isClick)
        clearMenus();
      else if (!isActive)
        clearMenus();

      if (!isActive) {
        $parent.toggleClass('open');
        hoverOpen = true;
      } else if (isClick) {
        hoverOpen = false;
      }

      return false
    }

  }

  function clearMenus() {
    $(toggle).parent().removeClass('open');
    hoverOpen = false;
  }


  /* DROPDOWN PLUGIN DEFINITION
   * ========================== */

  $.fn.dropdown = function (option) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('dropdown')
      if (!data) $this.data('dropdown', (data = new Dropdown(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  $.fn.dropdown.Constructor = Dropdown


  /* APPLY TO STANDARD DROPDOWN ELEMENTS
   * =================================== */

  $(function () {
    $('html').on('click.dropdown.data-api', clearMenus)
    $('body')
      .on('click.dropdown', '.dropdown form', function (e) { e.stopPropagation() })
      .on('click.dropdown.data-api', toggle, function(e) {
        Dropdown.prototype.toggle.call(this, e, true);
      })
  })

}(window.jQuery);