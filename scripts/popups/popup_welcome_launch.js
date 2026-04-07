var WelcomeLaunch = (function () {
	
    function _OnOKPressed() {
        var strGoalVersion = $.GetContextPanel().GetAttributeString("uisettingversion", '');
        GameInterfaceAPI.SetSettingString('ui_popup_weaponupdate_version', strGoalVersion);
        $.DispatchEvent('UIPopupButtonClicked', '');
    }

    function _OnCancelPressed() {
        _OnOKPressed();
    }

    function _OnGithubButtonPressed() {
        SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser("https://github.com/DeformedSAS/Counter-Strike2-Global-Offensive");
    }

    return {
        OnOKPressed: _OnOKPressed,
        OnCancelPressed: _OnCancelPressed,
        OnGithubButtonPressed: _OnGithubButtonPressed,
    };
})();
