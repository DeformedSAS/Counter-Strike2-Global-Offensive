"use strict";

// GOOD LUCK MAINTAINING THIS

var MainMenu = ( function() {
	var _m_bPerfectWorld = ( MyPersonaAPI.GetLauncherType() === "perfectworld" ); // china number 1!! this detects if you're launching the game in perfectworld mode.
	var _m_activeTab;
	var _m_sideBarElementContextMenuActive = false;
	var _m_elContentPanel = $( '#JsMainMenuContent' );
	var _m_playedInitalFadeUp = false; 
	let g_bModVersionOutdated = false;
    let g_sRemoteModVersion = "";
    const CURRENT_MOD_VERSION = "1.9.0.discontinued"; // update this when releasing a new version
	var _debug_d3gk_IsQOutOfDate = false; // d3gks notification debug stuff which is pretty much no longer used because of the new notification button..   
	var _debug_d3gk_IsQVAC = false;   
	var _debug_d3gk_IsQOverwatch = false; 
	const _m_elNotificationsContainer = $('#id-notifications-container');
	var _debug_d3gk_IsQOffline = false;       
	var _m_notificationSchedule = false;  // schedules the notifications i guess? i don't really know what it does and i'm lazy to take a look at it..
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
    var videoPlayer = $('#MainMenuMovie'); // video player panel
    var background = $('#MainMenuBackground'); // background panel for the movie 
	var containerpanel = $('#MainMenuContainerPanel');
    var vanityPanel = $('#JsMainmenu_Vanity'); // vanity agent panel

    if (!(videoPlayer && videoPlayer.IsValid() && background && background.IsValid())) {
        return;
    }

    // fades the mainmenu background when disconnecting, changing and loading into the mainmenu
    background.style.opacity = '0';
	containerpanel.style.opacity = '0';
    _PauseMainMenuCharacter();

    $.Schedule(0.7, function() {
        var backgroundMovie = GameInterfaceAPI.GetSettingString('ui_mainmenu_bkgnd_movie_CC4ECB9'); // ui background movie convar which tracks which background you set, example: inferno or dust2 or train and so on.
        _UnPauseMainMenuCharacter();
        videoPlayer.SetAttributeString('data-type', backgroundMovie);
        videoPlayer.SetMovie("file://{resources}/videos/" + backgroundMovie + ".webm");
        videoPlayer.SetSound('UIPanorama.BG_' + backgroundMovie);
        videoPlayer.Play();
        
        if (vanityPanel && vanityPanel.IsValid()) {
            _SetVanityLightingBasedOnBackgroundMovie(vanityPanel);
            vanityPanel.visible = true;   // makes the vanity instantly visible when the background fades in
            vanityPanel.style.opacity = '1';  // with the opacity set to 1 and no transition in css. it won't make the vanity panel transparent during the transition.
        }

        background.style.opacity = '1';  // fades the video background right into the screen
		containerpanel.style.opacity = '1';

        _InitVanity();
		_InitVanityNoGC();
        _ForceRestartVanity();
        //_LobbyPlayerUpdated();
		
		if (!LobbyAPI.IsSessionActive()) {
            LobbyAPI.CreateSession();
        }
    });
};

// when disconnecting, the vanity should be invisible and not randomly appear during pitch black transition. this code is unused
function HideVanity() {
    var vanityPanel = $('#JsMainmenu_Vanity');
    if (vanityPanel && vanityPanel.IsValid()) {
        vanityPanel.visible = false;  
    }
}

var devmode = 0;

var _OnShowMainMenu = function() {
    $.DispatchEvent('PlayMainMenuMusic', true, true); 
    $('#MainMenuNavBarHome').checked = true;

    GameInterfaceAPI.SetSettingString('panorama_play_movie_ambient_sound', '1');
	GameInterfaceAPI.SetSettingString('@panorama_ECO_mode', '0');
    GameInterfaceAPI.ConsoleCommand('sv_allowupload 1');
    GameInterfaceAPI.SetSettingString('dsp_room', '0');
    GameInterfaceAPI.SetSettingString('snd_soundmixer', 'MainMenu_Mix');

    _m_bVanityAnimationAlreadyStarted = false;
    _SetBackgroundMovie();

    $('#MainMenuNavBarPlay').SetHasClass('pausemenu-navbar__btn-small--hidden', false);
    var elScoreboard = $.GetContextPanel().FindChildInLayoutFile('Scoreboard');
    if (elScoreboard) elScoreboard.visible = false;

    _OnInitFadeUp();

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
    _ShowFloatingPanels();
    _RightColumnLoad();
    _PlayMenuSong();

    $.Schedule(3.0, function() {
        CheckModVersionAsync();
    });

    if (GameInterfaceAPI.HasCommandLineParm('-devmode')) {
        devmode = 1;
    } else {
        devmode = 0;
    }

    var devButtons = $.GetContextPanel().FindChildrenWithClassTraverse('DEVModeONLY');

    devButtons.forEach(function(button) {
        if (devmode === 1) {
            button.RemoveClass('DEVModeONLY');
        } else {
            button.AddClass('DEVModeONLY');
        }
    });

    const notifContainer = $('#id-notifications-container');
    if (notifContainer) {
        notifContainer.visible = true;
    }
}; 


function CheckModVersionAsync() {
    $.AsyncWebRequest("https://raw.githubusercontent.com/DeformedSAS/Counter-Strike2-Global-Offensive/refs/heads/main/version.json", {
        type: "GET",
        success: function(response) {
            try {
                const data = JSON.parse(response);
                if (data.version !== CURRENT_MOD_VERSION) {
                    g_bModVersionOutdated = true;
                    g_sRemoteModVersion = data.version;

                    $.DispatchEvent('PlaySoundEffect', 'PanoramaUI.Lobby.Error', 'MOUSE');
                } else {
                }
            } catch (e) {
            }
        },
        error: function(e) {
        }
    });
}

	var _TournamentDraftUpdate = function () // major pickems. nothing special here in this script i guess..
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
				UiToolkitAPI.ShowGenericPopupOneOptionBgStyle( "???", "???", "???",
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

function _OnHideMainMenu() { // stops all mainmenu stuff that are listed here
for (let i = 0; i < 5; i++) {
    const vanityPanel = $('#JsMainmenu_Vanity' + i);
    if (vanityPanel) {
        CharacterAnims.CancelScheduledAnim(vanityPanel);
    }
}
    _m_elContentPanel.RemoveClass('mainmenu-content--animate');
    _m_elContentPanel.AddClass('mainmenu-content--offscreen');
    _CancelNotificationSchedule();
    UiToolkitAPI.CloseAllVisiblePopups();
    _StopFetchingTournamentData();
    _HideFloatingPanels();

    const notifContainer = $('#id-notifications-container');
    if (notifContainer) {
        notifContainer.visible = false;
    }
}
	
	var _OnShowPauseMenu = function() // does the pause menu magic tricks
	{
		var elContextPanel = $.GetContextPanel();
		
		elContextPanel.AddClass( 'MainMenuRootPanel--PauseMenuMode' );
		 $('#MainMenuNavBarHome').checked = true;
		 $.DispatchEvent('PlayMainMenuMusic', false, false );  

		var bMultiplayer = elContextPanel.IsMultiplayer();
		var bQueuedMatchmaking = GameStateAPI.IsQueuedMatchmaking();
		var bTraining = elContextPanel.IsTraining();
		var bGotvSpectating = elContextPanel.IsGotvSpectating();
		var bIsCommunityServer = !_m_bPerfectWorld && MatchStatsAPI.IsConnectedToCommunityServer();
                                                                                                 
        $('#MainMenuNavBarPlay').SetHasClass('pausemenu-navbar__btn-small--hidden', true);   																								                                                                                                                                           
        $('#MainMenuNavBarSwitchTeams').SetHasClass('pausemenu-navbar__btn-small--hidden', (bQueuedMatchmaking || bGotvSpectating));
        $('#MainMenuNavBarVote').SetHasClass('pausemenu-navbar__btn-small--hidden', (bGotvSpectating));
        $('#MainMenuNavBarReportServer').SetHasClass('pausemenu-navbar__btn-small--hidden', !bIsCommunityServer);                  
                                            
		_UpdateSurvivalEndOfMatchInstance();

		                                               
		_AddPauseMenuMissionPanel();

		                
		OnHomeButtonPressed();
	};
	var _OnHidePauseMenu = function () // hides the pause menu if you press escape again or go to the mainmenu
	{
		$.GetContextPanel().RemoveClass( 'MainMenuRootPanel--PauseMenuMode' );
		                                 
		_DeletePauseMenuMissionPanel();
		$.DispatchEvent('PlayMainMenuMusic', false, false );  
		                                                                  
		OnHomeButtonPressed();
	};
const _CreatUpdateVanityInfo = function (oSettings) { // cs2 vanity info stuff.. not used, probably won't be used at all as the vanity info panel itself doesn't display anything..
    $.Schedule(0.1, () => {
        if (typeof VanityPlayerInfo === 'undefined') {
            $.Schedule(0.1, () => _CreatUpdateVanityInfo(oSettings));
            return;
        }

        const elVanityPlayerInfo = VanityPlayerInfo.CreateUpdateVanityInfoPanel(
            $.GetContextPanel().FindChildInLayoutFile('MainMenuVanityInfo'),
            oSettings
        );

        // Removed blur panel code here — no blur added

    });
};

    function _BCheckTabCanBeOpenedRightNow(tab) { // checks if you can open tabs if you don't have any license restrictions, or if the game coordinator is offline.
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

	var _CanOpenStatsPanel = function() // 360 stats, was supposed to be added into cs2 but later it was cut and only the ui panels work but no api responses because it has been shut down.
	{
		if( GameInterfaceAPI.GetSettingString( 'ui_show_subscription_alert' ) !== '0' )
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
 	var _NavigateToTab = function( tab, XmlName ) // navigatetotab, the shit that does the magic trick of you being able to open the play menu, inventory, settigns etc
	{
		if ( !_BCheckTabCanBeOpenedRightNow( tab ) )
		{
			 $('#MainMenuNavBarHome').checked = true;
			return;	                                                                               
		}
		$.DispatchEvent('PlayMainMenuMusic', true, false );                               
                    
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

function _ShowContentPanel() { // all this does is show the content panel for settings, play etc and adds some classes, hides and removes stuff.
    if (_m_elContentPanel.BHasClass('mainmenu-content--offscreen')) {
        _m_elContentPanel.AddClass('mainmenu-content--animate');
        _m_elContentPanel.RemoveClass('mainmenu-content--offscreen');
    }

    $.GetContextPanel().AddClass("mainmenu-content--open");
    $.DispatchEvent('ShowContentPanel');
    _DimMainMenuBackground(false);
    _HideFloatingPanels();
    _HideNewsAndStore();

    // hides the scoreboard when in a content panel.
    var elScoreboard = $.GetContextPanel().FindChildInLayoutFile('Scoreboard');
    if (elScoreboard) elScoreboard.visible = false;
}

function _OnHideContentPanel() { // hides the content panel, shows left and right columns, shows the scoreboard in the pausemenu.
    _m_elContentPanel.AddClass('mainmenu-content--animate');
    _m_elContentPanel.AddClass('mainmenu-content--offscreen');
    $.GetContextPanel().RemoveClass("mainmenu-content--open");

    const elActiveNavBarBtn = _GetActiveNavBarButton();
    if (elActiveNavBarBtn && elActiveNavBarBtn.id !== 'MainMenuNavBarHome') {
        elActiveNavBarBtn.checked = false;
    }

    _DimMainMenuBackground(true);

    if (_m_activeTab) {
        const panelToHide = $.GetContextPanel().FindChildInLayoutFile(_m_activeTab);
        panelToHide.AddClass('mainmenu-content--hidden');
    }

    _m_activeTab = '';
    _ShowNewsAndStore();
    _ShowFloatingPanels();

    // shows the pause menu scoreboard again when you are playing in a match, hides it entirely when in the mainmenu.
    if (GameStateAPI.IsLocalPlayerPlayingMatch()) {
        var elScoreboard = $.GetContextPanel().FindChildInLayoutFile('Scoreboard');
        if (elScoreboard) elScoreboard.visible = true;
    }
}
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
		UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_navdrawer.xml'); // honestly i have no clue what this is, perhaps something with debugging the popups?
	};

	                              
	var _ExpandSidebar = function( AutoClose = false ) // friendlist, shows your friendlist fully opened when you hover with your mouse over it.
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

	var _MinimizeSidebar = function() // hides the friendlist content when you move your mouse away from it.
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
	var _InitNewsAndStore = function () // this script is liability.. just like me, apparently
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

			//_AddWatchNoticePanel();

		_ShowNewsAndStore();
	};
	
	var _AddStream = function()
	{
		var elStream = $.CreatePanel( 'Panel', $.FindChildInContext( '#JsStreamContainer' ), 'JsStreamPanel' );
		elStream.BLoadLayout( 'file://{resources}/layout/mainmenu_stream.xml', false, false );
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
	//var _AddWatchNoticePanel = function()
	//{
	//	var WatchNoticeXML = '';
	//	var elPanel = $.CreatePanel( 'Panel', $.FindChildInContext( '#JsLeftColumn' ), 'JsWatchNoticePanel' );
	//	elPanel.BLoadLayout( WatchNoticeXML, false, false );
	//}
	
	var _ShowNewsAndStore = function ()
	{
		var elPanel = $.FindChildInContext( '#JsNewsContainer' );
		elPanel.SetHasClass( 'hidden', false );

		elPanel = $.FindChildInContext( '#JsActiveMissionPanel' );
		elPanel.SetHasClass( 'hidden', false );
	};

	var _HideNewsAndStore = function ()
	{
		var elPanel = $.FindChildInContext( '#JsNewsContainer' );
		elPanel.SetHasClass( 'hidden', true );

		elPanel = $.FindChildInContext( '#JsActiveMissionPanel' );
		elPanel.SetHasClass( 'hidden', true );
	};
	                                                                                                    
	                         
	                                                                                                    

	function OnHomeButtonPressed()
	{
		$.DispatchEvent( 'HideContentPanel' );
        $('#MainMenuNavBarHome').checked = true;
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
	
	var _AddStream = function()
	{
		//var elStream = $.CreatePanel( 'Panel', $.FindChildInContext( '#JsStreamContainer' ), 'JsStreamPanel' );
		//elStream.BLoadLayout( 'file://{resources}/layout/mainmenu_stream.xml', false, false );
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
	
    function _ShowFloatingPanels() {
        $.FindChildInContext('#JsLeftColumn').SetHasClass('hidden', false);
        $.FindChildInContext('#JsRightColumn').SetHasClass('hidden', false);
		$.FindChildInContext('#MainMenuVanityInfo').SetHasClass('hidden', false);
    }
    function _HideFloatingPanels() {
        $.FindChildInContext('#JsLeftColumn').SetHasClass('hidden', true);
        $.FindChildInContext('#JsRightColumn').SetHasClass('hidden', true);
		$.FindChildInContext('#MainMenuVanityInfo').SetHasClass('hidden', true);
    }     
    function _RightColumnLoad() // because for some reason, _ShowFloatingPanels cannot for the love of god load the frame id from mainmenu.xml, it's being loaded by this script which is hooked up to _OnShowMainMenu. i really have no clue why it's doing that.
    {
    var elRightColumn = $.CreatePanel('Panel', $.FindChildInContext('#JsRightColumn'), 'JsRightColumn');
    elRightColumn.BLoadLayout('file://{resources}/layout/mainmenu_right_column.xml', false, false);
    }	
    function _OnSteamIsPlaying() {
        const elNewsContainer = $.FindChildInContext('#JsNewsContainer');
        if (elNewsContainer) {
            elNewsContainer.SetHasClass('mainmenu-news-container-stream-active', EmbeddedStreamAPI.IsVideoPlaying());
        }
    }
    function _ResetNewsEntryStyle() {
        const elNewsContainer = $.FindChildInContext('#JsNewsContainer');
        if (elNewsContainer) {
            elNewsContainer.RemoveClass('mainmenu-news-container-stream-active');
        }
    }



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
		_UpdateLocalPlayerVanity();
	}
	    const _UpdateLocalPlayerVanity = function () {
        const oSettings = ItemInfo.GetOrUpdateVanityCharacterSettings();
       // const oLocalPlayer = m_aDisplayLobbyVanityData.filter(storedEntry => { return storedEntry.isLocalPlayer === true; });
       // oSettings.playeridx = oLocalPlayer.length > 0 ? oLocalPlayer[0].playeridx : 0;
        oSettings.xuid = MyPersonaAPI.GetXuid();
        oSettings.isLocalPlayer = true;
        _ApplyVanitySettingsToLobbyMetadata(oSettings);
        //_UpdatePlayerVanityModel(oSettings);
        _CreatUpdateVanityInfo(oSettings);
    };
	
var _m_bVanityAnimationAlreadyStarted = false;
var _m_bLocalVanityJustInitialized = false;

var _safeVanitySplit = function(vanityData) {
    if (!vanityData || vanityData.length === 0) return ['', '', '', '', ''];
    const parts = vanityData.split(',');
    while (parts.length < 5) parts.push('');
    return parts;
};

var _ForceRestartVanity = function () {
    _m_bVanityAnimationAlreadyStarted = false;

    const myXuid = MyPersonaAPI.GetXuid();
    const numPlayers = PartyListAPI.GetCount();

    for (let i = 0; i < numPlayers; i++) {
        const xuid = PartyListAPI.GetXuidByIndex(i);
        const vanityPanel = $('#JsMainmenu_Vanity_' + i);

        if (!xuid || !vanityPanel || !vanityPanel.IsValid()) continue;

        let oSettings = null;

        if (xuid === myXuid) {
            oSettings = ItemInfo.GetOrUpdateVanityCharacterSettings();
            if (oSettings) _ApplyVanitySettingsToLobbyMetadata(oSettings);

            const localVanityData = [
                oSettings.team,
                oSettings.charItemId,
                oSettings.glovesItemId,
                oSettings.loadoutSlot,
                oSettings.weaponItemId
            ].join(',');

            const alreadyApplied =
                (localVanityData === _m_sLastLocalVanityData) &&
                (oSettings.weaponItemId === _m_sLastLocalWeaponId);

            const panelNeedsAnim =
                (!vanityPanel.m_agentId) || (vanityPanel.BHasClass('hidden')) || (vanityPanel.m_xuid !== xuid);

            if (!(_m_bLocalVanityJustInitialized || (alreadyApplied && !panelNeedsAnim))) {
                oSettings.panel = vanityPanel;
                oSettings.activity = 'ACT_CSGO_UIPLAYER_WALKUP';
                oSettings.arrModifiers = ['vanity'];

                $.Schedule(0.0, function () {
                    if (vanityPanel && vanityPanel.IsValid()) {
                        CharacterAnims.PlayAnimsOnPanel(oSettings);
                    }
                });

                _m_sLastLocalVanityData = localVanityData;
                _m_sLastLocalWeaponId = oSettings.weaponItemId;
                _m_mapLastVanityDataByXuid[xuid] = localVanityData;
                _m_setInitializedXuids[xuid] = true;
            }
        } else {
            const vanityData = PartyListAPI.GetPartyMemberVanity(xuid);
            if (!vanityData) continue;

            const lastVanityData = _m_mapLastVanityDataByXuid[xuid];
            const hasBeenInitialized = _m_setInitializedXuids[xuid] === true;

            const panelNeedsReset =
                !vanityPanel.IsValid() ||
                vanityPanel.BHasClass('hidden') ||
                vanityPanel.m_agentId === '' ||
                vanityPanel.m_xuid !== xuid;

            if (vanityData !== lastVanityData || !hasBeenInitialized || panelNeedsReset) {
                const info = _safeVanitySplit(vanityData);
                oSettings = {
                    team: info[0],
                    charItemId: info[1],
                    glovesItemId: info[2],
                    loadoutSlot: info[3],
                    weaponItemId: info[4],
                    activity: 'ACT_CSGO_UIPLAYER_WALKUP',
                    arrModifiers: ['vanity'],
                    panel: vanityPanel
                };

                $.Schedule(0.0, function () {
                    if (vanityPanel && vanityPanel.IsValid()) {
                        CharacterAnims.PlayAnimsOnPanel(oSettings);
                    }
                });

                _m_mapLastVanityDataByXuid[xuid] = vanityData;
                _m_setInitializedXuids[xuid] = true;
            }
        }

        vanityPanel.RemoveClass('hidden');
        vanityPanel.SetSceneAngles(0, 0, 0, true);
        vanityPanel.hittest = false;

        _SetVanityLightingBasedOnBackgroundMovie(vanityPanel);
        _RigVanityHover(vanityPanel);

        $.Schedule(0.0, function () {
            if (vanityPanel && vanityPanel.IsValid()) vanityPanel.hittest = false;
        });

        if (oSettings) {
            vanityPanel.m_xuid = xuid;
            vanityPanel.m_agentId = oSettings.charItemId || '';
        }
    }

    _m_bLocalVanityJustInitialized = false;
};


var _m_sLastLocalVanityData = '';
var _m_sLastLocalWeaponId = '';
var _m_aCurrentLobbyVanityData = [];
var _m_mapLastVanityDataByXuid = {};
var _m_setInitializedXuids = {};
var _m_mapLastAnimTimeByXuid = {};


var _InitVanity = function(id, isLocalPlayer, settings) {
    var vanityPanel = $('#JsMainmenu_Vanity_' + id);
    if (!vanityPanel || !vanityPanel.IsValid()) {
        //$.Msg('[PanoramaScript] Init skipped — invalid panel at index ' + id);
        return;
    }

    var oSettings;
    const xuid = settings.xuid;

    if (isLocalPlayer) {
        oSettings = ItemInfo.GetOrUpdateVanityCharacterSettings();
        if (!oSettings) return;

        _m_bLocalVanityJustInitialized = true;

        const localVanityData = [
            oSettings.team,
            oSettings.charItemId,
            oSettings.glovesItemId,
            oSettings.loadoutSlot,
            oSettings.weaponItemId
        ].join(',');

        _m_sLastLocalVanityData = localVanityData;
        _m_sLastLocalWeaponId = oSettings.weaponItemId;
        _m_mapLastVanityDataByXuid[xuid] = localVanityData;
    } else {
        const vanityData = settings.vanity_data || '';
        const info = _safeVanitySplit(vanityData);

        oSettings = {
            team: info[0],
            charItemId: info[1],
            glovesItemId: info[2],
            loadoutSlot: info[3],
            weaponItemId: info[4]
        };

        _m_mapLastVanityDataByXuid[xuid] = info.join(',');
    }

    if (!oSettings.arrModifiers) oSettings.arrModifiers = [];
    if (!oSettings.arrModifiers.includes('vanity')) oSettings.arrModifiers.push('vanity');

    oSettings.activity = 'ACT_CSGO_UIPLAYER_WALKUP';
    oSettings.panel = vanityPanel;

    vanityPanel.RemoveClass('hidden');
    vanityPanel.m_xuid = xuid;
    vanityPanel.m_agentId = oSettings.charItemId || '';
    vanityPanel.SetSceneAngles(0, 0, 0, true);
    vanityPanel.hittest = false;

    $.Schedule(0.0, function () {
        if (vanityPanel && vanityPanel.IsValid()) {
            CharacterAnims.PlayAnimsOnPanel(oSettings);
        }
    });

    _SetVanityLightingBasedOnBackgroundMovie(vanityPanel);
    _RigVanityHover(vanityPanel);

    $.Schedule(3.0, function () {
        if (vanityPanel && vanityPanel.IsValid()) {
            vanityPanel.hittest = true;
        }
    });

    //$.Msg('[PanoramaScript] Init complete for xuid ' + xuid + ' | local: ' + isLocalPlayer);
};

var _ApplyVanitySettingsToLobbyMetadata = function( oSettings ) // applies vanity settings to your steam config file. if possible that is, if not connected then it will locally save it or won't save it depending on steam.
	{                                           
		PartyListAPI.SetLocalPlayerVanityPresence( oSettings.team,
			oSettings.charItemId, oSettings.glovesItemId,
			oSettings.loadoutSlot, oSettings.weaponItemId );
	};


var _LobbyPlayerUpdated = function() {
    var numPlayers = PartyListAPI.GetCount();
    var aCurrentLobbyVanityData = [];

    // d3gk: const for a good measure
    const localXuid = MyPersonaAPI.GetXuid();

    // d3gk: check data to prevent future cancer. Ugly but it will work
    // d3gk: also some optimizations for no reason ig
    let k = 0;
    let localPlayerData = null;
    for (;k < numPlayers;) {
        if (k >= numPlayers) {
            break;
        }
        var xuid = PartyListAPI.GetXuidByIndex(k);
        const _vanity_data = PartyListAPI.GetPartyMemberVanity(xuid);
        if (xuid && _vanity_data) {
            aCurrentLobbyVanityData.push({
                xuid: xuid,
                isLocalPlayer: xuid === localXuid,
                playeridx: k,
                vanity_data: _vanity_data
            });
            if(xuid === localXuid) {
                localPlayerData = aCurrentLobbyVanityData[k];
            }
            k++;
        }
    }
    
    // d3gk: I think bug is here
    // If newVanityData is empty string '', newVanityData.split(',')[4] makes no sense and will throw or I am stupid
    // Check my solution, idk what newWeaponId is suposed to be
    /*
    var newVanityData = localPlayerData && localPlayerData.vanity_data ? localPlayerData.vanity_data : '';
    var newWeaponId = newVanityData.split(',')[4];
    */
    var newVanityData = localPlayerData && localPlayerData.vanity_data ? localPlayerData.vanity_data : '';
    var newWeaponId = (newVanityData === '') ? '' : newVanityData.split(',')[4];
    
    
    // d3gk: this also makes no sense for me. I won't modify it bc i have no clue what it does.
    if (newVanityData !== _m_sLastLocalVanityData || newWeaponId !== _m_sLastLocalWeaponId) {
        _m_sLastLocalVanityData = '';
        _m_sLastLocalWeaponId = '';
    }

    var oSettings = ItemInfo.GetOrUpdateVanityCharacterSettings();
    
    
    // d3gk: just for good measure #2
    if (oSettings) {
        _ApplyVanitySettingsToLobbyMetadata(oSettings);
    }
    
    _UpdateLobbyVanity(aCurrentLobbyVanityData);

    $.Schedule(0.1, function () {
        _ForceRestartVanity();
    });
};


var _UpdateLobbyVanity = function(players)
{
    const localXuid = MyPersonaAPI.GetXuid();

    for (let i = 0; i < 5; i++) {
        let vanityPanel = $('#JsMainmenu_Vanity_' + i);

        if (!players[i]) {
            if (vanityPanel && !vanityPanel.BHasClass('hidden')) {
                vanityPanel.AddClass('hidden');
            }
            continue;
        }

        const newData = players[i];
        const xuid = newData.xuid;
		
        const isLocalPlayer = (xuid === localXuid);
        const newVanityData = newData.vanity_data;
        const newWeaponId = newVanityData.split(',')[4];
        const lastVanityData = _m_mapLastVanityDataByXuid[xuid];

        const panelInitialized =
            vanityPanel &&
            vanityPanel.IsValid() &&
            !vanityPanel.BHasClass('hidden') &&
            vanityPanel.m_agentId !== '';

        if (newVanityData === lastVanityData && panelInitialized) {
            //$.Msg('Skipping vanity update for xuid ' + xuid + ' — already initialized.');
            continue;
        }

        if (isLocalPlayer &&
            newVanityData === _m_sLastLocalVanityData &&
            newWeaponId === _m_sLastLocalWeaponId) {
            //$.Msg('Skipping vanity update for local player — no weapon change.');
            continue;
        }

        _m_mapLastVanityDataByXuid[xuid] = newVanityData;

        _InitVanity(newData.playeridx, isLocalPlayer, newData);
        _m_setInitializedXuids[xuid] = true;
    }

    _m_aCurrentLobbyVanityData = players;
};

	var _InitVanityNoGC = function() // all this does is show the vanity while not connected to GC to fix the giant idle ct agent in the ui.. only removed the inventory api thing.
	{                          
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
		$.Schedule( 3.0, function() {if (vanityPanel && vanityPanel.IsValid() ) vanityPanel.hittest = false;} );
	};
	
var _SetVanityLightingBasedOnBackgroundMovie = function( vanityPanel ) // background lighting, scene angles will be used for each background in the future.
{
    var backgroundMap = 'anubis'; // fallback to fix js error while in game? 

    var elMovie = $.GetContextPanel().FindChildInLayoutFile('MainMenuMovie');
    if (elMovie)
    {
        backgroundMap = elMovie.GetAttributeString('data-type', 'anubis');
    }

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
			//vanityPanel.SetSceneAngles( 0, 0, 0, true );   
		}
else if ( backgroundMap === 'dust2' )
{

    vanityPanel.SetFlashlightAmount( 2.0 );
    vanityPanel.SetFlashlightFOV( 55 );
    vanityPanel.SetFlashlightColor( 2.4, 2.3, 2.2 ); 


    vanityPanel.SetAmbientLightColor( 0.48, 0.45, 0.4 );


    vanityPanel.SetDirectionalLightModify( 0 );
    vanityPanel.SetDirectionalLightColor( 1.1, 1.05, 0.95 );
    vanityPanel.SetDirectionalLightDirection( -0.15, 0.95, -0.3 );


    vanityPanel.SetDirectionalLightModify( 1 );
    vanityPanel.SetDirectionalLightColor( 0.35, 0.33, 0.3 );
    vanityPanel.SetDirectionalLightDirection( 0.0, -0.4, 0.5 );


    vanityPanel.SetDirectionalLightModify( 2 );
    vanityPanel.SetDirectionalLightColor( 0.2, 0.2, 0.18 );
    vanityPanel.SetDirectionalLightDirection( 0.4, 0.4, -0.6 );
	//vanityPanel.SetSceneAngles( 0, 0, 0, true );   
}
else if ( backgroundMap === 'warehouse' )
{
    vanityPanel.SetFlashlightAmount( 1.8 );
    vanityPanel.SetFlashlightFOV( 55 );
    vanityPanel.SetFlashlightColor( 2.1, 2.0, 1.7 );

    vanityPanel.SetAmbientLightColor( 0.38, 0.36, 0.42 );

    vanityPanel.SetDirectionalLightModify( 0 );
    vanityPanel.SetDirectionalLightColor( 0.25, 0.28, 0.4 ); 
    vanityPanel.SetDirectionalLightDirection( -0.5, 0.8, -0.3 );

    vanityPanel.SetDirectionalLightModify( 1 );
    vanityPanel.SetDirectionalLightColor( 0.28, 0.22, 0.18 );
    vanityPanel.SetDirectionalLightDirection( 0.6, -0.2, -0.6 );

    vanityPanel.SetDirectionalLightModify( 2 );
    vanityPanel.SetDirectionalLightColor( 0.1, 0.12, 0.18 );
    vanityPanel.SetDirectionalLightDirection( 0.3, 0.5, -0.8 );

    //vanityPanel.SetSceneAngles( 0, 0, 0, true );
}
else if ( backgroundMap === 'mirage' )
{

    vanityPanel.SetFlashlightAmount( 2.0 );
    vanityPanel.SetFlashlightFOV( 55 );
    vanityPanel.SetFlashlightColor( 2.3, 2.2, 2.1 ); 


    vanityPanel.SetAmbientLightColor( 0.46, 0.44, 0.4 );


    vanityPanel.SetDirectionalLightModify( 0 );
    vanityPanel.SetDirectionalLightColor( 1.05, 1.0, 0.9 );
    vanityPanel.SetDirectionalLightDirection( -0.2, 0.92, -0.35 );


    vanityPanel.SetDirectionalLightModify( 1 );
    vanityPanel.SetDirectionalLightColor( 0.3, 0.28, 0.26 );
    vanityPanel.SetDirectionalLightDirection( 0.0, -0.5, 0.5 );


    vanityPanel.SetDirectionalLightModify( 2 );
    vanityPanel.SetDirectionalLightColor( 0.22, 0.2, 0.18 );
    vanityPanel.SetDirectionalLightDirection( 0.5, 0.5, -0.6 );
	//vanityPanel.SetSceneAngles( 0, 0, 0, true );   
}
else if ( backgroundMap === 'inferno' )
{

    vanityPanel.SetFlashlightAmount( 2.1 );
    vanityPanel.SetFlashlightFOV( 55 );
    vanityPanel.SetFlashlightColor( 2.35, 2.2, 2.0 ); 


    vanityPanel.SetAmbientLightColor( 0.5, 0.45, 0.4 );


    vanityPanel.SetDirectionalLightModify( 0 );
    vanityPanel.SetDirectionalLightColor( 1.05, 1.0, 0.9 );
    vanityPanel.SetDirectionalLightDirection( -0.2, 0.92, -0.35 );


    vanityPanel.SetDirectionalLightModify( 1 );
    vanityPanel.SetDirectionalLightColor( 0.35, 0.3, 0.25 );
    vanityPanel.SetDirectionalLightDirection( 0.1, -0.5, 0.6 );


    vanityPanel.SetDirectionalLightModify( 2 );
    vanityPanel.SetDirectionalLightColor( 0.2, 0.18, 0.15 );
    vanityPanel.SetDirectionalLightDirection( 0.5, 0.4, -0.6 );
	//vanityPanel.SetSceneAngles( 0, 0, 0, true );   
}
else if (backgroundMap === 'sirocco') {
    vanityPanel.SetFlashlightAmount( 2.2 );  
    vanityPanel.SetFlashlightFOV( 65 );
    vanityPanel.SetFlashlightColor( 2.0, 1.9, 1.7 );  // warm-white light

    vanityPanel.SetAmbientLightColor( 0.35, 0.32, 0.28 ); // slightly warm ambient

    vanityPanel.SetDirectionalLightModify( 0 );
    vanityPanel.SetDirectionalLightColor( 0.9, 0.75, 0.55 ); // sunlight (warm)
    vanityPanel.SetDirectionalLightDirection( 0.2, 0.7, -0.65 );

    vanityPanel.SetDirectionalLightModify( 1 );
    vanityPanel.SetDirectionalLightColor( 0.15, 0.18, 0.25 ); // cool shadow fill
    vanityPanel.SetDirectionalLightDirection( -0.85, -0.2, -0.5 );

    vanityPanel.SetDirectionalLightModify( 2 );
    vanityPanel.SetDirectionalLightColor( 0.05, 0.05, 0.07 ); // subtle bounce
    vanityPanel.SetDirectionalLightDirection( 0.7, 0.5, -0.4 );

    // vanityPanel.SetSceneAngles( 0, 0, 0, true );   
}
else if ( backgroundMap === 'nuke' )
{
    vanityPanel.SetFlashlightAmount( 2.6 ); 
    vanityPanel.SetFlashlightFOV( 52 );
    vanityPanel.SetFlashlightColor( 2.1, 2.0, 1.75 ); 

    vanityPanel.SetAmbientLightColor( 0.38, 0.34, 0.3 ); 

    vanityPanel.SetDirectionalLightModify( 0 );
    vanityPanel.SetDirectionalLightColor( 1.0, 0.9, 0.75 ); 
    vanityPanel.SetDirectionalLightDirection( 0.0, -1.0, 0.0 );

    vanityPanel.SetDirectionalLightModify( 1 );
    vanityPanel.SetDirectionalLightColor( 0.45, 0.35, 0.22 ); 
    vanityPanel.SetDirectionalLightDirection( 0.6, 0.1, -0.5 );

    vanityPanel.SetDirectionalLightModify( 2 );
    vanityPanel.SetDirectionalLightColor( 0.22, 0.2, 0.18 ); 
    vanityPanel.SetDirectionalLightDirection( -0.4, 0.5, -0.6 );

    //vanityPanel.SetSceneAngles( 0, 0, 0, true );
}
else if ( backgroundMap === 'train' )
{

    vanityPanel.SetFlashlightAmount( 1.2 );
    vanityPanel.SetFlashlightFOV( 50 );
    vanityPanel.SetFlashlightColor( 2.4, 2.35, 2.2 ); 


    vanityPanel.SetAmbientLightColor( 0.2, 0.25, 0.3 );


    vanityPanel.SetDirectionalLightModify( 0 );
    vanityPanel.SetDirectionalLightColor( 1.0, 0.95, 0.85 );
    vanityPanel.SetDirectionalLightDirection( 0.0, -1.0, 0.0 );


    vanityPanel.SetDirectionalLightModify( 1 );
    vanityPanel.SetDirectionalLightColor( 0.25, 0.3, 0.4 );
    vanityPanel.SetDirectionalLightDirection( 0.3, 0.6, -0.4 );


    vanityPanel.SetDirectionalLightModify( 2 );
    vanityPanel.SetDirectionalLightColor( 0.12, 0.14, 0.2 );
    vanityPanel.SetDirectionalLightDirection( -0.4, 0.5, -0.6 );
	//vanityPanel.SetSceneAngles( 0, 0, 0, true );   
}
else if ( backgroundMap === 'office' )
{

    vanityPanel.SetFlashlightAmount( 2.8 );
    vanityPanel.SetFlashlightFOV( 55 );
    vanityPanel.SetFlashlightColor( 2.0, 2.05, 2.2 ); 


    vanityPanel.SetAmbientLightColor( 0.25, 0.3, 0.45 );


    vanityPanel.SetDirectionalLightModify( 0 );
    vanityPanel.SetDirectionalLightColor( 0.8, 0.85, 0.95 );
    vanityPanel.SetDirectionalLightDirection( 0.0, -1.0, 0.0 ); 


    vanityPanel.SetDirectionalLightModify( 1 );
    vanityPanel.SetDirectionalLightColor( 0.4, 0.45, 0.6 );
    vanityPanel.SetDirectionalLightDirection( -0.4, 0.3, -0.5 );


    vanityPanel.SetDirectionalLightModify( 2 );
    vanityPanel.SetDirectionalLightColor( 0.2, 0.25, 0.3 );
    vanityPanel.SetDirectionalLightDirection( 0.5, 0.4, -0.3 );
	//vanityPanel.SetSceneAngles( 0, 0, 0, true );   
}
else if ( backgroundMap === 'anubis' )
{

    vanityPanel.SetFlashlightAmount( 2.0 );
    vanityPanel.SetFlashlightFOV( 55 );
    vanityPanel.SetFlashlightColor( 2.5, 2.3, 2.0 );


    vanityPanel.SetAmbientLightColor( 0.5, 0.45, 0.38 );


    vanityPanel.SetDirectionalLightModify( 0 );
    vanityPanel.SetDirectionalLightColor( 1.1, 0.95, 0.75 );
    vanityPanel.SetDirectionalLightDirection( -0.1, 0.85, -0.5 );


    vanityPanel.SetDirectionalLightModify( 1 );
    vanityPanel.SetDirectionalLightColor( 0.25, 0.3, 0.35 );
    vanityPanel.SetDirectionalLightDirection( 0.0, -0.5, 0.5 );


    vanityPanel.SetDirectionalLightModify( 2 );
    vanityPanel.SetDirectionalLightColor( 0.15, 0.12, 0.08 );
    vanityPanel.SetDirectionalLightDirection( 0.5, 0.4, -0.6 );
	//vanityPanel.SetSceneAngles( 0, 0, 0, true );   
}
else if ( backgroundMap === 'vertigo' )
{

    vanityPanel.SetFlashlightAmount( 2.2 );
    vanityPanel.SetFlashlightFOV( 55 );
    vanityPanel.SetFlashlightColor( 2.2, 2.3, 2.6 ); 


    vanityPanel.SetAmbientLightColor( 0.42, 0.48, 0.58 );


    vanityPanel.SetDirectionalLightModify( 0 );
    vanityPanel.SetDirectionalLightColor( 1.1, 1.2, 1.35 );
    vanityPanel.SetDirectionalLightDirection( -0.25, 0.92, -0.32 );


    vanityPanel.SetDirectionalLightModify( 1 );
    vanityPanel.SetDirectionalLightColor( 0.35, 0.35, 0.3 );
    vanityPanel.SetDirectionalLightDirection( 0.15, -0.4, 0.2 );


    vanityPanel.SetDirectionalLightModify( 2 );
    vanityPanel.SetDirectionalLightColor( 0.2, 0.25, 0.35 );
    vanityPanel.SetDirectionalLightDirection( 0.6, 0.5, -0.5 );
	//vanityPanel.SetSceneAngles( 0, 0, 0, true );   
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
            //vanityPanel.SetSceneAngles( 0, 0, 0, true );   			
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
            //vanityPanel.SetSceneAngles( 0, 0, 0, true );   			
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
			//vanityPanel.SetSceneAngles( 0, 0, 0, true );   
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
			vanityPanel.SetDirectionalLightDirection( 0.62, -0.74, 0.25 );
			vanityPanel.SetDirectionalLightPulseFlicker( 0.25, 0.25, 0.25, 0.25 );

			vanityPanel.SetDirectionalLightModify( 2 );
			vanityPanel.SetDirectionalLightColor( 0.72, 1.40, 1.68 );
			vanityPanel.SetDirectionalLightDirection( 0.50, -0.69, -0.52 );
			//vanityPanel.SetSceneAngles( 0, 0, 0, true );   

			                                                   
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
			//vanityPanel.SetSceneAngles( 0, 0, 0, true );   
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
    function _OpenFullscreenStore(openToSection = '') {
        _NavigateToTab('JsMainMenuStore', 'mainmenu_store_fullscreen', openToSection !== '' ? openToSection : 'id-store-nav-coupon');
    }
    function _OpenStatsMenu() {
        _NavigateToTab('JsPlayerStats', 'mainmenu_playerstats');
    }
    function _OpenSettingsMenu() {
        _NavigateToTab('JsSettings', 'settings/settings');
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
	function _PlayMenuSong() {
	 $.DispatchEvent('PlayMainMenuMusic', true, false ); // forcing the non panoramic effect fixes all issues i had with this piece of shit.. if i went further i would've rather overdosed on MDMA...
	}
	var OnEscapeKeyPressed = function( eSource, nRepeats, focusPanel )
	{
		                                
		if ( $.GetContextPanel().BHasClass( 'MainMenuRootPanel--PauseMenuMode' ) ) {
			$.DispatchEvent( 'CSGOMainMenuResumeGame' );
			$('#MainMenuNavBarHome').checked = true;
		}
		else {
			MainMenu.OnHomeButtonPressed();
			$('#MainMenuNavBarHome').checked = true;

			var elPlayButton = $( '#MainMenuNavBarPlay' );
			if( elPlayButton && !elPlayButton.BHasClass( 'mainmenu-navbar__btn-small--hidden' ) ) {
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
        if (!MyPersonaAPI.IsConnectedToGC() || !MyPersonaAPI.IsInventoryValid())
            return;
        const prevClientGenTime = Number(GameInterfaceAPI.GetSettingString("cl_redemption_reset_timestamp"));
    }
    function _OnRankUpRedemptionStoreClosed() {
        _m_bHasPopupNotification = false;
        _msg('_OnRankUpRedemptionStoreClosed');
    }
    function _UpdateInventoryBtnAlert() {
        const aNewItems = AcknowledgeItems.GetItems();
        const count = aNewItems.length;
        const elNavBar = $.GetContextPanel().FindChildInLayoutFile('MainMenuNavBarTop'), elAlert = elNavBar.FindChildInLayoutFile('MainMenuInvAlert');
        elAlert.SetDialogVariable("alert_value", count.toString());
        elAlert.SetHasClass('hidden', count < 1);
    }
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
    function _RegisterOnShowEvents() {
    NewNewsEntryCheck.RegisterForRssReceivedEvent();
    }
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

function _GetNotificationBarData() { // rest in peace 32px line at the top of the screen. we'll miss you :( valve updated the notifications and replaced the good old bar we had since csgos panorama release until the viewmodel recoil hotfix.
    let aAlerts = [];

    if (LicenseUtil.GetCurrentLicenseRestrictions() === false) {
        const notification = { color_class: "", title: "", tooltip: "", link: "", icon: "" };
        const bIsConnectedToGC = MyPersonaAPI.IsConnectedToGC();
        $('#MainMenuInput').SetHasClass('GameClientConnectingToGC', !bIsConnectedToGC);
        if (bIsConnectedToGC) {
            _m_tLastSeenDisconnectedFromGC = 0;
        } else if (!_m_tLastSeenDisconnectedFromGC) {
            _m_tLastSeenDisconnectedFromGC = +new Date();
        } else if (Math.abs((+new Date()) - _m_tLastSeenDisconnectedFromGC) > 500) {
            notification.title = $.Localize("#Store_Connecting_ToGc");
            notification.tooltip = $.Localize("#Store_Connecting_ToGc_Tooltip");
            notification.color_class = "";
            notification.icon = "gc-connecting";
            notification.is_gc_connecting = true;
            aAlerts.push(notification);
        }
    }

    const nIsVacBanned = MyPersonaAPI.IsVacBanned();
    if (nIsVacBanned != 0) {
        const notification = { color_class: "", title: "", tooltip: "", link: "", icon: "" };
        notification.color_class = "red-alert";
        notification.icon = "ban_global";

        if ((nIsVacBanned & 1) == 1) {
            notification.title = $.Localize("#SFUI_MainMenu_Vac_Title");
            notification.tooltip = $.Localize("#SFUI_MainMenu_Vac_Info");
            notification.link = "https://help.steampowered.com/faqs/view/647C-5CC1-7EA9-3C29";
        } else if ((nIsVacBanned & 4) == 4) {
            notification.title = $.Localize("#SFUI_MainMenu_AccountLocked_Title");
            notification.tooltip = $.Localize("#SFUI_MainMenu_AccountLocked_Info");
            notification.link = "https://help.steampowered.com/en/faqs/view/4F62-35F9-F395-5C23";
        } else {
            notification.title = $.Localize("#SFUI_MainMenu_GameBan_Title");
            notification.tooltip = $.Localize("#SFUI_MainMenu_GameBan_Info");
            notification.link = "https://help.steampowered.com/faqs/view/4E54-0B96-D0A4-1557";
        }

        aAlerts.push(notification);
    } else {
        const nBanRemaining = CompetitiveMatchAPI.GetCooldownSecondsRemaining();
        if (nBanRemaining > 0) {
            const notification = { color_class: "", title: "", tooltip: "", link: "", icon: "" };
            notification.tooltip = CompetitiveMatchAPI.GetCooldownReason();
            const strType = CompetitiveMatchAPI.GetCooldownType();

            if (strType == "global") {
                notification.title = $.Localize("#SFUI_MainMenu_Global_Ban_Title");
                notification.color_class = "red-alert"; // it was yellow before even though global bans should be red!      d3gk agrees
                notification.icon = "ban_competitive";
            } else if (strType == "green") {
                notification.title = $.Localize("#SFUI_MainMenu_Temporary_Ban_Title");
                notification.color_class = "green-alert"; // it was also yellow before even though temp bans are supposed to be green like before!!! valve please include my fix that i reported on cs2's bug report github page.
                notification.icon = "ban_competitive";
            } else if (strType == "competitive") {
                notification.title = $.Localize("#SFUI_MainMenu_Competitive_Ban_Title");
                notification.color_class = "yellow-alert";
                notification.icon = "ban_competitive";
            }

            if (!CompetitiveMatchAPI.CooldownIsPermanent()) {
                const title = notification.title;
                if (CompetitiveMatchAPI.ShowFairPlayGuidelinesForCooldown()) {
                    notification.link = "https://blog.counter-strike.net/index.php/fair-play-guidelines/";
                }
                notification.title = title + ' ' + FormatText.SecondsToSignificantTimeString(nBanRemaining);
            }

            aAlerts.push(notification);
        }
    }
    if (g_bModVersionOutdated) {
    const notification = {
        color_class: "yellow-alert",
        icon: "client_update",
        title: $.Localize("#SFUI_MainMenu_Discontinued_Title"),
        tooltip:
            "#SFUI_MainMenu_Discontinued_Body"
    };
    aAlerts.push(notification);
    }
    return aAlerts;
}

    function _UpdateNotificationBar() {
        const aNotifications = _GetNotificationBarData();
        _m_elNotificationsContainer.Children().forEach(icon => {
            if (icon && icon.IsValid()) {
                icon.SetHasClass('show', false);
            }
        });
        if (!aNotifications || aNotifications.length < 1) {
            _m_elNotificationsContainer.SetHasClass('show', false);
            return;
        }
        _m_elNotificationsContainer.SetHasClass('show', true);
        aNotifications.forEach(notification => {
            let oNotification = notification;
            let elIcon = _m_elNotificationsContainer.FindChildInLayoutFile('id-alert-navbar-' + oNotification.icon);
            if (oNotification.is_gc_connecting && elIcon) {
                elIcon.SetHasClass('show', true);
            }
            else {
                if (!elIcon) {
                    elIcon = $.CreatePanel(('Image'), _m_elNotificationsContainer, 'id-alert-navbar-' + oNotification.icon, { class: 'mainmenu-top-navbar__radio-btn__icon mainmenu-top-navbar__alerts-icon',
                        src: 'file://{images}/icons/ui/' + oNotification.icon + '.svg'
                    });
                }
                elIcon.SwitchClass('alert-color', oNotification.color_class);
                elIcon.SetHasClass('show', true);
            }
            elIcon.SetPanelEvent('onactivate', () => {
                let gc = oNotification.is_gc_connecting === true ? 'true' : 'false';
                let elContextMenu = UiToolkitAPI.ShowCustomLayoutContextMenuParameters('', '', 'file://{resources}/layout/context_menus/context_menu_navbar_notification.xml', 'icon=' + oNotification.icon + '&' +
                    'color=' + oNotification.color_class + '&' +
                    'title=' + oNotification.title + '&' +
                    'tooltip=' + oNotification.tooltip + '&' +
                    'link=' + oNotification.link + '&' +
                    'gcconnecting=' + gc);
                elContextMenu.AddClass("ContextMenu_NoArrow");
                elContextMenu.SetFocus();
            });
            elIcon.SetPanelEvent('onmouseover', () => {
                UiToolkitAPI.ShowTitleTextTooltip('id-alert-navbar-' + oNotification.icon, oNotification.title, oNotification.tooltip);
            });
            elIcon.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideTitleTextTooltip(); });
        });
    }
    function _UpdateNotifications() {
        if (_m_notificationSchedule == false) {
            _LoopUpdateNotifications();
        }
    }
    function _LoopUpdateNotifications() {
        _UpdatePopupnotification();
        _UpdateNotificationBar();
        _m_notificationSchedule = $.Schedule(1, _LoopUpdateNotifications);
    }

	                                                                                                    
	                    
	                                                                                                    
	var _m_acknowledgePopupHandler = null;
	var _ShowAcknowledgePopup = function( type = '', itemid = '' ) // inventory acknowledge popup that shows up when you either use a xp boost pack.
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
	
var _ShowDevContextMenu = function() {
    function showOperation() {
        var elPanel = UiToolkitAPI.ShowCustomLayoutPopupParameters(
            '',
            'file://{resources}/layout/operation/operation_main.xml',
            'none'
        );
        $.DispatchEvent('PlaySoundEffect', 'tab_mainmenu_inventory', 'MOUSE');
        elPanel.SetAttributeInt("season_access", 9);
    }

    var items = [
        { label: 'Dev Tools', style: 'Disabled' },
        { label: 'ControlsLib', jsCallback: _NavigateToTab.bind(undefined, 'JSConsolsLib', 'controlslibrary') },
        { label: 'DevUI', jsCallback: _NavigateToTab.bind(undefined, 'JSTests1', 'mainmenu_tests') },
        { label: 'CS360', jsCallback: _NavigateToTab.bind(undefined, 'JSCS360', 'mainmenu_playerstats') },

        { label: 'Main Menu Testing', style: 'TopSeparator' },
        { label: 'MainMenuTests', jsCallback: _NavigateToTab.bind(undefined, 'JsTests', 'mainmenu_tests') },
        { label: 'MainMenuPerf', jsCallback: _NavigateToTab.bind(undefined, 'JsPerf', 'mainmenu_perf') },

        { label: 'Store & News', style: 'TopSeparator' },
        { label: 'CSGOsStore', jsCallback: _NavigateToTab.bind(undefined, 'JSSmallStore', 'mainmenu_store') },
        { label: 'CSGOsNews', jsCallback: _NavigateToTab.bind(undefined, 'JSNews', 'mainmenu_news') },


        { label: 'External Tools', style: 'TopSeparator' },
        { label: 'ServerBrowser', jsCallback: _NavigateToTab.bind(undefined, 'JSServerBrowser', 'server_browser/server_browser') },
        { label: 'YouTube', jsCallback: _WebBrowser.bind(undefined) },

        { label: 'Operation', style: 'TopSeparator' },
        { label: 'OperationMain', jsCallback: showOperation.bind(undefined) },
		{ label: 'Enable Vanity Debug', jsCallback: function() {$('#JsMainmenu_Vanity_0').Children()[0].style.visibility = 'visible'}.bind() },
		{ label: 'OperationStore', jsCallback: OperationUtil.OpenPopupCustomLayoutOperationStore.bind(undefined) }
    ];

    UiToolkitAPI.ShowSimpleContextMenu('', 'DevContextMenu', items);
};

	var _WebBrowser = function()
{
    UiToolkitAPI.ShowCustomLayoutPopupParameters( '', 'file://{resources}/layout/popups/popup_browser.xml', '', 'none' );
};
var _OpStore = function()
{
    UiToolkitAPI.ShowCustomLayoutPopupParameters( '', 'file://{resources}/layout/operation/operation_store.xml', '', 'none' );
};

	var _ShowOperationLaunchPopup = function() // when is a new operation coming valve? in cs2 it seems to be never sadly, armory is the permanent operation that you get in cs2 now and is never going away unless they change their mind. d3gk: valve found infinite money glitch. armory has decent outcome and requires something about no work to carry out.
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

var _PauseMainMenuCharacter = function() {
    for (let i = 0; i < 5; i++) {
        let vanityPanel = $('#JsMainmenu_Vanity_' + i);
        if (vanityPanel) vanityPanel.Pause(true);
    }
};

var _UnPauseMainMenuCharacter = function() {
    for (let i = 0; i < 5; i++) {
        let vanityPanel = $('#JsMainmenu_Vanity_' + i);
        if (vanityPanel) vanityPanel.Pause(false);
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

	function _SwitchVanity ( team ) // switches your vanity to your desired team. pretty cool ain't it? ooo    d3gk: yes, it is
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


	return { // return functions, this is primarily used when making new scripts that get executed when OnShowMainMenu function loads. also these information tooltips in the script probably made the script twice as large.. sorry but i had to for dev purposes. - god forgives.
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
		InitVanity							: _InitVanity,
		ForceRestartVanity	 				: _ForceRestartVanity,
		OnEquipSlotChanged	 				: _OnEquipSlotChanged,
		OpenPlayMenu						: _OpenPlayMenu,
		WebBrowser                          : _WebBrowser,
		OpStore                             : _OpStore,
		ShowDevContextMenu                    : _ShowDevContextMenu,
		OpenWatchMenu						: _OpenWatchMenu,
		OpenStatsMenu						: _OpenStatsMenu,
		OpenInventory						: _OpenInventory,
		OpenFullscreenStore                 : _OpenFullscreenStore,
		OpenSettings						: _OpenSettings,
		OpenSettingsMenu					: _OpenSettingsMenu,
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
		HideMainMenuNewsPanel				: _HideMainMenuNewsPanel,
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
		SwitchVanity						: _SwitchVanity,
		GoToCharacterLoadout				: _GoToCharacterLoadout,
		OpenSubscriptionUpsell				: _OpenSubscriptionUpsell,
		UpdateUnlockCompAlert				: _UpdateUnlockCompAlert,
		DevAlertMgr							: _DevAlertMgr
	};
})();


                                                                                                    
                                           
// d3gk: putting this in a self-executing function seems to make no sense.
//       won't remove it tho, bc maybe it has some hidden meaning in volvo's world, where stuff is everything but obvious.
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

	$.RegisterForUnhandledEvent( "ForceRestartVanity", MainMenu.ForceRestartVanity );

	$.RegisterForUnhandledEvent( "CSGOMainInitBackgroundMovie", MainMenu.SetBackgroundMovie );
	$.RegisterForUnhandledEvent( "MainMenuGoToSettings", MainMenu.OpenSettings );
	$.RegisterForUnhandledEvent( "MainMenuSwitchVanity", MainMenu.SwitchVanity );
	$.RegisterForUnhandledEvent( "MainMenuGoToCharacterLoadout", MainMenu.GoToCharacterLoadout );
	
	MainMenu.MinimizeSidebar();
	MainMenu.InitVanity();
	MainMenu.MinimizeSidebar();
	MainMenu.InitNewsAndStore();
	MainMenu.InitFriendsList();


	                                                                                  
	$.RegisterEventHandler( "Cancelled", $.GetContextPanel(), MainMenu.OnEscapeKeyPressed );

})();

// btw, valves code is junk. the ui blur for example is so fucking badly implemented lmao.. not even properly tested.. if it ain't broke, don't fix it moment.

// d3gk: Yeah, good code looks nothing like this. All things should be checked at every point is that serious of a game as CS is. This excludes the vast majority of bugs!
