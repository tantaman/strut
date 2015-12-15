define(function () {
    function RemoteStorageProvider() {
        this.name = "Remote Storage";
        this.id = "remotestorage";
    }
    var alerted = false;

    RemoteStorageProvider.prototype = {
        ready: function () {
            return true;
        },
        bg: function () {

        },
        ls: function (path, regex, cb) {
            // Paths are currently ignored
            //load the files already saved in the folder

            var fnames = [];

            $.ajax({
                url: "https://stageaccounts2.icharts.net/gallery2.0/rest/v1/chartbooks",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Basic " + btoa("livedemo@icharts.net" + ":" + "livedemo10"));
                },
                success: function (resp) {
                    console.log(resp);
                    for (var i = 0; i < resp.results.length; i++) {
                        fnames.push(resp.results[i]);
                    }
                    cb(fnames);
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
        deleteChartBook: function (chartBookId, cb) {
            $.ajax({
                url: "https://stageaccounts2.icharts.net/gallery2.0/rest/v1/chartbooks/" + chartBookId,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Basic " + btoa("livedemo@icharts.net" + ":" + "livedemo10"));
                },
                data: {
                    chartBookId: chartBookId
                },
                type: "DELETE",
                success: function (resp) {
                    console.log(resp);
                }
            });
        },
        getContents: function (chartBookId, cb) {
//			get the content from server with ID 
            var that = this;
            $.ajax({
                url: "https://stageaccounts2.icharts.net/gallery2.0/rest/v1/chartbooks/" + chartBookId,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Basic " + btoa("livedemo@icharts.net" + ":" + "livedemo10"));
                },
                data: {
                    chartBookId: chartBookId
                },
                success: function (resp) {
                    console.log(resp);

                    var presentation = resp.results[0];
                    if (resp != null) {
                        try {
                            var data = JSON.parse(presentation);
                            cb(data);
                        } catch (e) {
                            cb(null, e);
                        }
                    }

                    return that;
                }
            });    

        },
        setContents: function (path, data, cb) {

            if (!(data["slides"].length == 0 || (data["slides"].length == 1 && data["slides"][0]["components"].length == 0))) {
                var url, type;
                try {
                    // this.impl.setItem(prefix + path, JSON.stringify(data));
                    // api call to store chartbook  presentation.  
                    if(data.chartBookId){
                        url = "http://stageaccounts2.icharts.net/gallery2.0/rest/v1/chartbooks/"+data.chartBookId;
                        type = "PUT";
                    }
                    else{
                        url = "http://stageaccounts2.icharts.net/gallery2.0/rest/v1/chartbooks";
                        type = "POST";
                    }
                    
                    $.ajax({
                        url: url,
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader("Authorization", "Basic " + btoa("livedemo@icharts.net" + ":" + "livedemo10"));
                        },
                        data: data,
                        contentType: "application/json",
                        type: "POST",
                        success: function (resp) {
                            console.log(resp);
                        }
                    });

                } catch (e) {
                    if (!alerted) {
                        alerted = true;
                        alert("Sorry for the inconvenience that this may cause.  We are working to resolve the issue!");
                    }
                }
            }
            if (cb)
                cb(true);
            return this;
        }
    };

    return RemoteStorageProvider;
});