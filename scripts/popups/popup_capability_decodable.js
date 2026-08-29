'use strict';

var CapabilityDecodable = ( function()
{
	var m_aItemsInLootlist = [];
	var m_scrollListsPanelIds = [ 'ScrollList', 'ScrollListMagnified' ];
	var m_caseId = '';
	var m_existingRewardFromXrayId = '';
	var m_itemFromContainer = '';
	var m_Inspectpanel = $.GetContextPanel();
	var m_keyId = '';
	var m_keytoSellId = '';
	var m_isKeyless = false;
	var m_storeItemId = '';
	var m_unusualItemImagePath = '';
	var m_showInspectScheduleHandle = null;
	var m_isAllowedToInteractWithLootlistItems = true;
	var m_styleforPopUpInspectFullScreenHostContainer = '';
	var m_isXrayMode = false;
	var m_blurOperationPanel = false;
	var m_elImageOrModel = null;
	
	var _Init = function()
	{
		function GetItemVarsFromMsg()
		{
			var idList = strMsg.split( ',' );
			return { key: idList[ 0 ], case: idList[ 1 ] };
		}
		
		function SetsItemVarsFromMsg()
		{
			var oData = GetItemVarsFromMsg();
			m_keyId = oData.key;
			m_caseId = oData.case;
		}
		
		var strMsg = $.GetContextPanel().GetAttributeString( "key-and-case", "" );
		
		m_isXrayMode = $.GetContextPanel().GetAttributeString( "isxraymode", "no" ) === 'yes' ? true : false;
		m_isAllowedToInteractWithLootlistItems = ( $.GetContextPanel().GetAttributeString( 'allowtointeractwithlootlistitems', 'true' ) === 'true' ) ? true : false;
		m_blurOperationPanel = ( $.GetContextPanel().GetAttributeString( 'bluroperationpanel', 'false' ) === 'true' ) ? true : false;

		if ( m_blurOperationPanel )
		{
			$.DispatchEvent( 'BlurOperationPanel' );
		}

		if ( m_isXrayMode )
		{
			m_Inspectpanel.SetHasClass( 'popup-in-xray', m_isXrayMode ); 
			var oData = ItemInfo.GetItemsInXray();
			m_existingRewardFromXrayId = oData.reward;

			if ( m_existingRewardFromXrayId )
			{
				if ( InventoryAPI.IsFauxItemID( m_existingRewardFromXrayId ) )
				{
					var elPopup = UiToolkitAPI.ShowGenericPopupOk( '#popup_xray_first_use_title', '#popup_xray_first_use_desc', '', function() { } );
					var elMessageLabel = elPopup.FindChildInLayoutFile( 'MessageLabel' );
					if ( elMessageLabel ) {
						elMessageLabel.html = true;
						elPopup.SetDialogVariable( 'itemname', ItemInfo.GetName( m_existingRewardFromXrayId ) );
						elMessageLabel.text = $.Localize( '#popup_xray_first_use_desc', elPopup );
					}
				}
				else if( $.GetContextPanel().GetAttributeString( "showxraypopup", "no" ) === 'yes' )
				{
					UiToolkitAPI.ShowGenericPopupOk( '#popup_xray_in_use_title', '#popup_xray_in_use_desc', '', function() { } );
				}

				m_caseId = oData.case;
			}
			else
			{
				SetsItemVarsFromMsg();
			}

			if ( !GetItemVarsFromMsg().key )
			{
				var keyId = ItemInfo.GetKeyForCaseInXray( m_caseId );
			
				if ( keyId )
				{
					m_keyId = keyId;
				}
			}
			else
			{
				m_keyId = GetItemVarsFromMsg().key;
			}
		}
		else
		{
			SetsItemVarsFromMsg();
		}

		m_styleforPopUpInspectFullScreenHostContainer = $.GetContextPanel().GetAttributeString( 'extrapopupfullscreenstyle', '' );
		if ( m_styleforPopUpInspectFullScreenHostContainer )
		{
			var elPopUpInspectFullScreenHostContainer = $.GetContextPanel().FindChildInLayoutFile( 'PopUpInspectFullScreenHostContainer' );
			if ( elPopUpInspectFullScreenHostContainer ) {
				elPopUpInspectFullScreenHostContainer.AddClass( m_styleforPopUpInspectFullScreenHostContainer );
			}
		}

		if ( !m_keyId )
		{
			var associatedItemCount = InventoryAPI.GetAssociatedItemsCount( m_caseId );

			if ( !InventoryAPI.IsItemInfoValid( m_caseId ) )
			{
				return;
			}

			m_storeItemId = $.GetContextPanel().GetAttributeString( "storeitemid", "" );
			if ( ( associatedItemCount === 0 || !associatedItemCount ) && !m_storeItemId )
			{
				m_isKeyless = true;
			}
			else if ( !m_storeItemId )
			{
				m_keytoSellId = InventoryAPI.GetAssociatedItemIdByIndex( m_caseId, 0 );
			}
		}
		else
		{
			if ( !InventoryAPI.IsItemInfoValid( m_keyId ) )
			{
				return;
			}
		}

		_SetUpPanelElements();
		_SetBackgroundMovie();
		$.DispatchEvent( 'CapabilityPopupIsOpen', true );
	};
	
	var _SetBackgroundMovie = function()
	{
		var videoPlayer = $( '#DecodableBGMovie' );
		if ( !( videoPlayer && videoPlayer.IsValid() ) )
			return;

		var backgroundMovie = GameInterfaceAPI.GetSettingString('ui_mainmenu_bkgnd_movie_CC4ECB9');
		videoPlayer.SetAttributeString( 'data-type', backgroundMovie );
		videoPlayer.SetMovie( "file://{resources}/videos/" + backgroundMovie + ".webm" );
		videoPlayer.Play();
	};

	var _SetUpPanelElements = function()
	{
		if ( !m_keyId )
		{
			$.GetContextPanel().SetAttributeString( 'asyncworkitemwarning', 'no' );
			$.GetContextPanel().SetAttributeString( 'asyncactiondescription', 'no' );

			if ( m_existingRewardFromXrayId )
			{
				$.GetContextPanel().SetAttributeString( 'allowxraypurchase', 'yes' );
			}
		}
		else
		{
			$.GetContextPanel().SetAttributeString( 'toolid', m_keyId );
			$.GetContextPanel().SetAttributeString( 'asyncworkitemwarning', 'yes' );
			$.GetContextPanel().SetAttributeString( 'asyncactiondescription', 'yes' );

			if ( m_existingRewardFromXrayId )
			{
				$.GetContextPanel().SetAttributeString( 'allowxrayclaim', 'yes' );
			}
		}

		if ( m_isKeyless )
		{
			if ( m_existingRewardFromXrayId )
			{
				$.GetContextPanel().SetAttributeString( 'allowxrayclaim', 'yes' );
			}
			
			$.GetContextPanel().SetAttributeString( 'decodeablekeyless', 'true' );
			$.GetContextPanel().SetAttributeString( 'asyncworkitemwarning', 'yes' );
			$.GetContextPanel().SetAttributeString( 'asyncactiondescription', 'yes' );
		}

		var sRestriction = m_storeItemId ? '' : InventoryAPI.GetDecodeableRestriction( m_caseId );
		if ( sRestriction !== 'restricted' && sRestriction !== 'xray' || ( m_isXrayMode && sRestriction === 'xray' ) )
		{
			_ShowPurchase( ( m_keyId ) ? '' : m_keytoSellId );

			var slot = ItemInfo.GetSlot( m_caseId );
			if ( slot == "musickit" )
			{
				InventoryAPI.PlayItemPreviewMusic( m_caseId, 'mainmenu.mp3' );
			}
		}

		_SetupHeader( m_caseId );
		_SetupDescription( m_caseId );
		_SetUpAsyncActionBar( m_caseId );

		if ( m_isXrayMode )
		{
			_SetUpXrayPanel();
		}
		else
		{
			_SetCaseModelImage( m_caseId, 'PopUpInspectModelOrImage' );
			_SetCaseModelCamera( 2, false );

			if ( !ItemInfo.ItemMatchDefName( m_caseId, 'spray' ) && !ItemInfo.ItemDefinitionNameSubstrMatch( m_caseId, 'tournament_pass_' ) )
			{
				_PlayCaseModelAnim( 'fall' );
				_PlayContainerSound( m_caseId, 'fall' );
			}

			_SetLootListItems( m_caseId, m_keyId );
		}
	};

	var _SetupHeader = function( caseId )
	{
		var elCapabilityHeaderPanel = $.GetContextPanel().FindChildInLayoutFile( 'PopUpCapabilityHeader' );
		if ( elCapabilityHeaderPanel && typeof CapabiityHeader !== 'undefined' ) {
			CapabiityHeader.Init( elCapabilityHeaderPanel, caseId, _GetSettingCallback );
		} else if ( typeof CapabilityHeader !== 'undefined' ) {
			CapabilityHeader.Init();
		}
	};

	var _SetupDescription = function( caseId )
	{
		var elPanel = $.GetContextPanel().FindChildInLayoutFile( 'InspectItemDesc' );
		if ( !elPanel ) return;
		var count = InventoryAPI.GetLootListItemsCount( caseId );
		
		if ( count === 0 && m_storeItemId )
		{
			elPanel.visible = true;
			elPanel.text = InventoryAPI.GetItemDescription( caseId, '' );
		}
		else
		{
			elPanel.visible = false;
		}
	};

	var _GetSettingCallback = function( settingname, defaultvalue )
	{
		return m_Inspectpanel.GetAttributeString( settingname, defaultvalue );
	};

	var _SetCaseModelImage = function( caseId, PanelId )
	{
		m_elImageOrModel = $.GetContextPanel().FindChildInLayoutFile( PanelId );
		if ( m_elImageOrModel && typeof InspectModelImage !== 'undefined' ) {
			InspectModelImage.Init( m_elImageOrModel, caseId, _GetSettingCallback );
		}
	};

	var _PlayCaseModelAnim = function( anim )
	{
		if ( !m_elImageOrModel ) return;
		var elModel = m_elImageOrModel.FindChildInLayoutFile( 'InspectItemModel' );
		if ( elModel ) {
			elModel.PlaySequence( anim, true );
		}
	};

	var _SetCaseModelCamera = function( preset, shouldTransition )
	{
		if ( !m_elImageOrModel ) return;
		var elModel = m_elImageOrModel.FindChildInLayoutFile( 'InspectItemModel' );
		if ( elModel ) {
			elModel.SetCameraPreset( preset, shouldTransition );
		}
	};

	var _SetUpAsyncActionBar = function( itemId )
	{
		var elAsyncActionBarPanel = $.GetContextPanel().FindChildInLayoutFile( 'PopUpInspectAsyncBar' );
		if ( elAsyncActionBarPanel && typeof InspectAsyncActionBar !== 'undefined' ) {
			InspectAsyncActionBar.Init( elAsyncActionBarPanel, itemId, _GetSettingCallback );
		}
	};

	var _ShowPurchase = function( m_keytoSellId )
	{
		var elPurchase = $.GetContextPanel().FindChildInLayoutFile( 'PopUpInspectPurchaseBar' );
		if ( elPurchase && typeof InpsectPurchaseBar !== 'undefined' ) {
			InpsectPurchaseBar.Init( elPurchase, m_keytoSellId, _GetSettingCallback );
		} else if ( typeof InspectPurchaseBar !== 'undefined' ) {
			InspectPurchaseBar.Init();
		}
	};

	var _SetLootListItems = function( caseId, keyId )
	{
		var count = InventoryAPI.GetLootListItemsCount( caseId );
		var elLootList = $.GetContextPanel().FindChildInLayoutFile( 'DecodableLootlist' );
		var specialItemId = 'id-special-item';

		if ( count === 0 )
		{
			_ShowHideLootList( false );
			return;
		}

		if ( m_elImageOrModel && m_elImageOrModel.IsValid() ) {
			var elImage = m_elImageOrModel.FindChildInLayoutFile( 'InspectItemImage' );
			if ( elImage ) {
				elImage.AddClass( 'y-offset' );
			}
		}

		_ShowHideLootList( true );
		_SetLootlistHintText( caseId, count );
		
		for ( var i = 0; i < count; i++ )
		{
			var itemid = InventoryAPI.GetLootListItemIdByIndex( caseId, i ) === '0' ? specialItemId : InventoryAPI.GetLootListItemIdByIndex( caseId, i );
			var elItem = elLootList.FindChildInLayoutFile( itemid );
			
			if ( !elItem )
			{
				elItem = $.CreatePanel( 'Panel', elLootList, itemid );
				elItem.SetAttributeString( 'itemid', itemid );
				elItem.BLoadLayoutSnippet( 'LootListItem' );

				_UpdateLootListItemInfo( elItem, itemid, caseId );
				elItem.SetPanelEvent( 'onactivate', _OnActivateLootlistTile.bind( undefined, itemid, caseId, keyId ) );
				elItem.SetPanelEvent( 'oncontextmenu', _OnActivateLootlistTile.bind( undefined, itemid, caseId, keyId ) );

				if ( i === 0 )
				{
					var elBrowseBtn = $.GetContextPanel().FindChildInLayoutFile( 'CanDecodableBrowseBtn' );
					if ( elBrowseBtn ) {
						elBrowseBtn.SetPanelEvent( 'onactivate', callBackFunc.bind( undefined, itemid, caseId, keyId ) );
					}
				}

				if ( itemid !== specialItemId )
				{
					m_aItemsInLootlist.push( {
						id: itemid,
						weight: _GetDisplayWeightForScroll( itemid ),
					} );
				}
			}
		}
	};

	var _OnActivateLootlistTile = function( itemid, caseId, keyId )
	{
		if ( !InventoryAPI.IsValidItemID( itemid ) )
			return;

		                                 
		InventoryAPI.PrecacheCustomMaterials( itemid );

		var items = [];
		items.push( { label: '#UI_Inspect', jsCallback: callBackFunc.bind( undefined, itemid, caseId, keyId ) } );

		if ( MyPersonaAPI.GetLauncherType() !== "perfectworld" )
		{
			items.push( { label: '#SFUI_Store_Market_Link', jsCallback: _ViewOnMarket.bind( undefined, itemid ) } );
		}

		UiToolkitAPI.ShowSimpleContextMenu( '', 'ControlLibSimpleContextMenu', items );
	};

	var callBackFunc = function( itemid, caseId, keyId )
	{
		$.DispatchEvent( 'ContextMenuEvent', '' );
		_HidePanelForLootlistItemPreview();

		var storeid = ( m_storeItemId ) ? m_storeItemId : '';
		var bluroperationpanel = m_blurOperationPanel ? 'bluroperationpanel=true' : '';
		var additionalParams = _GetSettingCallback( 'inspectonly', 'false' ) === 'true' ? 'inspectonly=true,' : '';
		additionalParams = _GetSettingCallback( 'asyncworkbtnstyle', 'positive' ) === 'hidden' ? additionalParams + 'asyncworkbtnstyle=hidden' : '';
		additionalParams = m_blurOperationPanel ? additionalParams + ',' + 'bluroperationpanel=true' : '';
		
		$.DispatchEvent(
			"LootlistItemPreview",
			itemid,
			keyId + ',' + caseId + ',' + storeid + ',' + bluroperationpanel + ',' + m_styleforPopUpInspectFullScreenHostContainer + ',' + additionalParams
		);
	};

	var _ViewOnMarket = function( id )
	{
		SteamOverlayAPI.OpenURL( ItemInfo.GetMarketLinkForLootlistItem( id ) );
		if ( typeof StoreAPI !== 'undefined' && StoreAPI.RecordUIEvent ) {
			StoreAPI.RecordUIEvent( "ViewOnMarket" );
		}
	};

	var _GetDisplayWeightForScroll = function( itemid )
	{
		var rarityVal = InventoryAPI.GetItemRarity( itemid );
		var displayItemWeight = [ 150000, 30000, 6000, 1250, 250, 50, 10 ];
		return displayItemWeight[ rarityVal ];
	};

	var _UpdateLootListItemInfo = function( elItem, itemid, caseId )
	{
		var specialItemId = 'id-special-item';
		if ( itemid == specialItemId )
		{
			m_unusualItemImagePath = InventoryAPI.GetLootListUnusualItemImage( caseId ) + ".png";
			_UpdateUnusualItemInfo( elItem, caseId, m_unusualItemImagePath, true );
		}
		else
		{
			var elImg = elItem.FindChildInLayoutFile( 'ItemImage' );
			var elRarity = elItem.FindChildInLayoutFile( 'JsRarity' );
			var elName = elItem.FindChildInLayoutFile( 'JsItemName' );

			if ( elImg ) elImg.itemid = itemid;
			if ( elRarity ) elRarity.style.backgroundColor = InventoryAPI.GetItemRarityColor( itemid );
			if ( elName ) ItemInfo.GetFormattedName( itemid ).SetOnLabel( elName );
		}
	};

	var _ShowHideLootList = function( bshow )
	{
		var elLootListContainer = $.GetContextPanel().FindChildInLayoutFile( 'DecodableLootlistContainer' );
		if ( elLootListContainer ) {
			elLootListContainer.SetHasClass( 'hidden', !bshow );
		}
	};

	var _SetLootlistHintText = function( caseId, count )
	{
		var bAllItems = InventoryAPI.GetLootListAllEntriesAreAdditionalDrops( caseId );
		var elDesc = $.GetContextPanel().FindChildInLayoutFile( 'CanDecodableDesc' );
		var elDescMulti = $.GetContextPanel().FindChildInLayoutFile( 'CanDecodableDescMulti' );
	
		if ( elDesc ) elDesc.visible = !bAllItems;

		if ( count > 1 || bAllItems )
		{
			if ( elDescMulti ) {
				elDescMulti.SetDialogVariableInt( 'num_items', count );
				elDescMulti.visible = ( count > 1 && bAllItems );
			}
		}
	};

	var _UpdateUnusualItemInfo = function( elItem, caseId, unusualItemImagePath, bisDisplayedInLootlist )
	{
		if ( !elItem || !elItem.IsValid() ) return;
		
		var elImg = elItem.FindChildInLayoutFile( 'ItemImage' );
		if ( elImg ) elImg.SetImage( "file://{images_econ}/" + unusualItemImagePath );
		
		var elRarity = elItem.FindChildInLayoutFile( 'JsRarity' );
		var elBg = elItem.FindChildInLayoutFile( 'ItemTileBg' );
		var elName = elItem.FindChildInLayoutFile( 'JsItemName' );
		var elTint = elItem.FindChildInLayoutFile( 'JItemTint' );

		if ( bisDisplayedInLootlist ) {
			if ( elRarity ) elRarity.AddClass( 'popup-decodable-wash-color-unusual' );
			if ( elBg ) elBg.AddClass( 'popup-decodable-wash-color-unusual-bg' );
			if ( elName ) elName.text = InventoryAPI.GetLootListUnusualItemName( caseId );
		} else {
			if ( elRarity ) elRarity.style.washColor = '#ffd700';
			if ( elTint ) elTint.style.washColor = '#ffd700';
		}
	};

	var _SetUpCaseOpeningScroll = function()
	{
		_ShowHideLootList( false );

		var elImage = m_elImageOrModel.FindChildInLayoutFile( 'InspectItemImage' );
		var elCase = null;
		var delay = 0;
		
		if ( !elImage.BHasClass( 'hidden' ) )
		{
			elImage.RemoveClass( 'y-offset' );
			elCase = elImage;
			delay = 0.1;
		}
		else
		{
			$.Schedule( 1, _PlayCaseModelAnim.bind( undefined, 'open' ) );
			_SetCaseModelCamera( 2, true );
			
			elCase = m_elImageOrModel.FindChildInLayoutFile( 'InspectItemModel' );
			delay = 2.3;
		}

		$.Schedule( delay, _ShowScroll.bind( undefined, elCase ) );
	};

	var _ShowScroll = function( elCase )
	{
		var elScroll = $.GetContextPanel().FindChildInLayoutFile( 'DecodableItemsScroll' );
		if ( !elScroll || !elScroll.IsValid() ) return;
		
		elScroll.RemoveClass( 'hidden' );
		if ( elCase && elCase.IsValid() ) {
			elCase.AddClass( 'popup-inspect-modelpanel_darken_blur' );
		}
		
		_FillScrollsWithItems( m_scrollListsPanelIds );
		$.Schedule( 0.1, _PlayScrollAnim.bind( undefined, m_scrollListsPanelIds ) );
	};

	var _PlayScrollAnim = function( scrolllists )
	{
		var targetId = 'ItemFromContainer';
		var xOffsetSlackPercent = ( Math.floor( Math.random() * ( ( 90 ) - 10 + 1 ) + 10 ) / 100 );
		
		scrolllists.forEach( element =>
		{
			var elScroll = $.GetContextPanel().FindChildInLayoutFile( element );
			if ( elScroll ) {
				var xPos = _GetStopPosition( elScroll, targetId, xOffsetSlackPercent );
				elScroll.ScrollToFitRegion( xPos, xPos, 0, 0, 3, true, false );
			}
		} );
		
		var revealDelay = 6;
		$.Schedule( ( revealDelay - 1 ), _PreCacheTextureForNewWeaponInpsect );
		m_showInspectScheduleHandle = $.Schedule( revealDelay, _ShowInspect );

		var itemDefName = InventoryAPI.GetItemDefinitionName( m_caseId );
		var soundEventName = "container_weapon_ticker";
		if ( itemDefName && itemDefName.indexOf( "sticker" ) != -1 )
		{
			soundEventName = "container_sticker_ticker";
		}
			
		for ( var i = 0; i < _TickSoundIntervals.length; ++i )
		{
			$.Schedule( _TickSoundIntervals[ i ], _ScrollTick.bind( undefined, soundEventName ) );
		}
	};

	var _TickSoundIntervals = [ 0.000, 0.063, 0.125, 0.188, 0.250, 0.313, 0.375, 0.438, 0.500, 0.563, 0.625, 0.688, 0.750, 0.813, 0.875, 0.938, 1.000, 1.063, 1.125, 1.188, 1.250, 1.313, 1.375, 1.483, 1.351, 1.620, 1.701, 1.786, 1.872, 2.003, 2.154, 2.313, 2.466, 2.615, 2.773, 2.941, 3.104, 3.339, 3.630, 3.953, 4.385, 5.004, ];

	var _ScrollTick = function( soundEventName )
	{
		$.DispatchEvent( "PlaySoundEffect", soundEventName, "MOUSE" );
	};

	var _GetStopPosition = function( elParent, targetId, xOffsetSlackPercent )
	{
		var elTile = elParent.FindChildInLayoutFile( targetId );
		if ( !elTile || !elTile.IsValid() ) return 0;
		var tileWidth = elTile.contentwidth;

		return ( elTile.actualxoffset + ( tileWidth * xOffsetSlackPercent ) );
	};

	var _PreCacheTextureForNewWeaponInpsect = function()
	{
		if ( m_itemFromContainer )
		{
			InventoryAPI.PrecacheCustomMaterials( m_itemFromContainer );
		}

		if ( m_existingRewardFromXrayId )
		{
			InventoryAPI.PrecacheCustomMaterials( m_existingRewardFromXrayId );
		}
	};

	var _ShowInspect = function()
	{
		m_showInspectScheduleHandle = null;

		if ( m_itemFromContainer )
		{
			InventoryAPI.SetItemSessionPropertyValue( m_itemFromContainer, 'recent', '1' );
			InventoryAPI.AcknowledgeNewItembyItemID( m_itemFromContainer );

			if ( ItemInfo.ItemDefinitionNameSubstrMatch( m_itemFromContainer, 'tournament_journal_' ) )
			{
				$.Schedule( 0.2, function()
				{
					UiToolkitAPI.ShowCustomLayoutPopupParameters(
						'',
						'file://{resources}/layout/popups/popup_tournament_journal.xml',
						'journalid=' + m_itemFromContainer
					);
				} );
			}
			else
			{
				$.DispatchEvent( "InventoryItemPreview", m_itemFromContainer );
			}

			CapabilityDecodable.ClosePopUp();

			var rarityVal = InventoryAPI.GetItemRarity( m_itemFromContainer );
			var soundEvent = "ItemRevealRarityCommon";
			if ( rarityVal == 4 ) soundEvent = "ItemRevealRarityUncommon";
			else if ( rarityVal == 5 ) soundEvent = "ItemRevealRarityRare";
			else if ( rarityVal == 6 ) soundEvent = "ItemRevealRarityMythical";
			else if ( rarityVal == 7 ) soundEvent = "ItemRevealRarityLegendary";
			else if ( rarityVal == 8 ) soundEvent = "ItemRevealRarityAncient";
	
			$.DispatchEvent( "PlaySoundEffect", soundEvent, "MOUSE" );
		}
		else
		{
			_TimeoutPopup();
		}
	};

	var _TimeoutPopup = function()
	{
		CapabilityDecodable.ClosePopUp();
			
		UiToolkitAPI.ShowGenericPopupOk(
			$.Localize( '#SFUI_SteamConnectionErrorTitle' ),
			$.Localize( '#SFUI_InvError_Item_Not_Given' ),
			'',
			function() {},
			function() {}
		);
	};
	
	var _FillScrollsWithItems = function( lists )
	{
		var numTilesInScroll = 38;
		var indexItemsFromContainer = 3;
		var indexStart = ( numTilesInScroll - 3 );

		var totalWeight = 0;
		m_aItemsInLootlist.forEach( element =>
		{
			totalWeight += element.weight;
		} );
		
		var displayItemsList = [];
		
		for ( var i = 0; i < numTilesInScroll; i++ )
		{
			var itemToAdd = GetItemBasedOnDisplayWeight( totalWeight, m_aItemsInLootlist );
			if ( itemToAdd ) displayItemsList.push( itemToAdd );
		}
		
		lists.forEach( element =>
		{
			var elParent = $.GetContextPanel().FindChildInLayoutFile( element );
			if ( !elParent ) return;

			for ( var i = 0; i < displayItemsList.length; i++ )
			{
				var itemId = displayItemsList[ i ];
				var tileId = ( i === indexItemsFromContainer ) ? 'ItemFromContainer' : ( i === indexStart ) ? 'ItemStart' : itemId;

				var elTile = $.CreatePanel( 'Panel', elParent, tileId );
				elTile.BLoadLayoutSnippet( 'ScrollItem' );

				_UpdateScrollTile( element, elTile, itemId );
			}
		} );
	};

	var _UpdateScrollTile = function( listId, elTile, itemId )
	{
		if ( listId === 'ScrollListMagnified' )
		{
			elTile.AddClass( 'magnified' );
		}

		itemId = ( elTile.id === 'ItemFromContainer' && m_itemFromContainer ) ? m_itemFromContainer : itemId;

		if ( ( InventoryAPI.IsItemUnusual ? InventoryAPI.IsItemUnusual( itemId ) : InventoryAPI.GetItemQuality( itemId ) === 3 ) && m_unusualItemImagePath )
		{
			_UpdateUnusualItemInfo( elTile, m_caseId, m_unusualItemImagePath, false );
		}
		else
		{
			var elImg = elTile.FindChildInLayoutFile( 'ItemImage' );
			var elRarity = elTile.FindChildInLayoutFile( 'JsRarity' );
			var elTint = elTile.FindChildInLayoutFile( 'JItemTint' );

			if ( elImg ) elImg.itemid = itemId;
			if ( elRarity ) elRarity.style.washColor = InventoryAPI.GetItemRarityColor( itemId );
			if ( elTint ) elTint.style.washColor = InventoryAPI.GetItemRarityColor( itemId );
		}
	};

	var GetItemBasedOnDisplayWeight = function( totalWeight, aItemsInLootlist )
	{
		var weightOfItem = 0;
		var Random = Math.floor( Math.random() * totalWeight );

		for ( var i = 0; i < aItemsInLootlist.length; i++ )
		{
			weightOfItem += aItemsInLootlist[ i ].weight;
			if ( Random <= weightOfItem ) return aItemsInLootlist[ i ].id;
		}
	};

	var _SetUpCaseOpeningCountdown = function()
	{
		_UpdateOpeningCounter.SetIsGraffiti( _GetContainerType( m_caseId ) === 'graffiti' );
		_UpdateOpeningCounter.ShowCounter();
		_UpdateOpeningCounter.UpdateCounter();
		_ShowHideLootList( false );
	};

	var _UpdateOpeningCounter = ( function()
	{
		var counterVal = 6;
		var elCountdown = $.GetContextPanel().FindChildInLayoutFile( 'DecodableCountdown' );
		var elCountdownLabel = elCountdown ? elCountdown.FindChildInLayoutFile( 'DecodableCountdownLabel' ) : null;
		var elCountdownRadial = elCountdown ? elCountdown.FindChildInLayoutFile( 'DecodableCountdownRadial' ) : null;
		var timerHandle = null;
		var isGraffitiUnseal = false;

		var _UpdateCounter = function()
		{
			timerHandle = null;
			counterVal = counterVal - 1;

			if ( counterVal === 0 )
			{
				if ( elCountdown ) elCountdown.AddClass( 'hidden' );
				_ShowInspect();
			}
			else
			{
				$.DispatchEvent( "PlaySoundEffect", "container_countdown", "MOUSE" );

				if ( elCountdownLabel ) {
					elCountdownLabel.text = counterVal;
					if ( !isGraffitiUnseal )
					{
						elCountdownLabel.visible = true;
						elCountdownLabel.RemoveClass( 'popup-countdown-anim' );
						elCountdownLabel.AddClass( 'popup-countdown-anim' );
					}
					else
					{
						elCountdownLabel.visible = false;
					}
				}

				if ( elCountdownRadial ) {
					elCountdownRadial.RemoveClass( 'popup-countdown-timer-circle-anim' );
					elCountdownRadial.AddClass( 'popup-countdown-timer-circle-anim' );
				}

				timerHandle = $.Schedule( 1, _UpdateCounter );
			}
		};

		var _ShowCounter = function()
		{
			if ( elCountdown ) elCountdown.RemoveClass( 'hidden' );
		};

		var _CancelTimer = function()
		{
			if ( timerHandle )
			{
				$.CancelScheduled( timerHandle );
				timerHandle = null;
			}
		};

		var _SetIsGraffiti = function( isGraffiti )
		{
			isGraffitiUnseal = isGraffiti;
		};

		return {
			UpdateCounter: _UpdateCounter,
			ShowCounter: _ShowCounter,
			CancelTimer: _CancelTimer,
			SetIsGraffiti: _SetIsGraffiti
		};
	} )();

	var _SetUpXrayPanel = function()
	{
		if ( !m_caseId ) return;

		var elActionsPanel = $.GetContextPanel().FindChildInLayoutFile( 'XrayItemsActionPanel' );
		if ( elActionsPanel ) elActionsPanel.AddClass( 'hidden' );
		
		if ( !m_existingRewardFromXrayId )
		{
			if ( elActionsPanel ) elActionsPanel.RemoveClass( 'hidden' );
			_SetCaseModelImage( m_caseId, 'PopUpXrayModelOrImage' );

			var elBtn = $.GetContextPanel().FindChildInLayoutFile( 'ConfirmXray' );
			if ( elBtn ) elBtn.SetPanelEvent( 'onactivate', _OnActivateXray.bind( undefined, elBtn ) );

			var elStatusLabel = $.GetContextPanel().FindChildInLayoutFile( 'PopUpXrayStatusLabel' );
			if ( elStatusLabel ) elStatusLabel.text = $.Localize( "#popup_xray_ready_for_use" );
		}
		else if( m_existingRewardFromXrayId )
		{
			var elHeaderPanel = $.GetContextPanel().FindChildInLayoutFile( 'PopUpInspectHeader' );
			if ( elHeaderPanel && typeof InspectHeader !== 'undefined' ) {
				InspectHeader.Init( elHeaderPanel, m_existingRewardFromXrayId, _GetSettingCallback );
			}

			var elActionName = $.GetContextPanel().FindChildInLayoutFile( 'XrayItemsActionPanelItemName' );
			if ( elActionName ) elActionName.RemoveClass( 'hidden' );
			
			var elImagePanel = $.GetContextPanel().FindChildInLayoutFile( 'PopUpXrayModelOrImageReveal' );
			if ( elImagePanel && !elImagePanel.BHasClass( 'popup-xray-reverse-effect' ) )
			{
				elImagePanel.AddClass( 'no-anim' );
				elImagePanel.AddClass( 'popup-xray-reverse-effect' );
				
				var elModelImg = $.GetContextPanel().FindChildInLayoutFile( 'PopUpXrayModelOrImage' );
				if ( elModelImg ) elModelImg.AddClass( 'hide' );
				
				_SetCaseModelImage( m_existingRewardFromXrayId, 'PopUpXrayModelOrImageReveal' );
			}

			var elStatusLabel = $.GetContextPanel().FindChildInLayoutFile( 'PopUpXrayStatusLabel' );
			if ( elStatusLabel ) elStatusLabel.text = $.Localize( "#popup_xray_already_in_use" );
			
			var elStatusDot = $.GetContextPanel().FindChildInLayoutFile( 'PopUpXrayStatusDot' );
			if ( elStatusDot ) elStatusDot.AddClass( 'in-use' );
		}
		
		var elXrayPanel = $.GetContextPanel().FindChildInLayoutFile( 'XrayItemsPanel' );
		if ( elXrayPanel ) elXrayPanel.RemoveClass( 'hidden' );

		var elBgSquares = $.GetContextPanel().FindChildInLayoutFile( 'PopUpXrayBgSquares' );
		if ( elBgSquares ) {
			var aPanels = elBgSquares.Children();
			_AnimSquares( aPanels );
		}
	};

	var _OnActivateXray = function( elBtn )
	{
		InventoryAPI.UseTool( m_caseId, m_caseId );
		elBtn.enabled = false;
		_XrayReveal();
		$.DispatchEvent( 'PlaySoundEffect', 'XrayStart', 'MOUSE' );
	};

	var _XrayReveal = function()
	{
		var revealDelay = 3.5;
		$.Schedule( ( revealDelay - 0.5 ), _PreCacheTextureForNewWeaponInpsect );
		m_showInspectScheduleHandle = $.Schedule( revealDelay, _ShowXrayReward );

		var oData = {
			clipValue: 0,
			lineValue: 100,
			clipPanel: $.GetContextPanel().FindChildInLayoutFile( 'PopUpXrayModelOrImage' ),
			linePanel: $.GetContextPanel().FindChildInLayoutFile( 'PopUpXrayModelOrImageRevealLine' )
		};
	
		if ( oData.clipPanel ) oData.clipPanel.AddClass( 'popup-xray-inverse-effect' );
		
		var elReveal = $.GetContextPanel().FindChildInLayoutFile( 'PopUpXrayModelOrImageReveal' );
		if ( elReveal ) elReveal.AddClass( 'popup-xray-reverse-effect' );
	
		$.Schedule( 1, function()
		{
			if ( oData.linePanel ) {
				oData.linePanel.visible = true;
				_AnimClip( oData );
			}
		} );
	};

	var _AnimClip = function( oData )
	{
		if ( oData.clipValue <= 100 )
		{
			if ( oData.clipPanel ) oData.clipPanel.style.clip = 'rect( 0%, 100%, 100%, ' + oData.clipValue + '% );';
			oData.clipValue = oData.clipValue  + 1;

			if ( oData.linePanel ) oData.linePanel.style.transform = 'translatex( -' + oData.lineValue + '%);';
			oData.lineValue = oData.lineValue - 1;

			$.Schedule( 0.02, _AnimClip.bind( undefined, oData ) );
		}
		else
		{
			if ( oData.linePanel ) oData.linePanel.AddClass( 'hide' );
			if ( oData.clipPanel ) oData.clipPanel.AddClass( 'hide' );
			_SetUpPanelElements();
		}
	};

	var _AnimSquares = function( aPanels )
	{
		var elXrayPanel = $.GetContextPanel().FindChildInLayoutFile( 'XrayItemsPanel' );
		if ( elXrayPanel && elXrayPanel.visible )
		{
			aPanels.forEach( panel =>
			{
				panel.style.backgroundColor = 'rgba(255, 255, 255, 0.0' + Math.ceil( Math.random() * 10 ) + ');';
			} );
			
			$.Schedule( 1, _AnimSquares.bind( undefined, aPanels ) );
		}
	};

	var _ShowXrayReward = function()
	{
		m_showInspectScheduleHandle = null;

		if ( m_existingRewardFromXrayId )
		{
			_SetUpPanelElements();
		}
		else
		{
			_TimeoutPopup();
		}
	};

	var _UpdateXrayRewardTile = function( itemId )
	{
		var oData = ItemInfo.GetItemsInXray();
		m_existingRewardFromXrayId = itemId === oData.reward ? oData.reward : '';
		
		_PreCacheTextureForNewWeaponInpsect();
		_SetCaseModelImage( itemId, 'PopUpXrayModelOrImageReveal' );
	};

	var _UpdateScrollResultTile = function( numericType, type, itemId )
	{
		if ( type === "crate_unlock" ||
			type === 'graffity_unseal' ||
			type === 'xray_item_reveal' ||
			type === "xray_item_claim"
		)
		{
			if ( m_isXrayMode )
			{
				var oData = ItemInfo.GetItemsInXray();

				if ( oData.reward && type === 'xray_item_reveal' )
				{
					_UpdateXrayRewardTile( itemId );
					return;
				}
				else if ( type === 'xray_item_claim' )
				{
					m_itemFromContainer = itemId;
					_ShowInspect();
					return;
				}
			}
			else
			{
				m_itemFromContainer = itemId;
			}
	
			var elScrollContainer = $.GetContextPanel().FindChildInLayoutFile( 'DecodableItemsScroll' );
			if ( elScrollContainer && elScrollContainer.BHasClass( 'hidden' ) )
			{
				if ( type === 'graffity_unseal' )
				{
					_ShowInspect();
				}
				return;
			}
			else
			{
				m_scrollListsPanelIds.forEach( element =>
				{
					var elScroll = $.GetContextPanel().FindChildInLayoutFile( element );
					if ( elScroll ) {
						var elTile = elScroll.FindChildInLayoutFile( 'ItemFromContainer' );
						if ( elTile ) _UpdateScrollTile( element, elTile, itemId );
					}
				} );
			}
		}
		else if ( type === "ticket_activated" )
		{
			m_itemFromContainer = itemId;
			_ShowInspect();
		}
	};

	var _ItemAcquired = function( ItemId )
	{
		$.DispatchEvent( "PlaySoundEffect", "rename_purchaseSuccess", "MOUSE" );
		
		if ( !m_keyId && m_keytoSellId )
		{
			var matchtingKeyDefName = InventoryAPI.GetItemDefinitionName( m_keytoSellId );
			
			if ( InventoryAPI.DoesItemMatchDefinitionByName ? InventoryAPI.DoesItemMatchDefinitionByName( ItemId, matchtingKeyDefName ) : ItemInfo.ItemMatchDefName( ItemId, matchtingKeyDefName ) )
			{
				m_keyId = ItemId;
				$.DispatchEvent( 'HideStoreStatusPanel' );
				_AcknowledgeMatchingKeys( matchtingKeyDefName );
				_SetUpPanelElements();
			}
		}
		else if( m_storeItemId )
		{
			_ClosePopUp();
			$.DispatchEvent( 'ShowAcknowledgePopup', '', ItemId );
			$.DispatchEvent( 'HideStoreStatusPanel' );
		}
	};

	var _AcknowledgeMatchingKeys = function( matchtingKeyDefName )
	{
		var bShouldAcknowledge = true;
		if ( typeof AcknowledgeItems !== 'undefined' ) {
			AcknowledgeItems.GetItemsByType( [ matchtingKeyDefName ], bShouldAcknowledge );
		}
	};

	var _ShowUnlockAnimation = function()
	{
		var lootListCount = InventoryAPI.GetLootListItemsCount( m_caseId );
		if ( lootListCount === undefined )
		{
			if ( InventoryAPI.IsValidItemID( m_itemFromContainer ) )
			{
				_ShowInspect();
			}
			else
			{
				_SetUpCaseOpeningCountdown();
			}
			return;
		}

		if ( lootListCount <= 1 )
		{
			_SetUpCaseOpeningCountdown();
		}
		else
		{
			_SetUpCaseOpeningScroll();
		}

		_PlayContainerSound( m_caseId, 'open' );
		_PlayContainerSound( m_caseId, 'ticker' );
	};

	var _PlayContainerSound = function(caseId, soundName) {
		$.DispatchEvent( "PlaySoundEffect", "container_" + _GetContainerType(caseId) + "_" + soundName, "MOUSE" );
	};

	var _GetContainerType = function(caseId) {
		var itemDefName = InventoryAPI.GetItemDefinitionName( m_caseId );
		if ( itemDefName && ( itemDefName.indexOf("spray") != -1 || itemDefName.indexOf("tournament_pass_") != -1 ) ) {
			return 'graffiti';
		} else if ( itemDefName && itemDefName.indexOf("sticker") != -1 ) {
			return 'sticker';
		} else if ( itemDefName && itemDefName.indexOf("pins") != -1 ) {
			return 'pins';
		} else if ( itemDefName && itemDefName.indexOf("patch") != -1 ) {
			return 'patch';
		} else if ( itemDefName && ( itemDefName.indexOf("coupon") == 0 || itemDefName.indexOf("musickit") != -1 ) ) {
			return 'music';
		} else {
			return 'weapon';
		}
	};

	var _HidePanelForLootlistItemPreview = function()
	{
		m_Inspectpanel.visible = true;
	};

	var _ClosePopUp = function()
	{
		InventoryAPI.StopItemPreviewMusic();

		if ( m_Inspectpanel.IsValid() )
		{ 
			if ( m_showInspectScheduleHandle )
			{
				$.CancelScheduled( m_showInspectScheduleHandle );
				m_showInspectScheduleHandle = null;
			}

			var elAsyncActionBarPanel = m_Inspectpanel.FindChildInLayoutFile( 'PopUpInspectAsyncBar' );
			var elPurchase = m_Inspectpanel.FindChildInLayoutFile( 'PopUpInspectPurchaseBar' );
			
			if ( elAsyncActionBarPanel && !elAsyncActionBarPanel.BHasClass( 'hidden' ) )
			{
				InspectAsyncActionBar.OnEventToClose();
			}
			else if ( elPurchase && !elPurchase.BHasClass( 'hidden' ) )
			{
				if ( InpsectPurchaseBar && InpsectPurchaseBar.ClosePopup ) InpsectPurchaseBar.ClosePopup();
				else if ( InspectPurchaseBar && InspectPurchaseBar.ClosePopup ) InspectPurchaseBar.ClosePopup();
			}
		}

		_UpdateOpeningCounter.CancelTimer();
	};
	
	return {
		Init: _Init,
		SetUpCaseOpening: _SetUpCaseOpeningScroll,
		ClosePopUp: _ClosePopUp,
		UpdateScrollResultTile: _UpdateScrollResultTile,
		ItemAcquired: _ItemAcquired,
		ShowUnlockAnimation: _ShowUnlockAnimation
	};
} )();


( function()
{
	var _m_PanelRegisteredForEvents;
	if ( !_m_PanelRegisteredForEvents )
	{
		_m_PanelRegisteredForEvents = $.RegisterForUnhandledEvent( 'PanoramaComponent_Inventory_ItemCustomizationNotification', CapabilityDecodable.UpdateScrollResultTile );
		$.RegisterForUnhandledEvent( 'PanoramaComponent_Store_PurchaseCompleted', CapabilityDecodable.ItemAcquired );
		$.RegisterForUnhandledEvent( 'StartDecodeableAnim', CapabilityDecodable.ShowUnlockAnimation );
		
		$.RegisterForUnhandledEvent( 'CSGOShowMainMenu', CapabilityDecodable.Init );
		$.RegisterForUnhandledEvent( 'PopulateLoadingScreen', CapabilityDecodable.ClosePopUp );
		$.RegisterForUnhandledEvent( 'OpenInventory', CapabilityDecodable.ClosePopUp );
	}
} )();