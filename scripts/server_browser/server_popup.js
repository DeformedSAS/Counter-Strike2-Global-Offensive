'use strict';

var ServerPopup = (function () {

	let server = {}

	let dataCallback = -1
	function InvokeCallback(...args) {
		let callback = $.GetContextPanel().GetAttributeInt('callback', -1)
		if (callback !== -1) {
			UiToolkitAPI.InvokeJSCallback(callback, ...args);
		}
		return callback;
	}
	
	function _Return(szType) {
		let callback = InvokeCallback(szType);
		if (callback !== -1) {
			UiToolkitAPI.UnregisterJSCallback(callback);
		}
		UiToolkitAPI.UnregisterJSCallback(dataCallback);

		UiToolkitAPI.HideTextTooltip();
		$.DispatchEvent('UIPopupButtonClicked', '');
	}

	function _ClearPlayerList() {
		$.GetContextPanel().FindChildTraverse('PlayerList').Children().forEach(ch => {
			ch.DeleteAsync(0.0);
		})
	}

	function _PlayerAdded(ply) {
		let el = $.CreatePanel(
			'Panel',
			$.GetContextPanel().FindChildTraverse('PlayerList'),
			''
		);
		el.BLoadLayoutSnippet('serverbrowser_player');
		el.FindChildTraverse('Name').text = ply.nickname;
		el.FindChildTraverse('Score').text = ply.score;
		el.FindChildTraverse('Time').text = ply.timeF;
	}

	function _UpdateData(type, data) {
		switch (type) {
			case 'clearPlayerList':
				_ClearPlayerList();
				break
			case 'playerAdded':
				_PlayerAdded(data);
				break;
			case 'playerRefreshStatus':
				break;
		}
	}

	function _SetupPopup() {
        server = JSON.parse($.GetContextPanel().GetAttributeString( "json", "(not found)" ));

        server[ 'PlayerList' ].forEach( function( player, i )
        {
            _UpdateData('playerAdded', player);
        });
        _UpdateWithServer(server);
		InvokeCallback('players', dataCallback)
	}

	function _UpdateWithServer(server) {
		$.GetContextPanel().SetDialogVariable('name', server.HostName)
		$.GetContextPanel().SetDialogVariable('game', server.ModDesc)
		$.GetContextPanel().SetDialogVariable('map', server.Map)
		$.GetContextPanel().SetDialogVariable('players', server.Players + ' / ' + server.MaxPlayers)
		$.GetContextPanel().SetDialogVariable('vac', server.Secure === 'true' ? 'Secure' : 'Not secure')
		$.GetContextPanel().SetDialogVariable('ping', server.ping)
	}

	function _CancelPopup() {
		_Return(false);
	}

	function _OnCopyPressed() {
		SteamOverlayAPI.CopyTextToClipboard(server.ipPort)
		UiToolkitAPI.HideTextTooltip();
		UiToolkitAPI.ShowTextTooltipOnPanel($.GetContextPanel().FindChildTraverse('CopyButton'), 'Copied to clipboard');
	}

	function _OnConnectPressed() {
		_CancelPopup();
		GameInterfaceAPI.ConsoleCommand('connect '+server.addr);
	}

	return {
        SetupPopup : _SetupPopup,
        CancelPopup : _CancelPopup,
        OnCopyPressed : _OnCopyPressed,
        OnConnectPressed : _OnConnectPressed
	};
})();