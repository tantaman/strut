define(['tantaman/web/widgets/PromptPopup'], function (PromptPopup) {
    function RemoteStorageProvider() {
        this.name = "Remote Storage";
        this.id = "remotestorage";
    }
    var alerted = false;

    var $modals = $("#modals");
    PromptPopup = new PromptPopup();
    this.promptPopupTemplate = JST['strut.storage/PromptPopup'];

    RemoteStorageProvider.prototype = {
        ready: function () {
            return true;
        },
        bg: function () {

        },
        ls: function (path, regex, cb, page_num) {
            // Paths are currently ignored
            //load the files already saved in the folder
            page_num = page_num || 0;
            var fnames = [];
            var perPage = 10;
            $.ajax({
                url: "https://devaccounts.icharts.net/gallery2.0/rest/v1/chartbooks",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Basic " + btoa("livedemo@icharts.net" + ":" + "livedemo10"));
                    $(".storageModal").find(".loading").removeClass("hideThis");
                },
                data: {
                    showPublic: true,
                    sortBy: "created",
                    offset: perPage * page_num,
                    perPage: perPage
                },
                success: function (resp) {
//                    console.log(resp);
                    $(".storageModal").find(".loading").addClass("hideThis");
                    var no_of_pages = Math.ceil(Number(resp.total) / perPage);
                    for (var i = 0; i < resp.results.length; i++) {
                        fnames.push(resp.results[i]);
                    }
                    cb(fnames, false, no_of_pages, $(".storageModal").find(".page-section").length);
                },
                error: function(){
                    $(".storageModal").find(".loading").addClass("hideThis");
                }
            });

            return this;
        },
        rm: function (path, cb) {
//            this.impl.removeItem(prefix + path);
//            if (cb)
//                cb(true);
//            return this;
        },
        deleteChartBook: function (id) {
            PromptPopup.render("Delete", this.deleteChartBookOk, id);
            $modals.append(PromptPopup.$el);
            PromptPopup.$el.removeClass("hide");
        },
        deleteChartBookOk: function (id, handler) {
            $.ajax({
                url: "https://devaccounts.icharts.net/gallery2.0/rest/v1/chartbooks/" + id,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Basic " + btoa("livedemo@icharts.net" + ":" + "livedemo10"));
                    $("body").css("cursor","progress");
                },
                type: "DELETE",
                success: function (resp) {
                    $(".storageModal").find('.browserContent li[data-chartbookid="'+id+'"]').remove();
                    $("body").css("cursor","default");
                    resp = JSON.parse(resp);
                    if(resp.results == 1)
                        handler("Chartbook deleted successfully");
                    else if(resp.results == 2)
                        handler("Chartbook has been already deleted. Please refresh the page.");
                    else
                        handler("Unable to process your request. Refresh the page and try again.");
                },
                error: function(err){
                    $("body").css("cursor","default");
                    handler("Unable to process your request. Refresh the page and try again.");
                }
                
            });
        },
        getContents: function (id, cb) {
            var that = this;
            $.ajax({
                url: "https://devaccounts.icharts.net/gallery2.0/rest/v1/chartbooks/" + id,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Basic " + btoa("livedemo@icharts.net" + ":" + "livedemo10"));
                     $("body").css("cursor","progress");
                },
                success: function (resp) {
                    $("body").css("cursor","default");
                    var presentation = resp.results;
                    if (presentation) {
                        cb(presentation);
                    }
                    
                    return that;
                },
                error: function(err){
                    $("body").css("cursor","default");
                }
                
            });

        },
        setContents: function (path, data, cb, model) {
            if (!(data["slides"].length == 0 || (data["slides"].length == 1 && data["slides"][0]["components"].length == 0))) {
                data.chartBookName = $(".storageModal").find(".cb-ip-field").val() || data.chartBookName;
                model._deck.set('chartBookName', data.chartBookName);
                var url, type;
                try {
                    // this.impl.setItem(prefix + path, JSON.stringify(data));
                    // api call to store chartbook  presentation.  
                    if (data.id) {
                        url = "https://devaccounts.icharts.net/gallery2.0/rest/v1/chartbooks/" + data.id;
                        type = "PUT";
                    }
                    else {
                        url = "https://devaccounts.icharts.net/gallery2.0/rest/v1/chartbooks";
                        type = "POST";
                    }
                    $.ajax({
                        url: url,
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader("Authorization", "Basic " + btoa("livedemo@icharts.net" + ":" + "livedemo10"));
                             $("body").css("cursor","progress");
                        },
                        data: JSON.stringify(data),
                        contentType: "application/json",
                        type: type,
                        success: function (resp, status, xhr) {
                            resp = JSON.parse(resp);
                            var err= false;
                            $("body").css("cursor","auto");
                            var msg = resp.results;
                            if (type == "POST") {
                                var url = xhr.getResponseHeader('Location');
                                if(url)
                                    var id = url.split("/")[url.split("/").length - 1];
                                msg = msg.replace(/IC|_/g," ");
                                data.id = id;
                                model._deck.set('id', data.id);
                                if (cb){
                                    cb({"msg": msg,"result": url || ""});
                                }
                            }
                            else {
                                if(msg == "1"){
                                    msg = "Successfully Saved";
                                }
                                else if(msg == "2"){
                                    msg = "Chartbook name already exists. Change the name and save again.";
                                    err = true;
                                }
                                else{
                                    msg = "Unable to process your request. Refresh the page and try again.";
                                    err = true;
                                }
                                if (cb)
                                    cb({"msg": msg,
                                        "result": url}, err);
                            }
                        },
                        error: function(){
                             $("body").css("cursor","auto");
                        }
                    });

                } catch (e) {
                    if (!alerted) {
                        alerted = true;
                        alert("Sorry for the inconvenience that this may cause.  We are working to resolve the issue!");
                    }
                }
            }
            else {
                if (cb)
                    cb({"msg": "Atleast add one component before you save.",
                        "result": url}, true);
            }
            return this;
        }
    };

    return RemoteStorageProvider;
});