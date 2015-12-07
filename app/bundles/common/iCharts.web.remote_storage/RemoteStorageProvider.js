define(function () {
    var prefix = "strut-";
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

//            $.ajax({
//                url: "https://stageaccounts2.icharts.net/gallery2.0/rest/v1/chartbooks",
//                beforeSend: function (xhr) {
//                    xhr.setRequestHeader("Authorization", "Basic " + btoa("livedemo@icharts.net" + ":" + "livedemo10"));
//                },
//                success: function (resp) {
//                    console.log(resp);
//                }
//            });    

            var resp = {"total": 20, "results": [{"chartBookCreator": "livedemo@icharts.net", "chartBookId": "N3/U", "chartBookCreated": "2011-06-02T05:01:07.000+0000", "chartBookName": "Customer Satisfaction Survey", "chartBookPreviewURL": "", "chartBookModified": "2011-06-02T05:01:13.000+0000"}, {"chartBookCreator": "livedemo@icharts.net", "chartBookId": "MH3XzA==", "chartBookCreated": "2011-07-27T20:11:10.000+0000", "chartBookName": "Jackie REport", "chartBookPreviewURL": "", "chartBookModified": "2011-07-27T20:11:10.000+0000"}, {"chartBookCreator": "livedemo@icharts.net", "chartBookId": "MX3UzQ==", "chartBookCreated": "2012-01-16T23:20:02.000+0000", "chartBookName": "Automotive Brand Health Report", "chartBookPreviewURL": "", "chartBookModified": "2012-01-16T23:20:02.000+0000"}, {"chartBookCreator": "livedemo@icharts.net", "chartBookId": "NnrVyA==", "chartBookCreated": "2012-04-19T16:41:28.000+0000", "chartBookName": "ConX ChartBook", "chartBookPreviewURL": "", "chartBookModified": "2012-04-19T16:44:41.000+0000"}, {"chartBookCreator": "livedemo@icharts.net", "chartBookId": "NnrayA==", "chartBookCreated": "2012-05-05T21:37:34.000+0000", "chartBookName": "Computer Sales Tracker for HP (Sample Data)", "chartBookPreviewURL": "", "chartBookModified": "2015-05-11T22:14:06.000+0000"}, {"chartBookCreator": "livedemo@icharts.net", "chartBookId": "Nnrazw==", "chartBookCreated": "2012-05-08T08:59:52.000+0000", "chartBookName": "CNBC ", "chartBookPreviewURL": "", "chartBookModified": "2012-05-08T13:02:55.000+0000"}, {"chartBookCreator": "livedemo@icharts.net", "chartBookId": "NnvVyw==", "chartBookCreated": "2012-07-11T18:25:56.000+0000", "chartBookName": "Marist Poll - Sample", "chartBookPreviewURL": "", "chartBookModified": "2012-07-11T18:33:06.000+0000"}, {"chartBookCreator": "livedemo@icharts.net", "chartBookId": "NnnSzg==", "chartBookCreated": "2012-08-23T18:45:20.000+0000", "chartBookName": "Nielsen - PC Sales Chartbook", "chartBookPreviewURL": "", "chartBookModified": "2012-08-24T00:37:54.000+0000"}, {"chartBookCreator": "livedemo@icharts.net", "chartBookId": "NnnWyQ==", "chartBookCreated": "2012-10-04T12:14:43.000+0000", "chartBookName": "report test", "chartBookPreviewURL": "", "chartBookModified": "2012-10-04T12:14:43.000+0000"}, {"chartBookCreator": "livedemo@icharts.net", "chartBookId": "Nnnayg==", "chartBookCreated": "2014-12-30T12:31:01.000+0000", "chartBookName": "One", "chartBookPreviewURL": "", "chartBookModified": "2015-06-25T14:46:04.000+0000"}], "perPage": 0, "offset": 0};

            for (var i = 0; i < resp.results.length; i++) {
                fnames.push(resp.results[i]);
            }
            cb(fnames);

            return this;
        },
        rm: function (path, cb) {
//            this.impl.removeItem(prefix + path);
//            if (cb)
//                cb(true);
//            return this;
        },
        getContents: function (chartBookId, cb) {
//			get the content from server with ID 

            console.log(chartBookId);
//            $.ajax({
//                url: "https://stageaccounts2.icharts.net/gallery2.0/rest/v1/chartbooks/{"+chartBookId+"}",
//                beforeSend: function (xhr) {
//                    xhr.setRequestHeader("Authorization", "Basic " + btoa("livedemo@icharts.net" + ":" + "livedemo10"));
//                },
//                data : {
//                    chartBookId : chartBookId 
//                }
//                success: function (resp) {
//                    console.log(resp);
//                }
//            });    

            var resp = '{"slides":[{"components":[{"TextBox":{},"x":337,"y":205,"scale":{"x":1,"y":1},"type":"TextBox","text":"<font>Sample</font>","size":72,"selected":false}],"z":0,"impScale":3,"rotateX":0,"rotateY":0,"rotateZ":0,"index":0,"selected":true,"active":true}],"background":"bg-default","activeSlide":{"components":[{"TextBox":{},"x":337,"y":205,"scale":{"x":1,"y":1},"type":"TextBox","text":"<font>Sample</font>","size":72,"selected":false}],"z":0,"impScale":3,"rotateX":0,"rotateY":0,"rotateZ":0,"index":0,"selected":true,"active":true},"chartBookName":"sample2"}';

            if (resp != null) {
                try {
                    var data = JSON.parse(resp);
                    cb(data);
                } catch (e) {
                    cb(null, e);
                }
            }

            return this;
        },
        setContents: function (path, data, cb) {
            data.chartBookName = data.fileName;
            delete data.fileName;
            try {
//				this.impl.setItem(prefix + path, JSON.stringify(data));
                // api call to store chartbook  presentation.  
//                console.log("Basic " + btoa("livedemo@icharts.net" + ":" + "livedemo10"));
                console.log(JSON.stringify(data));
                $.ajax({
                    url: "http://stageaccounts2.icharts.net/gallery2.0/rest/v1/chartbooks/createChartBook",
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Authorization", "Basic " + btoa("livedemo@icharts.net" + ":" + "livedemo10"));
                    },
                    data: {
                        chartBookJson: JSON.stringify(data),
                        chartBookName: data.chartBookName
                    },
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
            if (cb)
                cb(true);
            return this;
        }
    };

    return RemoteStorageProvider;
});