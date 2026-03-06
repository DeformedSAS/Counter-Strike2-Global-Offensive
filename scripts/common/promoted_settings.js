'use strict';

                                                                                                                                      
var g_PromotedSettingsVersion = 1;

var g_PromotedSettings = [
	  
		                                                              
		                                                                 
		                                                                
		                                                 
		  	
		                                       
		                                                                                        
		                                                      
		                                                      
		                                                                              
		                                                                                                                         
					                                           
		                                                                                                              
					                                    
	  
	{
		id: "BuyMenuDonationKey",
		loc_name: "#SFUI_Settings_BuyWheelDonateKey",
		loc_desc: "#SFUI_Settings_BuyWheelDonateKey_Info",
		section: "GameSettings",
		start_date: new Date( 'December 17, 2020' ), 
		end_date: new Date( 'April 31, 2021' ),
	},
	{
		id: "SettingsChatWheel",
		loc_name: "#settings_ui_chatwheel_section",
		loc_desc: "#Chatwheel_description",
		section: "KeybdMouseSettings",
		start_date: new Date( 'November 25, 2020' ), 
		end_date: new Date( 'April 30, 2021' ),
	},
	{
		id: "SettingsCommunicationSettings",
		                                           
		                                        
		loc_name: "#SFUI_Settings_FilterText_Title",
		loc_desc: "#SFUI_Settings_FilterText_Title_Tooltip",
		section: "GameSettings",
		start_date: new Date( 'June 11, 2020' ), 
		end_date: new Date( 'June 30, 2020' )
	},
	{
	    id: "MainMenuMovieSceneSelector",
	    loc_name: "#GameUI_MainMenuMovieScene",
	    loc_desc: "#GameUI_MainMenuMovieScene_Tooltip",
		section: "VideoSettings",
		start_date: new Date( 'May 26, 2020' ), 
		end_date: new Date( 'June 15, 2020' )
	},
	{
	    id: "XhairShowObserverCrosshair",
	    loc_name: "#GameUI_ShowObserverCrosshair",
	    loc_desc: "#GameUI_ShowObserverCrosshair_Tooltip",
		section: "GameSettings",
		start_date: new Date( 'April 15, 2020' ), 
		end_date: new Date( 'May 1, 2020' )
	},
	{
		id: "SettingsCrosshair",
		loc_name: "#settings_crosshair",
		loc_desc: "#settings_crosshair_info",
		section: "GameSettings",
		start_date: new Date( 'February 24, 2019' ), 
		end_date: new Date( 'March 28, 2020' )
	},
	{
		id: "TripleMonitor",
		loc_name: "#SFUI_Settings_Triple_Monitor",
		loc_desc: "#GameUI_TripleMonitor_Tooltip",
		section: "VideoSettings",
		start_date: new Date( 'November 20, 2019' ), 
		end_date: new Date( 'January 30, 2020' )
	},
	{
		id: "ClutchKey",
		loc_name: "#GameUI_Clutch_Key",
		loc_desc: "#GameUI_Clutch_Key_Tooltip",
		section: "KeybdMouseSettings",
		start_date: new Date( 'September 21, 2019' ), 
		end_date: new Date( 'January 30, 2020' )
	},
	{
		id: "id-friendlyfirecrosshair",
		loc_name: "#GameUI_FriendlyWarning",
		loc_desc: "#GameUI_FriendlyWarning_desc",
		section: "GameSettings",
		start_date: new Date( 'October 7, 2019' ), 
		end_date: new Date( 'February 30, 2020' )
	},
	{
		id: "SettingsCommunicationSettings",
		loc_name: "#settings_comm_binds_section",
		loc_desc: "#settings_comm_binds_info",
		section: "GameSettings",
		start_date: new Date( 'September 13, 2019' ), 
		end_date: new Date( 'January 30, 2020' )
	},
	{
		id: "RadialWepMenuBinder",
		loc_name: "#SFUI_RadialWeaponMenu",
		loc_desc: "#SFUI_RadialWeaponMenu_Desc",
		section: "KeybdMouseSettings",
		start_date: new Date( 'September 18, 2019' ), 
		end_date: new Date( 'January 30, 2020' )
	},
	{
		id: "ViewmodelSway",
		loc_name: "#SFUI_Settings_ViewmodelSway",
		loc_desc: "This allows you to change your viewmodels sway amount",
		section: "GameSettings",
		start_date: new Date( 'July 7, 2025' ), 
		end_date: new Date( 'August 7, 2025' )
	},
	{
		id: "PanoramaFPS",
		loc_name: "Show Panorama FPS",
		loc_desc: "Displays panorama's built in FPS counter.",
		section: "VideoSettings",
		start_date: new Date( 'July 7, 2025' ), 
		end_date: new Date( 'August 7, 2025' )
	},
	{
		id: "RenderAspectRatio",
		loc_name: "#SFUI_settings_video_render_aspect_ratio_title",
		loc_desc: "#SFUI_settings_video_render_aspect_ratio_tooltip",
		section: "VideoSettings",
		start_date: new Date( 'July 7, 2025' ), 
		end_date: new Date( 'August 7, 2025' )
	},
	{
		id: "VmdlShadow",
		loc_name: "Viewmodel Shadows",
		loc_desc: "Allows you to disable shadows on your Viewmodel.",
		section: "VideoSettings",
		start_date: new Date( 'July 7, 2025' ), 
		end_date: new Date( 'August 7, 2025' )
	},
	{
		id: "WorldShadow",
		loc_name: "Dynamic Shadows",
		loc_desc: "Allows you to disable all Dynamic Shadows on all maps",
		section: "VideoSettings",
		start_date: new Date( 'July 7, 2025' ), 
		end_date: new Date( 'August 7, 2025' )
	},
	{
		id: "hudcolor22",
		loc_name: "Team Colored HUD",
		loc_desc: "Sets your HUD color depending on your team, CT or T.",
		section: "GameSettings",
		start_date: new Date( 'July 7, 2025' ), 
		end_date: new Date( 'August 7, 2025' )
	},
	{
		id: "SettingsVideoFramePacing",
		loc_name: "Frame Pacing",
		loc_desc: "You can now control the framerate that you want via the video settings under the frame pacing section.",
		section: "VideoSettings",
		start_date: new Date( 'October 28, 2025' ), 
		end_date: new Date( 'November 28, 2025' )
	},
	{
		id: "SettingsSnipersXhair",
		loc_name: "Sniper sights",
		loc_desc: "You can adjust the width of the sniper scope under the Sniper sights section in the Game tab",
		section: "GameSettings",
		start_date: new Date( 'October 28, 2025' ), 
		end_date: new Date( 'November 28, 2025' )
	},
	{
		id: "FirstPersonTracers",
		loc_name: "First person tracers",
		loc_desc: "Option to enable or disable first person tracers",
		section: "GameSettings",
		start_date: new Date( 'October 28, 2025' ), 
		end_date: new Date( 'November 28, 2025' )
	},
];

var PromotedSettingsUtil = ( function ()
{
	function _GetUnacknowledgedPromotedSettings()
	{
		if ( g_PromotedSettings.length == 0 )
			return [];

		let settingsInfo = GameInterfaceAPI.GetSettingString( "cl_promoted_settings_acknowledged" ).split( ':' );
		let version = parseInt( settingsInfo.shift() );
		let arrNewSettings = [];
		if ( version === g_PromotedSettingsVersion )
		{
			                                                 
			let timeLastViewed = new Date( parseInt( settingsInfo.shift() ) );
			for ( let setting of g_PromotedSettings )
			{
				const now = new Date();
				if ( setting.start_date > timeLastViewed && setting.start_date <= now )
					arrNewSettings.push( setting );
			}
		}
		else
		{
			                                                                             
			                                                 
			const now = new Date();
			return g_PromotedSettings.filter( setting => setting.start_date <= now && setting.end_date > now );
		}
		return arrNewSettings;
	}

	                                                                                              
	var hPromotedSettingsViewedEvt = $.RegisterForUnhandledEvent( "MainMenu_PromotedSettingsViewed", function ( id )
	{
		                  
		GameInterfaceAPI.SetSettingString( "cl_promoted_settings_acknowledged", "" + g_PromotedSettingsVersion + ":" + Date.now() );
		$.UnregisterForUnhandledEvent( "MainMenu_PromotedSettingsViewed", hPromotedSettingsViewedEvt );
	} );

	return {
		GetUnacknowledgedPromotedSettings : _GetUnacknowledgedPromotedSettings
	}
}() );

