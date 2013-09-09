define(['lang', 'libs/backbone'],
function(lang, Backbone) {
    function ContextMenu() {

    }

    _.extend(ContextMenu.prototype, Backbone.Events);

    var menu = new ContextMenu();

    $.contextMenu({
        selector: '.slideContainer', 
        callback: function(key, options) {
            menu.trigger('change:' + key, menu, key, options);
        },
        items: {
            "background": {name: "Background", icon: "tint"}
        }
    }); 

    return menu;
});
