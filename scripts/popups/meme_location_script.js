var _Init = function() {
    m_lobbySettings = LobbyAPI.GetSessionSettings();

    var memeLocations = [
        "LONDON AMERIKA",
        "CYKA BLYAT IDI NAHUI",
        "KARAKIN",
        "RONDAM TI GA NA MAJKU"
    ];
    var randomIndex = Math.floor(Math.random() * memeLocations.length);
    m_gsLocation = memeLocations[randomIndex];

    m_gsPing = Math.floor(Math.random() * 200) + 20;

    $.GetContextPanel().SetDialogVariable('region', m_gsLocation);
    $.GetContextPanel().SetDialogVariableInt('ping', m_gsPing);

		          
		              
		if ( m_lobbySettings.game.mode == 'competitive' || m_lobbySettings.game.mode == 'skirmish' || m_lobbySettings.game.mode == 'scrimcomp5v5' ) {
			var m_numTotalClientsInReservation = 10;
		}
		 
		if ( m_lobbySettings.game.mode == 'scrimcomp2v2' ) {
			var m_numTotalClientsInReservation = 4;
		}
			                                 
		if ( m_lobbySettings.game.mode == 'survival' ) {
			var m_numTotalClientsInReservation = 18;
		}

		if ( m_lobbySettings.game.mode == 'deathmatch' || m_lobbySettings.game.mode == 'casual' ) {
			var m_numTotalClientsInReservation = 2;
		}
			 
			 
		var elPlayerSlots = $.GetContextPanel().FindChildInLayoutFile( 'AcceptMatchSlots' );
		elPlayerSlots.RemoveAndDeleteChildren();
		
		var settings = $.GetContextPanel().GetAttributeString( 'map_and_isreconnect', '' );

		                                           
		var settingsList = settings.split( ',' );

		// var map = settingsList[ 0 ];
		var mapgroupaaa = LobbyAPI.GetSessionSettings().game;
		var mapsList = mapgroupaaa.mapgroupname.split(',');
		var map = mapsList[0].replace(/mg_/g, "");
		if ( map.charAt( 0 ) === '@' )
		{
			m_isNqmmAnnouncementOnly = true;
			m_hasPressedAccept = true;
			map = map.substr( 1 );
		}
		
		                                                             
		// m_isReconnect = settingsList[ 1 ] === 'true' ? true : false;
		m_isReconnect = false;
		
			                                 
			                          
			                      
		 
		          

		if ( !m_isReconnect && m_lobbySettings && m_lobbySettings.game  )
		{
			                         
			var elAgreement = $.GetContextPanel().FindChildInLayoutFile( 'Agreement' );
			elAgreement.visible = true;

			var elAgreementComp = $.GetContextPanel().FindChildInLayoutFile( 'AcceptMatchAgreementCompetitive' );
			elAgreementComp.visible = ( m_lobbySettings.game.mode === "competitive" );
		}

		$.DispatchEvent( "ShowReadyUpPanel", "" );

		_SetMatchData( map );

		if ( m_isNqmmAnnouncementOnly )
		{
			$( '#AcceptMatchDataContainer' ).SetHasClass( 'auto', true );
			_UpdateUiState();
			m_jsTimerUpdateHandle = $.Schedule( 1.9, _OnNqmmAutoReadyUp );
		}
		else
{
	_UpdateUiState(); // Ensure UI is drawn before timer starts
	m_jsTimerUpdateHandle = $.Schedule( 1.0, _OnTimerUpdate );
}