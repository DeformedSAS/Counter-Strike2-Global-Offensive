"use strict";
var MainMenu = ( function() {
	var _m_bPerfectWorld = ( MyPersonaAPI.GetLauncherType() === "perfectworld" ); // china number 1!! this detects if you're launching the game in perfectworld mode.
	var _m_activeTab;
	var _m_sideBarElementContextMenuActive = false;
	var _m_elContentPanel = $( '#JsMainMenuContent' );
	var _m_playedInitalFadeUp = false;
	var _debug_d3gk_IsQOutOfDate = false;
	var _debug_d3gk_IsQVAC = false;
	var _debug_d3gk_IsQOverwatch = false;
	var _debug_d3gk_IsQOffline = false;           
	var _m_elNotificationsContainer = $( '#NotificationsContainer' );
	var _m_notificationSchedule = false;
	var _m_bVanityAnimationAlreadyStarted = false; // checks if the vanity agent anim is already playing. this is causing the vanity to appear for a split second when disconnecting from a server. unable to fix for now.
	var _m_bHasPopupNotification = false; // if you have a popup notification this will turn to true, if not it's going to stay at false.
	var _m_tLastSeenDisconnectedFromGC = 0; // last time seen on gc, this is controlled by an internal script in the games code. nothing you can do about it here.
	var _m_NotificationBarColorClasses = [ // notif color classes if you can't really read this somehow.. very simple you can add your own notification color classes. wow very cool
		"NotificationRed", "NotificationYellow", "NotificationGreen", "NotificationLoggingOn"
	];

	var _m_storePopupElement = null;
	var m_TournamentPickBanPopup = null;

	var _m_hOnEngineSoundSystemsRunningRegisterHandle = null;

	var _m_jobFetchTournamentData = null;
	const TOURNAMENT_FETCH_DELAY = 1;

	                                         
	let nNumNewSettings = UpdateSettingsMenuAlert();

	function UpdateSettingsMenuAlert()
	{ 
		let elNewSettingsAlert = $( "#MainMenuSettingsAlert" );
		if ( elNewSettingsAlert )
		{
			let nNewSettings = PromotedSettingsUtil.GetUnacknowledgedPromotedSettings().length;
			elNewSettingsAlert.SetHasClass( "has-new-settings", nNewSettings > 0 );
			elNewSettingsAlert.SetDialogVariableInt( "num_settings", nNewSettings );
			return nNewSettings;
		}
		return 0;
	}

	if ( nNumNewSettings > 0 )
	{
		var hPromotedSettingsViewedEvt = $.RegisterForUnhandledEvent( "MainMenu_PromotedSettingsViewed", function () 
		{
			UpdateSettingsMenuAlert();
			$.UnregisterForUnhandledEvent( "MainMenu_PromotedSettingsViewed", hPromotedSettingsViewedEvt );
		} );
	}

	var _OnInitFadeUp = function()
	{
		if( !_m_playedInitalFadeUp )
		{
			$( '#MainMenuContainerPanel' ).TriggerClass( 'show' );
			_m_playedInitalFadeUp = true;

			if ( GameInterfaceAPI.GetEngineSoundSystemsRunning() )
			{
				                                           
				                                                            
				_ShowOperationLaunchPopup();
				_ShowUpdateWelcomePopup();
			}
			else
			{
				                                                                                                                  
				_m_hOnEngineSoundSystemsRunningRegisterHandle = $.RegisterForUnhandledEvent( "PanoramaComponent_GameInterface_EngineSoundSystemsRunning", MainMenu.ShowOperationLaunchPopup );
			}
		}
	};

	function _FetchTournamentData ()
	{
		                                         

		                                                             
		if ( _m_jobFetchTournamentData )
			return;
		
		TournamentsAPI.RequestTournaments();
			
		_m_jobFetchTournamentData = $.Schedule( TOURNAMENT_FETCH_DELAY, function ()
		{
			_m_jobFetchTournamentData = null;
			_FetchTournamentData();
		} );
	}

	function _StopFetchingTournamentData ()
	{
		if ( _m_jobFetchTournamentData )
		{
			$.CancelScheduled( _m_jobFetchTournamentData );
			_m_jobFetchTournamentData = null;
		}
	}
var _SetBackgroundMovie = function() {
    var videoPlayer = $('#MainMenuMovie');
    var background = $('#MainMenuBackground');
    if (!(videoPlayer && videoPlayer.IsValid() && background && background.IsValid())) {
        return;
    }

    background.style.opacity = '0';
    _PauseMainMenuCharacter();

    $.Schedule(0.5, function() {
        var backgroundMovie = GameInterfaceAPI.GetSettingString('ui_mainmenu_bkgnd_movie_CC4ECB9');

        _UnPauseMainMenuCharacter();
        videoPlayer.SetAttributeString('data-type', backgroundMovie);
        videoPlayer.SetMovie("file://{resources}/videos/" + backgroundMovie + ".webm");
        videoPlayer.SetSound('UIPanorama.BG_' + backgroundMovie);
        videoPlayer.Play();

        var vanityPanel = $('#JsMainmenu_Vanity');
        if (vanityPanel && vanityPanel.IsValid()) {
            _SetVanityLightingBasedOnBackgroundMovie(vanityPanel);
        }

        background.style.opacity = '1';
        _InitVanity();
        _ForceRestartVanity();
        _LobbyPlayerUpdated();
    });
};

var _OnShowMainMenu = function() {

    $.DispatchEvent('PlayMainMenuMusic', true, true);
    $('#MainMenuNavBarHome').checked = true;

    GameInterfaceAPI.SetSettingString('panorama_play_movie_ambient_sound', '1');
    GameInterfaceAPI.ConsoleCommand("mirv_cvar_unhide_all");
    GameInterfaceAPI.ConsoleCommand('@panorama_ECO_mode 0');
    GameInterfaceAPI.SetSettingString('dsp_room', '0');
    GameInterfaceAPI.SetSettingString('snd_soundmixer', 'MainMenu_Mix');

    _m_bVanityAnimationAlreadyStarted = false;

    _SetBackgroundMovie();

    $('#MainMenuNavBarPlay').SetHasClass('pausemenu-navbar__btn-small--hidden', false);
    
    $.Schedule(0.2, function() {
        _OnInitFadeUp();
    });

    _UpdateNotifications();
    _ShowWeaponUpdatePopup();
    _UpdateInventoryBtnAlert();
    _GcLogonNotificationReceived();
    _BetaEnrollmentStatusChange();
    _UpdateStoreAlert();
    _DeleteSurvivalEndOfMatch();
    _DeletePauseMenuMissionPanel();
    _ShowHideAlertForNewEventForWatchBtn();
    _UpdateUnlockCompAlert();
    _FetchTournamentData();
};

	var _TournamentDraftUpdate = function ()
	{
		if ( !m_TournamentPickBanPopup || !m_TournamentPickBanPopup.IsValid() )
		{
			m_TournamentPickBanPopup = UiToolkitAPI.ShowCustomLayoutPopup( 'tournament_pickban_popup', 'file://{resources}/layout/popups/popup_tournament_pickban.xml' );
		}
	}

	var _m_bGcLogonNotificationReceivedOnce = false;
	var _GcLogonNotificationReceived = function()
	{
		if ( _m_bGcLogonNotificationReceivedOnce ) return;
		
		var strFatalError = MyPersonaAPI.GetClientLogonFatalError();
		if ( strFatalError
			&& ( strFatalError !== "ShowGameLicenseNoOnlineLicensePW" )                                                                                               
			&& ( strFatalError !== "ShowGameLicenseNoOnlineLicense" )	                                                                                              
			)
		{
			_m_bGcLogonNotificationReceivedOnce = true;

			if ( strFatalError === "ShowGameLicenseNeedToLinkAccountsWithMoreInfo" )
			{
				UiToolkitAPI.ShowGenericPopupThreeOptionsBgStyle( "#CSGO_Purchasable_Game_License_Short", "#SFUI_LoginLicenseAssist_PW_NeedToLinkAccounts_WW_hint", "",
					"#UI_Yes", function() { SteamOverlayAPI.OpenURL( "https://community.csgo.com.cn/join/pwlink_csgo" ); },
					"#UI_No", function() {},
					"#ShowFAQ", function() { _OnGcLogonNotificationReceived_ShowFaqCallback(); },
					"dim" );
			}
			else if ( strFatalError === "UnsupportedClientLogon" )
			{
				UiToolkitAPI.ShowGenericPopupOneOptionBgStyle( "#CS2_GO_INF_ERROR_TITLE", "#CS2_GO_INF_ERRROR_MESSAGE", "#CS2_GO_GLHF_MSG",
					"#GameUI_Quit", function () { GameInterfaceAPI.ConsoleCommand( "quit" ); },
					"blur" );
			}
			else if ( strFatalError === "ShowGameLicenseNeedToLinkAccounts" )
			{
				_OnGcLogonNotificationReceived_ShowLicenseYesNoBox( "#SFUI_LoginLicenseAssist_PW_NeedToLinkAccounts", "https://community.csgo.com.cn/join/pwlink_csgo" );
			}
			else if ( strFatalError === "ShowGameLicenseHasLicensePW" )
			{
				_OnGcLogonNotificationReceived_ShowLicenseYesNoBox( "#SFUI_LoginLicenseAssist_HasLicense_PW", "https://community.csgo.com.cn/join/pwlink_csgo?needlicense=1" );
			}
			else if ( strFatalError === "ShowGameLicenseNoOnlineLicensePW" )
			{
				                                                                                 
				                                                                                     
				                                 
				                                                                                                                                                           
			}
			else if ( strFatalError === "ShowGameLicenseNoOnlineLicense" )
			{
				                                                                                 
				                                                                                     
				                                 
				                                                                                                                                                 
			}
			else
			{
				UiToolkitAPI.ShowGenericPopupOneOptionBgStyle( "#SFUI_LoginPerfectWorld_Title_Error", strFatalError, "",
					"#GameUI_Quit", function() { GameInterfaceAPI.ConsoleCommand( "quit" ); },
					"dim" );
			}

			return;
		}
		
		var nAntiAddictionTrackingState = MyPersonaAPI.GetTimePlayedTrackingState();
		if ( nAntiAddictionTrackingState > 0 )
		{
			_m_bGcLogonNotificationReceivedOnce = true;

			var pszDialogTitle = "#SFUI_LoginPerfectWorld_Title_Info";
			var pszDialogMessageText = "#SFUI_LoginPerfectWorld_AntiAddiction1";
			var pszOverlayUrlToOpen = null;
			if ( nAntiAddictionTrackingState != 2                                        )
			{
				pszDialogMessageText = "#SFUI_LoginPerfectWorld_AntiAddiction2";
				pszOverlayUrlToOpen = "https://community.csgo.com.cn/join/pwcompleteaccountinfo";
			}
			if ( pszOverlayUrlToOpen )
			{
				UiToolkitAPI.ShowGenericPopupYesNo( pszDialogTitle, pszDialogMessageText, "",
					function() { SteamOverlayAPI.OpenURL( pszOverlayUrlToOpen ); },
					function() {} 
				);
			}
			else
			{
				UiToolkitAPI.ShowGenericPopup( pszDialogTitle, pszDialogMessageText, "" );
			}

			return;
		}
	}

	var _m_numGameMustExitNowForAntiAddictionHandled = 0;
	var _m_panelGameMustExitDialog = null;
	var _GameMustExitNowForAntiAddiction = function()
	{
		                                                                       
		if ( _m_panelGameMustExitDialog && _m_panelGameMustExitDialog.IsValid() ) return;

		                                                            
		if ( _m_numGameMustExitNowForAntiAddictionHandled >= 100 ) return;
		++ _m_numGameMustExitNowForAntiAddictionHandled;

		                                                                                       
		_m_panelGameMustExitDialog =
		UiToolkitAPI.ShowGenericPopupOneOptionBgStyle( "#GameUI_QuitConfirmationTitle", "#UI_AntiAddiction_ExitGameNowMessage", "",
					"#GameUI_Quit", function() { GameInterfaceAPI.ConsoleCommand( "quit" ); },
					"dim" );
		                                                                                  
	}

	var _OnGcLogonNotificationReceived_ShowLicenseYesNoBox = function ( strTextMessage, pszOverlayUrlToOpen )
	{
		UiToolkitAPI.ShowGenericPopupTwoOptionsBgStyle( "#CSGO_Purchasable_Game_License_Short", strTextMessage, "",
			"#UI_Yes", function() { SteamOverlayAPI.OpenURL( pszOverlayUrlToOpen ); },
			"#UI_No", function() {},
			"dim" );
	}

	var _OnGcLogonNotificationReceived_ShowFaqCallback = function ()
	{
		                         
		SteamOverlayAPI.OpenURL( "https://support.steampowered.com/kb_article.php?ref=6026-IFKZ-7043&l=schinese" );

		                                                                     
		_m_bGcLogonNotificationReceivedOnce = false;
		_GcLogonNotificationReceived();
	}

	var _BetaEnrollmentStatusChange = function ()
	{
		                                                                  
		let strMyBetaStatus = MyPersonaAPI.GetMyBetaEnrollmentStatus();
		let bShowEnrollIntoBetaButton = ( strMyBetaStatus === 'eligible' );

		var btn = $.FindChildInContext( '#JsLimitedTest' );
		if ( btn && btn.IsValid() )
			btn.SetHasClass( 'hidden', !bShowEnrollIntoBetaButton );
	}

	var _OnHideMainMenu = function ()
	{
		                        
		var vanityPanel = $( '#JsMainmenu_Vanity' );
		if ( vanityPanel )
		{
			CharacterAnims.CancelScheduledAnim( vanityPanel );
		}

		_CancelNotificationSchedule();

		UiToolkitAPI.CloseAllVisiblePopups();

		_StopFetchingTournamentData();
	};
	
	var _OnShowPauseMenu = function()
	{
		var elContextPanel = $.GetContextPanel();
		
		elContextPanel.AddClass( 'MainMenuRootPanel--PauseMenuMode' );
		 $('#MainMenuNavBarHomePause').checked = true;
		 $.DispatchEvent('PlayMainMenuMusic', false, false );  

		var bMultiplayer = elContextPanel.IsMultiplayer();
		var bQueuedMatchmaking = GameStateAPI.IsQueuedMatchmaking();
		var bTraining = elContextPanel.IsTraining();
		var bGotvSpectating = elContextPanel.IsGotvSpectating();
		var bIsCommunityServer = !_m_bPerfectWorld && MatchStatsAPI.IsConnectedToCommunityServer();
                                                                                                 
        $('#MainMenuNavBarPlay').SetHasClass('pausemenu-navbar__btn-small--hidden', true);   																								 
		$( '#MainMenuNavBarPlay' ).SetHasClass( 'mainmenu-navbar__btn-small--hidden', true );                                                                                                                                            
		$( '#MainMenuNavBarVote' ).SetHasClass( 'mainmenu-navbar__btn-small--hidden', ( bTraining ||                      bGotvSpectating ) );
		$( '#MainMenuNavBarSwitchTeams' ).SetHasClass( 'mainmenu-navbar__btn-small--hidden', ( bTraining || bQueuedMatchmaking || bGotvSpectating ) );                                                                                                                                   
		$( '#MainMenuNavBarVote' ).SetHasClass( 'mainmenu-navbar__btn-small--hidden', ( bTraining ||                      bGotvSpectating ) );                                                                               
		$( '#MainMenuNavBarReportServer' ).SetHasClass( 'mainmenu-navbar__btn-small--hidden', !bIsCommunityServer );                           
                                            
		_UpdateSurvivalEndOfMatchInstance();

		                                               
		_AddPauseMenuMissionPanel();

		                
		OnHomeButtonPressed();
	};

	var _OnHidePauseMenu = function ()
	{
		$.GetContextPanel().RemoveClass( 'MainMenuRootPanel--PauseMenuMode' );
		                                 
		_DeletePauseMenuMissionPanel();
		$.DispatchEvent('PlayMainMenuMusic', false, false );  
		                                                                  
		OnHomeButtonPressed();
	};

    function _BCheckTabCanBeOpenedRightNow(tab) {
        if (tab === 'JsInventory' || tab === 'JsMainMenuStore' || tab === 'JsLoadout') {
            const restrictions = LicenseUtil.GetCurrentLicenseRestrictions();
            if (restrictions !== false) {
                LicenseUtil.ShowLicenseRestrictions(restrictions);
                return false;
            }
        }
        if (tab === 'JsInventory' || tab === 'JsPlayerStats' || tab === 'JsLoadout' || tab === 'JsMainMenuStore') {
            if (!MyPersonaAPI.IsInventoryValid() || !MyPersonaAPI.IsConnectedToGC()) {
                UiToolkitAPI.ShowGenericPopupOk($.Localize('#SFUI_SteamConnectionErrorTitle'), $.Localize('#SFUI_Steam_Error_LinkUnexpected'), '', () => { });
                return false;
            }
        }
        return true;
    }

	var _CanOpenStatsPanel = function()
	{
		if( GameInterfaceAPI.GetSettingString( 'ui_show_subscription_alert' ) !== '1' )
		{
			GameInterfaceAPI.SetSettingString( 'ui_show_subscription_alert', '1' );
		}

		_UpdateSubscriptionAlert();
		
		var rtRecurringSubscriptionNextBillingCycle = InventoryAPI.GetCacheTypeElementFieldByIndex( 'RecurringSubscription', 0, 'time_next_cycle' );
		if( !rtRecurringSubscriptionNextBillingCycle )
		{
			$.DispatchEvent( 'OpenSubscriptionUpsell' );

			var rtTimeInitiated = InventoryAPI.GetCacheTypeElementFieldByIndex( 'RecurringSubscription', 0, 'time_initiated' );
			if ( rtTimeInitiated )
				return true;
			else
				return false;
		}
		
		return true;
	}
 	var _NavigateToTab = function( tab, XmlName )
	{
		if ( !_BCheckTabCanBeOpenedRightNow( tab ) )
		{
			 $('#MainMenuNavBarHome').checked = true;
			return;	                                                                               
		}
		$.DispatchEvent('PlayMainMenuMusic', true, false );                               
		GameInterfaceAPI.SetSettingString( 'panorama_play_movie_ambient_sound', '1' );
                    
		if( !$.GetContextPanel().FindChildInLayoutFile( tab ) )
		{
			var newPanel = $.CreatePanel('Panel', _m_elContentPanel, tab );
			newPanel.Data().elMainMenuRoot = $.GetContextPanel();
			newPanel.BLoadLayout('file://{resources}/layout/' + XmlName + '.xml', false, false );
			newPanel.RegisterForReadyEvents( true );
                                                    
			newPanel.OnPropertyTransitionEndEvent = function ( panelName, propertyName )
			{
				if( newPanel.id === panelName && propertyName === 'opacity' )
				{
					                                         
					if( newPanel.visible === true && newPanel.BIsTransparent() )
					{
						                                               
						newPanel.visible = false;
						newPanel.SetReadyForDisplay( false );
						return true;
					}
					else if ( newPanel.visible === true )
					{
						$.DispatchEvent( 'MainMenuTabShown', tab );
					}
				}
				return false;
			};
			$.RegisterEventHandler( 'PropertyTransitionEnd', newPanel, newPanel.OnPropertyTransitionEndEvent );
		}
                      
		if( _m_activeTab !== tab )
		{                                    
			if(XmlName) {
				$.DispatchEvent('PlaySoundEffect', 'tab_' + XmlName.replace('/', '_'), 'MOUSE');
			}
			if( _m_activeTab )
			{
				var panelToHide = $.GetContextPanel().FindChildInLayoutFile( _m_activeTab );
				panelToHide.AddClass( 'mainmenu-content--hidden' );          
			}
              
			_m_activeTab = tab;
			var activePanel = $.GetContextPanel().FindChildInLayoutFile( tab );
			activePanel.RemoveClass( 'mainmenu-content--hidden' );
                                                               
			activePanel.visible = true;
			activePanel.SetReadyForDisplay( true );
                                	
		}
		_ShowContentPanel();
	};

	var _ShowContentPanel = function()
	{
		if ( _m_elContentPanel.BHasClass( 'mainmenu-content--offscreen' ) ) {
			_m_elContentPanel.RemoveClass( 'mainmenu-content--offscreen' );
		}
        $.GetContextPanel().AddClass("mainmenu-content--open");
		$.DispatchEvent( 'ShowContentPanel' );
		_DimMainMenuBackground( false );
		_HideFloatingPanels();
		_HideNewsAndStore();
	};

	var _OnHideContentPanel = function()
	{
		_m_elContentPanel.AddClass( 'mainmenu-content--offscreen' );
         $.GetContextPanel().RemoveClass("mainmenu-content--open");
		                                                     
		var elActiveNavBarBtn = _GetActiveNavBarButton();
		if ( elActiveNavBarBtn && elActiveNavBarBtn.id !== 'MainMenuNavBarHome' ) {
			elActiveNavBarBtn.checked = false;
		}

		_DimMainMenuBackground( true );
		
		                                 
		if ( _m_activeTab )
		{
			var panelToHide = $.GetContextPanel().FindChildInLayoutFile( _m_activeTab );
			panelToHide.AddClass( 'mainmenu-content--hidden' );
			                                       
		}
		
		_m_activeTab = '';

		_ShowFloatingPanels();
		_ShowNewsAndStore();
	};

	var _GetActiveNavBarButton = function( )
	{
		var elNavBar = $( '#JsMainMenuTopNavBar' );
		var children = elNavBar.Children();
		var count = children.length;

		for (var i = 0; i < count; i++) 
		{
			if ( children[ i ].IsSelected() ) {
				return children[ i ];
			}
		}
	};

	                                                                                                    
	                                              
	                                                                                                    
	var _ShowHideNavDrawer = function()
	{
		UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_navdrawer.xml');
	};

	                              
	var _ExpandSidebar = function( AutoClose = false )
	{
		var elSidebar = $( '#JsMainMenuSidebar' );

		if(elSidebar.BHasClass( 'mainmenu-sidebar--minimized' ) ) {
			$.DispatchEvent( 'PlaySoundEffect', 'sidemenu_slidein', 'MOUSE' );
		}

		elSidebar.RemoveClass( 'mainmenu-sidebar--minimized' );

		$.DispatchEvent( 'SidebarIsCollapsed', false );
		_DimMainMenuBackground( false );

		if ( AutoClose )
		{
			$.Schedule( 1, _MinimizeSidebar );
		}
	};

	var _MinimizeSidebar = function()
	{
		                                                                                                 
		                                                                                               
		                           
		if ( _m_elContentPanel == null ) {
			return;
		}

		                                                                  
		                                    
		if ( _m_sideBarElementContextMenuActive ) {
			return;
		}
		
		var elSidebar = $( '#JsMainMenuSidebar' );

		if(!elSidebar.BHasClass( 'mainmenu-sidebar--minimized' ) ) {
			$.DispatchEvent( 'PlaySoundEffect', 'sidemenu_slideout', 'MOUSE' );
		}

		elSidebar.AddClass( 'mainmenu-sidebar--minimized' );

		                                                            
		                                                                    
		
		$.DispatchEvent( 'SidebarIsCollapsed', true );
		_DimMainMenuBackground( true );
	};

	var _OnSideBarElementContextMenuActive = function( bActive )
	{
		                                               
		_m_sideBarElementContextMenuActive = bActive;

		                                                                              
		                                                                      
		                                        
		var ContextMenuClosedOutsideSidebar = function ()
		{ 
			var isHover =  $( '#JsMainMenuSidebar' ).BHasHoverStyle();
			if( !isHover ) {
				_MinimizeSidebar();
			}
		};

		                                                                                       
		$.Schedule( 0.25, ContextMenuClosedOutsideSidebar );

		_DimMainMenuBackground( true );
	};

	var _DimMainMenuBackground = function( removeDim )
	{		
		if ( removeDim && _m_elContentPanel.BHasClass('mainmenu-content--offscreen') &&
			$('#mainmenu-content__blur-target').BHasHoverStyle() === false) {
			$('#MainMenuBackground').RemoveClass('Dim');
		} else
			$('#MainMenuBackground').AddClass('Dim');
	};

	                                                                                                    
	                         
	                                                                                                    

	function OnHomeButtonPressed()
	{
		$.DispatchEvent( 'HideContentPanel' );

		                                            	
		var vanityPanel = $( '#JsMainmenu_Vanity' );
		if ( vanityPanel )
		{
			 $('#MainMenuNavBarHome').checked = true;
			vanityPanel.Pause( false );
		}
	}

	function _OnQuitButtonPressed()
	{	
	$('#MainMenuNavBarHome').checked = true;
		UiToolkitAPI.ShowGenericPopupTwoOptionsBgStyle( '#UI_ConfirmExitTitle',
			'#UI_ConfirmExitMessage',
			'',
			'#UI_Quit',
			function() {
				QuitGame( 'Option1' );
			},
			'#UI_Return',
			function() {
			},
			'dim'
		);
	}

	function QuitGame( msg )
	{
		                                                 
		GameInterfaceAPI.ConsoleCommand('quit');
	}

	                                                                                                    
	                      
	                                                                                                    
	var _InitFriendsList = function( )
	{
		var friendsList = $.CreatePanel( 'Panel', $.FindChildInContext( '#mainmenu-sidebar__blur-target' ), 'JsFriendsList' );
		friendsList.BLoadLayout( 'file://{resources}/layout/friendslist.xml', false, false );
	};

	var _InitLRColumns = function ()
	{	
		var elLeftColumn = $.CreatePanel( 'Panel', $.FindChildInContext( '#JsLeftColumnContainer' ), 'JsLeftColumn' );
		elLeftColumn.BLoadLayout( 'file://{resources}/layout/mainmenu_left_column.xml', false, false );
		
		var elRightColumn = $.CreatePanel( 'Panel', $.FindChildInContext( '#JsRightColumnContainer' ), 'JsRightColumn' );
		elRightColumn.BLoadLayout( 'file://{resources}/layout/mainmenu_right_column.xml', false, false );                                                                                                 

		$.FindChildInContext( '#JsLeftColumnContainer' ).OnPropertyTransitionEndEvent = function ( panelName, propertyName )
		{
			if( elNews.id === panelName && propertyName === 'opacity')
			{
				                                         
				if( elNews.visible === false && elNews.BIsTransparent() )
				{
					                                               
					elNews.visible = false;
					elNews.SetReadyForDisplay( false );
					return true;
				}
			}

			return false;
		};

		                            
		var bFeaturedPanelIsActive = false;
		
		if ( bFeaturedPanelIsActive )
		{
			                                                                                
			                                                                                 
			_AddFeaturedPanel( 'operation/operation_mainmenu.xml', 'JsOperationPanel' );
		}
		                                                                           
		                          
		    
			_AddWatchNoticePanel();
		    
		
		_ShowFloatingPanels();
	};
	
	var _InitNewsAndStore = function ()
	{	
		                             
		_AddStream();
                          
		var elLimitedTest = $.CreatePanel( 'Panel', $.FindChildInContext( '#JsNewsContainer' ), 'JsLimitedTest' );
		elLimitedTest.BLoadLayout( 'file://{resources}/layout/mainmenu_limitedtest.xml', false, false );

		_BetaEnrollmentStatusChange();
		                          
		var elNews = $.CreatePanel( 'Panel', $.FindChildInContext( '#JsNewsContainer' ), 'JsNewsPanel' );
		elNews.BLoadLayout( 'file://{resources}/layout/mainmenu_news.xml', false, false );
                         
		var elLastMatch = $.CreatePanel( 'Panel', $.FindChildInContext( '#JsNewsContainer' ), 'JsLastMatch' );
		elLastMatch.BLoadLayout( 'file://{resources}/layout/mainmenu_lastmatch.xml', false, false );
                       
		var elStore = $.CreatePanel( 'Panel', $.FindChildInContext( '#JsNewsContainer' ), 'JsStorePanel' );
		elStore.BLoadLayout( 'file://{resources}/layout/mainmenu_store.xml', false, false );
		$.FindChildInContext( '#JsNewsContainer' ).OnPropertyTransitionEndEvent = function ( panelName, propertyName )
		{
			if( elNews.id === panelName && propertyName === 'opacity')
			{
				                                         
				if( elNews.visible === true && elNews.BIsTransparent() )
				{
					                                               
					elNews.visible = false;
					elNews.SetReadyForDisplay( false );
					return true;
				}
			}

			return false;
		};                         
		var bFeaturedPanelIsActive = false;
		if ( bFeaturedPanelIsActive )
		{                                                                               
			_AddFeaturedPanel( 'operation/operation_mainmenu.xml', 'JsOperationPanel' );
		}

			_AddWatchNoticePanel();

		_ShowNewsAndStore();
	};
	
	var _AddStream = function()
	{
		var elStream = $.CreatePanel( 'Panel', $.FindChildInContext( '#JsStreamContainer' ), 'JsStreamPanel' );
		elStream.BLoadLayout( 'file://{resources}/layout/mainmenu_stream.xml', false, false );
	};

	var _AddFeaturedPanel = function( xmlPath, panelId )
	{
		var featuredXML = 'file://{resources}/layout/' + xmlPath;
		elPanel.BLoadLayout( featuredXML, false, false );

		                                                                                                 
		var overrideStyle = ( featuredXML.indexOf( 'tournament' ) !== -1 || featuredXML.indexOf( 'operation' ) !== -1 ) ? 
			'' : 
			'news-panel-style-feature-panel-visible';

		if( overrideStyle !== '' )
		{
		}
	};
	

	var _HideMainMenuNewsPanel = function()
	{
		var elNews = $.FindChildInContext( '#JsNewsContainer' );
		elNews.SetHasClass( 'news-panel--hide-news-panel', true );

		if( elNews.BHasClass( 'news-panel-style-feature-panel-visible') )
		{
			elNews.RemoveClass( 'news-panel-style-feature-panel-visible', true );
		}
	}

	var _AddWatchNoticePanel = function()
	{
		var WatchNoticeXML = '';
		var elPanel = $.CreatePanel( 'Panel', $.FindChildInContext( '#JsLeftColumnContainer' ), 'JsWatchNoticePanel' );
		elPanel.BLoadLayout( WatchNoticeXML, false, false );
	}
	
	var _ShowFloatingPanels = function ()
	{
		var elPanel = $.FindChildInContext( '#JsLeftColumnContainer' );
		elPanel.SetHasClass( 'hidden', false );
		
		var elPanel = $.FindChildInContext( '#JsRightColumnContainer' );
		elPanel.SetHasClass( 'hidden', false );

		elPanel = $.FindChildInContext( '#JsActiveMissionPanel' );
		elPanel.SetHasClass( 'visible', true );

		var elVanityButton = $.FindChildInContext( '#VanityControls' );
		if ( elVanityButton )
		{
			elVanityButton.visible = true;
		}

		
		elPanel = $.FindChildInContext( '#JsStreamContainer' );
		elPanel.SetHasClass( 'hidden', false );

	};

	var _HideFloatingPanels = function ()
	{
		var elPanel = $.FindChildInContext( '#JsLeftColumnContainer' );
		elPanel.SetHasClass( 'hidden', true );

		
		var elPanel = $.FindChildInContext( '#JsRightColumnContainer' );
		elPanel.SetHasClass( 'hidden', true );

		elPanel = $.FindChildInContext( '#JsActiveMissionPanel' );
		elPanel.SetHasClass( 'hidden', true );

		var elVanityButton = $.FindChildInContext( '#VanityControls' );

		if ( elVanityButton )
		{
			elVanityButton.visible = false;
		}

		elPanel = $.FindChildInContext( '#JsStreamContainer' );
		elPanel.SetHasClass( 'hidden', true );
	};
	
	var _ShowNewsAndStore = function ()
	{
		var elPanel = $.FindChildInContext( '#JsNewsContainer' );
		elPanel.SetHasClass( 'hidden', false );

		elPanel = $.FindChildInContext( '#JsActiveMissionPanel' );
		elPanel.SetHasClass( 'hidden', false );
		
		elPanel = $.FindChildInContext( '#JsStreamContainer' );
		elPanel.SetHasClass( 'hidden', false );

	};

	var _HideNewsAndStore = function ()
	{
		var elPanel = $.FindChildInContext( '#JsNewsContainer' );
		elPanel.SetHasClass( 'hidden', true );

		elPanel = $.FindChildInContext( '#JsActiveMissionPanel' );
		elPanel.SetHasClass( 'hidden', true );

		elPanel = $.FindChildInContext( '#JsStreamContainer' );
		elPanel.SetHasClass( 'hidden', true );
	};
                                              
	var _OnSteamIsPlaying = function()
    {
		var elNewsContainer = $.FindChildInContext( '#JsLeftColumnContainer' );

		if ( elNewsContainer )
		{
			elNewsContainer.SetHasClass( 'mainmenu-news-container-stream-active', EmbeddedStreamAPI.IsVideoPlaying() );
		}
    };

    var _ResetNewsEntryStyle = function()
    {
		var elNewsContainer = $.FindChildInContext( '#JsLeftColumnContainer' );

		if ( elNewsContainer )
		{
			elNewsContainer.RemoveClass( 'mainmenu-news-container-stream-active' );
		}
    };

	                                                                                                    
	                     
	                                                                                                    

	var _ForceRestartVanity = function()
	{
		_m_bVanityAnimationAlreadyStarted = false;
		_InitVanity();
	};

	                                                                 
	function _RigVanityHover ( vanityPanel )
	{
		if ( !vanityPanel || !vanityPanel.IsValid() )
			return;
		
		var elHover = $( "#id-mainmenu-vanity-hover" );

		if ( !elHover || !elHover.IsValid )
			return;
		
		                                                                       

		                                                                         
		
		var OnMouseOver = function()
        {
			if ( $( '#VanityControls' ) )
			{
				$( '#VanityControls' ).AddClass( 'pulse-vanity-controls')
			}
		};
		
		var OnMouseOut = function()
        {
			if ( $( '#VanityControls' ) )
			{
				$( '#VanityControls' ).RemoveClass( 'pulse-vanity-controls')
			}
        };
        
		elHover.SetPanelEvent( 'onmouseover', OnMouseOver );
		elHover.SetPanelEvent( 'onmouseout', OnMouseOut );
	}

	var _InitVanity = function() // this is the vanity player agent initialization script, basically controls your stuff. api's are documented on valves forum.
	{                          
		if ( !MyPersonaAPI.IsInventoryValid() ) {                                             
			return;
		}
		if ( _m_bVanityAnimationAlreadyStarted ) {                                                                         
			return;
		}

		var oSettings = ItemInfo.GetOrUpdateVanityCharacterSettings();
		oSettings.activity = 'ACT_CSGO_UIPLAYER_WALKUP';
		oSettings.arrModifiers.push( 'vanity' );                                                               
		_ApplyVanitySettingsToLobbyMetadata( oSettings );

		var vanityPanel = $( '#JsMainmenu_Vanity' );
		if ( !vanityPanel )
		{                                                                 
			return;
		}
		oSettings.panel = vanityPanel;                                    
		vanityPanel.SetSceneAngles( 0, 0, 0, true );                                                                        
		vanityPanel.hittest = false;                               
		_m_bVanityAnimationAlreadyStarted = true;
		CharacterAnims.PlayAnimsOnPanel( oSettings );
		_SetVanityLightingBasedOnBackgroundMovie( vanityPanel );
		if ( oSettings.panel.BHasClass( 'hidden' ) ) {
			oSettings.panel.RemoveClass( 'hidden' );
		}

		_RigVanityHover( vanityPanel );                                                                  
		$.Schedule( 3.0, function() {if (vanityPanel && vanityPanel.IsValid() ) vanityPanel.hittest = true;} );
	};
	
	var _ApplyVanitySettingsToLobbyMetadata = function( oSettings ) // applies vanity settings to your steam config file. if possible that is, if not connected then it will locally save it or won't save it depending on steam.
	{                                           
		PartyListAPI.SetLocalPlayerVanityPresence( oSettings.team,
			oSettings.charItemId, oSettings.glovesItemId,
			oSettings.loadoutSlot, oSettings.weaponItemId );
	};

	var _LobbyPlayerUpdated = function() // this function does nothing and for some reason the game requires it or otherwise it won't load mainmenu.js BUG THIS!
	{
		  

		  
	};

	var _SetVanityLightingBasedOnBackgroundMovie = function( vanityPanel )
	{
		var backgroundMap = $.GetContextPanel().FindChildInLayoutFile( 'MainMenuMovie' ).GetAttributeString( 'data-type', 'anubis' );

		                                                                                                  
		                                                                             
		                                                                                    
		                                                                                   
		                                                                

		                                                                                                                 
		vanityPanel.RestoreLightingState();

		if ( backgroundMap === 'overpass' )
		{
			vanityPanel.SetFlashlightAmount( 2 );
			                                               
			vanityPanel.SetFlashlightFOV( 60 );                                     
			                                                            
			vanityPanel.SetFlashlightColor( 4, 4, 4);
			vanityPanel.SetAmbientLightColor( 0.25, 0.20, 0.35 );

			vanityPanel.SetDirectionalLightModify( 0 );
			vanityPanel.SetDirectionalLightColor(0.00, 0.19, 0.38 );
			vanityPanel.SetDirectionalLightDirection( 0.6, 0.67, -0.71 );
			
			vanityPanel.SetDirectionalLightModify( 1 );
			vanityPanel.SetDirectionalLightColor( 0.05, 0.09, 0.21) ;
			vanityPanel.SetDirectionalLightDirection(-0.86, -0.18, -0.47 );

			vanityPanel.SetDirectionalLightModify( 2 );
			vanityPanel.SetDirectionalLightColor( 0.0, 0.0, 0.0 );
			vanityPanel.SetDirectionalLightDirection( 0.76, 0.48, -0.44 );
		}
		else if ( backgroundMap === 'dust2' )
		{
			vanityPanel.SetFlashlightAmount( 4.5 );
			                                               
			                                                            
			                                                       
			vanityPanel.SetFlashlightFOV( 60 );
			                                                            
			vanityPanel.SetFlashlightColor( 1.8, 1.8, 2 );
			vanityPanel.SetAmbientLightColor( 0.27, 0.3, 0.4 );
			
			vanityPanel.SetDirectionalLightModify( 0 );
			vanityPanel.SetDirectionalLightColor(0.00, 0.19, 0.38 );
			vanityPanel.SetDirectionalLightDirection( 0.1, 0.67, -0.71 );
			
			vanityPanel.SetDirectionalLightModify( 1 );
			vanityPanel.SetDirectionalLightColor( 0.05, 0.09, 0.21) ;
			vanityPanel.SetDirectionalLightDirection(-0.86, -0.18, -0.47 );

			vanityPanel.SetDirectionalLightModify( 2 );
			vanityPanel.SetDirectionalLightColor( 0.0, 0.0, 0.0 );
			vanityPanel.SetDirectionalLightDirection( 0.76, 0.48, -0.44 );
		}
else if (backgroundMap === 'sirocco') {
			vanityPanel.SetFlashlightAmount( 3 );
			                                               
			                                                            
			                                                       
			vanityPanel.SetFlashlightFOV( 60 );
			                                                            
			vanityPanel.SetFlashlightColor( 1.8, 1.8, 2 );
			vanityPanel.SetAmbientLightColor( 0.27, 0.3, 0.4 );
			
			vanityPanel.SetDirectionalLightModify( 0 );
			vanityPanel.SetDirectionalLightColor(0.00, 0.19, 0.38 );
			vanityPanel.SetDirectionalLightDirection( 0.1, 0.67, -0.71 );
			
			vanityPanel.SetDirectionalLightModify( 1 );
			vanityPanel.SetDirectionalLightColor( 0.05, 0.09, 0.21) ;
			vanityPanel.SetDirectionalLightDirection(-0.86, -0.18, -0.47 );

			vanityPanel.SetDirectionalLightModify( 2 );
			vanityPanel.SetDirectionalLightColor( 0.0, 0.0, 0.0 );
			vanityPanel.SetDirectionalLightDirection( 0.76, 0.48, -0.44 );
}

else if ( backgroundMap === 'nuke' )
{
    vanityPanel.SetFlashlightAmount( 7 );
    vanityPanel.SetFlashlightFOV( 60 );
    vanityPanel.SetFlashlightColor( 1.9, 1.7, 1.5 );

    vanityPanel.SetAmbientLightColor( 0.22, 0.24, 0.28 );

    vanityPanel.SetDirectionalLightModify( 0 );
    vanityPanel.SetDirectionalLightColor( 0.22, 0.22, 0.22 );
    vanityPanel.SetDirectionalLightDirection( 0.0, 0.0, -1.0 );

    vanityPanel.SetDirectionalLightModify( 1 );
    vanityPanel.SetDirectionalLightColor( 0.12, 0.12, 0.12 );
    vanityPanel.SetDirectionalLightDirection( 0.5, 0.2, -0.7 );

    vanityPanel.SetDirectionalLightModify( 2 );
    vanityPanel.SetDirectionalLightColor( 0.08, 0.08, 0.08 );
    vanityPanel.SetDirectionalLightDirection( -0.5, 0.3, -0.7 );
}


		else if ( backgroundMap === 'train' )
		{
			vanityPanel.SetFlashlightAmount( 1 );
			                                               
			                                                            
			                                                       
			vanityPanel.SetFlashlightFOV( 60 );
			                                                            
			vanityPanel.SetFlashlightColor( 1.8, 1.8, 2 );
			vanityPanel.SetAmbientLightColor(0.15, 0.2, 0.45);

			
			vanityPanel.SetDirectionalLightModify( 0 );
			vanityPanel.SetDirectionalLightColor(0.00, 0.19, 0.38 );
			vanityPanel.SetDirectionalLightDirection( 0.1, 0.67, -0.71 );
			
			vanityPanel.SetDirectionalLightModify( 1 );
			vanityPanel.SetDirectionalLightColor( 0.05, 0.09, 0.21) ;
			vanityPanel.SetDirectionalLightDirection(-0.86, -0.18, -0.47 );

			vanityPanel.SetDirectionalLightModify( 2 );
			vanityPanel.SetDirectionalLightColor( 0.0, 0.0, 0.0 );
			vanityPanel.SetDirectionalLightDirection( 0.76, 0.48, -0.44 );                                               
		}
		else if ( backgroundMap === 'office' )
		{
			vanityPanel.SetFlashlightAmount( 1 );
			                                               
			                                                            
			                                                       
			vanityPanel.SetFlashlightFOV( 60 );
			                                                            
			vanityPanel.SetFlashlightColor( 1.8, 1.8, 2 );
			vanityPanel.SetAmbientLightColor(0.15, 0.2, 0.45);

			
			vanityPanel.SetDirectionalLightModify( 0 );
			vanityPanel.SetDirectionalLightColor(0.00, 0.19, 0.38 );
			vanityPanel.SetDirectionalLightDirection( 0.1, 0.67, -0.71 );
			
			vanityPanel.SetDirectionalLightModify( 1 );
			vanityPanel.SetDirectionalLightColor( 0.05, 0.09, 0.21) ;
			vanityPanel.SetDirectionalLightDirection(-0.86, -0.18, -0.47 );

			vanityPanel.SetDirectionalLightModify( 2 );
			vanityPanel.SetDirectionalLightColor( 0.0, 0.0, 0.0 );
			vanityPanel.SetDirectionalLightDirection( 0.76, 0.48, -0.44 );                                               
		}
		else if ( backgroundMap === 'anubis' )
		{
			vanityPanel.SetFlashlightAmount( 3 );
			                                               
			                                                            
			                                                       
			vanityPanel.SetFlashlightFOV( 60 );
			                                                            
			vanityPanel.SetFlashlightColor( 1.8, 1.8, 2 );
			vanityPanel.SetAmbientLightColor( 0.2, 0.25, 0.4 );
			
			vanityPanel.SetDirectionalLightModify( 0 );
			vanityPanel.SetDirectionalLightColor(0.00, 0.19, 0.38 );
			vanityPanel.SetDirectionalLightDirection( 0.1, 0.67, -0.71 );
			
			vanityPanel.SetDirectionalLightModify( 1 );
			vanityPanel.SetDirectionalLightColor( 0.05, 0.09, 0.21) ;
			vanityPanel.SetDirectionalLightDirection(-0.86, -0.18, -0.47 );

			vanityPanel.SetDirectionalLightModify( 2 );
			vanityPanel.SetDirectionalLightColor( 0.0, 0.0, 0.0 );
			vanityPanel.SetDirectionalLightDirection( 0.76, 0.48, -0.44 );                                              
		}
		else if ( backgroundMap === 'mutiny' )
		{
			vanityPanel.SetFlashlightAmount( 3 );
			                                               
			                                                            
			                                                       
			vanityPanel.SetFlashlightFOV( 60 );
			                                                            
			vanityPanel.SetFlashlightColor( 1.8, 1.8, 2 );
			vanityPanel.SetAmbientLightColor( 0.2, 0.25, 0.4 );
			
			vanityPanel.SetDirectionalLightModify( 0 );
			vanityPanel.SetDirectionalLightColor(0.00, 0.19, 0.38 );
			vanityPanel.SetDirectionalLightDirection( 0.1, 0.67, -0.71 );
			
			vanityPanel.SetDirectionalLightModify( 1 );
			vanityPanel.SetDirectionalLightColor( 0.05, 0.09, 0.21) ;
			vanityPanel.SetDirectionalLightDirection(-0.86, -0.18, -0.47 );

			vanityPanel.SetDirectionalLightModify( 2 );
			vanityPanel.SetDirectionalLightColor( 0.0, 0.0, 0.0 );
			vanityPanel.SetDirectionalLightDirection( 0.76, 0.48, -0.44 );                                              
		}
		else if ( backgroundMap === 'vertigo' )
		{
			vanityPanel.SetFlashlightAmount( 3 );
			                                               
			                                                            
			                                                       
			vanityPanel.SetFlashlightFOV( 60 );
			                                                            
			vanityPanel.SetFlashlightColor( 1.8, 1.8, 2 );
			vanityPanel.SetAmbientLightColor( 0.2, 0.25, 0.4 );
			
			vanityPanel.SetDirectionalLightModify( 0 );
			vanityPanel.SetDirectionalLightColor(0.00, 0.19, 0.38 );
			vanityPanel.SetDirectionalLightDirection( 0.1, 0.67, -0.71 );
			
			vanityPanel.SetDirectionalLightModify( 1 );
			vanityPanel.SetDirectionalLightColor( 0.05, 0.09, 0.21) ;
			vanityPanel.SetDirectionalLightDirection(-0.86, -0.18, -0.47 );

			vanityPanel.SetDirectionalLightModify( 2 );
			vanityPanel.SetDirectionalLightColor( 0.0, 0.0, 0.0 );
			vanityPanel.SetDirectionalLightDirection( 0.76, 0.48, -0.44 );                                              
		}
		else if ( backgroundMap === 'ancient' )
		{
			vanityPanel.SetFlashlightAmount( 3 );
			                                               
			                                                            
			                                                       
			vanityPanel.SetFlashlightFOV( 60 );
			                                                            
			vanityPanel.SetFlashlightColor( 1.8, 1.8, 2 );
			vanityPanel.SetAmbientLightColor( 0.2, 0.32, 0.4 );
			
			vanityPanel.SetDirectionalLightModify( 0 );
			vanityPanel.SetDirectionalLightColor(0.00, 0.19, 0.38 );
			vanityPanel.SetDirectionalLightDirection( 0.1, 0.67, -0.71 );
			
			vanityPanel.SetDirectionalLightModify( 1 );
			vanityPanel.SetDirectionalLightColor( 0.05, 0.09, 0.21) ;
			vanityPanel.SetDirectionalLightDirection(-0.86, -0.18, -0.47 );

			vanityPanel.SetDirectionalLightModify( 2 );
			vanityPanel.SetDirectionalLightColor( 0.0, 0.0, 0.0 );
			vanityPanel.SetDirectionalLightDirection( 0.76, 0.48, -0.44 );                                              
		}
		else if ( backgroundMap === 'swamp' )
		{
			vanityPanel.SetFlashlightAmount( 3 );
			                                               
			                                                            
			                                                       
			vanityPanel.SetFlashlightFOV( 60 );
			                                                            
			vanityPanel.SetFlashlightColor( 1.8, 1.8, 2 );
			vanityPanel.SetAmbientLightColor( 0.2, 0.32, 0.4 );
			
			vanityPanel.SetDirectionalLightModify( 0 );
			vanityPanel.SetDirectionalLightColor(0.00, 0.19, 0.38 );
			vanityPanel.SetDirectionalLightDirection( 0.1, 0.67, -0.71 );
			
			vanityPanel.SetDirectionalLightModify( 1 );
			vanityPanel.SetDirectionalLightColor( 0.05, 0.09, 0.21) ;
			vanityPanel.SetDirectionalLightDirection(-0.86, -0.18, -0.47 );

			vanityPanel.SetDirectionalLightModify( 2 );
			vanityPanel.SetDirectionalLightColor( 0.0, 0.0, 0.0 );
			vanityPanel.SetDirectionalLightDirection( 0.76, 0.48, -0.44 );                                              
		}
		else if ( backgroundMap === 'cache' )
		{
			vanityPanel.SetFlashlightAmount( 3 );
			                                               
			                                                            
			                                                       
			vanityPanel.SetFlashlightFOV( 60 );
			                                                            
			vanityPanel.SetFlashlightColor( 1.8, 1.8, 2 );
			vanityPanel.SetAmbientLightColor( 0.2, 0.32, 0.4 );
			
			vanityPanel.SetDirectionalLightModify( 0 );
			vanityPanel.SetDirectionalLightColor(0.00, 0.19, 0.38 );
			vanityPanel.SetDirectionalLightDirection( 0.1, 0.67, -0.71 );
			
			vanityPanel.SetDirectionalLightModify( 1 );
			vanityPanel.SetDirectionalLightColor( 0.05, 0.09, 0.21) ;
			vanityPanel.SetDirectionalLightDirection(-0.86, -0.18, -0.47 );

			vanityPanel.SetDirectionalLightModify( 2 );
			vanityPanel.SetDirectionalLightColor( 0.0, 0.0, 0.0 );
			vanityPanel.SetDirectionalLightDirection( 0.76, 0.48, -0.44 );                                              
		}
		else if ( backgroundMap === 'blacksite' )
		{
			vanityPanel.SetFlashlightAmount( 1 );
			                                               
			                                                           
			                                                            
			vanityPanel.SetFlashlightColor( 4, 4, 4);
			vanityPanel.SetAmbientLightColor( 0.16, 0.26, 0.30 );
			
			vanityPanel.SetDirectionalLightModify( 0 );
			vanityPanel.SetDirectionalLightColor( 0.26, 0.35, 0.47 );
			vanityPanel.SetDirectionalLightDirection( -0.50, 0.80, 0.00 );
			
			vanityPanel.SetDirectionalLightModify( 1 );
			vanityPanel.SetDirectionalLightColor( 0.74, 1.01, 1.36 );
			vanityPanel.SetDirectionalLightDirection( 0.47, -0.77, -0.42 );

			vanityPanel.SetDirectionalLightModify( 2 );
			vanityPanel.SetDirectionalLightColor( 0.75, 1.20, 1.94 );
			vanityPanel.SetDirectionalLightDirection( 0.76, 0.48, -0.44 );
		}
	    else if ( backgroundMap === 'cbble' )
		{
			vanityPanel.SetFlashlightAmount( 1.0 );
			                                               
			                                                            
			                                                           
			vanityPanel.SetFlashlightColor( 0.81, 0.92, 1.00 );
			vanityPanel.SetAmbientLightColor( 0.12, 0.21, 0.46 );

			vanityPanel.SetDirectionalLightModify( 0 );
			vanityPanel.SetDirectionalLightColor( 0.13, 0.14, 0.13 );
			vanityPanel.SetDirectionalLightDirection( -0.81, 0.41, 0.43 );
			
			vanityPanel.SetDirectionalLightModify( 1 );
			vanityPanel.SetDirectionalLightColor( 0.82, 0.19, 0.08 );
			vanityPanel.SetDirectionalLightDirection( 0.62, 0.74, -0.25 );
			vanityPanel.SetDirectionalLightPulseFlicker( 0.25, 0.25, 0.25, 0.25 );

			vanityPanel.SetDirectionalLightModify( 2 );
			vanityPanel.SetDirectionalLightColor( 0.72, 1.40, 1.68 );
			vanityPanel.SetDirectionalLightDirection( 0.50, -0.69, -0.52 );

			                                                   
		}
		else if ( backgroundMap === 'sirocco_night' )
		{
			vanityPanel.SetFlashlightAmount( 2 );
			                                               
			                                                            
			                                                       
			vanityPanel.SetFlashlightFOV( 45 );
			                                                            
			vanityPanel.SetFlashlightColor( 1.8, 1.8, 2 );
			vanityPanel.SetAmbientLightColor( 0.13, 0.17, 0.29 );
			
			vanityPanel.SetDirectionalLightModify( 0 );
			vanityPanel.SetDirectionalLightColor(0.00, 0.19, 0.38 );
			vanityPanel.SetDirectionalLightDirection( 0.22, 0.67, -0.71 );
			
			vanityPanel.SetDirectionalLightModify( 1 );
			vanityPanel.SetDirectionalLightColor( 0.05, 0.09, 0.21) ;
			vanityPanel.SetDirectionalLightDirection(-0.86, -0.18, -0.47 );

			vanityPanel.SetDirectionalLightModify( 2 );
			vanityPanel.SetDirectionalLightColor( 0.0, 0.0, 0.0 );
			vanityPanel.SetDirectionalLightDirection( 0.76, 0.48, -0.44 );
		}
		
	};

	                                                                           
	var _OnEquipSlotChanged = function( slot, oldItemID, newItemID )
	{
	};

  function _OpenPlayMenu() {
        if (MatchStatsAPI.GetUiExperienceType())
            return;
        _InsureSessionCreated();
        _NavigateToTab('JsPlay', 'mainmenu_play', 'Play-official');
    }
    function _OpenWatchMenu() {
        NavigateToTab('JsWatch', 'mainmenu_watch');
    }
    function _OpenInventory() {
	 _NavigateToTab('JsInventory', 'mainmenu_inventory');
	 }
    function _OpenFullscreenStore() {
        _NavigateToTab('JsMainMenuStore', 'mainmenu_store_fullscreen', 'id-store-nav-coupon');
    }
    function _OpenStatsMenu() {
        _NavigateToTab('JsPlayerStats', 'mainmenu_playerstats');
    }
    function _OpenSettingsMenu() {
        NavigateToTab('JsSettings', 'settings/settings');
    }
    var _UpdateOverwatch = function () {
        var strCaseDescription = OverwatchAPI.GetAssignedCaseDescription();
        $('#MainMenuNavBarOverwatch').SetHasClass('pausemenu-navbar__btn-small--hidden', strCaseDescription == "");
    };
    function _OpenSubscriptionUpsell() {
        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_subscription_upsell.xml', '');
    }
    function _ShowLoadoutForItem(itemId) {
        let bLoadoutPanelExisted = !!$.GetContextPanel().FindChildInLayoutFile('JsLoadout');
        $.DispatchEvent("Activated", $.GetContextPanel().FindChildInLayoutFile('MainMenuNavBarLoadout'), "mouse");
        let bLoadoutPanelExists = !!$.GetContextPanel().FindChildInLayoutFile('JsLoadout');
        if (!bLoadoutPanelExisted && bLoadoutPanelExists) {
            $.DispatchEvent("ShowLoadoutForItem", itemId);
        }
    }
    function _OpenSettings() {
        NavigateToTab('JsSettings', 'settings/settings', 'KeybdMouseSettings');
    }
    function _InsureSessionCreated() {
        if (!LobbyAPI.IsSessionActive()) {
            LobbyAPI.CreateSession();
        }
    }
	var OnEscapeKeyPressed = function( eSource, nRepeats, focusPanel ) // fixed issue with pause menu not closing and mainmenu song playing.
	{
		                                
		if ( $.GetContextPanel().BHasClass( 'MainMenuRootPanel--PauseMenuMode' ) ) {
			$.DispatchEvent( 'CSGOMainMenuResumeGame' );
		}
		else {
			MainMenu.OnHomeButtonPressed();

			var elPlayButton = $( '#MainMenuNavBarPlay' );
			if( elPlayButton && !elPlayButton.BHasClass( 'mainmenu-navbar__btn-small--hidden' ) ) {

				GameInterfaceAPI.SetSettingString('panorama_play_movie_ambient_sound', '1');
				$.DispatchEvent('PlayMainMenuMusic', true, true );
			}
		}
	};
    function _InventoryUpdated() {
        _ForceRestartVanity();
        if (GameStateAPI.IsLocalPlayerPlayingMatch()) {
            return;
        }
        _UpdateInventoryBtnAlert();
		_UpdateStoreAlert();
    }
    function _CheckRankUpRedemptionStore() {
        if (_m_bHasPopupNotification)
            return;
        if (GameStateAPI.IsLocalPlayerPlayingMatch())
            return;
        if (!$('#MainMenuNavBarHome').checked)
            return;
        const objStore = InventoryAPI.GetCacheTypeElementJSOByIndex("PersonalStore", 1);
        if (!objStore)
            return;
        if (!MyPersonaAPI.IsConnectedToGC() || !MyPersonaAPI.IsInventoryValid())
            return;
        const genTime = objStore.generation_time;
        const balance = objStore.redeemable_balance;
        const prevClientGenTime = Number(GameInterfaceAPI.GetSettingString("cl_redemption_reset_timestamp"));
        if (prevClientGenTime != genTime && balance > 0) {
            _m_bHasPopupNotification = true;
            const RankUpRedemptionStoreClosedCallbackHandle = UiToolkitAPI.RegisterJSCallback(_OnRankUpRedemptionStoreClosed);
            UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_rankup_redemption_store.xml', 'callback=' + RankUpRedemptionStoreClosedCallbackHandle);
        }
    }
    function _OnRankUpRedemptionStoreClosed() {
        _m_bHasPopupNotification = false;
        _msg('_OnRankUpRedemptionStoreClosed');
    }
	var _UpdateInventoryBtnAlert = function()
	{
		var aNewItems = AcknowledgeItems.GetItems();
		var count = aNewItems.length;
		var elNavBar = $.GetContextPanel().FindChildInLayoutFile('JsMainMenuTopNavBar'),
		elAlert = elNavBar.FindChildInLayoutFile('MainMenuInvAlert');

		elAlert.FindChildInLayoutFile('MainMenuInvAlertText').text = count;
		elAlert.SetHasClass( 'hidden', count < 1 );
	};
    function _OnInventoryInspect(id, contextmenuparam) {
        let inspectviewfunc = contextmenuparam ? contextmenuparam : 'primary';
        UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_inventory_inspect.xml', `itemid=${id}&inspectonly=true&viewfunc=${inspectviewfunc}`);
    }
    function _OnShowXrayCasePopup(toolid, caseId, bShowPopupWarning = false) {
        const showpopup = bShowPopupWarning ? 'yes' : 'no';
        UiToolkitAPI.ShowCustomLayoutPopupParameters('popup-inspect-' + caseId, 'file://{resources}/layout/popups/popup_capability_decodable.xml', 'key-and-case=' + toolid + ',' + caseId +
            '&' + 'asyncworktype=decodeable' +
            '&' + 'showXrayMachineUi=yes' +
            '&' + 'showxraypopup=' + showpopup);
    }

	var JsInspectCallback = -1;

	var _OnInventoryInspect = function( id )
	{
		UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'',
			'file://{resources}/layout/popups/popup_inventory_inspect.xml',
			'itemid=' + id +
			'&' + 'inspectonly=true' +
			'&' + 'viewfunc=primary',
			'none'
		);
	};

	var _OnShowXrayCasePopup = function( toolid, caseId, bShowPopupWarning = false )
	{
		var showpopup = bShowPopupWarning ? 'yes' : 'no';
		
		UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'popup-inspect-'+ caseId,
			'file://{resources}/layout/popups/popup_capability_decodable.xml',
			'key-and-case=' + toolid + ',' + caseId +
			'&' + 'asyncworktype=decodeable' +
			'&' + 'isxraymode=yes' +
			'&' + 'showxraypopup='+showpopup
		);
	};

	var JsInspectCallback = -1;
	var _OnLootlistItemPreview = function( id, params )
	{
		if ( JsInspectCallback != -1 )
		{
			UiToolkitAPI.UnregisterJSCallback( JsInspectCallback );
			JsInspectCallback = -1;
		}
		                             
		var ParamsList = params.split( ',' );
		var keyId = ParamsList[ 0 ];
		var caseId = ParamsList[ 1 ];
		var storeId = ParamsList[ 2 ];
		var blurOperationPanel = ParamsList[ 3 ];
		var extrapopupfullscreenstyle = ParamsList[ 4 ];
		                                                                                    
		var aParamsForCallback = ParamsList.slice( 5 );
		var showMarketLinkDefault = _m_bPerfectWorld ? 'false' : 'true';

		                                                                                                                                                                           
		
		JsInspectCallback = UiToolkitAPI.RegisterJSCallback( function()
		{
			let idtoUse = storeId ? storeId : caseId
			$.GetContextPanel().FindChildInLayoutFile( 'PopupManager' ).FindChildInLayoutFile( 'popup-inspect-' + idtoUse ).visible = true;
		} );

		UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'',
			'file://{resources}/layout/popups/popup_inventory_inspect.xml',
			'itemid=' + id +
			'&' + 'inspectonly=true' +
			'&' + 'allowsave=false' +
			'&' + 'showequip=false' +
			'&' + 'showitemcert=false' +
			'&' + blurOperationPanel +
			'&' + 'extrapopupfullscreenstyle=' + extrapopupfullscreenstyle +
			'&' + 'showmarketlink=' + showMarketLinkDefault +
			'&' + 'callback=' + JsInspectCallback +
			'&' + 'caseidforlootlist=' + caseId,
			'none'
		);
	};

	var _OpenDecodeAfterInspect = function( keyId, caseId, storeId, extrapopupfullscreenstyle, aParamsForCallback )
	{
		                                                                                                               
		                                                                                    
		                              
		var backtostoreiteminspectsettings = storeId ?
			'&' + 'asyncworkitemwarning=no' +
			'&' + 'asyncforcehide=true' +
			'&' + 'storeitemid=' + storeId +
			'&' + 'extrapopupfullscreenstyle=' + extrapopupfullscreenstyle
			: '';

		var backtodecodeparams = aParamsForCallback.length > 0 ?
		'&' + aParamsForCallback.join( '&' ) : 
		'';

		UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'',
			'file://{resources}/layout/popups/popup_capability_decodable.xml',
			'key-and-case=' + keyId + ',' + caseId +
			'&' + 'asyncworktype=decodeable' +
			backtostoreiteminspectsettings +
			backtodecodeparams
		);
	};
	var _WeaponPreviewRequest = function( id )
	{
		UiToolkitAPI.CloseAllVisiblePopups();

		UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'',
			'file://{resources}/layout/popups/popup_inventory_inspect.xml',
			'itemid=' + id +
			'&' + 'inspectonly=true' +
			'&' + 'allowsave=false' +
			'&' + 'showequip=false' +
			'&' + 'showitemcert=true',
			'none'
		);
	};
function _UpdateStoreAlert() { // this function is for testing and currently does not work..
    let hideAlert;
    let objStore;
    
    if (InventoryAPI.GetCacheTypeElementJSOByIndex) {
        objStore = InventoryAPI.GetCacheTypeElementJSOByIndex("PersonalStore", 0);
    }
    
    const gcConnection = MyPersonaAPI.IsConnectedToGC();
    const validInventory = MyPersonaAPI.IsInventoryValid();
    
    // checks if objstore exists but does nothing after that. will check to find the issue so that i could make the rankup redemption work in csgo.
    hideAlert = !gcConnection || !validInventory || !objStore || objStore.redeemable_balance === 0;
    const elNavBar = $.GetContextPanel().FindChildInLayoutFile('MainMenuNavBarTop');
    const elAlert = elNavBar.FindChildInLayoutFile('MainMenuStoreAlert');
    elAlert.SetDialogVariable("alert_value", $.Localize("#Store_Price_New"));
    elAlert.SetHasClass('hidden', hideAlert);
}
	var _UpdateSubscriptionAlert = function()
	{
		var elNavBar = $.GetContextPanel().FindChildInLayoutFile('JsMainMenuTopNavBar'),
		elAlert = elNavBar.FindChildInLayoutFile('MainMenuSubscriptionAlert');

		var hideAlert = GameInterfaceAPI.GetSettingString( 'ui_show_subscription_alert' ) === '1' ? true : false;
	}

	function _CancelNotificationSchedule()
	{
		if ( _m_notificationSchedule !== false )
		{
			$.CancelScheduled( _m_notificationSchedule );
			_m_notificationSchedule = false;
		}
	}

	function _AcknowledgePenaltyNotificationsCallback()
	{
		CompetitiveMatchAPI.ActionAcknowledgePenalty();

		_m_bHasPopupNotification = false;
	}

	function _AcknowledgeMsgNotificationsCallback()
	{
		MyPersonaAPI.ActionAcknowledgeNotifications();

		_m_bHasPopupNotification = false;
	}

	function _GetPopupNotification()
	{
		var popupNotification = {
			title: "",
			msg: "",
			color_class: "NotificationYellow",
			callback: function() {},
			html: false
		};
		
		var nBanRemaining = CompetitiveMatchAPI.GetCooldownSecondsRemaining();
		if ( nBanRemaining < 0 )
		{
			popupNotification.title = "#SFUI_MainMenu_Competitive_Ban_Confirm_Title";
			popupNotification.msg = $.Localize( "#SFUI_CooldownExplanationReason_Expired_Cooldown" ) + $.Localize( CompetitiveMatchAPI.GetCooldownReason() );
			popupNotification.callback = _AcknowledgePenaltyNotificationsCallback;
			popupNotification.html = true;

			return popupNotification;
		}

		var strNotifications = MyPersonaAPI.GetMyNotifications();
		if ( strNotifications !== "" )
		{
			var arrayOfNotifications = strNotifications.split( ',' );
			arrayOfNotifications.forEach( function( notificationType )
			{
				if ( notificationType != 6 )
				{
					popupNotification.color_class = 'NotificationBlue';
				}
				popupNotification.title = '#SFUI_PersonaNotification_Title_' + notificationType;
				popupNotification.msg = '#SFUI_PersonaNotification_Msg_' + notificationType;
				popupNotification.callback = _AcknowledgeMsgNotificationsCallback;

				return true;
			} );

			return popupNotification;
		}

		return null;
	}

	function _UpdatePopupnotification()
	{
		                                                                       
		if ( !_m_bHasPopupNotification )
		{
			var popupNotification = _GetPopupNotification();
			if ( popupNotification != null )
			{
				var elPopup = UiToolkitAPI.ShowGenericPopupOneOption(
					popupNotification.title,
					popupNotification.msg,
					popupNotification.color_class,
					'#SFUI_MainMenu_ConfirmBan',
					popupNotification.callback
				);
				
				                                                       
				if ( popupNotification.html )
					elPopup.EnableHTML();

				_m_bHasPopupNotification = true;
			}
		}
	}

	function _GetNotificationBarData()
	{
		var notification = { color_class: "", title: "", tooltip: "", link: "" };
		
		
		
		
		if ( LicenseUtil.GetCurrentLicenseRestrictions() === false )
		{
			  
			                                                                                              
			  
			var bIsConnectedToGC = MyPersonaAPI.IsConnectedToGC();
			$( '#MainMenuInput' ).SetHasClass( 'GameClientConnectingToGC', !bIsConnectedToGC );
			if ( bIsConnectedToGC )
			{	                                                                 
				_m_tLastSeenDisconnectedFromGC = 0;
			}
			else if ( !_m_tLastSeenDisconnectedFromGC )
			{	                                                                          
				_m_tLastSeenDisconnectedFromGC = + new Date();                                                          
			}
			else if ( Math.abs( ( + new Date() ) - _m_tLastSeenDisconnectedFromGC ) > 0 )
			{	                                           
				notification.color_class = "NotificationLoggingOn";
				notification.title = $.Localize( "#Store_Connecting_ToGc" );
				notification.tooltip = $.Localize( "#Store_Connecting_ToGc_Tooltip" );
				return notification;
			}
		}

		  
		if ( _debug_d3gk_IsQOffline )
		{	                                           
			notification.color_class = "NotificationLoggingOn";
			notification.title = $.Localize( "#Store_Connecting_ToGc" );
			notification.tooltip = $.Localize( "#Store_Connecting_ToGc_Tooltip" );
			return notification;
		}                        
		  
		var nIsVacBanned = MyPersonaAPI.IsVacBanned(); // basically... you are a dick for cheating. sorry but this is the truth. also this vac ban notification is for debug. the one below is the real vac ban notification
		if ( _debug_d3gk_IsQVAC )
		{
			notification.color_class = "NotificationRed";

			if ( !_debug_d3gk_IsQOverwatch )
			{
				notification.title = $.Localize( "VAC (Valve Anti-Cheat)" );
				notification.tooltip = $.Localize( "This is not a real vacban notification and only displays when you enable it via the debug button on the navbar for notifications. Good luck trolling friends though." );
			}
			else
			{
				notification.title = $.Localize( "#SFUI_MainMenu_Global_Ban_Title" );
				notification.tooltip = $.Localize( "#SFUI_CooldownExplanationReason_ConvictedForCheating" );
			}
			
			return notification;
		}
		
		var nIsVacBanned = MyPersonaAPI.IsVacBanned(); // actual vac banned notification, the one above is used for debugging purposes. 
		if ( nIsVacBanned != 0 )
		{
			notification.color_class = "NotificationRed";

			if ( nIsVacBanned == 1 )
			{
				notification.title = $.Localize( "#SFUI_MainMenu_Vac_Title" );
				notification.tooltip = $.Localize( "#SFUI_MainMenu_Vac_Info" );
				notification.link = "https://help.steampowered.com/faqs/view/647C-5CC1-7EA9-3C29";
			}
			            else if ((nIsVacBanned & 4) == 4) {
                notification.title = $.Localize("#SFUI_MainMenu_AccountLocked_Title");
                notification.tooltip = $.Localize("#SFUI_MainMenu_AccountLocked_Info");
                notification.link = "https://help.steampowered.com/en/faqs/view/4F62-35F9-F395-5C23";
            }
			else
			{
				notification.title = $.Localize( "#SFUI_MainMenu_GameBan_Title" );
				notification.tooltip = $.Localize( "#SFUI_MainMenu_GameBan_Info" );
				notification.link = "https://help.steampowered.com/faqs/view/4E54-0B96-D0A4-1557";
			}
			
			return notification;
		}

		  
		                                  
		
		if ( _debug_d3gk_IsQOutOfDate )
		{
			notification.color_class = "NotificationYellow";
			notification.title = $.Localize( "#SFUI_MainMenu_Outofdate_Title" );
			notification.tooltip = $.Localize( "#SFUI_MainMenu_Outofdate_Body" );
			return notification;
		}	

		
		  
		                             
		  
		var nBanRemaining = CompetitiveMatchAPI.GetCooldownSecondsRemaining(); // did you kill your teammate at roundstart? or did you kick them too many times because you thought someone was cheating? well this is the function that calls the cooldown notification at the top of your screen.
		if ( nBanRemaining > 0 )
		{
			notification.tooltip = CompetitiveMatchAPI.GetCooldownReason();

			var strType = CompetitiveMatchAPI.GetCooldownType();
			if ( strType == "global" )
			{
				notification.title = $.Localize( "#SFUI_MainMenu_Global_Ban_Title" );
				notification.color_class = "NotificationRed";
			}
			else if ( strType == "green" )
			{
				notification.title = $.Localize( "#SFUI_MainMenu_Temporary_Ban_Title" );
				notification.color_class = "NotificationGreen";
			}
			else if ( strType == "competitive" )
			{
				notification.title = $.Localize( "#SFUI_MainMenu_Competitive_Ban_Title" );
				notification.color_class = "NotificationYellow";
			}
			
			                                                                                                                
			                                    
			if ( !CompetitiveMatchAPI.CooldownIsPermanent() )
			{
				var title = notification.title;

				if ( CompetitiveMatchAPI.ShowFairPlayGuidelinesForCooldown() )
				{
					notification.link = "https://blog.counter-strike.net/index.php/fair-play-guidelines/";
				}
				notification.title = title + ' ' + FormatText.SecondsToSignificantTimeString( nBanRemaining );
			}

			return notification;
		}	

		return null;
	}

	function _UpdateNotificationBar() // updates notification bar for things such as: new client available, ban, gc unable to connect etc.
	{
		var notification = _GetNotificationBarData();

		                   
		_m_NotificationBarColorClasses.forEach( function ( strColorClass )
		{
			var bVisibleColor = false;
			if ( notification !== null )
			{
				bVisibleColor = strColorClass === notification.color_class;
			}
			_m_elNotificationsContainer.SetHasClass( strColorClass, bVisibleColor );
		} );

		                         
		if ( notification !== null )
		{			
			if ( notification.link )
			{
				var btnClickableLink = $.FindChildInContext( '#ClickableLinkButton' );
				btnClickableLink.enabled = true;
				btnClickableLink.SetPanelEvent( 'onactivate', _ => SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser(notification.link) );
				notification.title = "<span class='fairplay-link'>" + notification.title + "</span>";
			}
			
			$.FindChildInContext( '#MainMenuNotificationTitle' ).text = notification.title;
		}

		_m_elNotificationsContainer.SetHasClass( 'hidden', notification === null );
	}

	var _UpdateNotifications = function()
	{
		_m_notificationSchedule = $.Schedule( 1, _UpdateNotifications );

		_UpdatePopupnotification();
		_UpdateNotificationBar();
	};

	                                                                                                    
	                    
	                                                                                                    
	var _m_acknowledgePopupHandler = null;
	var _ShowAcknowledgePopup = function( type = '', itemid = '' ) // inventory acknowledge popup that shows up when you either use a xp boost pack or get a new item in your inventory.
	{
		if ( type === 'xpgrant' )
		{	                                                 
			UiToolkitAPI.ShowCustomLayoutPopupParameters( 
				'',
				'file://{resources}/layout/popups/popup_acknowledge_xpgrant.xml',
				'none'
			);
			$.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.inventory_new_item', 'MOUSE' );
			return;
		}

		var updatedItemTypeAndItemid = '';
		if ( itemid && type )
			updatedItemTypeAndItemid = 'ackitemid=' + itemid + '&acktype=' + type;
			
		if( !_m_acknowledgePopupHandler ) {
			var jsPopupCallbackHandle;
			jsPopupCallbackHandle = UiToolkitAPI.RegisterJSCallback( MainMenu.ResetAcknowlegeHandler );

			_m_acknowledgePopupHandler = UiToolkitAPI.ShowCustomLayoutPopupParameters( 
				'',
				'file://{resources}/layout/popups/popup_acknowledge_item.xml',
				updatedItemTypeAndItemid + '&callback=' + jsPopupCallbackHandle
			);

			$.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.inventory_new_item', 'MOUSE' );
		}
	};

	var _ResetAcknowlegeHandler = function()
	{
		_m_acknowledgePopupHandler = null;
	};

	var _ShowNotificationBarTooltip = function () // tooltip for those who really want to know what gave them a cooldown or permanent vac ban. in reality this doesn't really show the actual reason for vac bans.
	{
		var notification = _GetNotificationBarData();
		if ( notification !== null && notification.tooltip )
		{
			UiToolkitAPI.ShowTextTooltip( 'NotificationsContainer', notification.tooltip );
		}
	};

	var _ShowVote = function ()
	{
		var contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent(
			'MainMenuNavBarVote',
			'',
			'file://{resources}/layout/context_menus/context_menu_vote.xml',
			'',
			function()
			{
				                                    
			}
		);
		contextMenuPanel.AddClass( "ContextMenu_NoArrow" );
	};

	var _HideStoreStatusPanel = function () {
		if (_m_storePopupElement && _m_storePopupElement.IsValid()) {
			_m_storePopupElement.DeleteAsync(0);
		}

		_m_storePopupElement = null;
	};

	var _ShowStoreStatusPanel = function (strText, bAllowClose, bCancel, strOkCmd)
	{
		_HideStoreStatusPanel();

		var paramclose = '0';
		if (bAllowClose) {
			paramclose = '1';
		}

		var paramcancel = '0';
		if (bCancel) {
			paramcancel = '1';
		}

		_m_storePopupElement = UiToolkitAPI.ShowCustomLayoutPopupParameters(
            'store_popup',
            'file://{resources}/layout/popups/popup_store_status.xml',
			'text=' + $.UrlEncode( strText ) +
			'&' + 'allowclose=' + paramclose +
			'&' + 'cancel=' + paramcancel +
			'&'+'okcmd=' + $.UrlEncode( strOkCmd ) );
	};

	var _ShowWeaponUpdatePopup = function() // mp5 weapon update popup, it is broken. does not work even after multiple fixes applied, something seems to be fucked in the game code for this.
	{
		return;                                                         
		var setVersionTo = '1';
		var currentVersion = GameInterfaceAPI.GetSettingString( 'ui_popup_weaponupdate_version' );

		if ( currentVersion !== setVersionTo )
		{
			                      
			$.Schedule( 1.75, showMp5Popup );

			function showMp5Popup ()
			{
				var defIndex = 23;
				UiToolkitAPI.ShowCustomLayoutPopupParameters(
					'',
					'file://{resources}/layout/popups/popup_weapon_update.xml',
					'defindex=' + defIndex +
					'&' + 'uisettingversion=' + setVersionTo,
					'none'
				);
			}
		}
	};
		var _DevAlertMgr = function()
	{
		$('#MainMenuNavBarHome').checked = true;
		UiToolkitAPI.ShowGenericPopupThreeOptionsBgStyle( 
		'CS:GO Main Menu Alerts',
		'Actions available:',
		'',
		'Remove all',
		function() 
		{ 
			_debug_d3gk_IsQOffline = false;
			_debug_d3gk_IsQOutOfDate = false;
			_debug_d3gk_IsQOverwatch = false;
			_debug_d3gk_IsQVAC = false;
		}, 
		'Out Of Date',
		function() 
		{ 
			_debug_d3gk_IsQOffline = false;
			_debug_d3gk_IsQOutOfDate = true;
			_debug_d3gk_IsQOverwatch = false;
			_debug_d3gk_IsQVAC = false;
		}, 
		'More...',
		function() 
		{ 
			UiToolkitAPI.ShowGenericPopupThreeOptionsBgStyle( 
			'CS:GO Main Menu Alerts',
			'Actions available: More...',
			'',
			'Overwatch Ban',
			function() 
			{ 
				_debug_d3gk_IsQOffline = false;
				_debug_d3gk_IsQOutOfDate = false;
				_debug_d3gk_IsQOverwatch = true;
				_debug_d3gk_IsQVAC = true;
			}, 
			'VAC Ban',
			function() 
			{ 
				_debug_d3gk_IsQOffline = false;
				_debug_d3gk_IsQOutOfDate = true;
				_debug_d3gk_IsQOverwatch = false;
				_debug_d3gk_IsQVAC = true;
			}, 
			'Offline',
			function() 
			{ 
				_debug_d3gk_IsQOffline = true;
				_debug_d3gk_IsQOutOfDate = true;
				_debug_d3gk_IsQOverwatch = false;
				_debug_d3gk_IsQVAC = false;
			}, 
			'dim' );
		}, 
		'dim' );
		
		_UpdateNotificationBar();
	};
	
	var _DevPopups = function()
	{		
	$('#MainMenuNavBarHome').checked = true;
		UiToolkitAPI.ShowGenericPopupThreeOptionsBgStyle( 
		'CS:GO',
		'Popups available:',
		'',
		'Default...', 
		function() 
		{
			UiToolkitAPI.ShowGenericPopupThreeOptionsBgStyle( 
			'CS:GO',
			'Popups available:',
			'',
			'Accept Match',
			function() 
			{ 
				UiToolkitAPI.ShowCustomLayoutPopupParameters( '', 'file://{resources}/layout/popups/popup_accept_match.xml', '', 'none' ); 
			}, 
			'Matchmaking',
			function() 
			{ 
				UiToolkitAPI.ShowCustomLayoutPopupParameters( '', 'file://{resources}/layout/popups/popup_go_team_matchmaking.xml', '', 'none' ); 
			}, 
			'More...',
			function() 
			{ 
				UiToolkitAPI.ShowGenericPopupThreeOptionsBgStyle( 
				'CS:GO',
				'Popups available:',
				'',
				'Operation Store',
				function() 
				{ 
					_NavigateToTab('JsDbg', 'playercard');
					//UiToolkitAPI.ShowCustomLayoutPopupParameters( '', 'file://{resources}/layout/popups/popup_license_register.xml', '', 'none' ); 
				}, 
				'News',
				function() 
				{ 
					UiToolkitAPI.ShowCustomLayoutPopupParameters( '', 'file://{resources}/layout/popups/popup_news.xml', '', 'none' );  
					// UiToolkitAPI.ShowCustomLayoutPopupParameters( '', 'file://{resources}/layout/popups/popup_operation_store.xml', '', 'none' ); 
					// _NavigateToTab('JsAccept', 'popups/popup_accept_match');
				}, 
				'Premier',
				function() 
				{ 
					// _NavigateToTab('JsDbg', 'console');
					// Nav Drawer // UiToolkitAPI.ShowCustomLayoutPopupParameters( '', 'file://{resources}/layout/popups/popup_navdrawer.xml', '', 'none' ); 
					UiToolkitAPI.ShowCustomLayoutPopupParameters( '', 'file://{resources}/layout/popups/popup_premier_matchmaking.xml', '', 'none' ); 
				}, 
				'dim' );
			}, 
			'dim' );
		}, 
		'More...',
		function() 
		{
			UiToolkitAPI.ShowGenericPopupThreeOptionsBgStyle( 
			'CS:GO',
			'Popups available:',
			'',
			'Rank',
			function() 
			{ 
				UiToolkitAPI.ShowCustomLayoutPopupParameters( '', 'file://{resources}/layout/popups/popup_acknowledge_xpgrant.xml', '', 'none' ); 
			}, 
			'Overwatch Verdict',
			function() 
			{ 
				UiToolkitAPI.ShowCustomLayoutPopupParameters( '', 'file://{resources}/layout/popups/popup_mainmenu_overwatch_verdict.xml', '', 'none' ); 
			}, 
			'PickBan',
			function() 
			{ 
				UiToolkitAPI.ShowCustomLayoutPopupParameters( '', 'file://{resources}/layout/popups/popup_tournament_pickban.xml', '', 'none' ); 
			}, 
			'dim' );
		},
		'Cancel',
		function() 
		{
		}, 
		'dim' );
	};
	
	var _WebBrowser = function()
{
    UiToolkitAPI.ShowCustomLayoutPopupParameters( '', 'file://{resources}/layout/popups/popup_browser.xml', '', 'none' );
};

	var _ShowOperationLaunchPopup = function() // when is a new operation coming valve? in cs2 it seems to be never sadly, armory is the permanent operation that you get in cs2 now and is never going away unless they change their mind.
	{
		if ( _m_hOnEngineSoundSystemsRunningRegisterHandle )
		{
			                                                                                                    
			$.UnregisterForUnhandledEvent( "PanoramaComponent_GameInterface_EngineSoundSystemsRunning", _m_hOnEngineSoundSystemsRunningRegisterHandle );
			_m_hOnEngineSoundSystemsRunningRegisterHandle = null;
		}

		                                                                                   
		var elCoverPlaque = $( '#MainMenuFullScreenBlackCoverPlaque' );
		if ( elCoverPlaque )
			elCoverPlaque.visible = false;
		
		return;                                                                                                     

		var setVersionTo = '2109';                                       
		var currentVersion = GameInterfaceAPI.GetSettingString( 'ui_popup_weaponupdate_version' );

		if ( currentVersion !== setVersionTo )
		{
			UiToolkitAPI.ShowCustomLayoutPopupParameters(
				'',
				'file://{resources}/layout/popups/popup_operation_launch.xml',
				'uisettingversion=' + setVersionTo,
				'none'
			);
		}
	};
	    const _ShowUpdateWelcomePopup = function () {
        const setVersionTo = '2303';
        const currentVersion = GameInterfaceAPI.GetSettingString('ui_popup_weaponupdate_version');
        if (currentVersion !== setVersionTo) {
            UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_welcome_launch.xml', 'uisettingversion=' + setVersionTo);
        }
    };

var _PauseMainMenuCharacter = function() { // pauses your agent when changing background or disconnecting from a server.
    var vanityPanel = $('#JsMainmenu_Vanity');

    if (vanityPanel) {
        vanityPanel.Pause(true);
    }
};

var _UnPauseMainMenuCharacter = function() { // unpauses your agent after background change.
    var vanityPanel = $('#JsMainmenu_Vanity');

    if (vanityPanel) {
        vanityPanel.Pause(false);
    }
};

	var _ShowTournamentStore = function() 
	{
		UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'',
			'file://{resources}/layout/popups/popup_tournament_store.xml',
			'',
			'none'
		);
	};

	                                                                                                    
	                         
	                                                                                                    
	function _AddPauseMenuMissionPanel() // op mission pausemenu panel that actually never worked in the first place so i have no idea why it's here but removing it breaks the script.
	{
		var elPanel = null;
		var missionId = GameStateAPI.GetActiveQuestID();

		                                                         
		var oGameState = GameStateAPI.GetTimeDataJSO();
		
		if ( !$.GetContextPanel().FindChildInLayoutFile( 'JsActiveMission' ) && missionId && oGameState && oGameState.gamephase !== 5 )
		{
			elPanel = $.CreatePanel( 
				'Panel', 
				$( '#JsActiveMissionPanel' ),
				'JsActiveMission',
				{ class: 'PauseMenuModeOnly' });
				
			elPanel.BLoadLayout('file://{resources}/layout/operation/operation_active_mission.xml', false, false );
		}
		else
		{
			elPanel = $.GetContextPanel().FindChildInLayoutFile( 'JsActiveMission' );
		}

		if( missionId && elPanel && elPanel.IsValid() )
		{
			elPanel.SetAttributeString( 'missionid', missionId );
		}
	}

	function _DeletePauseMenuMissionPanel()
	{
		if( $.GetContextPanel().FindChildInLayoutFile( 'JsActiveMission' ) )
		{
			$.GetContextPanel().FindChildInLayoutFile( 'JsActiveMission' ).DeleteAsync( 0.0 );
		}
	}

	                                                                                                    
	                                                
	                                                                                                    
	var _ResetSurvivalEndOfMatch = function()
	{
		_DeleteSurvivalEndOfMatch();

		function CreateEndOfMatchPanel ()
		{
			var elPanel = $( '#PauseMenuSurvivalEndOfMatch' );

			if ( !elPanel )
			{
				elPanel = $.CreatePanel(
					'CSGOSurvivalEndOfMatch',
					$( '#MainMenuBackground' ),
					'PauseMenuSurvivalEndOfMatch',
					{
						class: 'PauseMenuModeOnly'
					}
				);

				elPanel.SetAttributeString( 'pausemenu', 'true' );
			}

			_UpdateSurvivalEndOfMatchInstance();
		}

		$.Schedule( 0.1, CreateEndOfMatchPanel );
	};

	var _DeleteSurvivalEndOfMatch = function()
	{
		if ( $( '#PauseMenuSurvivalEndOfMatch' ) )
		{
			$( '#PauseMenuSurvivalEndOfMatch' ).DeleteAsync( 0.0 );
		}
	};

	function _UpdateSurvivalEndOfMatchInstance()
	{
		var elSurvivalPanel = $( '#PauseMenuSurvivalEndOfMatch' );

		if ( elSurvivalPanel && elSurvivalPanel.IsValid() )
		{
			$( '#PauseMenuSurvivalEndOfMatch' ).matchStatus.UpdateFromPauseMenu();
		}
	}

	var _ShowHideAlertForNewEventForWatchBtn = function()
	{
		                                                                               
		                                                                
		  
		                                                                                  
		                                                    
		  
		                                            
	};

	var _WatchBtnPressedUpdateAlert = function()
	{
		                                                                        
		_ShowHideAlertForNewEventForWatchBtn();
	};

	var _StatsBtnPressedUpdateAlert = function()
	{
		                                                                        
		_ShowHideAlertForNewEventForWatchBtn();
	};

	var _UpdateUnlockCompAlert = function()
	{
		var btn = $.GetContextPanel().FindChildInLayoutFile( 'MainMenuNavBarPlay' );
		var alert = btn.FindChildInLayoutFile( 'MainMenuPlayAlert' );

		if ( !MyPersonaAPI.IsConnectedToGC() )
		{
			alert.AddClass( 'hidden' );
			return;
		}

		var bHide = GameInterfaceAPI.GetSettingString( 'ui_show_unlock_competitive_alert' ) === '1' ||
			MyPersonaAPI.HasPrestige() ||
			MyPersonaAPI.GetCurrentLevel() !== 2;
		
		alert.SetHasClass( 'hidden', bHide );
	}

	function _SwitchVanity ( team ) // switches your vanity to your desired team. pretty cool ain't it? ooo
	{
		$.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.generic_button_press', 'MOUSE' );
		GameInterfaceAPI.SetSettingString( 'ui_vanitysetting_team', team );	
		_ForceRestartVanity();
	}

	function _GoToCharacterLoadout ( team )
	{
		_OpenInventory();

		$.DispatchEvent( "ShowLoadoutForItem", 'customplayer', 'customplayer', team );
	}

	                                                                                                    
	function _OnGoToCharacterLoadoutPressed () // opens inventory loadout and shows your weapon or agent loadout.
	{
		if ( !MyPersonaAPI.IsInventoryValid() || !MyPersonaAPI.IsConnectedToGC() )
		{
			                                       
			UiToolkitAPI.ShowGenericPopupOk(
				$.Localize( '#SFUI_SteamConnectionErrorTitle' ),
				$.Localize( '#SFUI_Steam_Error_LinkUnexpected' ),
				'',
				function() {},
				function() {}
			);
			return;
		}

		var team = GameInterfaceAPI.GetSettingString( 'ui_vanitysetting_team' ) == 't' ? 2 : 3;

		var elVanityContextMenu = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent(
			'id-vanity-contextmenu',
			'',
			'file://{resources}/layout/context_menus/context_menu_mainmenu_vanity.xml', 
			'team=' + team,
			function(){}
		)

		elVanityContextMenu.AddClass( "ContextMenu_NoArrow" );
	}


	return { // return functions, this is primarily used when making new scripts that get executed when OnShowMainMenu function loads. also these information tooltips in the script probably made the script twice as large.. sorry but i had to for dev purposes.
		OnInitFadeUp						: _OnInitFadeUp,
		OnShowMainMenu						: _OnShowMainMenu,
		OnHideMainMenu	 					: _OnHideMainMenu,
		OnShowPauseMenu	 					: _OnShowPauseMenu,
		OnHidePauseMenu	 					: _OnHidePauseMenu,
		NavigateToTab	 					: _NavigateToTab,
		ShowContentPanel	 				: _ShowContentPanel,
		OnHideContentPanel	 				: _OnHideContentPanel,
		GetActiveNavBarButton	 			: _GetActiveNavBarButton,
		ShowHideNavDrawer	 				: _ShowHideNavDrawer,
		ExpandSidebar	 					: _ExpandSidebar,
		MinimizeSidebar	 					: _MinimizeSidebar,
		OnSideBarElementContextMenuActive	: _OnSideBarElementContextMenuActive,
		InitFriendsList	 					: _InitFriendsList,
		InitLRColumns					: _InitLRColumns,
		InitVanity							: _InitVanity,
		ForceRestartVanity	 				: _ForceRestartVanity,
		OnEquipSlotChanged	 				: _OnEquipSlotChanged,
		OpenPlayMenu						: _OpenPlayMenu,
		WebBrowser                          : _WebBrowser,
		OpenWatchMenu						: _OpenWatchMenu,
		OpenStatsMenu						: _OpenStatsMenu,
		OpenInventory						: _OpenInventory,
		OpenFullscreenStore                 : _OpenFullscreenStore,
		OpenSettings						: _OpenSettings,
		UpdateStoreAlert                    : _UpdateStoreAlert,
		OnHomeButtonPressed					: OnHomeButtonPressed,
		OnQuitButtonPressed					: _OnQuitButtonPressed,
		OnEscapeKeyPressed					: OnEscapeKeyPressed,
		GameMustExitNowForAntiAddiction		: _GameMustExitNowForAntiAddiction,
		GcLogonNotificationReceived			: _GcLogonNotificationReceived,
		BetaEnrollmentStatusChange			: _BetaEnrollmentStatusChange,
		InventoryUpdated					: _InventoryUpdated,
		LobbyPlayerUpdated					: _LobbyPlayerUpdated,
		OnInventoryInspect					: _OnInventoryInspect,
		OnShowXrayCasePopup					: _OnShowXrayCasePopup,
		WeaponPreviewRequest				: _WeaponPreviewRequest,
		OnLootlistItemPreview				: _OnLootlistItemPreview,
		UpdateNotifications					: _UpdateNotifications,
		ShowAcknowledgePopup				: _ShowAcknowledgePopup,
		ShowOperationLaunchPopup			: _ShowOperationLaunchPopup,
		ResetAcknowlegeHandler				: _ResetAcknowlegeHandler,
		ShowNotificationBarTooltip			: _ShowNotificationBarTooltip,
		InitNewsAndStore                    : _InitNewsAndStore,
		ShowVote 							: _ShowVote,
		DevPopups							: _DevPopups,
		ShowStoreStatusPanel				: _ShowStoreStatusPanel,
		HideStoreStatusPanel				: _HideStoreStatusPanel,
		SetBackgroundMovie					: _SetBackgroundMovie,
		PauseMainMenuCharacter				: _PauseMainMenuCharacter,
		UnPauseMainMenuCharacter				: _UnPauseMainMenuCharacter,
		ShowTournamentStore					: _ShowTournamentStore,
		TournamentDraftUpdate				: _TournamentDraftUpdate,
		ResetSurvivalEndOfMatch				: _ResetSurvivalEndOfMatch,
		OnGoToCharacterLoadoutPressed		: _OnGoToCharacterLoadoutPressed,
		ResetNewsEntryStyle					: _ResetNewsEntryStyle,
		OnSteamIsPlaying					: _OnSteamIsPlaying,
		WatchBtnPressedUpdateAlert			: _WatchBtnPressedUpdateAlert,
		StatsBtnPressedUpdateAlert			: _StatsBtnPressedUpdateAlert,
		HideMainMenuNewsPanel				: _HideMainMenuNewsPanel,
		SwitchVanity						: _SwitchVanity,
		GoToCharacterLoadout				: _GoToCharacterLoadout,
		OpenSubscriptionUpsell				: _OpenSubscriptionUpsell,
		UpdateUnlockCompAlert				: _UpdateUnlockCompAlert,
		DevAlertMgr							: _DevAlertMgr
	};
})();


                                                                                                    
                                           
                                                                                                    
(function()
{
	$.RegisterForUnhandledEvent( 'HideContentPanel', MainMenu.OnHideContentPanel );
	$.RegisterForUnhandledEvent( 'SidebarContextMenuActive', MainMenu.OnSideBarElementContextMenuActive );

	$.RegisterForUnhandledEvent( 'OpenPlayMenu', MainMenu.OpenPlayMenu );
	$.RegisterForUnhandledEvent( 'OpenInventory', MainMenu.OpenInventory );
	$.RegisterForUnhandledEvent('OpenFullscreenStore', MainMenu.OpenFullscreenStore);
	$.RegisterForUnhandledEvent( 'OpenWatchMenu', MainMenu.OpenWatchMenu );
	$.RegisterForUnhandledEvent( 'OpenStatsMenu', MainMenu.OpenStatsMenu );
	$.RegisterForUnhandledEvent( 'OpenSubscriptionUpsell', MainMenu.OpenSubscriptionUpsell );
	$.RegisterForUnhandledEvent( 'CSGOShowMainMenu', MainMenu.OnShowMainMenu);
	$.RegisterForUnhandledEvent( 'CSGOHideMainMenu', MainMenu.OnHideMainMenu);
	$.RegisterForUnhandledEvent( 'CSGOShowPauseMenu', MainMenu.OnShowPauseMenu);
	$.RegisterForUnhandledEvent( 'CSGOHidePauseMenu', MainMenu.OnHidePauseMenu);
	$.RegisterForUnhandledEvent( 'OpenSidebarPanel', MainMenu.ExpandSidebar);
	$.RegisterForUnhandledEvent( 'PanoramaComponent_MyPersona_GameMustExitNowForAntiAddiction', MainMenu.GameMustExitNowForAntiAddiction );
	$.RegisterForUnhandledEvent( 'PanoramaComponent_MyPersona_GcLogonNotificationReceived', MainMenu.GcLogonNotificationReceived );
	$.RegisterForUnhandledEvent( 'PanoramaComponent_MyPersona_BetaEnrollmentStatusChange', MainMenu.BetaEnrollmentStatusChange );
	$.RegisterForUnhandledEvent( 'PanoramaComponent_GC_Hello', MainMenu.UpdateUnlockCompAlert );
	$.RegisterForUnhandledEvent( 'PanoramaComponent_MyPersona_InventoryUpdated', MainMenu.InventoryUpdated );
	$.RegisterForUnhandledEvent( "PanoramaComponent_Lobby_MatchmakingSessionUpdate", MainMenu.LobbyPlayerUpdated );
	$.RegisterForUnhandledEvent( "PanoramaComponent_Lobby_PlayerUpdated", MainMenu.LobbyPlayerUpdated );
	$.RegisterForUnhandledEvent( 'InventoryItemPreview', MainMenu.OnInventoryInspect );
	$.RegisterForUnhandledEvent( 'LootlistItemPreview', MainMenu.OnLootlistItemPreview );
	$.RegisterForUnhandledEvent( 'ShowXrayCasePopup', MainMenu.OnShowXrayCasePopup );
	$.RegisterForUnhandledEvent( 'PanoramaComponent_Inventory_WeaponPreviewRequest', MainMenu.WeaponPreviewRequest );
	$.RegisterForUnhandledEvent( "PanoramaComponent_TournamentMatch_DraftUpdate", MainMenu.TournamentDraftUpdate );

	$.RegisterForUnhandledEvent( 'ShowAcknowledgePopup', MainMenu.ShowAcknowledgePopup );
    $.RegisterForUnhandledEvent( 'ShowStoreStatusPanel', MainMenu.ShowStoreStatusPanel );
	$.RegisterForUnhandledEvent( 'HideStoreStatusPanel', MainMenu.HideStoreStatusPanel );

	$.RegisterForUnhandledEvent( 'ShowVoteContextMenu', MainMenu.ShowVote );
	$.RegisterForUnhandledEvent( 'ShowTournamentStore', MainMenu.ShowTournamentStore );

  	                                                                                     
	$.RegisterForUnhandledEvent( 'UnloadLoadingScreenAndReinit', MainMenu.ResetSurvivalEndOfMatch );

	$.RegisterForUnhandledEvent( 'MainMenu_OnGoToCharacterLoadoutPressed', MainMenu.OnGoToCharacterLoadoutPressed );
	$.RegisterForUnhandledEvent( "PanoramaComponent_EmbeddedStream_VideoPlaying", MainMenu.OnSteamIsPlaying );
	$.RegisterForUnhandledEvent( "StreamPanelClosed", MainMenu.ResetNewsEntryStyle );
	$.RegisterForUnhandledEvent( "HideMainMenuNewsPanel", MainMenu.HideMainMenuNewsPanel );

	$.RegisterForUnhandledEvent( "ForceRestartVanity", MainMenu.ForceRestartVanity );

	$.RegisterForUnhandledEvent( "CSGOMainInitBackgroundMovie", MainMenu.SetBackgroundMovie );
	$.RegisterForUnhandledEvent( "MainMenuGoToSettings", MainMenu.OpenSettings );
	$.RegisterForUnhandledEvent( "MainMenuSwitchVanity", MainMenu.SwitchVanity );
	$.RegisterForUnhandledEvent( "MainMenuGoToCharacterLoadout", MainMenu.GoToCharacterLoadout );
	
	MainMenu.MinimizeSidebar();
	MainMenu.InitVanity();
	MainMenu.MinimizeSidebar();
	MainMenu.InitFriendsList();
	MainMenu.InitLRColumns();
	MainMenu.InitNewsAndStore();


	                                                                                  
	$.RegisterEventHandler( "Cancelled", $.GetContextPanel(), MainMenu.OnEscapeKeyPressed );

})();
