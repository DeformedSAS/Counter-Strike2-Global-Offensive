'use strict';

var EndOfMatch = (function () {
    var _m_cP = $("#EndOfMatch");
    if (!_m_cP) _m_cP = $("#PanelToTest");
    if (!_m_cP) _m_cP = $.GetContextPanel();

    if (!_m_cP || !_m_cP.IsValid()) {
        return {};
    }


    $.RegisterEventHandler("EndOfMatch_Show", _m_cP, _Start);
    $.RegisterForUnhandledEvent("EndOfMatch_Shutdown", _Shutdown);
    $.RegisterForUnhandledEvent("OnMouseEnableBinding", _ToggleBetweenScoreboardAndCharacters);

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

        if (_m_cP.Data()._m_jobStart !== null) {
            $.CancelScheduled(_m_cP.Data()._m_jobStart);
            _m_cP.Data()._m_jobStart = null;
        }

        _m_cP.SetHasClass('scoreboard-visible', true);

        $.Schedule(3.0, () => {
            for (var j = 0; j < 10; ++j) {
                var elPanel = $.GetContextPanel().FindChildTraverse('EomCancelReason' + j);
                if (elPanel) elPanel.AddClass('show');
            }
        });

        var elLayout = _m_cP.FindChildTraverse("id-eom-layout");
        if (elLayout) {
            elLayout.RemoveAndDeleteChildren();
            elLayout.BLoadLayoutSnippet("snippet-eom-layout--default");
        }

        var mode = "competitive";
        if (typeof GameStateAPI !== 'undefined' && GameStateAPI.GetGameModeInternalName) {
            mode = GameStateAPI.GetGameModeInternalName(false);
        }
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



    function _ShowPanelStart() {
        if (!_m_cP || !_m_cP.IsValid()) {
            $.Msg("[EOM DEBUG] Error: Context Panel is invalid.");
            return;
        }

        _m_cP.AddClass("eom--reveal");

        const elFade = $("#id-eom-fade");
        if (elFade) {
            elFade.AddClass("active");
        }

        let elFallbackBackground = $("#id-eom-fallback-background");
        if (elFallbackBackground) {
            elFallbackBackground.AddClass("hidden");
        }

        var elBackgroundImage = _m_cP.FindChildInLayoutFile('BackgroundMapImage');
        if (elBackgroundImage) {
            var mapName = GameStateAPI.GetMapBSPName();
            if (!mapName || mapName === "") mapName = 'de_dust2'; // fallback image.
            elBackgroundImage.SetImage('file://{images}/map_icons/screenshots/1080p/' + mapName + '_eom.png');
        }

        $.Schedule(0.5, () => {

            var elCharRoot = _m_cP.FindChildTraverse('id-eom-characters-root');
            if (elCharRoot) {
                if (typeof EOM_Characters !== 'undefined') {
                    EOM_Characters.Start();
                } else {
                }
            } else {
            }

            if (_m_cP.Data()._m_arrPanelObjects && _m_cP.Data()._m_arrPanelObjects.length > 0) {
            } else {
            }

            if (elFade) elFade.RemoveClass("active");
            if (elFallbackBackground) elFallbackBackground.RemoveClass("hidden");
           
        });
    }

    function _Start ( bHardCut ) 
    {
        _Initialize();
        if ( bHardCut )
        {     
            _m_cP.Data()._m_jobStart = $.Schedule( 0.0, _ => 
            {
                _m_cP.Data()._m_jobStart = null;
                _m_cP.RemoveClass( "eom--fade-in-enabled" );
                _ShowPanelStart();
                _m_cP.AddClass( "eom--fade-in-enabled" );
                _ShowNextPanel();
            } );
        }
        else
        {
            _m_cP.Data()._m_jobStart = $.Schedule( 2.0, _ => 
            {
                _m_cP.Data()._m_jobStart = null;
                _ShowPanelStart();
                $.Schedule( 1.25, _ShowNextPanel );
            } );
        }
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

        _m_cP.RemoveClass("eom--reveal");
    }

    $.Schedule(0.2, function() {
        if (_m_cP && _m_cP.IsValid()) {
            _Start(true);
        }
    });

    return {
        ShowNextPanel: _ShowNextPanel,
        SwitchToPanel: _SwitchToPanel,
        RegisterPanelObject: _RegisterPanelObject,
        StartDisplayTimer: _StartDisplayTimer,
        EnableToggleBetweenScoreboardAndCharacters: _EnableToggleBetweenScoreboardAndCharacters,
        ToggleBetweenScoreboardAndCharacters: _ToggleBetweenScoreboardAndCharacters,
        Start: _Start 
    };
})();