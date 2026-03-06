'use strict';

var ServerBrowserAPI = (function () {

	function _HTTPRequest(url, type, body, callback) {
        if(url == undefined){
            $.Msg('HttpRequest failed due to missing url!');
            return;
        }
        if(type == undefined){
            $.Msg('HttpRequest failed due to missing type!');
            return;
        }
    
        var request = {
            type: type,
            body: body,
            success: function (response) {
                if (callback) callback(null, response);
            },
            error: function (error) {
                if (callback) callback(error, null);
            }
        };
    
        $.AsyncWebRequest(url, request);
    }

    async function _RequestServerBrowser() {
        _HTTPRequest('https://shashlik226.ru/plus_api?request=servers', 'GET', '', function(error, response) {
            if (!error) {
                ServerBrowser.BuildServerBrowser(response);
            }
        });
    }

	return {
		HTTPRequest : _HTTPRequest,
        RequestServerBrowser : _RequestServerBrowser
	};
})();

( function() {
} )();
