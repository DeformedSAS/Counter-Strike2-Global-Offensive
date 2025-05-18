'use strict';

var ServerBrowser = (function () {

	function _BuildList(servers)
	{
		var elLister = $.GetContextPanel().FindChildInLayoutFile( 'serverbrowser-servers-internet' );

		if ( elLister === undefined || elLister === null || !servers )
			return;
		
		elLister.RemoveAndDeleteChildren();

		servers[ 'servers' ].forEach( function( server, i )
		{
		
			var elEntry = $.CreatePanel( 'Panel', elLister, 'server_'+i, {
				acceptsinput: true
			} );
		
			let contextMenu = [
				{
					label: 'Connect to server',
					jsCallback: () => {
						GameInterfaceAPI.ConsoleCommand('connect '+server.addr);
					},
				},
				{
					label: 'View server info',
					jsCallback: () => {
						UiToolkitAPI.ShowCustomLayoutPopupParameters(
							'',
							'file://{resources}/layout/server_browser/server_popup.xml',
							'json='+JSON.stringify(server)
						);
					},
				},
				{
					label: 'Copy IP to clipboard',
					jsCallback: () => {
						SteamOverlayAPI.CopyTextToClipboard(server.addr);
						UiToolkitAPI.HideTextTooltip();
						UiToolkitAPI.ShowTextTooltipOnPanel(
							elLister.FindChildTraverse('name'),
							'Copied to clipboard'
						);
						$.Schedule(1, () => UiToolkitAPI.HideTextTooltip());
					},
				}
			];
		
			elEntry.SetPanelEvent('ondblclick', () => {
				GameInterfaceAPI.ConsoleCommand('connect '+server.addr);
			});
		
			elEntry.SetPanelEvent('oncontextmenu', () => {
				UiToolkitAPI.ShowSimpleContextMenu('', `ServerContextMenu_`+i, contextMenu);
			});
		
			elEntry.BLoadLayoutSnippet( 'serverbrowser_server' );
			elEntry.FindChildTraverse( 'name' ).text = server.HostName;
			elEntry.FindChildTraverse( 'players' ).text = server.Players+"/"+server.MaxPlayers;
			elEntry.FindChildTraverse( 'map' ).text = server.Map;
			elEntry.FindChildTraverse( 'ping' ).text = server.ping;
			elEntry.FindChildTraverse( 'vac' ).visible = server.Secure;
			elEntry.FindChildTraverse( 'password' ).visible = server.Password;
		
		});

	};

	return {
		BuildServerBrowser: _BuildList,
	};
})();