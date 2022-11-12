export default function init(bespoke) {
  "use strict";

  var themes, selectedThemeIndex, instructionsTimeout, deck;

  function init() {
    deck = bespoke.from("article");
    initThemeSwitching();
    scale();
    window.addEventListener("resize", scale);
  }

  init();

  function initThemeSwitching() {
    themes = ["coverflow", "classic", "cube", "carousel", "concave"];

    selectedThemeIndex = 0;

    initKeys();
    initSlideGestures();
    initThemeGestures();
  }

  function initKeys() {
    if (/Firefox/.test(navigator.userAgent)) {
      document.addEventListener("keydown", function (e) {
        if (e.which >= 37 && e.which <= 40) {
          e.preventDefault();
        }
      });
    }

    document.addEventListener("keydown", function (e) {
      var key = e.which;

      key === 37 && deck.prev();
      (key === 32 || key === 39) && deck.next();

      key === 38 && prevTheme();
      key === 40 && nextTheme();
    });
  }

  function initSlideGestures() {
    var main = document.getElementById("main"),
      startPosition,
      delta,
      singleTouch = function (fn, preventDefault) {
        return function (e) {
          if (preventDefault) {
            e.preventDefault();
          }
          e.touches.length === 1 && fn(e.touches[0].pageX);
        };
      },
      touchstart = singleTouch(function (position) {
        startPosition = position;
        delta = 0;
      }),
      touchmove = singleTouch(function (position) {
        delta = position - startPosition;
      }, true),
      touchend = function () {
        if (Math.abs(delta) < 50) {
          return;
        }

        delta > 0 ? deck.prev() : deck.next();
      };

    main.addEventListener("touchstart", touchstart);
    main.addEventListener("touchmove", touchmove);
    main.addEventListener("touchend", touchend);
  }

  function initThemeGestures() {
    var startPosition,
      delta,
      singleTouch = function (fn, preventDefault) {
        return function (e) {
          if (preventDefault) {
            e.preventDefault();
          }
          e.touches.length === 1 && fn(e.touches[0].pageY);
        };
      };

    document.addEventListener(
      "touchstart",
      singleTouch(function (position) {
        startPosition = position;
        delta = 0;
      })
    );

    document.addEventListener(
      "touchmove",
      singleTouch(function (position) {
        delta = position - startPosition;
      }, true)
    );

    document.addEventListener("touchend", function () {
      if (Math.abs(delta) < 100) {
        return;
      }

      delta > 0 ? prevTheme() : nextTheme();
    });
  }

  function selectTheme(index) {
    var theme = themes[index];
    document.body.className = theme;
    selectedThemeIndex = index;
  }

  function nextTheme() {
    offsetSelectedTheme(1);
  }

  function prevTheme() {
    offsetSelectedTheme(-1);
  }

  function offsetSelectedTheme(n) {
    selectTheme(modulo(selectedThemeIndex + n, themes.length));
  }

  function isTouch() {
    return !!("ontouchstart" in window) || navigator.msMaxTouchPoints;
  }

  function modulo(num, n) {
    return ((num % n) + n) % n;
  }

  function scale() {
    const container = document.getElementById("main");
    const scaleFactor = getFitSquareScaleFactor(
      // TODO: pass around slide w/h configuration or generate this file with proper slide widths
      // and heights
      960,
      700,
      window.innerWidth,
      window.innerHeight
    );
    if (navigator.userAgent.toLowerCase().indexOf("firefox") > -1) {
      container.style = `transform: scale(${scaleFactor})`;
    } else {
      container.style = `zoom: ${scaleFactor}`;
    }
  }

  function getFitSquareScaleFactor(desiredWidth, desiredHeight, width, height) {
    var xScale = width / desiredWidth;
    var yScale = height / desiredHeight;

    var newHeight = desiredHeight * xScale;
    if (newHeight > height) {
      var scale = yScale;
    } else {
      var scale = xScale;
    }

    return scale;
  }
}
