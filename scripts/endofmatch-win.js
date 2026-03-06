'use strict';

var EOM_Win = ( function () {


	var _m_pauseBeforeEnd = 4.0;
	var _m_cP = $.GetContextPanel();

                                                     

	var _m_arrTopPlayerXuid = [];
	var _m_localPlayerScoreboardPosition;

	var _m_oMatchEndData = {};
	var _m_oScoreData = {};
	var _m_oTime = {};
	var _m_oResults = {};

	function _GetFreeForAllTopThreePlayers_Response( first, second, third )
	{
		_m_arrTopPlayerXuid[ 0 ] = first;
		_m_arrTopPlayerXuid[ 1 ] = second;
		_m_arrTopPlayerXuid[ 2 ] = third;

		_SetPlayerWinners();
	}	

	function _GetFreeForAllPlayerPosition_Response( pos )
	{
		_m_localPlayerScoreboardPosition = pos;
	}

function _SetVictoryStatement()
{
    var _m_oScoreData = GameStateAPI.GetScoreDataJSO();

    if ( !_m_oScoreData ||
        !_m_oScoreData["teamdata"] ||
        !_m_oScoreData["teamdata"]["CT"] ||
        !_m_oScoreData["teamdata"]["TERRORIST"] )
        return false;
   $.DispatchEvent('PlaySoundEffect', 'UIPanorama.gameover_show', 'MOUSE');

    _m_cP.FindChildTraverse('WinTeam').RemoveClass('hidden');
    var winningTeam;
    var winningTeamNumber = _m_oMatchEndData["winning_team_number"];
    var result = "eom-result-tie2";

    if (winningTeamNumber == 2) {
        winningTeam = "terrorist";
    } else if (winningTeamNumber == 3) {
        winningTeam = "ct";
    }

    var localPlayerTeamNumber = MockAdapter.GetPlayerTeamNumber(MockAdapter.GetLocalPlayerXuid());

    result = (winningTeamNumber == localPlayerTeamNumber) ? "eom-result-win2" : 
             (winningTeamNumber === 0) ? "eom-result-tie2" :
             "eom-result-loss2";

    if (winningTeam) {
        var teamAbbreviation = (winningTeam === 'ct') ? winningTeam : 't';
        _SetCoinModel(winningTeam, teamAbbreviation);
        _SetWinTeamText(winningTeam);
        _AnimStart();
    } else {
        var elWinnerLabel = $.GetContextPanel().FindChildTraverse('WinTeamBackgroundText');
        elWinnerLabel.text = $.Localize('#eom-tie');
        elWinnerLabel.TriggerClass('move');
    }

    _m_cP.SetDialogVariable("win-result", $.Localize(result));

    return true;
}



	function _SetCoinModel( winningTeam, team )
	{
		var elModel = _m_cP.FindChildTraverse( 'WinCoinModel' );
		elModel.SetScene( "resource/ui/econ/ItemModelPanelCharWeaponInspect.res",
			'models/inventory_items/scoreboard_logos/logo_' + team + '.mdl',
			false
		);
	}

	function _SetWinTeamText( team )
	{
		var elLabel = _m_cP.FindChildTraverse( 'WinTeamName' );
		var clanName = GameStateAPI.GetTeamClanName( team.toUpperCase() );
		elLabel.text = clanName;
	}

	function _AnimStart ()
	{
		var elCoinModel = $.GetContextPanel().FindChildTraverse( 'WinCoinModel' );
		var elTeamLabel = $.GetContextPanel().FindChildTraverse( 'WinTeamName' );
		var elWinnerLabel = $.GetContextPanel().FindChildTraverse( 'WinTeamBackgroundText' );

		elCoinModel.SetCameraPreset( 1, false );
		elCoinModel.RemoveClass( 'hidden' );
		elCoinModel.SetCameraPreset( 0, true );
		elWinnerLabel.TriggerClass( 'move' );
		elTeamLabel.TriggerClass( 'move' );
	}

	function _SetPlayerWinners()
	{
		var elPlayers = _m_cP.FindChildTraverse( 'WinPlayers' );
		elPlayers.RemoveClass( 'hidden' );

		elPlayers.RemoveAndDeleteChildren();

		for ( var i = 0; i < _m_arrTopPlayerXuid.length; i++ )
		{
			var elPlayer = $.CreatePanel( 'Panel', elPlayers, 'Player + entry' );
			elPlayer.BLoadLayoutSnippet( "PlayerWinner" );

			var elAvatar = elPlayer.FindChildTraverse( 'WinPlayersAvatar' );
			elAvatar.BLoadLayoutSnippet( 'AvatarPlayerCard' );

			elPlayer.FindChildTraverse( 'WinPlacement' ).text = $.Localize( "#scoreboard_arsenal_" + i );
			elPlayer.SetDialogVariable( 'winner_name', GameStateAPI.GetPlayerName( _m_arrTopPlayerXuid[ i ] ));

			var bIsBot = GameStateAPI.IsFakePlayer( _m_arrTopPlayerXuid[ i ] );
			var xuidForAvatarLookup = bIsBot ? '0' : _m_arrTopPlayerXuid[ i ];

			Avatar.Init( elAvatar, xuidForAvatarLookup, 'playercard' );

			if ( bIsBot )
			{
				var team = GameStateAPI.GetPlayerTeamName( _m_arrTopPlayerXuid[ i ] );
				elAvatar.FindChildTraverse( 'JsAvatarImage' ).SetDefaultImage( 'file://{images}/icons/scoreboard/avatar-' + team + '.png' );
				elAvatar.FindChildTraverse( 'JsAvatarImage' ).RemoveClass( 'hidden' );
			}
			

			if ( i > 0 )
			{
				elPlayer.AddClass( 'eom-win__player--small' );
			}
		}
	}

	function _DisplayMe() 
	{
		_m_oMatchEndData = MockAdapter.GetMatchEndWinDataJSO();
		_m_oScoreData = MockAdapter.GetScoreDataJSO();
		
		if ( !_m_oMatchEndData )
		{
			return false;
		}

		var bFreeForAll = ( _m_oMatchEndData[ 'winning_player' ] != 0 );

		if ( bFreeForAll )
		{
			                                                 
			                                                                                                  

			                                                
		  	                                                             
			
			return false;
		}
		else             
		{
			return _SetVictoryStatement();
		}

		return true;
	}
	                                                         
	                                                                      
	  
	  

	function _Start() 
	{
		                              

		if ( _DisplayMe() )
		{
			EndOfMatch.SwitchToPanel( 'eom-win' );
			EndOfMatch.StartDisplayTimer( _m_pauseBeforeEnd );
			
			$.Schedule( _m_pauseBeforeEnd, _End );
		}
		else
		{
			_End();
		}
	}

	function _End() 
	{
		                            

		EndOfMatch.ShowNextPanel();
	}

	function _Shutdown()
	{
	}

	                      
	return	{
        name: 'eom-win',
		Start									: _Start,
		GetFreeForAllTopThreePlayers_Response	: _GetFreeForAllTopThreePlayers_Response,
		GetFreeForAllPlayerPosition_Response:    _GetFreeForAllPlayerPosition_Response,
		Shutdown: _Shutdown,
	};
})();


                                                                                                    
                                           
                                                                                                    
(function () {

	if ( EndOfMatch )
		EndOfMatch.RegisterPanelObject( EOM_Win );


})();
