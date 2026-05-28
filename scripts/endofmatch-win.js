'use strict';

var EOM_Win = (function() {

    var DEBUG_VACLIVE = false; // THIS is for the giant red box across the screen, old vac live message box.
    var DEBUG_CANCELLED = false; // this is for the one that just replaces the text in eom win.

    var _m_pauseBeforeEnd = 5.0;
    var _m_cP = $.GetContextPanel();

    var _m_oMatchEndData;
    var _m_oScoreData;

    const TEAM_T = 2;
    const TEAM_CT = 3;

    function _SetVictoryStatement() {
        _m_oScoreData = MockAdapter.GetScoreDataJSO();
        _m_oMatchEndData = MockAdapter.GetMatchEndWinDataJSO();

        if (!_m_oScoreData || !_m_oMatchEndData) {
            $.Msg("[PanoramaScript] Missing match data");
            return false;
        }

        var winningTeam = _m_oMatchEndData.winning_team_number;
        var localTeam = MockAdapter.GetPlayerTeamNumber(MockAdapter.GetLocalPlayerXuid());
        var localWon = (winningTeam === localTeam);

        _m_cP.RemoveClass('eom-win_won');
        _m_cP.RemoveClass('eom-win_lost');

        var result = "#eom-result-tie3";
        if (winningTeam === TEAM_T || winningTeam === TEAM_CT) {
            result = localWon ? "#eom-result-win3" : "#eom-result-loss3";
            if (localWon) {
                _m_cP.AddClass('eom-win_won');
            } else {
                _m_cP.AddClass('eom-win_lost');
            }
        }

        var isCancelled = _m_oMatchEndData.hasOwnProperty('match_cancelled') && _m_oMatchEndData.match_cancelled; // vac live cancel message instead of a giant red box at the top of the screen. debug only.
        
        if (DEBUG_CANCELLED || isCancelled) {
            _m_cP.RemoveClass('eom-win_won');
            _m_cP.RemoveClass('eom-win_lost');
            result = '#SFUI_match_cancelled';
            
            if (_m_oMatchEndData.hasOwnProperty('cancel_reason_code') && _m_oMatchEndData.cancel_reason_code) {
                if (typeof _ShowMatchCancelledEarlyWithReasonExplanation === "function") {
                    _ShowMatchCancelledEarlyWithReasonExplanation(_m_oMatchEndData.cancel_reason_code);
                }
            }
        }
        var teamName = MockAdapter.GetTeamClanName(
            MockAdapter.GetPlayerTeamName(MockAdapter.GetLocalPlayerXuid())
        );

        var ctScore = (_m_oScoreData.teamdata && _m_oScoreData.teamdata.CT) ? _m_oScoreData.teamdata.CT.score : 0;
        var tScore = (_m_oScoreData.teamdata && _m_oScoreData.teamdata.TERRORIST) ? _m_oScoreData.teamdata.TERRORIST.score : 0;
        var localScore = (localTeam === TEAM_T) ? tScore : ctScore;
        var otherScore = (localTeam === TEAM_T) ? ctScore : tScore;

        _m_cP.SetDialogVariable("win-result", $.Localize(result));
        _m_cP.SetDialogVariable("teamname", teamName);
        _m_cP.SetDialogVariableInt("score_local_player", localScore);
        _m_cP.SetDialogVariableInt("score_other", otherScore);

        var elPanel = _m_cP.FindChildTraverse("WinTeam");
        if (elPanel) {
            elPanel.AddClass("visible");
            elPanel.style.opacity = 1;
            elPanel.TriggerClass("show");
        }

        _AnimStart();
        $.Schedule(0.05, function() {
        });

        return true;
    }

    function _AnimStart() {
        var elPanel = _m_cP.FindChildTraverse("WinTeam");
        if (elPanel) {
            elPanel.TriggerClass("show");
            elPanel.AddClass("visible");
        }
    }

    function _ShowVacLivePanel() {
        var elPanel = _m_cP.FindChildTraverse("VacLive");
        if (elPanel) {
            elPanel.TriggerClass("show");
        }
    }

    function _DisplayMe() {
        _m_oMatchEndData = MockAdapter.GetMatchEndWinDataJSO();
        _m_oScoreData = MockAdapter.GetScoreDataJSO();

        if (!_m_oMatchEndData || !_m_oScoreData) {
            return false;
        }
        if (GameStateAPI.GetGameModeInternalName(false) == 'deathmatch')
            return false;

        if (DEBUG_VACLIVE || (_m_oMatchEndData.hasOwnProperty('vac_live') && _m_oMatchEndData.vac_live)) {
            _ShowVacLivePanel();
        } else {
            _SetVictoryStatement();
        }

        return true;
    }

    function _Start() {
        if (_DisplayMe()) {
            if (EndOfMatch) {
                EndOfMatch.SwitchToPanel("eom-win");
                EndOfMatch.StartDisplayTimer(_m_pauseBeforeEnd);
                $.Schedule(_m_pauseBeforeEnd, _End);
            }
        } else {
            _End();
        }
    }

    function _End() {
        if (EndOfMatch) EndOfMatch.ShowNextPanel();
    }

    function _Shutdown() {}

    return {
        name: "eom-win",
        Start: _Start,
        Shutdown: _Shutdown
    };

})();

(function() {
    if (EndOfMatch) EndOfMatch.RegisterPanelObject(EOM_Win);
})();