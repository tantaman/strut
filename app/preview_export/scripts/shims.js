if (window.navigator.userAgent.indexOf('WebKit') >= 0) {
    // Hack to make pages generate by document.write savable in Chrome.
    // This will break firefox, however.
    var prevHash = window.location.hash;
    window.location.hash = "#/";
    window.location.hash = prevHash;
}