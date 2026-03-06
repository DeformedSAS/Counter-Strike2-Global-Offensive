'use strict';

var EndOfMatch = (function () {
    var _m_cP = $("#EndOfMatch");
    if (!_m_cP) _m_cP = $("#PanelToTest");

    if (!_m_cP || !_m_cP.IsValid()) {
        $.Msg("[PanoramaScript] script file endofmatch.js failed to load. Stopping dev panel load.");
        return {};
    }

    $.RegisterEventHandler("EndOfMatch_Show", _m_cP, _Start);
    $.RegisterForUnhandledEvent("EndOfMatch_Shutdown", _Shutdown);
    $.RegisterForUnhandledEvent("OnMouseEnableBinding", _ToggleBetweenScoreboardAndCharacters);
    $.DispatchEvent("PlayMainMenuMusic", false, false);

    _m_cP.AddClass("eom--fade-in-enabled");

    _m_cP.Data()._m_arrPanelObjects = [];
    _m_cP.Data()._m_currentPanelIndex = -1;
    _m_cP.Data()._m_jobStart = null;
    _m_cP.Data()._m_elActiveTab = null;
    _m_cP.Data()._m_scoreboardVisible = false;

    function _NavigateToTab(tab) {
        if (_m_cP.Data()._m_elActiveTab)
            _m_cP.Data()._m_elActiveTab.RemoveClass('eom-panel--active');

        _m_cP.Data()._m_elActiveTab = _m_cP.FindChildTraverse(tab);

        if (_m_cP.Data()._m_elActiveTab)
            _m_cP.Data()._m_elActiveTab.AddClass('eom-panel--active');
    }

    function _ToggleBetweenScoreboardAndCharacters() {
        _m_cP.Data()._m_scoreboardVisible = !_m_cP.Data()._m_scoreboardVisible;
        _m_cP.SetHasClass('scoreboard-visible', _m_cP.Data()._m_scoreboardVisible);
    }

    function _EnableToggleBetweenScoreboardAndCharacters() {
        _m_cP.SetHasClass('scoreboard-visible', _m_cP.Data()._m_scoreboardVisible);
    }

    function _SwitchToPanel(tab) {
        var el = _m_cP.FindChildTraverse('rb--' + tab);
        if (el) {
            el.RemoveClass("hidden");
            el.checked = true;
            _NavigateToTab(tab);
        }
    }

    function _RegisterPanelObject(panel) {
        _m_cP.Data()._m_arrPanelObjects.push(panel);
    }

    function _Initialize() {
        $.Schedule(1, () => $.DispatchEvent("EndOfMatch_Latch"));

        _m_cP.Data()._m_arrPanelObjects.length = 0;
        _m_cP.Data()._m_currentPanelIndex = -1;
        _m_cP.Data()._m_elActiveTab = null;
        EndOfMatch_Music('loading');

        if (_m_cP.Data()._m_jobStart !== null) {
            $.CancelScheduled(_m_cP.Data()._m_jobStart);
            _m_cP.Data()._m_jobStart = null;
        }

        _m_cP.SetHasClass('scoreboard-visible', true);

        $.Schedule(3.0, () => {
            for (var j = 0; j < 10; ++j) {
                var elPanel = $.GetContextPanel().FindChildTraverse('EomCancelReason' + j);
                if (elPanel) elPanel.RemoveClass('show');
            }
        });

        var elLayout = _m_cP.FindChildTraverse("id-eom-layout");
        if (elLayout) {
            elLayout.RemoveAndDeleteChildren();
            elLayout.BLoadLayoutSnippet("snippet-eom-layout--default");
        }

        var mode = MockAdapter.GetGameModeInternalName(false);
        _m_cP.Data()._m_scoreboardVisible = mode === "cooperative" || mode === "coopmission";

        var bind = GameInterfaceAPI.GetSettingString("cl_scoreboard_mouse_enable_binding");
        if (bind.charAt(0) === '+' || bind.charAt(0) === '-') bind = bind.substring(1);
        bind = "{v:csgo_bind:bind_" + bind + "}";
        bind = $.Localize(bind, _m_cP);
        _m_cP.SetDialogVariable("scoreboard_toggle_bind", bind);

        _m_cP.FindChildrenWithClassTraverse("timer").forEach(el => el.active = false);

        var elNavBar = _m_cP.FindChildTraverse("id-content-navbar__tabs");
        if (elNavBar) {
            elNavBar.RemoveAndDeleteChildren();

            _m_cP.FindChildrenWithClassTraverse("eom-panel").forEach(function (elPanel) {
                var elRBtn = $.CreatePanel("RadioButton", elNavBar, "rb--" + elPanel.id);
                elRBtn.BLoadLayoutSnippet("snippet_navbar-button");
                elRBtn.AddClass("navbar-button");
                elRBtn.AddClass("appear");
                elRBtn.SetPanelEvent('onactivate', _NavigateToTab.bind(undefined, elPanel.id));
                elRBtn.FindChildTraverse("id-navbar-button__label").text = $.Localize(elPanel.id);
            });
        }

        _m_cP.SetFocus();
    }

    function EndOfMatch_Music(type) {
        var itemId = LoadoutAPI.GetItemID('noteam', 'musickit');
        var musicId = InventoryAPI.GetItemAttributeValue(itemId, 'music id');
        var musicName = InventoryAPI.GetMusicNameFromMusicID(musicId).replace(/^#musickit_/, '');

        if (type === 'loading' && GameStateAPI.GetCSGOGameUIStateName() === 'CSGO_GAME_UI_STATE_INGAME') {
            InventoryAPI.PlayItemPreviewMusic(itemId, 'endofmatch.mp3');
            InventoryAPI.StopItemPreviewMusic();
            $.DispatchEvent('PlaySoundEffect', 'Music.EndOfMatch.' + musicName, 'MOUSE');
        }
    }

    function _ShowPanelStart() {
        if (!_m_cP || !_m_cP.IsValid()) return;

        var elBlur = _m_cP.GetParent().FindChildTraverse("HudBlur");
        if (elBlur) elBlur.AddClass("eom-blur-fade-in");

        _m_cP.AddClass("eom--reveal");

        if (_m_cP.FindChildTraverse('id-eom-characters-root'))
            EOM_Characters.Start();

        _m_cP.SetMouseCapture(true);
    }

    function _Start(bHardCut) {
        _Initialize();

        _m_cP.Data()._m_jobStart = $.Schedule(bHardCut ? 0.0 : 1.5, () => {
            _m_cP.Data()._m_jobStart = null;
            if (bHardCut) _m_cP.RemoveClass("eom--fade-in-enabled");
            _ShowPanelStart();
            if (bHardCut) _m_cP.AddClass("eom--fade-in-enabled");
            $.Schedule(bHardCut ? 0.0 : 1.25, _ShowNextPanel);
        });
    }
	
	function _StartDisplayTimer( time )
	{
		var elProgBar = _m_cP.FindChildTraverse( "id-display-timer-progress-bar" );

		        

		$.Schedule( 0.0, function()
		{
			if ( elProgBar && elProgBar.IsValid() )
			{
				elProgBar.style.transitionDuration = "0s";
			
				elProgBar.style.width = '0%';				
			}
		} );

		       

		
		$.Schedule( 0.0, function()
		{
			if ( elProgBar && elProgBar.IsValid() )
			{
				elProgBar.style.transitionDuration = time + "s";

				elProgBar.style.width = '100%';
			}
		} );

	}

    function _ShowNextPanel() {
        _m_cP.Data()._m_currentPanelIndex++;
        if (_m_cP.Data()._m_currentPanelIndex < _m_cP.Data()._m_arrPanelObjects.length) {
            if (_m_cP.Data()._m_currentPanelIndex === (_m_cP.Data()._m_arrPanelObjects.length - 1) &&
                !GameStateAPI.IsDemoOrHltv() &&
                !GameStateAPI.IsQueuedMatchmaking()) {
                _m_cP.FindChildrenWithClassTraverse("timer").forEach(el => el.active = true);
            }

            _m_cP.Data()._m_arrPanelObjects[_m_cP.Data()._m_currentPanelIndex].Start();
        }
    }

    function _Shutdown() {
        if (_m_cP.Data()._m_jobStart) {
            $.CancelScheduled(_m_cP.Data()._m_jobStart);
            _m_cP.Data()._m_jobStart = null;
        }

        _m_cP.Data()._m_arrPanelObjects.forEach(obj => {
            if (obj.Shutdown) obj.Shutdown();
        });

        for (var j = 0; j < 10; ++j) {
            var elPanel = $.GetContextPanel().FindChildTraverse('EomCancelReason' + j);
            if (elPanel) elPanel.RemoveClass('show');
        }

        var elBlur = _m_cP.GetParent().FindChildTraverse("HudBlur");
        if (elBlur) elBlur.RemoveClass("eom-blur-fade-in");

        _m_cP.RemoveClass("eom--reveal");
    }

    return {
        ShowNextPanel: _ShowNextPanel,
        SwitchToPanel: _SwitchToPanel,
        RegisterPanelObject: _RegisterPanelObject,
        StartDisplayTimer: _StartDisplayTimer,
        EnableToggleBetweenScoreboardAndCharacters: _EnableToggleBetweenScoreboardAndCharacters,
        ToggleBetweenScoreboardAndCharacters: _ToggleBetweenScoreboardAndCharacters,
        Start: _Start // ← exposed for dev triggers
    };
})();
