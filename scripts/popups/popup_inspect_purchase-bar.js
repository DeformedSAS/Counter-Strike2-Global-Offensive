'use strict';

var InpsectPurchaseBar = ( function()
{
	var m_itemid = '';                                            
	var m_storeItemid = '';                                                                      
	var m_elPanel = null;
	var m_showToolUpsell = false;                                                             
	var m_isXrayMode = false;
	var m_allowXrayPurchase = false;
	var m_bOverridePurchaseMultiple = false;
	var m_blurOperationPanel = false;
	var m_previewingMusic = false;
	var m_schfnMusicMvpPreviewEnd = null;
	var m_activePreviewItemId = '';

	var _Init = function( elPanel, itemId, funcGetSettingCallback )
	{
		m_storeItemid = funcGetSettingCallback( "storeitemid", "" );
		m_bOverridePurchaseMultiple = ( funcGetSettingCallback( "overridepurchasemultiple", "" === '1' ) ) ? true : false;
		m_blurOperationPanel = ( $.GetContextPanel().GetAttributeString( 'bluroperationpanel', 'false' ) === 'true' ) ? true : false;
		
		m_itemid = !m_storeItemid ? itemId : m_storeItemid;

		var bFauxItemIdForPurchase = InventoryAPI.IsFauxItemID( m_itemid );
		var priceOriginal = bFauxItemIdForPurchase ? ItemInfo.GetStoreOriginalPrice( m_itemid, 1 ) : '';

		if ( !priceOriginal ||
			( funcGetSettingCallback( 'inspectonly', 'false' ) === 'true' ) ||
			!InventoryAPI.IsValidItemID( m_itemid )
		)
		{
			elPanel.AddClass( 'hidden' );
			return;
		}

		m_elPanel = elPanel;
		m_isXrayMode = ( funcGetSettingCallback( "isxraymode", "no" ) === 'yes' ) ? true : false;
		m_allowXrayPurchase = ( funcGetSettingCallback( "allowxraypurchase", "no" ) === 'yes' ) ? true : false;
		m_showToolUpsell = (funcGetSettingCallback( "toolid", '' )) === '' ? true : false;
		elPanel.RemoveClass( 'hidden' );	

		var targetId = m_storeItemid ? m_storeItemid : m_itemid;
		m_activePreviewItemId = GetDisplayItemId( targetId );

		_SetPurchaseImage( elPanel, m_activePreviewItemId );
		_SetDialogVariables( elPanel, m_itemid );
		_UpdateDecString( elPanel );
		_SetUpPurchaseBtn( elPanel );
		_UpdatePurchasePrice();

		var slot = ItemInfo.GetSlot( m_activePreviewItemId );
		var elMusicBtn = elPanel.FindChildInLayoutFile( 'InspectPlayMvpBtn' );

		if ( elMusicBtn )
		{
			if ( slot == "musickit" )
			{
				InventoryAPI.PlayItemPreviewMusic( m_activePreviewItemId );
				m_previewingMusic = true;

				elMusicBtn.SetHasClass( 'hidden', ( InventoryAPI.GetItemRarity( m_activePreviewItemId ) <= 0 ) );
				elMusicBtn.visible = true;
				elMusicBtn.SetPanelEvent( 'onactivate', function() {
					_InspectPlayMusic( 'mvp' );
				} );
			}
			else
			{
				elMusicBtn.AddClass( 'hidden' );
				elMusicBtn.visible = false;
			}
		}
	};

	var _InspectPlayMusic = function ( type )
	{
		if ( !m_previewingMusic )
			return;

		if ( type === 'mvp' )
		{
			if ( m_schfnMusicMvpPreviewEnd )
				return;                                                                      

			InventoryAPI.StopItemPreviewMusic();
			InventoryAPI.PlayItemPreviewMusic( m_activePreviewItemId, 'roundmvpanthem_01.mp3' );

			m_schfnMusicMvpPreviewEnd = $.Schedule( 6.8, InpsectPurchaseBar.InspectPlayMusic.bind( null, 'schfn' ) );
		}
		else if ( type === 'schfn' )
		{
			m_schfnMusicMvpPreviewEnd = null;
			InventoryAPI.StopItemPreviewMusic();
			InventoryAPI.PlayItemPreviewMusic( m_activePreviewItemId );
		}
	};

	var _SetDialogVariables = function( elPanel, itemId )
	{
		elPanel.SetDialogVariable( "itemname", ItemInfo.GetName( itemId ) );
	};

	var _SetPurchaseImage = function( elPanel, itemId )
	{
		var elImage = elPanel.FindChildInLayoutFile( 'PurchaseItemImage' );
		if ( !elImage )
			return;

		elImage.itemid = itemId;
		elImage.SetHasClass( 'popup-capability-faded', m_isXrayMode && !m_allowXrayPurchase );
	};

	function GetDisplayItemId( itemId ) 
	{
		if ( !itemId || !InventoryAPI.IsValidItemID( itemId ) )
			return itemId;

		if ( InventoryAPI.GetItemTypeFromEnum( itemId ) === 'coupon' )
			return InventoryAPI.GetLootListItemIdByIndex( itemId, 0 );
	
		return itemId;
	}

	var _UpdateDecString = function ( elPanel )
	{
		var elDesc = m_elPanel.FindChildInLayoutFile( 'PurchaseItemName' );

		if ( m_isXrayMode )
		{
			elPanel.SetDialogVariable( "itemprice", ItemInfo.GetStoreSalePrice( m_itemid, 1 ) );
			elDesc.text = "#popup_capability_upsell_xray";
		}
		else if ( !m_storeItemid && m_showToolUpsell )
		{
			elDesc.text = "#popup_capability_upsell";
		}
		else
		{
			elDesc.text = "#popup_capability_use";
		}

		elDesc.SetHasClass( 'popup-capability-faded', m_isXrayMode && !m_allowXrayPurchase );
	};

	var _UpdatePurchasePrice = function ()
	{
		if ( !m_elPanel.IsValid() )
			return;
		
		var elBtn = m_elPanel.FindChildInLayoutFile( 'PurchaseBtn' );
		var elDropdown = m_elPanel.FindChildInLayoutFile( 'PurchaseCountDropdown' );
		var qty = 1;

		var bCanShowQuantityDropdown = !m_isXrayMode && _isAllowedToPurchaseMultiple();
		elDropdown.visible = bCanShowQuantityDropdown;
		if( bCanShowQuantityDropdown )
		{
			qty = Number( elDropdown.GetSelected().id );
		}

		var salePrice = ItemInfo.GetStoreSalePrice( m_itemid, qty );
		elBtn.text = m_isXrayMode ? '#popup_totool_purchase_header' :  salePrice;

		_UpdateSalePrice( ItemInfo.GetStoreOriginalPrice( m_itemid, qty ) );
	};

	var _isAllowedToPurchaseMultiple = function()
	{
		if ( m_bOverridePurchaseMultiple )
			return true;                                             

		var attValue = InventoryAPI.GetItemAttributeValue( m_itemid, 'season access' );
		if ( attValue )
			return false;                                                                  

		var defName = InventoryAPI.GetItemDefinitionName( m_itemid );
		if ( defName === 'casket' )
			return false;                                                                               

		return true;
	};

	var _SetUpPurchaseBtn = function ( elPanel )
	{
		elPanel.FindChildInLayoutFile( 'PurchaseBtn' ).enabled = !m_isXrayMode || ( m_isXrayMode && m_allowXrayPurchase );
		elPanel.FindChildInLayoutFile( 'PurchaseBtn' ).SetPanelEvent( 'onactivate', _OnActivate );
	};

	var _UpdateSalePrice = function( salePrice )
	{
		var elSalePrice = m_elPanel.FindChildInLayoutFile( 'PurchaseSalePrice' );
		var elSalePercent = m_elPanel.FindChildInLayoutFile( 'PurchaseItemPercent' );
		var salePercent = ItemInfo.GetStoreSalePercentReduction( m_itemid );

		if( salePercent )
		{
			elSalePrice.visible = true;
			elSalePrice.text = salePrice;

			elSalePercent.visible = true;
			elSalePercent.text = salePercent;
			return;
		}

		elSalePrice.visible = false;
		elSalePercent.visible = false;
	};

	var _OnDropdownUpdate = function ()
	{
		_UpdatePurchasePrice();
	};

	var _OnActivate = function()
	{
		var elDropdown = m_elPanel.FindChildInLayoutFile( 'PurchaseCountDropdown' );
		var qty = Number( elDropdown.GetSelected().id );

		var itemDefitionNameString = ItemInfo.GetItemDefinitionName( m_itemid );
		var purchaseList = [];

		for ( var i = 0; i < qty; i++ )
		{
			purchaseList.push( m_itemid );
		}

		var purchaseString = purchaseList.join( ',' );
		if ( itemDefitionNameString && itemDefitionNameString.startsWith( 'coupon - crate_patch_' ) &&
			! ItemInfo.FindAnyUserOwnedCharacterItemID() )
		{	                                                                                           
			UiToolkitAPI.ShowGenericPopupYesNo(
				$.Localize( '#CSGO_Patch_NoAgent_Title' ),
				$.Localize( '#CSGO_Patch_NoAgent_Message' ),
				'',
				function() { ItemInfo.ItemPurchase( purchaseString ); },
				function() {}
			);
		}
		else
		{
			ItemInfo.ItemPurchase( purchaseString );
		}
	};

    var _ClosePopup = function()
	{
		InventoryAPI.StopItemPreviewMusic();

		if ( m_previewingMusic )
		{
			InventoryAPI.StopItemPreviewMusic();
			m_previewingMusic = false;

			if ( m_schfnMusicMvpPreviewEnd )
			{
				$.CancelScheduled( m_schfnMusicMvpPreviewEnd );
				m_schfnMusicMvpPreviewEnd = null;
			}
			
			$.DispatchEvent( 'PlayMainMenuMusic', true, false );
		}

		if( m_blurOperationPanel )
		{
			$.DispatchEvent( 'UnblurOperationPanel' );
		}

		$.DispatchEvent( 'HideSelectItemForCapabilityPopup' );
		$.DispatchEvent( 'UIPopupButtonClicked', '' );
		$.DispatchEvent( 'CapabilityPopupIsOpen', false );
	};

	return {
		Init: _Init,
		OnDropdownUpdate: _OnDropdownUpdate,
		ClosePopup :_ClosePopup,
		InspectPlayMusic: _InspectPlayMusic
	};
} )();

( function()
{

} )();