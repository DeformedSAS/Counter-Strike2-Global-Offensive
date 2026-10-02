'use strict';

var MainMenuYTMusic = (function() {

    var _Init = function() {
        var elYTMusicHTML = $.GetContextPanel().FindChildTraverse('YTMusicHTML');
        if (elYTMusicHTML) {
            elYTMusicHTML.SetURL('https://music.youtube.com');
        }
    };

    function _OnHTMLFinishRequest(objHtmlEventTarget, sUrl) {
        var elYTMusicHTML = $.GetContextPanel().FindChildTraverse('YTMusicHTML');
        if (elYTMusicHTML) {
        }
    }

    function _HTMLOpenPopupTab(objHtmlEventTarget, objHtml, sUrl) {
        SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser(sUrl);
    }

    return {
        Init: _Init,
        OnHTMLFinishRequest: _OnHTMLFinishRequest,
        HTMLOpenPopupTab: _HTMLOpenPopupTab
    };
})();

(function() {
    MainMenuYTMusic.Init();
    $.RegisterEventHandler("HTMLOpenPopupTab", $.GetContextPanel(), MainMenuYTMusic.HTMLOpenPopupTab);
    $.RegisterEventHandler("HTMLFinishRequest", $.GetContextPanel(), MainMenuYTMusic.OnHTMLFinishRequest);
})();