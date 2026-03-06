var WelcomeLaunch = (function () {
	
    function _OnOKPressed() {
        var strGoalVersion = $.GetContextPanel().GetAttributeString("uisettingversion", '');
        GameInterfaceAPI.SetSettingString('ui_popup_weaponupdate_version', strGoalVersion);
        $.DispatchEvent('UIPopupButtonClicked', '');
		$.DispatchEvent('PlayMainMenuMusic', true, true );
		_PlayMenuSong();
    }

    function _OnCancelPressed() {
        _OnOKPressed();
    }

    function _OnGithubButtonPressed() {
        SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser("https://github.com/DeformedSAS/CS-GO-Custom-Panorama-CS2-");
    }
	
	function _PlayMenuSong() {
	 $.DispatchEvent('PlayMainMenuMusic', true, false );
	 }

    return {
        OnOKPressed: _OnOKPressed,
        OnCancelPressed: _OnCancelPressed,
        OnGithubButtonPressed: _OnGithubButtonPressed,
    };
})();

$.DispatchEvent('PlayMainMenuMusic', false, true);
$.DispatchEvent('PlaySoundEffect', 'UIPanorama.welcome_popup', 'MOUSE');
