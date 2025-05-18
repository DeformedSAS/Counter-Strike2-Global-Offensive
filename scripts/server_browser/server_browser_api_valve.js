'use strict';

var ServerBrowserAPI = (function () {

    var APIKEY = ''; // YOUR STEAM API KEY IS REQUIRED TO SEE SERVERS FROM VALVES API!

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
        _HTTPRequest(`https://api.steampowered.com/IGameServersService/GetServerList/v1/?key=${APIKEY}&limit=4999&filter=\\product\\csgo\\`, 'GET', '', function(error, response) {
            if (!error) {
                ServerBrowser.BuildServerBrowser(response.response);
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