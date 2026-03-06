"use strict"; 

var HUDTeamColor = ( function ()
{
	function _Init() 
	{
    }

function _UpdateHUD()
{
    var elLogo = $.GetContextPanel().FindChildInLayoutFile("TeamLogoHud");
    if (!elLogo)
    {
        // try again shortly if the panel doesn't exist yet
        $.Schedule(0.1, _UpdateHUD);
        return;
    }

    _SetTeamColor();
}

    function _SetTeamColor()
    {
        var teamname = MockAdapter.GetPlayerTeamName( MockAdapter.GetLocalPlayerXuid() )
		var elRoot = $.GetContextPanel();
        while ( elRoot.GetParent() )
            elRoot = elRoot.GetParent();
        
        elRoot.SetHasClass('hud-team-ct', teamname == "CT")
        elRoot.SetHasClass('hud-team-t', teamname == "TERRORIST")
		if (teamname == "TERRORIST")
		{
			$( "#TeamLogoHud" ).SetImage( "file://{images}/hud/killbar/t_killbar.png" );
		}
		else if (teamname == "CT")
		{
			$( "#TeamLogoHud" ).SetImage( "file://{images}/hud/killbar/ct_killbar.png" );
		}
    }

	return {
		Init : _Init,
		UpdateHUD : _UpdateHUD,
	 };
})();


(function()
{
    HUDTeamColor.Init();	
    $.RegisterForUnhandledEvent( "PlayerTeamChanged", HUDTeamColor.UpdateHUD );
})();