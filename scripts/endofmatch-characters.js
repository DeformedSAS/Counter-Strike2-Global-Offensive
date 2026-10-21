'use strict';

var EOM_Characters = (function() {
    var _m_cP = $.GetContextPanel();
    var _m_arrAllPlayersMatchDataJSO = [];
    var _m_localPlayer = null;
    var _m_teamToShow = null;

    var ACCOLADE_START_TIME = 1.0;
    var DELAY_PER_PLAYER = 0.5;
    var m_bNoGimmeAccolades = true;

    var CAMERA_POSITIONS = [10, 11, 12, 13, 14, 15, 22, 23, 24, 25];

    function _GetSnippetForMode(mode) {
        switch (mode) {
            case "scrimcomp2v2":
                return "snippet-eom-chars__layout--scrimcomp2v2";
            case "competitive":
            case "cooperative":
            case "casual":
            case "teamdm":
                return "snippet-eom-chars__layout--classic";
            case "training":
            case "deathmatch":
            case "ffadm":
            case "gungameprogressive":
                return "snippet-eom-chars__layout--ffa";
            default:
                return "snippet-eom-chars__layout--classic";
        }
    }

    function _SetTeamLogo(team) {
        var elRoot = $('#id-eom-characters-root');
        if (!elRoot) return;
        
        var teamLogoPath = "file://{images}/icons/ui/" + (team === "ct" ? "ct_logo_1c.svg" : "t_logo_1c.svg");
        var elTeamLogo = elRoot.FindChildTraverse("id-eom-chars__layout__logo--" + team);

        if (elTeamLogo) {
            elTeamLogo.SetImage(teamLogoPath);
        }
    }

    function _SetupPanel(mode) {
        var elRoot = $('#id-eom-characters-root');
        if (!elRoot) return;
        
        var snippet = _GetSnippetForMode(mode);

        elRoot.RemoveAndDeleteChildren();
        elRoot.BLoadLayoutSnippet(snippet);
        _SetTeamLogo('t');
        _SetTeamLogo('ct');
    }

    function _CollectPlayersForMode(mode) {
        var arrPlayerList = [];

        switch (mode) {
			case "deathmatch":
			case "ffadm":
			case "gungameprogressive":            
				{
					var arrPlayerXuids = Scoreboard.GetFreeForAllTopThreePlayers();
					if ( MockAdapter.GetMockData() != undefined )
					{
						arrPlayerXuids = [ "1", "2", "3" ];
					}

					                                                                  
					arrPlayerList[ 0 ] = _m_arrAllPlayersMatchDataJSO.filter( o => o[ 'xuid' ] == arrPlayerXuids[ 0 ] )[ 0 ];
					arrPlayerList[ 1 ] = _m_arrAllPlayersMatchDataJSO.filter( o => o[ 'xuid' ] == arrPlayerXuids[ 1 ] )[ 0 ];
					arrPlayerList[ 2 ] = _m_arrAllPlayersMatchDataJSO.filter( o => o[ 'xuid' ] == arrPlayerXuids[ 2 ] )[ 0 ];
					
					m_bNoGimmeAccolades = true;

					break;
				}
            case "training":
            case "scrimcomp2v2":
                {
                    var listCT = _CollectPlayersOfTeam("CT").slice(0, 2);
                    var listT = _CollectPlayersOfTeam("TERRORIST").slice(0, 2);

                    arrPlayerList = listCT.concat(listT);
                    m_bNoGimmeAccolades = false;
                    break;
                }
            case "competitive":
            case "casual":
            case "cooperative":
            case "teamdm":
            default:
                {
                    arrPlayerList = _CollectPlayersOfTeam(_m_teamToShow);
                    arrPlayerList = arrPlayerList.sort(_SortByScoreFn);
                    m_bNoGimmeAccolades = false;

                    if (_m_localPlayer) {
                        arrPlayerList = arrPlayerList.filter(function(player) { return player['xuid'] !== _m_localPlayer['xuid']; });
                        arrPlayerList.splice(0, 0, _m_localPlayer);
                    }
                    break;
                }
        }

        if (arrPlayerList) {
            arrPlayerList = arrPlayerList.slice(0, _GetNumCharsToShowForMode(mode));
        }

        return arrPlayerList;
    }

    function _CollectPlayersOfTeam(teamName) {
        var teamNum = 0;
        switch (teamName) {
            case "TERRORIST": teamNum = 2; break;
            case "CT": teamNum = 3; break;
        }
        return _m_arrAllPlayersMatchDataJSO.filter(function(o) { return o['teamnumber'] === teamNum; });
    }

    function _GetNumCharsToShowForMode(mode) {
        switch (mode) {
            case "scrimcomp2v2": return 4;
            case "competitive": return 5;
            case "casual": return 5;
            case "teamdm": return 5;
            case "cooperative": return 2;
            case "gungameprogressive":            
            case "deathmatch":
            case "ffadm": return 3;
            case "training": return 1;
            default: return 5;
        }
    }

    function _AddModeSpecificSettings(mode, settings, index, arrPlayerList) {
        var zDepth;
        settings.flashlightAmount = 1.5;

        switch (mode) {
            case "scrimcomp2v2":
                zDepth = 1;
                break;
            case "competitive":
            default:
                zDepth = Math.abs(Math.floor(arrPlayerList.length / 2) - index);
                break;
            case "casual":
            case "teamdm":
            case "gungametrbomb":
                settings.flashlightAmount = 2 - index * (2 / arrPlayerList.length);
                zDepth = index;
                break;
            case "cooperative":
                zDepth = 0;
                break;
            case "gungameprogressive":            
            case "deathmatch":
            case "ffadm":
            case "training":
                var positions = [1, 0, 2];
                zDepth = positions[index];
                break;
        }

        settings['cameraPreset'] = CAMERA_POSITIONS[zDepth] || 10;
        settings['panelPosition'] = -zDepth;
    }

    function _ShouldDisplayCommendsInMode(mode) {
        if (typeof MyPersonaAPI !== 'undefined' && MyPersonaAPI.GetElevatedState() !== "elevated") return false; 
        
        switch (mode) {
            case "scrimcomp2v2":
            case "competitive":
            case "casual":
            case "gungametrbomb":
            case "cooperative":
            case "teamdm":
                return true;
            default:
                return false;
        }
    }

    function _GetModeForEndOfMatchPurposes() {
        var mode = (typeof MockAdapter !== 'undefined') ? MockAdapter.GetGameModeInternalName(false) : "casual";
        if (mode === 'deathmatch' && typeof GameInterfaceAPI !== 'undefined') {
            if (GameInterfaceAPI.GetSettingString('mp_teammates_are_enemies') !== '0')
                mode = 'ffadm';
            else if (GameInterfaceAPI.GetSettingString('mp_dm_teammode') !== '0')
                mode = 'teamdm';
        }
        return mode;
    }

    function _ShowWinningTeam(mode) {
        return false;
    }

    function _DisplayMe() {
        if (typeof MockAdapter === 'undefined') {
            return false;
        }

        var data = MockAdapter.GetAllPlayersMatchDataJSO();
        if (data && data.allplayerdata && data.allplayerdata.length > 0) {
            _m_arrAllPlayersMatchDataJSO = data.allplayerdata;
        } else {
            return false;
        }

        if (typeof EndOfMatch !== 'undefined' && EndOfMatch.EnableToggleBetweenScoreboardAndCharacters) {
            EndOfMatch.EnableToggleBetweenScoreboardAndCharacters();
        }

        var localPlayerSet = _m_arrAllPlayersMatchDataJSO.filter(function(oPlayer) { 
            return oPlayer['xuid'] === MockAdapter.GetLocalPlayerXuid(); 
        });
        var localPlayer = (localPlayerSet.length > 0) ? localPlayerSet[0] : undefined;

        var oMatchEndData = MockAdapter.GetMatchEndWinDataJSO();
        var teamNumToShow = 3;
        var losingTeamNum = oMatchEndData ? oMatchEndData.losing_team_number : 0;
        var mode = _GetModeForEndOfMatchPurposes();

        if (localPlayer && !_ShowWinningTeam(mode)) {
            _m_localPlayer = localPlayer;
            teamNumToShow = _m_localPlayer['teamnumber'];
        } else {
            if (oMatchEndData)
                teamNumToShow = oMatchEndData["winning_team_number"];
            
            if (!teamNumToShow && localPlayer) {
                _m_localPlayer = localPlayer;
                teamNumToShow = _m_localPlayer['teamnumber'];
            }
        }

        _m_teamToShow = (teamNumToShow === 2) ? "TERRORIST" : "CT";

        _SetupPanel(mode);

        var arrPlayerList = _CollectPlayersForMode(mode);
        arrPlayerList = _SortPlayers(mode, arrPlayerList);

        var gapIndex = -1;
        if (mode === 'scrimcomp2v2' && arrPlayerList.length > 0) {
            var firstTeamNum = arrPlayerList[0].teamnumber;
            for (var i = 0; i < arrPlayerList.length; i++) {
                if (arrPlayerList[i].teamnumber !== firstTeamNum) {
                    gapIndex = i;
                    break;
                }
            }
        }

        var elRoot = $('#id-eom-characters-root');
        var elCLU = elRoot ? elRoot.FindChildTraverse("id-eom-characters__player-container") : null;
        var mapCheers = {};

        if (_m_localPlayer && typeof ItemInfo !== 'undefined') {
            var arrLocalPlayer = _m_localPlayer.hasOwnProperty('items') ? _m_localPlayer.items.filter(function(oItem) { return ItemInfo.IsCharacter(oItem.itemid); }) : [];
            var localPlayerModel = arrLocalPlayer.length > 0 ? arrLocalPlayer[0] : "";    
            var localPlayerCheer = "";

            if (localPlayerModel) {
                var isDefeatEnabled = typeof GameInterfaceAPI !== 'undefined' && GameInterfaceAPI.GetSettingString('eom_local_player_defeat_anim_enabled') !== '0';
                if (_m_localPlayer['teamnumber'] === losingTeamNum && isDefeatEnabled && typeof ItemInfo.GetDefaultDefeat === 'function') {
                    localPlayerCheer = ItemInfo.GetDefaultDefeat(localPlayerModel['itemid']);
                } else if (typeof ItemInfo.GetDefaultCheer === 'function') {
                    localPlayerCheer = ItemInfo.GetDefaultCheer(localPlayerModel['itemid']);
                }
            }
            mapCheers[localPlayerCheer] = 1;
        }

        if (elCLU && typeof CharacterLineUp !== 'undefined') {
            var oSettings = {
                'numCharacters': arrPlayerList.length,
                'characterShowDelay': 0,
                'displayCommendButton': _ShouldDisplayCommendsInMode(mode)
            };
            CharacterLineUp.Init(elCLU, oSettings);
        }

        arrPlayerList.forEach(function(oPlayer, index) {
            if (oPlayer) {
                var settings = { display_immediately: true, cameraPreset: 10 };
                var cheer = "";
                var playerModelItem = '';
                
                if ('items' in oPlayer && typeof ItemInfo !== 'undefined') {
                    playerModelItem = oPlayer['items'].filter(function(oItem) { return ItemInfo.IsCharacter(oItem['itemid']); })[0];
                    
                    var glovesItem = oPlayer['items'].filter(function(oItem) { return typeof ItemInfo.IsGloves === 'function' && ItemInfo.IsGloves(oItem['itemid']); })[0];
                    if (glovesItem) settings.glovesItemId = glovesItem['itemid'];

                    var weaponItem = oPlayer['items'].filter(function(oItem) { return typeof ItemInfo.IsWeapon === 'function' && (ItemInfo.IsWeapon(oItem['itemid']) || (typeof ItemInfo.IsMelee === 'function' && ItemInfo.IsMelee(oItem['itemid']))); })[0];
                    if (weaponItem) settings.weaponItemId = weaponItem['itemid'];
                }

                if (playerModelItem && typeof ItemInfo !== 'undefined') {
                    if (oPlayer.teamnumber === losingTeamNum && typeof ItemInfo.GetDefaultDefeat === 'function') {
                        cheer = ItemInfo.GetDefaultDefeat(playerModelItem['itemid']);
                    } else if (typeof ItemInfo.GetDefaultCheer === 'function') {
                        cheer = ItemInfo.GetDefaultCheer(playerModelItem['itemid']);
                    }
                }

                if (oPlayer !== _m_localPlayer && mapCheers[cheer] === 1) cheer = "";
                mapCheers[cheer] = 1;
                
                settings.arrModifiers = [cheer];
                settings.activity = cheer === "" ? 'ACT_CSGO_UIPLAYER_WALKUP' : 'ACT_CSGO_UIPLAYER_CELEBRATE';

                _AddModeSpecificSettings(mode, settings, index, arrPlayerList);
                var label = oPlayer['xuid'];

                if (elCLU && typeof CharacterLineUp !== 'undefined') {
                    CharacterLineUp.AddPlayer(elCLU, label, oPlayer, settings);
                    var elCharacter = CharacterLineUp.GetPlayerPanel(elCLU, label);
                    if (elCharacter) elCharacter.AddClass('brightmodel');
                }
            }
        });

        if (elCLU && typeof CharacterLineUp !== 'undefined') {
            CharacterLineUp.DisplayAll(elCLU);
        }

        _CreatePlayerStatCards(arrPlayerList, gapIndex, m_bNoGimmeAccolades);
        return true;
    }

    function _CreatePlayerStatCards(arrPlayerList, gapIndex, bNoGimmes) {
        if (!arrPlayerList || arrPlayerList.length === 0) return;

        var arrBestStats = [
            { stat: 'adr', value: null, elCard: null },
            { stat: 'hsp', value: null, elCard: null },
            { stat: 'enemiesflashed', value: null, elCard: null },
            { stat: 'utilitydamage', value: null, elCard: null }
        ];

        var nPlayerCount = arrPlayerList.length + (gapIndex >= 0 ? 1 : 0);
        var elRoot = $('#id-eom-characters-root');
        if (!elRoot) return;

        for (var i = 0; i < arrPlayerList.length; i++) {
            var oPlayer = arrPlayerList[i];
            if (!oPlayer) continue;

            var oTitle = oPlayer.nomination;
            var index = i;
            if (index >= gapIndex && gapIndex >= 0) index += 1;

            if (oTitle !== undefined) {
                var xuid = oPlayer.xuid;
                var elCardContainer = $.CreatePanel('Panel', elRoot, 'cardcontainer-' + xuid);
                elCardContainer.AddClass('player-stats-card-container');
                elCardContainer.style.zIndex = (index * 10).toString();

                if (typeof PlayerStatsCard !== 'undefined') {
                    var elCard = PlayerStatsCard.Init(elCardContainer, xuid, index);
                    var accName = typeof GameStateAPI !== 'undefined' ? GameStateAPI.GetAccoladeLocalizationString(Number(oTitle.eaccolade)) : "";
                    var showAccolade = !(bNoGimmes && accName.includes('gimme_'));
                    
                    if (showAccolade && elCard) {
                        var accValue = oTitle.value.toString();
                        var accPosition = oTitle.position.toString();
                        PlayerStatsCard.SetAccolade(elCard, accValue, accName, accPosition);
                    }

                    if (elCard) {
                        PlayerStatsCard.SetStats(elCard, xuid, arrBestStats);
                        PlayerStatsCard.SetFlair(elCard, xuid);
                        PlayerStatsCard.SetSkillGroup(elCard, xuid);
                        PlayerStatsCard.SetAvatar(elCard, xuid);
                        PlayerStatsCard.SetTeammateColor(elCard, xuid);
                    }
                }

                $.Schedule(ACCOLADE_START_TIME + (index * DELAY_PER_PLAYER), _DisplayPlayerStatsCard.bind(undefined, elCardContainer, index, nPlayerCount));
            }
        }

        if (typeof PlayerStatsCard !== 'undefined') {
            for (var j = 0; j < arrBestStats.length; j++) {
                var oBest = arrBestStats[j];
                if (oBest.elCard) PlayerStatsCard.HighlightStat(oBest.elCard, oBest.stat);
            }
        }
    }

    function _DisplayPlayerStatsCard(elCardContainer, index, nPlayerCount) {
        var elEndOfMatch = $.GetContextPanel();
        var w = elEndOfMatch.actuallayoutwidth;
        var h = elEndOfMatch.actuallayoutheight;
        
        var xMin = 1080 * (w / h) * 0.5 - 720;
        var x = xMin + 1440 * ((index + 1) / (nPlayerCount + 1));
        var charPos = { x: x, y: 540 };

        if (elCardContainer && elCardContainer.IsValid()) {
            elCardContainer.style.x = charPos.x + 'px;';
            var elCard = elCardContainer.FindChildTraverse('card');
            elCardContainer.AddClass('reveal');
            
            $.Schedule(0.3, function() {
                if (typeof PlayerStatsCard !== 'undefined' && elCard && elCard.IsValid()) {
                    PlayerStatsCard.RevealStats(elCard);
                }
            });
        }
    }

    function _SortByTeamFn(a, b) {
        var team_a = Number(a['teamnumber']);
        var team_b = Number(b['teamnumber']);
        var index_a = Number(a['slot'] !== undefined ? a['slot'] : a['entindex']);
        var index_b = Number(b['slot'] !== undefined ? b['slot'] : b['entindex']);

        if (team_a !== team_b) return team_b - team_a;
        else return index_a - index_b;
    }

    function _SortByScoreFn(a, b) {
        var score_a = (typeof MockAdapter !== 'undefined') ? MockAdapter.GetPlayerScore(a['xuid']) : 0;
        var score_b = (typeof MockAdapter !== 'undefined') ? MockAdapter.GetPlayerScore(b['xuid']) : 0;
        var index_a = Number(a['slot'] !== undefined ? a['slot'] : a['entindex']);
        var index_b = Number(b['slot'] !== undefined ? b['slot'] : b['entindex']);

        if (score_a !== score_b) return score_b - score_a;
        else return index_a - index_b;
    }

    function _SortPlayers(mode, arrPlayerList) {
        switch (mode) {
            case "scrimcomp2v2":
                arrPlayerList.sort(_SortByTeamFn);
                break;
            case "competitive":
                if (_m_localPlayer && _m_localPlayer.hasOwnProperty('xuid') &&
                    (arrPlayerList.filter(function(p) { return p.xuid === _m_localPlayer.xuid; }).length > 0)) {
                    var midpoint = Math.floor(arrPlayerList.length / 2);
                    arrPlayerList = arrPlayerList.filter(function(player) { return player['xuid'] !== _m_localPlayer['xuid']; });
                    arrPlayerList.splice(midpoint, 0, _m_localPlayer);
                }
                break;
            default:
                break;
        }

        return arrPlayerList;
    }

    function _RankRevealAll() {
        var mode = _GetModeForEndOfMatchPurposes();
        var arrPlayerList = _CollectPlayersForMode(mode);
        for (var i = 0; i < arrPlayerList.length; i++) {
            var oPlayer = arrPlayerList[i];
            if (!oPlayer) continue;
            var xuid = oPlayer.xuid;
            var elCardContainer = $.GetContextPanel().FindChildTraverse('cardcontainer-' + xuid);
            if (elCardContainer && typeof PlayerStatsCard !== 'undefined') {
                var elCard = PlayerStatsCard.GetCard(elCardContainer);
                PlayerStatsCard.SetSkillGroup(elCard, xuid);
            }
        }
    }

    function _Start() {
        _DisplayMe();
        $.DispatchEvent('PlaySoundEffect', 'UIPanorama.gameover_show', 'MOUSE');
		EndOfMatch_Music('loading');
    }
	
    function EndOfMatch_Music(type) {
        var itemId = LoadoutAPI.GetItemID('noteam', 'musickit');
        var musicId = InventoryAPI.GetItemAttributeValue(itemId, 'music id');
        var musicName = InventoryAPI.GetMusicNameFromMusicID(musicId).replace(/^#musickit_/i, '');

        if (type === 'loading' && GameStateAPI.GetCSGOGameUIStateName() === 'CSGO_GAME_UI_STATE_INGAME') {
            InventoryAPI.PlayItemPreviewMusic(itemId, 'endofmatch.mp3');
            InventoryAPI.StopItemPreviewMusic();
            $.DispatchEvent('PlaySoundEffect', 'Music.EndOfMatch.' + musicName, 'MOUSE');
        }
    }

    function _Shutdown() {
        var elRoot = $('#id-eom-characters-root');
        if (elRoot) {
            elRoot.FindChildrenWithClassTraverse('eom-chars__accolade').forEach(function(el) { 
                el.DeleteAsync(0.0); 
            });
            elRoot.RemoveAndDeleteChildren();
        }
    }

    $.RegisterForUnhandledEvent('GameState_RankRevealAll', _RankRevealAll);

    return {
        Start: _Start,
        Shutdown: _Shutdown,
        GetModeForEndOfMatchPurposes: _GetModeForEndOfMatchPurposes,
        ShowWinningTeam: _ShowWinningTeam
    };
})();