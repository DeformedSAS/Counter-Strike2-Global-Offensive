'use strict';

var SettingsMenuGameSettings = ( function() {


	var _OnCrosshairStyleChange = function()
	{
		                                            
		let nStyle = parseInt( GameInterfaceAPI.GetSettingString( 'cl_crosshairstyle' ) );

		let bEnableControls = nStyle !== 0 && nStyle !== 1;
		$( "#XhairLength" ).visible = bEnableControls;
		$( "#XhairThickness" ).visible = bEnableControls;
		$( "#XhairGap" ).visible = bEnableControls;
		$( "#XhairOutline" ).visible = bEnableControls;
		$( "#XhairColorRed" ).visible = bEnableControls;
		$( "#XhairColorGreen" ).visible = bEnableControls;
		$( "#XhairColorBlue" ).visible = bEnableControls;
		$( "#XhairAlpha" ).visible = bEnableControls;
		$( "#XhairCenterDot" ).visible = bEnableControls;
		$( "#XhairTStyle" ).visible = bEnableControls;

		let bEnableSplitControls = nStyle === 2;
		$( "#XhairSlitDist" ).visible = bEnableSplitControls;
		$( "#XhairSplitInnerAlpha" ).visible = bEnableSplitControls;
		$( "#XhairSplitOuterAlpha" ).visible = bEnableSplitControls;
		$( "#XhairSplitRatio" ).visible = bEnableSplitControls;

		$( "#XhairFixedGap" ).visible = (nStyle === 1);

		$( "#CrosshairEditorPreview" ).SetHasClass( "dynamic-crosshair", nStyle === 0 || nStyle === 2 || nStyle === 3 ); 

}

    return {
        OnCrosshairStyleChange : _OnCrosshairStyleChange
    };

})();

              
(function ()
{
	SettingsMenuGameSettings.OnCrosshairStyleChange();
	SettingsMenuShared.ChangeBackground( 0 );

})();