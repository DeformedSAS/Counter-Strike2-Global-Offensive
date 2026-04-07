"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/formattext.ts" />
/// <reference path="segmented_progress_bar.ts" />

// Ensure MissionTile exists before the module
var MissionTile = MissionTile || {};

(function (MissionTile) {
    const _m_missionPanel = $.GetContextPanel();

    // ======= FAKE MISSION DATA =======
    const FakeMission = {
        id: "fake_mission_01",
        name: "Fake Mission 01",
        loc_description: "Eliminate 10 enemies in casual",
        progress_saved: 2,
        progress_this_match: 1,
        goal_points: [10],
        xp_reward: [50],
        map: "de_dust2",
        gamemode: "classic",
        seconds_remaining: 3600,
        string_tokens: {}
    };

    // ======= FAKE APIs =======
    const MissionsAPI = {
        GetRecurringMission: (bOptional) => {
            $.Msg("Fake MissionsAPI.GetRecurringMission called, returning null");
            return null; // always fallback to FakeMission
        }
    };

    const LobbyAPI = {
        StopMatchmaking: () => $.Msg("Fake LobbyAPI.StopMatchmaking called")
    };

    function _msg(text) {
        $.Msg("[MissionTile] " + text);
    }

    function IsTheInGamePanel() {
        return (_m_missionPanel.id === 'HudMissionPanel');
    }
    function IsThePauseMenuPanel() {
        return (_m_missionPanel.id === 'id-pausemenu-mission-panel');
    }
    function IsTheMainMenuPanel() {
        return (_m_missionPanel.id === 'id-mainmenu-mission-panel');
    }

    // ================= INIT =================
    function Init(srcText) {
        _msg("Init called: " + srcText);

        // Grab mission data normally
        let missionData = null;
        if (IsThePauseMenuPanel()) {
            missionData = MissionsAPI.GetRecurringMission(false);
        }
        if (!missionData) {
            missionData = MissionsAPI.GetRecurringMission(!IsTheInGamePanel());
        }

        // ===== USE FAKE MISSION IF NONE EXISTS =====
        if (!missionData) {
            _msg("No mission from GC — using fake mission.");
            missionData = FakeMission;
        }

        _m_missionPanel.Data().m_oMissionData = missionData;

        // Hide in certain cases
        if (!missionData) {
            _msg("Still no mission — hiding panel");
            _m_missionPanel.AddClass('hidden');
            return;
        }

        // Background art
        const imagePath = missionData.map || 'undefined';
        const elBgArt = _m_missionPanel.FindChildTraverse('missionArtBG');
        if (elBgArt) {
            elBgArt.style.backgroundImage =
                'url("file://{images}/map_icons/screenshots/720p/' + imagePath + '.png")';
            elBgArt.style.backgroundPosition = '50% 0%';
            elBgArt.style.backgroundSize = 'cover';
        }

        SetButtonPlayMission();
        SessionUpdate();

        // Set completion
        _m_missionPanel.SetHasClass('COMPLETE',
            (missionData.progress_saved +
             (missionData.progress_this_match || 0)) >=
            missionData.goal_points.slice(-1)[0]
        );

        ConstructMissionStrings(_m_missionPanel);

        // Progress bar
        const elProg = _m_missionPanel.FindChildTraverse('progressBaContainer');
        if (elProg) {
            SegmentedProgressBar.Init(elProg, missionData);
        }
        UpdateProgressBar(missionData);

        _m_missionPanel.RemoveClass('hidden');
    }
    MissionTile.Init = Init;

    // ================= BUTTONS =================
    function GetButtonPanel() {
        return _m_missionPanel.FindChildTraverse('missionButton');
    }

    function SetButtonPlayMission() {
        const btn = GetButtonPanel();
        if (!btn) return;
        btn.SetPanelEvent("onactivate", PlayMission);
    }

    function SetButtonCancelSearch() {
        const btn = GetButtonPanel();
        if (!btn) return;
        btn.SetPanelEvent("onactivate", () => LobbyAPI.StopMatchmaking());
    }

    function SetButtonEnabled(enabled) {
        const btn = GetButtonPanel();
        if (!btn) return;
        btn.enabled = enabled;
        btn.SetHasClass('DISABLED', !enabled);
    }

    // ================= TOOLTIP =================
    function GetToolTip(elPanel) {
        return elPanel.Data().missionText;
    }
    MissionTile.GetToolTip = GetToolTip;

    // ================= MISSION STRINGS =================
    function ConstructMissionStrings(elPanel) {
        const missionData = elPanel.Data().m_oMissionData || FakeMission;
        let progress = missionData.progress_saved;
        if (missionData.progress_this_match) {
            progress += missionData.progress_this_match;
            progress = Math.min(progress, missionData.goal_points.slice(-1)[0]);
        }

        elPanel.SetDialogVariableInt("mission-points", missionData.goal_points.slice(-1)[0]);
        elPanel.SetDialogVariableInt("mission-progress", progress);
        elPanel.SetDialogVariableInt("mission-points-checkpoint", missionData.goal_points[0]);
        elPanel.SetDialogVariable("mission-xp", missionData.xp_reward.reduce((a, b) => a + b, 0));

        // Description
        const desc = $.Localize(missionData.loc_description, elPanel);
        elPanel.SetDialogVariable('mission_desc', desc);

        // Map icon
        const elMapIcon = elPanel.FindChildTraverse('missionMapicon');
        if (elMapIcon) {
            if (missionData.map) {
                const iconPath = "file://{images}/map_icons/map_icon_" + missionData.map + ".svg";
                elMapIcon.SetImage(iconPath);
                elMapIcon.style.visibility = 'visible';
            } else {
                elMapIcon.style.visibility = 'collapse';
            }
        }

        // Mode icon
        const elModeIcon = elPanel.FindChildTraverse('missionModeicon');
        if (elModeIcon) {
            if (missionData.gamemode) {
                const iconPath = "file://{images}/icons/ui/" + missionData.gamemode + ".svg";
                elModeIcon.SetImage(iconPath);
                elModeIcon.style.visibility = 'visible';
            } else {
                elModeIcon.style.visibility = 'collapse';
            }
        }
    }

    // ================= PROGRESS BAR =================
    function UpdateProgressBar(missionData) {
        const elProg = _m_missionPanel.FindChildTraverse('progressBaContainer');
        if (!elProg) return;
        SegmentedProgressBar.SetValue(elProg, missionData.progress_saved, 'Base');
        if (missionData.progress_this_match) {
            const liveValue = missionData.progress_saved + missionData.progress_this_match;
            SegmentedProgressBar.SetValue(elProg, liveValue, 'Live');
        }
    }

    // ================= SESSION =================
    function SessionUpdate() {
        _m_missionPanel.Data().m_oMissionData =
            _m_missionPanel.Data().m_oMissionData || FakeMission;
        SetButtonPlayMission();
    }

    // ================= PLAY MISSION =================
    function PlayMission() {
        const missionData = _m_missionPanel.Data().m_oMissionData || FakeMission;
        _msg("Starting fake mission: " + missionData.name);
        // Fake LobbyAPI call simulation
        LobbyAPI.StopMatchmaking();
    }

    // ================= AUTO INIT =================
    Init('default');

    // Fake event registration
    $.RegisterForUnhandledEvent("CSGOShowMainMenu", () => Init('MainMenu'));

})(MissionTile);
