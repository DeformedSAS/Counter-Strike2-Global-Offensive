'use strict';

var PopupAcceptMatch = (function() {

    var m_hasPressedAccept = false;
    var m_numPlayersReady = 1;
    var m_numTotalClientsInReservation = 0;
    var m_numSecondsRemaining = 20;
    var m_isReconnect = false;
    var m_isNqmmAnnouncementOnly = false;
    var m_lobbySettings;
    let m_gsLocation = '';
    let m_gsPing = 0;
    var m_elTimer = $.GetContextPanel().FindChildInLayoutFile('AcceptMatchCountdown');
    var m_jsTimerUpdateHandle = false;
    var bShowPlayerSlots = false;

    var AcceptMatchMusic = function(type) {
        var itemId = LoadoutAPI.GetItemID('noteam', 'musickit');
        var musicId = InventoryAPI.GetItemAttributeValue(itemId, 'music id');
        var musicName = InventoryAPI.GetMusicNameFromMusicID(musicId);
        musicName = musicName.replace(/^#musickit_/, '');

        if (type === 'loading' && GameStateAPI.GetCSGOGameUIStateName() === 'CSGO_GAME_UI_STATE_MAINMENU') {
            $.DispatchEvent('PlayMainMenuMusic', true, true);
			_StopMenuMusic();
            InventoryAPI.PlayItemPreviewMusic(itemId, 'startround_01.mp3');
            InventoryAPI.StopItemPreviewMusic();
            $.Schedule(0.01, function() {
                $.DispatchEvent('PlaySoundEffect', 'Music.StartRound.' + musicName, 'MOUSE');
            });
        }
    };

    var _Init = function() {
        m_lobbySettings = LobbyAPI.GetSessionSettings() || { game: {} };
        var mode = m_lobbySettings.game.mode || 'unknown';

        m_gsLocation = $.GetContextPanel().GetAttributeString('location', '');
        m_gsPing = parseInt($.GetContextPanel().GetAttributeString('ping', ''));
        $.GetContextPanel().SetDialogVariable('region', m_gsLocation);
        $.GetContextPanel().SetDialogVariableInt('ping', m_gsPing);

        m_numTotalClientsInReservation = 10;
        switch (mode) {
            case 'competitive':
            case 'skirmish':
            case 'scrimcomp5v5':
                m_numTotalClientsInReservation = 10;
                break;
            case 'scrimcomp2v2':
            case 'competitive_wingman':
                m_numTotalClientsInReservation = 4;
                break;
            case 'survival':
                m_numTotalClientsInReservation = 18;
                break;
            case 'deathmatch':
            case 'casual':
            case 'skirmish':
                m_numTotalClientsInReservation = 2;
                break;
        }

        var elPlayerSlots = $.GetContextPanel().FindChildInLayoutFile('AcceptMatchSlots');
        elPlayerSlots.RemoveAndDeleteChildren();

        var mapgroup = m_lobbySettings.game || {};
        var mapsList = (mapgroup.mapgroupname || '').split(',');
        var map = mapsList[0] ? mapsList[0].replace(/mg_/g, '') : 'de_dust2';

        if (map.charAt(0) === '@' || mode === 'casual' || mode === 'deathmatch' || mode === 'skirmish') {
            m_isNqmmAnnouncementOnly = true;
            m_hasPressedAccept = true;
            if (map.charAt(0) === '@') map = map.substr(1);
        }

        m_isReconnect = false;

        if (!m_isReconnect && m_lobbySettings && m_lobbySettings.game) {
            var elAgreement = $.GetContextPanel().FindChildInLayoutFile('Agreement');
            elAgreement.visible = true;

            var elAgreementComp = $.GetContextPanel().FindChildInLayoutFile('AcceptMatchAgreementCompetitive');
            elAgreementComp.visible = (mode === 'competitive');
        }

        $.DispatchEvent('ShowReadyUpPanel', '');

        if (m_isNqmmAnnouncementOnly) {
            $('#AcceptMatchSlots').visible = false;
            $('#AcceptMatchDataContainer').SetHasClass('auto', true);
            _UpdateUiState();
            m_jsTimerUpdateHandle = $.Schedule(4, _OnNqmmAutoReadyUp);
        } else {
            _SetMatchData(map);
            _PopulatePlayerList();
            _UpdateUiState();
            m_jsTimerUpdateHandle = $.Schedule(1.0, _OnTimerUpdate);
        }

        _UpdateGameServerUi();
		AcceptMatchMusic('loading');
    };

    var _UpdateGameServerUi = function() {
        var elGameServer = $.GetContextPanel().FindChildInLayoutFile('AcceptMatchGameServer');
        if (!elGameServer) return;

        elGameServer.SetHasClass(
            'hidden',
            m_hasPressedAccept || m_isReconnect || m_isNqmmAnnouncementOnly || !(m_gsLocation && m_gsPing)
        );
    };

	function _PopulatePlayerList() {
		return;		
	}

	var _MakeAvatar = function( xuid, elTeammates, bisTeamLister = false ) {
		var panelType = bisTeamLister ? 'Button' : 'Panel';
		var elAvatar = $.CreatePanel( panelType, elTeammates, xuid );
		elAvatar.BLoadLayoutSnippet( 'SmallAvatar' );

		if(bisTeamLister ) {
			_AddOpenPlayerCardAction( elAvatar, xuid );
		}

		elAvatar.FindChildTraverse('JsAvatarImage').steamid = xuid;
		var elTeamColor = elAvatar.FindChildInLayoutFile( 'JsAvatarTeamColor' );
		elTeamColor.visible = false;

		var strName = FriendsListAPI.GetFriendName( xuid );
		elAvatar.SetDialogVariable( 'teammate_name', strName );
	};

	var _AddOpenPlayerCardAction = function ( elAvatar, xuid ) {
		var openCard = function ( xuid ) {
			$.DispatchEvent( 'SidebarContextMenuActive', true );
			if ( xuid !== 0 ) {
				var contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent(
					'',
					'',
					'file://{resources}/layout/context_menus/context_menu_playercard.xml', 
					'xuid='+xuid,
					function () {
						$.DispatchEvent('SidebarContextMenuActive', false )
					}
				);
				contextMenuPanel.AddClass( "ContextMenu_NoArrow" );
			}
		}
		elAvatar.SetPanelEvent( "onactivate", openCard.bind( undefined, xuid ));
	};

	var _UpdateUiState = function() {
		var btnAccept = $.GetContextPanel().FindChildInLayoutFile ( 'AcceptMatchBtn' );
		var elPlayerSlots = $.GetContextPanel().FindChildInLayoutFile ( 'AcceptMatchSlots' );
		var bHideTimer = false;
		if ( m_isNqmmAnnouncementOnly ) {
			bShowPlayerSlots = true;
			bHideTimer = true;
		}
		
		btnAccept.SetHasClass( 'hidden', m_hasPressedAccept || m_isReconnect );

		if ( bShowPlayerSlots ) {
			_UpdatePlayerSlots( elPlayerSlots );
			bHideTimer = true;
		}

		m_elTimer.GetChild(0).text = "0:"+( (m_numSecondsRemaining<10) ? "0":"")+m_numSecondsRemaining;
		m_elTimer.SetHasClass( "hidden", bHideTimer || ( m_numSecondsRemaining <= 0 ) );

		if( m_jsTimerUpdateHandle ) {
			$.CancelScheduled( m_jsTimerUpdateHandle );
			m_jsTimerUpdateHandle = false;
		}
	};

    var _UpdateTimeRemainingSeconds = function() {
        if (m_numSecondsRemaining > 0) {
            m_numSecondsRemaining--;
        }
    };

    var _OnTimerUpdate = function() {
        m_jsTimerUpdateHandle = false;
        _UpdateTimeRemainingSeconds();
        _UpdateUiState();

        if ( m_numSecondsRemaining > 0 ) {
            if ( m_hasPressedAccept ) {
                $.DispatchEvent( 'PlaySoundEffect', 'popup_accept_match_waitquiet', 'MOUSE' );
            } else {
                $.DispatchEvent( 'PlaySoundEffect', 'popup_accept_match_beep', 'MOUSE' );
            }
            m_jsTimerUpdateHandle = $.Schedule( 1.0, _OnTimerUpdate );
        } else {
            $.Schedule( 1.0, function() {
                $.DispatchEvent( "CloseAcceptPopup" );
                $.DispatchEvent( 'UIPopupButtonClicked', '' );
                LobbyAPI.StopMatchmaking();
                _OnCustomCancelPopup();

                if ( !m_hasPressedAccept ) {
                    UiToolkitAPI.ShowGenericPopupOk(
                        'DID NOT ACCEPT',
                        'A match was found for you, but you did not accept it, so you have been removed from the queue.',
                        '',
                        () => {},
                        false
                    );
                }
            });
        }
    };

	var _FriendsListNameChanged = function ( xuid ) {
		if ( !xuid ) return;
		var elNameLabel = $.GetContextPanel().FindChildTraverse( 'xuid' );
		if ( !elNameLabel ) return;
		var strName = FriendsListAPI.GetFriendName( xuid );
		elNameLabel.SetDialogVariable( 'teammate_name', strName );
	};

	var _ReadyForMatch = function ( shouldShow, playersReadyCount, numTotalClientsInReservation ) {
		playersReadyCount = 9;
		if( !shouldShow ) {
			if( m_jsTimerUpdateHandle ) {
				$.CancelScheduled( m_jsTimerUpdateHandle );
				m_jsTimerUpdateHandle = false;
			}
			$.DispatchEvent( "CloseAcceptPopup" );
			$.DispatchEvent( 'UIPopupButtonClicked', '' );
			return;
		}

		if ( m_hasPressedAccept && m_numPlayersReady && ( playersReadyCount > m_numPlayersReady ) ) {
			$.DispatchEvent( 'PlaySoundEffect', 'popup_accept_match_person', 'MOUSE' );
		}

		if ( playersReadyCount == 1 && numTotalClientsInReservation == 1 && ( m_numTotalClientsInReservation > 1 ) ) {	                                                                                 
			numTotalClientsInReservation = m_numTotalClientsInReservation;
			playersReadyCount = m_numTotalClientsInReservation;
		}
		m_numPlayersReady = playersReadyCount;
		m_numTotalClientsInReservation = numTotalClientsInReservation;
		_UpdateTimeRemainingSeconds();
		_UpdateUiState();

		m_jsTimerUpdateHandle = $.Schedule( 1.0, _OnTimerUpdate );
	};

	var _UpdatePlayerSlots = function ( elPlayerSlots ) {
		for( var i = 0; i < m_numTotalClientsInReservation; i++ ) {
			var Slot = $.GetContextPanel().FindChildInLayoutFile( 'AcceptMatchSlot' + i );
			if( !Slot ) {
				Slot = $.CreatePanel( 'Panel', elPlayerSlots, 'AcceptMatchSlot' + i );
				Slot.BLoadLayoutSnippet( 'AcceptMatchPlayerSlot' );
			}
			Slot.SetHasClass ( 'accept-match__slots__player--accepted', ( i < m_numPlayersReady ) );
		}

		var labelPlayersAccepted = $.GetContextPanel().FindChildInLayoutFile( 'AcceptMatchPlayersAccepted' );
		labelPlayersAccepted.SetDialogVariableInt( 'accepted', m_numPlayersReady );
		labelPlayersAccepted.SetDialogVariableInt( 'slots', m_numTotalClientsInReservation );
		labelPlayersAccepted.text = $.Localize( '#match_ready_players_accepted', labelPlayersAccepted );
	};

	var _SetMatchData = function ( map ) {
		if ( !m_lobbySettings || !m_lobbySettings.game ) return;

		var labelData = $.GetContextPanel().FindChildInLayoutFile ( 'AcceptMatchModeMap' );
		var strLocalize = '#match_ready_match_data';
		labelData.SetDialogVariable( 'mode', $.Localize( '#SFUI_GameMode_' + m_lobbySettings.game.mode ) );

		var flags = parseInt( m_lobbySettings.game.gamemodeflags );
		if ( GameModeFlags.DoesModeUseFlags( m_lobbySettings.game.mode ) && flags ) {
			labelData.SetDialogVariable( 'modifier', $.Localize( '#play_setting_gamemodeflags_' + m_lobbySettings.game.mode + '_' + flags ) );
			strLocalize = '#match_ready_match_data_modifier';
		}

		if( MyPersonaAPI.GetElevatedState() === 'elevated' && SessionUtil.DoesGameModeHavePrimeQueue( m_lobbySettings.game.mode ) && ( m_lobbySettings.game.prime !== 1 || !SessionUtil.AreLobbyPlayersPrime() )) {
			$.GetContextPanel().FindChildInLayoutFile( 'AcceptMatchWarning' ).RemoveClass( 'hidden' );
		}

		labelData.SetDialogVariable ( 'map', $.Localize( '#SFUI_Map_' + map ) );

		if ( ( m_lobbySettings.game.mode === 'competitive' ) && ( map === 'lobby_mapveto' ) ) {
			$('#AcceptMatchModeIcon').SetImage( "file://{images}/icons/ui/competitive_teams.svg" );
			if ( m_lobbySettings.options && m_lobbySettings.options.challengekey ) {
				strLocalize = '#match_ready_match_data_map';
				labelData.SetDialogVariable ( 'map', $.Localize( '#SFUI_Lobby_LeaderMatchmaking_Type_PremierPrivateQueue' ) );
			}
		}

		labelData.text = $.Localize( strLocalize, labelData );
		var imgMap = $.GetContextPanel().FindChildInLayoutFile ( 'AcceptMatchMapImage' );		
		imgMap.style.backgroundImage = 'url("file://{images}/map_icons/screenshots/360p/' + map + '.png")';
	};

    var _OnNqmmAutoReadyUp = function () {
        m_jsTimerUpdateHandle = false;
        $.DispatchEvent('PlaySoundEffect', 'popup_accept_match_confirmed', 'MOUSE');
        $.DispatchEvent("CloseAcceptPopup");
        $.DispatchEvent('UIPopupButtonClicked', '');
        LobbyAPI.StopMatchmaking();

        var gameSettings = LobbyAPI.GetSessionSettings().game || {};
        var mapsList = (gameSettings.mapgroupname || '').split(',');
        var map = mapsList[0] ? mapsList[0].replace(/mg_/g, '') : 'de_dust2';
    	_OnCustomCancelPopup();

        GameInterfaceAPI.ConsoleCommand(
            "mp_force_pick_time 0; game_mode 1; game_type 0; map " + map
        );
    };

var _OnAcceptMatchPressed = function ()
{
    m_jsTimerUpdateHandle = false;
    m_hasPressedAccept = true;
    bShowPlayerSlots = true;
    _UpdateUiState();
    
    acceptLoop();
    
    return;

    function acceptLoop() {
        var IsLetsRoll = true;

        function loop() {
            const randomDelay = Math.random() * 2;

            if (m_numPlayersReady < m_numTotalClientsInReservation) {
                m_numPlayersReady++;

                if (m_numPlayersReady === m_numTotalClientsInReservation) {
                    $.DispatchEvent('PlaySoundEffect', 'popup_accept_match_confirmed', 'MOUSE');
                } else {
                    $.DispatchEvent('PlaySoundEffect', 'popup_accept_match_person', 'MOUSE');
                }

                _UpdateUiState();
            }

            $.Schedule(randomDelay, function() {

                if (m_numPlayersReady === m_numTotalClientsInReservation) {

                    if (IsLetsRoll) {
                        IsLetsRoll = false;

                        var settings = LobbyAPI.GetSessionSettings().game;
                        var mapsList = (settings.mapgroupname || 'mg_de_dust2').split(',');
                        var map = mapsList[0].replace(/mg_/g, "");

                        GameInterfaceAPI.ConsoleCommand(
                            "mp_force_pick_time 0; game_mode 1; game_type 0; map " + map
                        );

                        LobbyAPI.StopMatchmaking();
                        $.DispatchEvent("CloseAcceptPopup");
                    }

                    return;
                }

                loop();

            });
        }

        loop();
    }
};
	
	var _OnCustomCancelPopup = function() {
		$.DispatchEvent( "CloseAcceptPopup" );
		InventoryAPI.StopItemPreviewMusic();
		$.DispatchEvent('PlayMainMenuMusic', true, true );
		m_jsTimerUpdateHandle = false;
		LobbyAPI.SetLocalPlayerReady( 'deferred' );
		$.DispatchEvent( "CloseAcceptPopup" );
		$.DispatchEvent( 'UIPopupButtonClicked', '' );
        $.Schedule(0.1, function () {
            _PlayMenuSong();
        });
	};
	
	function _PlayMenuSong() {
	    $.DispatchEvent('PlayMainMenuMusic', true, false ); 
	}
	
    function _StopMenuMusic() {
        $.DispatchEvent('PlayMainMenuMusic', false, true);
    }

	return {
		Init					: _Init,
		ReadyForMatch			: _ReadyForMatch,
		FriendsListNameChanged	: _FriendsListNameChanged,
		OnAcceptMatchPressed	: _OnAcceptMatchPressed,
		OnCustomCancelPopup	: _OnCustomCancelPopup
	}

})();

(function() {
	$.RegisterForUnhandledEvent( 'PanoramaComponent_FriendsList_NameChanged', PopupAcceptMatch.FriendsListNameChanged );
	$.RegisterForUnhandledEvent( 'PanoramaComponent_Lobby_ReadyUpForMatch', PopupAcceptMatch.ReadyForMatch );
	$.RegisterForUnhandledEvent( 'MatchAssistedAccept', PopupAcceptMatch.OnAcceptMatchPressed );
})();