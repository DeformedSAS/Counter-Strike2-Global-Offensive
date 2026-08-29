"use strict";

var TeamSelectMenu;
(function (TeamSelectMenu) {
    var m_highlightedTeam = 0;
    let m_errorTimerHandle = false;

    const CAMERA_PRESET_T = 1;
    const CAMERA_PRESET_CT = 2;

    function _Init() {
        _SetUpTeamSelectBtns();
    }

    function _ShowPanel() {
        if (GameStateAPI.IsDemoOrHltv())
            return;

        const elFade = $("#TeamSelectFade");
        if (elFade) {
            elFade.style.transitionDuration = "0.0s";
            elFade.RemoveClass("hidden");

            $.Schedule(0.5, () => {
                if (elFade.IsValid()) {
                    elFade.style.transitionDuration = "0.5s";
                    elFade.AddClass("hidden");
                }
            });
        }

        var elBackgroundImage = $.GetContextPanel().FindChildInLayoutFile('BackgroundMapImage');
        var mapName = MockAdapter.GetMapBSPName();

        if (elBackgroundImage) {
            elBackgroundImage.SetImage('file://{images}/map_icons/screenshots/1080p/' + mapName + '.png');
        }

        _GetAnimInfo();
        _OnServerForcingTeamJoin(0);
        _PopulatePlayerList();
        _ShowCancelButton();

        if (m_errorTimerHandle !== false) {
            $.CancelScheduled(m_errorTimerHandle);
            m_errorTimerHandle = false;
        }

        var elWarningPanel = $('#TeamJoinError');
        if (elWarningPanel) elWarningPanel.AddClass('hidden');

        m_highlightedTeam = 0;
    }

    function _ShowPanelTest(mockdata) {
        MockAdapter.SetMockData(mockdata);
        _ShowPanel();
    }

    function _UpdateBotPlayerCount(countBots, countPlayers, team) {
        let elLabel = $("#BtnSelectTeam-" + team).FindChildInLayoutFile("PlayerBotCount");
        if (!elLabel) return;

        elLabel.SetDialogVariable("botlabel", $.Localize(countBots === 1 ? "#team_select_bot" : "#team_select_bots"));
        elLabel.SetDialogVariable("playerlabel", $.Localize(countPlayers === 1 ? "#team_select_player" : "#team_select_players"));
        
        elLabel.SetDialogVariableInt("bots", countBots);
        elLabel.SetDialogVariableInt("players", countPlayers);
        elLabel.text = $.Localize("#team_select_bot_player_count", elLabel);
    }

    function _OnServerForcingTeamJoin(nTimeout) {
        let bUnassigned = $.GetContextPanel().GetTeamNumber() == 0;
        let elCancel = $("#TeamSelectCancel");
        if (elCancel) elCancel.visible = !bUnassigned;

        if (bUnassigned && isFinite(nTimeout) && nTimeout > 0) {
            let elTimer = $("#AutojoinTimer");
            if (elTimer) {
                let elTimerBar = elTimer.FindChildInLayoutFile("AutojoinTimerBar");
                if (elTimerBar) elTimerBar.DeleteAsync(0);
                
                elTimerBar = $.CreatePanel("Panel", elTimer, "AutojoinTimerBar");
                elTimerBar.style.animationDuration = nTimeout + "s";
                elTimerBar.AddClass("team-select__timer__bar");
                elTimer.endTime = Date.now() * 0.001 + nTimeout;
                elTimer.visible = true;
            }
        } else {
            let elTimer = $("#AutojoinTimer");
            if (elTimer) elTimer.visible = false;
        }
    }

    function _HighlightPanel(elModelPanel) {
        if (!elModelPanel) return;
        elModelPanel.GetParent().SetHasClass('highlight', true);
        elModelPanel.ResetActivityModifiers();
        elModelPanel.ApplyActivityModifier(elModelPanel.id === 'TeamCharT' ? 'terrorist' : 'ct');
        elModelPanel.PlayActivity('ACT_CSGO_UIPLAYER_CONFIRM', true);
    }

    function _UnhighlightPanel(elModelPanel) {
        if (!elModelPanel || !elModelPanel.IsValid()) return;
        elModelPanel.GetParent().SetHasClass('highlight', false);
        elModelPanel.ApplyActivityModifier(elModelPanel.id === 'TeamCharT' ? 'terrorist' : 'ct');
        elModelPanel.ApplyActivityModifier('Pistol');
        elModelPanel.PlayActivity('ACT_CSGO_UIPLAYER_IDLE', true);
    }

    function _SelectTeam(team) {
        var currentTeamNumber = MockAdapter.GetPlayerTeamNumber(MyPersonaAPI.GetXuid());
        if (team !== "0" && currentTeamNumber.toString() === team) {
            _HidePanel();
            return;
        }
        GameInterfaceAPI.ConsoleCommand('jointeam ' + team + ' 1');
    }

    function _HighlightTTeam() {
        var elBtnTeamT = $('#BtnSelectTeam-TERRORIST');
        if (elBtnTeamT) elBtnTeamT.SetHasClass('team-select-icon-title-highlight', true);
        _HighlightPanel($('#TeamCharT'));
        m_highlightedTeam = '2';
    }

    function _UnhighlightTTeam() {
        var elBtnTeamT = $('#BtnSelectTeam-TERRORIST');
        if (elBtnTeamT) elBtnTeamT.SetHasClass('team-select-icon-title-highlight', false);
        _UnhighlightPanel($('#TeamCharT'));
    }

    function _HighlightCTTeam() {
        var elBtnTeamCT = $('#BtnSelectTeam-CT');
        if (elBtnTeamCT) elBtnTeamCT.SetHasClass('team-select-icon-title-highlight', true);
        _HighlightPanel($('#TeamCharCT'));
        m_highlightedTeam = '3';
    }

    function _UnhighlightCTTeam() {
        var elBtnTeamCT = $('#BtnSelectTeam-CT');
        if (elBtnTeamCT) elBtnTeamCT.SetHasClass('team-select-icon-title-highlight', false);
        _UnhighlightPanel($('#TeamCharCT'));
    }

    function _SetUpTeamSelectBtns() {
        var elBtnTeamT = $('#BtnSelectTeam-TERRORIST');
        if (elBtnTeamT) {
            elBtnTeamT.SetPanelEvent('onmouseover', _HighlightTTeam);
            elBtnTeamT.SetPanelEvent('onmouseout', _UnhighlightTTeam);
            elBtnTeamT.SetPanelEvent('onactivate', () => _SelectTeam('2'));
        }

        var elBtnTeamCT = $('#BtnSelectTeam-CT');
        if (elBtnTeamCT) {
            elBtnTeamCT.SetPanelEvent('onmouseover', _HighlightCTTeam);
            elBtnTeamCT.SetPanelEvent('onmouseout', _UnhighlightCTTeam);
            elBtnTeamCT.SetPanelEvent('onactivate', () => _SelectTeam('3'));
        }

        var elBtnSpec = $('#TeamSelectSpectate');
        if (elBtnSpec) elBtnSpec.SetPanelEvent('onactivate', () => _SelectTeam('1'));

        var elBtnAuto = $('#TeamSelectAuto');
        if (elBtnAuto) elBtnAuto.SetPanelEvent('onactivate', () => _SelectTeam('0'));

        _UnhighlightCTTeam();
        _UnhighlightTTeam();
    }

    function _GetAnimInfo() {
        _ResetModel('TERRORIST');
        _ResetModel('CT');
    }

    function _ResetModel(team) {
        var elChar = (team == "CT") ? $.GetContextPanel().FindChildInLayoutFile('TeamCharCT') : $.GetContextPanel().FindChildInLayoutFile('TeamCharT');
        if (!elChar) return;

        _SetCharacterAnim(elChar, {
            team: (team == "CT" ? 'ct' : 't'),
            cameraPreset: (team == "CT" ? CAMERA_PRESET_CT : CAMERA_PRESET_T)
        });
        elChar.GetParent().TriggerClass('highlit-player');
    }

    function _SetCharacterAnim(playerPanel, paramsettings) {
        var teamstring = CharacterAnims.NormalizeTeamName(paramsettings.team, true);
        var settings = ItemInfo.GetOrUpdateVanityCharacterSettings(LoadoutAPI.GetItemID(teamstring, 'customplayer'));
        settings.panel = playerPanel;
        settings.cameraPreset = paramsettings.cameraPreset;
        settings.weaponItemId = LoadoutAPI.GetItemID(teamstring, "secondary0");
        if (settings.charItemId === LoadoutAPI.GetDefaultItem(teamstring, 'customplayer')) {
            settings.modelOverride = (teamstring == 'ct') ? MockAdapter.GetPlayerItemCT($.GetContextPanel()) : MockAdapter.GetPlayerItemTerrorist($.GetContextPanel());
            settings.charItemId = undefined;
        }
        CharacterAnims.PlayAnimsOnPanel(settings);
    }

    function _PopulatePlayerList() {
        if (GameStateAPI.IsDemoOrHltv()) return false;

        var oPlayerList = MockAdapter.GetPlayerDataJSO();
        var teamNames = ['TERRORIST', 'CT'];

        for (var iTeam = 0; iTeam < teamNames.length; ++iTeam) {
            var teamName = teamNames[iTeam];
            var players = (oPlayerList && oPlayerList[teamName]) ? oPlayerList[teamName] : {};
            var xuidsOnTeam = [];
            var countBots = 0;

            for (var j in players) {
                var xuid = players[j];
                _UpdatePlayer(xuid, teamName);
                xuidsOnTeam.push(xuid.toString()); 
                if (MockAdapter.IsFakePlayer(xuid)) countBots++;
            }

            var listId = (teamName === 'TERRORIST') ? 'List-0' : 'List-1';
            var elList = $('#' + listId);
            
            if (elList) {
                var elTeammates = elList.FindChild('Teammates') || elList;
                if (elTeammates) {
                    elTeammates.RemoveClass('hidden');
                    elTeammates.Children().forEach(function(element) {
                        var bShouldBeVisible = (xuidsOnTeam.indexOf(element.id) !== -1) && 
                                              MockAdapter.IsPlayerConnected(element.id) && 
                                              (teamName === MockAdapter.GetPlayerTeamName(element.id));

                        if (!bShouldBeVisible) {
                            element.AddClass('hidden');
                            element.visible = false;
                        } else {
                            element.RemoveClass('hidden');
                            element.visible = true;
                        }
                    });
                }
            }
            _UpdateBotPlayerCount(countBots, xuidsOnTeam.length - countBots, teamName);
        }
        return false;
    }

    function _UpdatePlayer(xuid, teamName) {
        if (xuid === 0 || xuid === "0") return;

        var listId = (teamName === 'TERRORIST') ? 'List-0' : 'List-1';
        var elList = $('#' + listId);
        if (!elList) return;

        var elTeammatesPanels = elList.FindChild('Teammates') || elList;
        var elTeammate = elTeammatesPanels.FindChildInLayoutFile(xuid.toString());

        if (!elTeammate) {
            elTeammate = $.CreatePanel('Panel', elTeammatesPanels, xuid.toString());
            elTeammate.BLoadLayoutSnippet('Teammate');

            var elName = elTeammate.FindChildInLayoutFile('TeamSelectTeammateName');
            if (elName) {
                var clanTag = MockAdapter.GetPlayerClanTag(xuid);
                var playerName = MockAdapter.GetPlayerNameWithNoHTMLEscapes(xuid);
                elName.text = (clanTag ? "[" + clanTag + "] " : "") + playerName;
            }

            var elAvatar = $.CreatePanel('Panel', elTeammate, 'Avatar_' + xuid, { hittest: 'true' });
            elAvatar.SetAttributeString('xuid', xuid.toString());
            elAvatar.BLoadLayout('file://{resources}/layout/avatar.xml', false, false);
            elAvatar.BLoadLayoutSnippet('AvatarParty');
            
            if (elName) {
                elTeammate.MoveChildBefore(elAvatar, elName);
            }

            var elAvatarImage = elAvatar.FindChildInLayoutFile('JsAvatarImage');
            if (elAvatarImage) {
                elAvatarImage.SetDefaultImage('file://{images}/icons/scoreboard/avatar-' + teamName + '.png');
                elAvatarImage.AddClass('no-hover');
            }

            Avatar.Init(elAvatar, xuid.toString(), "PlayerCard");
            elTeammate.RemoveClass('hidden');
        } else {
            var elExistingAvatar = elTeammate.FindChild('Avatar_' + xuid);
            if (elExistingAvatar) {
                Avatar.Init(elExistingAvatar, xuid.toString(), "PlayerCard");
            }
        }
    }

    function _SetPlayerModel(team, charItemId, weaponItemId) {
        var elChar = (team == 'CT') ? $.GetContextPanel().FindChildInLayoutFile('TeamCharCT') : $.GetContextPanel().FindChildInLayoutFile('TeamCharT');
        if (!elChar) return;
        CharacterAnims.PlayAnimsOnPanel({
            panel: elChar,
            team: team,
            charItemId: charItemId,
            weaponItemId: weaponItemId,
            cameraPreset: (team == 'CT' ? CAMERA_PRESET_CT : CAMERA_PRESET_T)
        });
        elChar.GetParent().TriggerClass('highlit-player');
    }

    function _ShowError(locString) {
        let elLabel = $("#TeamJoinErrorLabel");
        let elWarningPanel = $("#TeamJoinError");
        if (elLabel && elWarningPanel) {
            elLabel.text = $.Localize(locString);
            elWarningPanel.RemoveClass("hidden");
            m_errorTimerHandle = $.Schedule(5.0, function() {
                if (elWarningPanel.IsValid()) elWarningPanel.AddClass("hidden");
                m_errorTimerHandle = false;
            });
        }
    }

    function _ShowCancelButton() {
        var bUnassigned = $.GetContextPanel().GetTeamNumber() == 0;
        let elCancel = $('#TeamSelectCancel');
        if (elCancel) elCancel.visible = !bUnassigned;
    }

    function _HidePanel() {
        $.DispatchEvent('CSGOShowTeamSelectMenu', false);
    }
    TeamSelectMenu.HidePanel = _HidePanel;

    {
        _Init();
        $.RegisterForUnhandledEvent("CSGOShowTeamSelectMenu", _ShowPanel);
        $.RegisterForUnhandledEvent("CSGOShowTeamSelectMenu_Test", _ShowPanelTest);
        $.RegisterForUnhandledEvent("ServerForcingTeamJoin", _OnServerForcingTeamJoin);
        $.RegisterForUnhandledEvent("TeamJoinFailed", _ShowError);

        $.RegisterForUnhandledEvent("PlayerTeamChanged", _PopulatePlayerList);

        $.GetContextPanel().RegisterForReadyEvents(true);
        var _m_cP = $('#TeamSelectMenu');
        if (!_m_cP) _m_cP = $("#PanelToTest");
        if (_m_cP) $.RegisterKeyBind(_m_cP, 'key_escape', TeamSelectMenu.HidePanel);
    }
})(TeamSelectMenu || (TeamSelectMenu = {}));