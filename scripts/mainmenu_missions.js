"use strict";
/// <reference path="csgo.d.ts" />
var MainMenuMissions;
(function (MainMenuMissions) {
    const _m_missionPanel = $.GetContextPanel();

    // === FAKE MISSIONS ===
    const FakeMissions = [
        {
            name: "mission_1",
            loc_description: "Eliminate 10 enemies in casual",
            progress_saved: 4,
            goal_points: [10],
            xp_reward: [50],
            map: "de_dust2",
            gamemode: "classic",
            string_tokens: {}
        },
        {
            name: "mission_2",
            loc_description: "Win a competitive match",
            progress_saved: 0,
            goal_points: [1],
            xp_reward: [100],
            map: "de_inferno",
            gamemode: "competitive",
            string_tokens: {}
        },
        {
            name: "mission_3",
            loc_description: "Play 5 rounds of Deathmatch",
            progress_saved: 2,
            goal_points: [5],
            xp_reward: [75],
            map: "de_nuke",
            gamemode: "deathmatch",
            string_tokens: {}
        }
    ];

    function Init() {
        UpdateMissionEntries();
    }

    function UpdateMissionEntries() {
        const missionContainer = $("#mission-container-root");
        if (!missionContainer) return;

        missionContainer.RemoveAndDeleteChildren();

        const missions = FakeMissions; // use fake missions instead of API
        if (missions.length > 0) {
            $.GetContextPanel().RemoveClass('hidden');

            for (const missionInfo of missions) {
                const elMissionPanel = $.CreatePanel('Button', missionContainer, missionInfo.name);
                elMissionPanel.BLoadLayoutSnippet("mission");

                // Set name and progress
                const elNameLabel = elMissionPanel.FindChildTraverse("name");
                if (elNameLabel) elNameLabel.text = missionInfo.loc_description;

                elMissionPanel.SetDialogVariableInt("progress", missionInfo.progress_saved);
                elMissionPanel.SetDialogVariableInt("points", missionInfo.goal_points[0]);
                elMissionPanel.SetDialogVariableInt("xp", Number(missionInfo.xp_reward[0]));

                // Panel click
                elMissionPanel.SetPanelEvent("onactivate", PlayMission.bind(undefined, missionInfo));

                // Set image
                let imagePath = missionInfo.map || "default";
                const elBg = elMissionPanel.FindChildTraverse('id-mission-art');
                if (elBg) {
                    elBg.style.backgroundImage = 'url("file://{images}/map_icons/screenshots/360p/' + imagePath + '.png")';
                }

                // Set string tokens if any
                if (missionInfo.string_tokens) {
                    function ExtractStringTokens(tokens) {
                        for (const k in tokens) {
                            if (typeof tokens[k] === 'object' && !Array.isArray(tokens[k]) && tokens[k] !== null) {
                                ExtractStringTokens(tokens[k]);
                            }
                            const val = tokens[k];
                            elMissionPanel.SetDialogVariableLocString(k, val);
                        }
                    }
                    ExtractStringTokens(missionInfo.string_tokens);
                }
            }
        } else {
            $.GetContextPanel().AddClass('hidden');
        }
    }

    function PlayMission(m) {
        // Fake matchmaking logic
        $.Msg("Fake mission activated:", m.name);
        // If you want, you can implement a simple dummy "start match" popup here
    }

    // === Initialize ===
    Init();
    $.RegisterForUnhandledEvent('OnRecurringMissionsReceived', Init);
    $.RegisterForUnhandledEvent('OnRecurringMissionsChanged', Init);

})(MainMenuMissions || (MainMenuMissions = {}));
