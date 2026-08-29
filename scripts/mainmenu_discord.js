'use strict';

var MainMenuDiscord = (function() {
    var _Init = function() {
        var elDiscordHTML = $.GetContextPanel().FindChildTraverse('DiscordHTML');
        if (elDiscordHTML) {
            elDiscordHTML.SetURL('https://discord.com/app');
        }
    };

    function _HTMLOpenPopupTab(objHtmlEventTarget, objHtml, sUrl) {
        // if you press an external link, opens it up in steams overlay browser, or in your default browser if in windowed..
        SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser(sUrl);
    }

    return {
        Init: _Init,
        HTMLOpenPopupTab: _HTMLOpenPopupTab
    };
})();

(function() {
    MainMenuDiscord.Init();
    $.RegisterEventHandler("HTMLOpenPopupTab", $.GetContextPanel(), MainMenuDiscord.HTMLOpenPopupTab);
})();