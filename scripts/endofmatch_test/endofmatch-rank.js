'use strict';


var EOM_Rank = (function () {

	var _m_pauseBeforeEnd = 1.0;
	var _m_cP = $.GetContextPanel();
	GameInterfaceAPI.ConsoleCommand('mp_match_restart_delay  60');

	_m_cP.Data().m_retries = 0;
	
	var _DisplayMe = function()
	{

		var xPPerLevel = 5000;
		
		var xp_t = ( function( reason, xp )
		{
			
			var _m_reason = reason;
			var _m_xp = xp;
	
			return {
				
				m_reason: _m_reason,
				m_xp: _m_xp
			}
		} );

		var oXpData = MockAdapter.XPDataJSO( _m_cP );
		oXpData['current_xp'] = 1000; // your current xp
		oXpData['current_level'] = 40; // your current level (level can only increase by one)
		oXpData['xp_earned'] = { // column of the levels, example -> reason(id): earned(xp)
			88: 2000,
			3: 2000
		};

		/*  IDs for xp_earned

			Old Current XP
			0 *empty text*
			1 Earned XP (Your Score x %s2 Multiplier)
			2 Earned XP (Rounds Won x %s2 Multiplier)
			3 Weekly XP Bonus
			4 Overwatch XP Reward
			5 Weekly XP Bonus (for Overwatch XP)
			6 Mission Completion
			7 Mission Bonus
			8 Blitz Mission XP
			9 Operation XP (Your score x War Game Multiplier)
			10 Operation XP (Rounds Won x Event Multiplier)
			51 Earned XP (Your Score x Reduced %s2 Multiplier)
			52 Earned XP (Rounds Won x Reduced %s2 Multiplier)
			54 Overwatch XP (Your Reward x Reduced Multiplier)
			58 Blitz Mission XP (Your XP x Reduced Multiplier)
			59 Operation XP (Event XP Exhausted)
			81 Earned XP (Your Score x Private Rank %s2 Multiplier)
			82 Earned XP (Rounds Won x Private Rank %s2 Multiplier)
			88 Blitz Mission XP (Your XP x Private Rank Blitz Multiplier)

		*/ 

		if ( !oXpData )
			return false;
		
		var elProgress = _m_cP.FindChildInLayoutFile( "id-eom-rank__bar-container" );
		var elNew = _m_cP.FindChildInLayoutFile( "id-eom-rank__new-reveal" );
		var elCurrent = _m_cP.FindChildInLayoutFile( "id-eom-rank__current" );
		var elBar = _m_cP.FindChildInLayoutFile( "id-eom-rank__bar" );
		var elRankLister = _m_cP.FindChildInLayoutFile( "id-eom-rank__lister" );
		var elRankListerItems = _m_cP.FindChildInLayoutFile( "id-eom-rank__lister__items" );

		var arrPreRankXP = [];                                     
		var arrPostRankXP = [];                                    
		var totalXP = 0;

		var maxLevel = 40;

		               
		var currentRank = oXpData[ "current_level" ];
		currentRank = currentRank < maxLevel ? currentRank : maxLevel;

		elCurrent.SetDialogVariableInt( "level", currentRank );
		elCurrent.SetDialogVariable( 'name', $.Localize( '#XP_RankName_' + currentRank, elCurrent ) );
	
		_m_cP.FindChildInLayoutFile( "id-eom-rank__current__emblem" ).SetImage( "file://{images}/icons/xp/level" + currentRank + ".png" );

		            
		var newRank = currentRank < maxLevel ?  ( currentRank + 1 ) : maxLevel;
		$.Msg(newRank);
		
		elNew.SetDialogVariableInt( "level", newRank );
		elNew.SetDialogVariable( 'rank_new_name', $.Localize( '#XP_RankName_' + newRank, elNew ) );
		_m_cP.SetDialogVariable( 'rank_new_rank', $.Localize( '#XP_RankName_Display_Rank', elNew ) );

		_m_cP.FindChildInLayoutFile( "id-eom-rank__new-reveal__emblem" ).SetImage( "file://{images}/icons/xp/level" + newRank + ".png" );

		var elCurrentListerItem;

		var _xpSoundNum = 1;

		var xp = 0;

		var _AddXPBar = function( reason, xp )
		{
			var sPerXp = 0.0005;

			var duration = sPerXp * xp;

			var sPerSoundTick = 0.082;
			for ( var t = sPerSoundTick; t < duration; t += sPerSoundTick )
			{
				$.Schedule( animTime + t, function()
				{
					$.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.XP.Ticker', 'eom-rank' );
				} );
			}

			$.Schedule( animTime, function()
			{
				if ( !elBar.IsValid() )
					return 0;

				var elRankSegment = $.CreatePanel( 'Panel', elBar, 'id-eom-rank__bar__segment' );
				elRankSegment.AddClass( "eom-rank__bar__segment" );

				                                    
				elBar.MoveChildAfter( elRankLister, elRankSegment );

				        
				var colorClass;
				if ( reason == "old" )
				{
					colorClass = "eom-rank__blue";
				}
				else if ( reason == "levelup" )
				{
					colorClass = "eom-rank__purple";
				}
				else if ( reason == "6" || reason == "7" )
				{
					colorClass = "eom-rank__yellow";
				}
				else if ( reason == "9" || reason == "10" || reason == "59" )
				{
					colorClass = "eom-rank__yellow";
				}
				else
				{
					colorClass = "eom-rank__green";
				}

				$.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.XP.Milestone_0' + _xpSoundNum.toString(), 'eom-rank' );
				if ( _xpSoundNum < 4 )
				{
					_xpSoundNum++;
				}

				elRankSegment.AddClass( colorClass );

				elRankSegment.style.width = '0%';

				$.Schedule( 0.0, function()
				{
					if ( elRankSegment && elRankSegment.IsValid() )
					{
						elRankSegment.style.width = ( xp / xPPerLevel * 70.8 ) + '%;';                               
					}
				} );
				
				elRankSegment.style.transitionDuration = duration + "s";

				                             
				if ( elCurrentListerItem )
				{
					elCurrentListerItem.AddClass( "eom-rank__lister__item--old" );
					
				}

				                    
				if ( elRankListerItems && elRankListerItems.IsValid() )
				{
					elCurrentListerItem = $.CreatePanel( 'Panel', elRankListerItems, 'id-eom-rank__lister__items__' + reason );
					elCurrentListerItem.BLoadLayoutSnippet( "snippet_rank__lister__item" );

					elCurrentListerItem.RemoveClass( "eom-rank__lister__item--appear" );

					var elAmtLabel = elCurrentListerItem.FindChildTraverse( 'id-eom-rank__lister__item__amt' );
					elAmtLabel.SetDialogVariable( "xp", xp );
					elAmtLabel.text = $.Localize( "#EOM_XP_Bar", elAmtLabel );
					elAmtLabel.AddClass( colorClass );

					var elDescLabel = elCurrentListerItem.FindChildTraverse( 'id-eom-rank__lister__item__desc' );

					elDescLabel.SetDialogVariable( "gamemode", $.Localize( "#SFUI_GameMode_" + MatchStatsAPI.GetGameMode() ) );

					elDescLabel.text = $.Localize( "#XP_Bonus_RankUp_" + reason, elDescLabel );
				}

			} );

			return duration;
		}

		                     
		totalXP += parseInt( oXpData[ "current_xp" ] );

		                
		Object.keys( oXpData[ "xp_earned" ] ).forEach( function( key, index ) 
		{

			var xp = parseInt( oXpData[ "xp_earned" ][ key ] );

			                                                          
			if ( totalXP + xp < xPPerLevel )
			{
				arrPreRankXP.push( xp_t( key, xp ) );
			}
			else
			{
				var xp_upto = xPPerLevel - totalXP;
				var xp_remainder = totalXP + xp - xPPerLevel;

				                                                                   
				if ( xp_upto > 0 )
				{
					arrPreRankXP.push( xp_t( key, xp_upto ) );
					arrPostRankXP.push( xp_t( key, xp_remainder ) );
				}
				else
					arrPostRankXP.push( xp_t( key, xp ) );
			}

			totalXP += xp;

		} );


		                                     
		  
		  
		  
		  

		function _AnimSequenceNext( func, duration = 0 )
		{
			$.Schedule( animTime, func );

			animTime += duration;
		}

		var _AnimPause = function( sec )
		{
			animTime += sec;
		}

		var animTime = 0;
		_AnimPause( 1.0 );
		              
		if ( oXpData[ "current_xp" ] > 0 )
			_AnimPause( _AddXPBar( "old", oXpData[ "current_xp" ] ) );

		         
		for ( var i = 0; i < arrPreRankXP.length; i++ )
		{
			_AnimPause( 1.0 );
			if ( arrPreRankXP[ i ].m_xp > 0 )
				_AnimPause( _AddXPBar( arrPreRankXP[ i ].m_reason, arrPreRankXP[ i ].m_xp ) );
		}

		            
		if ( totalXP >= xPPerLevel )
		{
			           
			_AnimSequenceNext( function()
			{
				$.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.XP.BarFull', 'eom-rank' );
				if ( _m_cP && _m_cP.IsValid() )
				{
					_m_cP.FindChildTraverse( "id-eom-rank__bar--shine" ).AddClass( "eom-rank__bar--shine--on" );
				}

			}, 1 );

			           
			_AnimSequenceNext( function()
			{
				$.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.XP.NewRank', 'eom-rank' );

				                             
				if ( elCurrentListerItem && elCurrentListerItem.IsValid() )
				{
					elCurrentListerItem.AddClass( "eom-rank__lister__item--old" );
				}

				                    
				elCurrentListerItem = $.CreatePanel( 'Panel', elRankListerItems, 'id-eom-rank__lister__items__' + 'rank-up' );
				elCurrentListerItem.BLoadLayoutSnippet( "snippet_rank__lister__item" );

				elCurrentListerItem.RemoveClass( "eom-rank__lister__item--appear" );

				elCurrentListerItem.FindChildTraverse( 'id-eom-rank__lister__item__amt' ).text = $.Localize( "{s:rank_new_name}", elNew );
				elCurrentListerItem.FindChildTraverse( 'id-eom-rank__lister__item__desc' ).text = $.Localize( "{s:rank_new_rank}", elNew );

			}, 1 );

			                                     
			_AnimSequenceNext( function()
			{
				if ( !elProgress || !elProgress.IsValid() || 
					!elCurrent || !elCurrent.IsValid() ||
					!elBar || !elBar.IsValid() ||
					!elNew || !elNew.IsValid() ||
					!elCurrent || !elCurrent.IsValid() )
					return;						
				
				elProgress.AddClass( "subdue" );
				elCurrent.AddClass( "subdue" );

				                 
				elBar.FindChildrenWithClassTraverse( "eom-rank__bar__segment" ).forEach( entry => entry.DeleteAsync( .0 ) );

				elNew.RemoveClass( "hidden" );

				elNew.Children().forEach( entry => entry.AddClass( "appear" ) );
				
				$.Schedule( 0.5, _PlayParticles );

				                                                                 

				elCurrent.SetDialogVariableInt( "level", newRank );
				elCurrent.SetDialogVariable( 'name', $.Localize( '#XP_RankName_' + newRank, elCurrent ) );
				_m_cP.SetDialogVariable( 'rank_new', $.Localize( '#XP_RankName_Display', elCurrent ) );

				_m_cP.FindChildTraverse( "id-eom-rank__current__label" ).text = $.Localize( "{s:rank_new}", elCurrent );

				_m_cP.FindChildTraverse( "id-eom-rank__current__emblem" ).SetImage( "file://{images}/icons/xp/level" + newRank + ".png" );

			}, 2 );

			_AnimSequenceNext( function()
			{
				if ( !elProgress || !elProgress.IsValid() || 
					!elCurrent || !elCurrent.IsValid() ||
					!elBar || !elBar.IsValid() ||
					!elNew || !elNew.IsValid() ||
					!elCurrent || !elCurrent.IsValid() )
					return;	
				
				elProgress.RemoveClass( "subdue" );
				elNew.FindChildInLayoutFile( 'id-eom-rank__new-reveal__emblem' ).AddClass( 'move-to-current-rank' );
				elNew.AddClass( "eom-rank__new-reveal--fade" );
				elCurrent.RemoveClass( "subdue" );
			} );

			  	            
			for ( var i = 0; i < arrPostRankXP.length; i++ )
			{
				_AnimPause( 1.0 );
				_AnimPause( _AddXPBar( arrPostRankXP[ i ].m_reason, arrPostRankXP[ i ].m_xp ) );
			}

			_AnimPause( 2.0 );
		}


		           
		_AnimSequenceNext( function()
		{

			                                          

		}, 1 );

		function _PlayParticles ()
		{
			var elModel = _m_cP.FindChildTraverse( 'RankParticleModel' );
			if ( !elModel || !elModel.IsValid() )
				return;

			elModel.RemoveClass( 'hidden' );
			elModel.SetCameraPosition( -15.10, 0.00, 0.00 );
			elModel.SetCameraAngles( 0.00,  0.00,  0.00 );
			elModel.AddParticleSystem( 'nuke_sparks1_glow', '', false );
			elModel.AddParticleSystem( 'nuke_sparks1_core', '', false );
		}

		_m_pauseBeforeEnd += animTime;

		return true;
	};

                                                         
                                                                      
  
  
	function _Start() 
	{
		if ( MockAdapter.GetMockData() && !MockAdapter.GetMockData().includes( 'RANK' ) )
		{
			_End();
			return;
		}
		
		if ( _DisplayMe() )
		{
			EndOfMatch.SwitchToPanel( 'eom-rank' );
			EndOfMatch.StartDisplayTimer( _m_pauseBeforeEnd );
			
			$.Schedule( _m_pauseBeforeEnd, _End );
		}
		else
		{
			_End();
			return;
		}	
	}

	function _End() 
	{
		EndOfMatch.ShowNextPanel();
	}

	function _Shutdown()
	{
	}

	                      
	return {
	    name: 'eom-rank',
		Start: _Start,
		Shutdown: _Shutdown,
	};
} )();

                                                                                                    
                                           
                                                                                                    
(function () {

	EndOfMatch.RegisterPanelObject( EOM_Rank );
})();
