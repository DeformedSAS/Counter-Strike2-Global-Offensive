'use strict';

var SettingsMenuCredits = ( function() {

	var userList = [];
	var initiated = false;
	var sanitize_names = null;
	var hide_avatars = null;

	var _RefreshUsers = function() {
		sanitize_names = GameInterfaceAPI.GetSettingString( 'cl_sanitize_player_names' ) != 0;
		hide_avatars = GameInterfaceAPI.GetSettingString( 'cl_hide_avatar_images' ) != 0;
		if(!initiated)
		{
			_Init();
			return;
		}
		for(var user of userList)
			_SetUser(user.el, user.key, user.value)
	}

    var _Init = function () {

		sanitize_names = GameInterfaceAPI.GetSettingString( 'cl_sanitize_player_names' ) != 0;
		hide_avatars = GameInterfaceAPI.GetSettingString( 'cl_hide_avatar_images' ) != 0;
		$.Msg('Borrwed from Classic Offensive, ZooL please dont kill me..');
		
		var dummy = 0;
		initiated = true;

		var elParent = $('#CreditsInside');
		if(!elParent)
			return;

		var developers = $.LoadKeyValuesFile( 'resource/ui/credits.res', 'MOD' );
		for(var categ in developers)
		{
			var elTitle = $.CreatePanel( "Panel", elParent, "categtitle-"+(dummy++) );
			elTitle.BLoadLayoutSnippet( "CreditsTitle" );
			elTitle.FindChildTraverse( 'JsTitle' ).text = $.Localize( '#'+categ );

			var elCateg = $.CreatePanel( "Panel", elParent, "categ-"+(dummy++) );
			elCateg.BLoadLayoutSnippet( "CreditsCategory" );

			for(var dev in developers[categ])
			{
				var devValue = developers[categ][dev];

				var elDev = $.CreatePanel( "Panel", elCateg, "dev"+(dummy++) );
				elDev.BLoadLayoutSnippet( devValue["steamid"] ? "CreditsDeveloper" : "CreditsDeveloperNoSteam" );
				elDev.FindChildTraverse( 'JsName' ).text = devValue.name;
				elDev.FindChildTraverse( 'JsDesc' ).text = $.Localize( '#'+devValue.role );
				_SetUser(elDev, dev, devValue)

				userList.push({el: elDev, key: dev, value: devValue});

				$.CreatePanel( "Panel", elCateg, "dev"+(dummy++) ).BLoadLayoutSnippet( "CreditsSeparator" );
			}
		}
	}

	var _SetUser = function (panel, key, value) {

		for(var el of panel.Children())
		{
			if(el.paneltype == "CSGOAvatarImage")
			{
				el.steamid = value.steamid;
				el.SetHasClass('hide', hide_avatars)
			}
			else if(!isNaN(+key) && el.paneltype == "Image")                  
			{
				el.SetHasClass('hide', true);
			}
			else if(el.paneltype == "Image")              
			{
				el.SetImage("file://{images}/credits/avatars/"+key+".png");
				el.SetHasClass('hide', hide_avatars);
			}
			else if(el.paneltype == "Label" && el.BHasClass( 'Credit-Name' ))
			{
				if(value.steamid == '' || parseInt(value.steamid) == NaN)
					continue;

				const name = FriendsListAPI.GetFriendName( value.steamid )
				if(sanitize_names || name == '')
					el.text = value.name;
				else
					el.text = name;
			}
		}
	}


	return {
        Init : _Init,
        RefreshUsers : _RefreshUsers,
    };

})();

              
(function ()
{
	SettingsMenuCredits.Init();
})();

// this script is written by zool for classic offensive. i do not take any credit for it! zool is credited in credits.res!