'use strict';

var InspectModelImage = ( function (){

    var m_charAnimIsPlaying = false;
    var m_bCanShowCertificateInfo = true;
    var m_bCanShowEquipControls = true;

    var _Init = function ( elPanel, itemId, funcGetSettingCallback)
    {
        var strViewFunc = funcGetSettingCallback ? funcGetSettingCallback( 'viewfunc', '' ) : '';

        if ( ItemInfo.ItemDefinitionNameSubstrMatch( itemId, 'tournament_journal_' ) )
            itemId = ( strViewFunc === 'primary' ) ? itemId : ItemInfo.GetFauxReplacementItemID( itemId, 'graffiti' );

        if ( !InventoryAPI.IsValidItemID( itemId ) )
            return;

        var model = ItemInfo.GetModelPathFromJSONOrAPI( itemId );

        if ( model )
            _SetModelScene( elPanel, model, itemId );
        else
            _SetImage( elPanel, itemId );

        var view = ItemInfo.GetModelPathFromJSONOrAPI( itemId );
        if ( view )
        {
            _SetViewScene( elPanel, model, itemId );

            var elViewContainer = elPanel.FindChildTraverse( 'InspectModelViewContainer' );
            if ( elViewContainer )
                elViewContainer.AddClass( 'hidden' );
        }
    };

    var _SetModelScene = function ( elParent, model, itemId = 0 )
    {
        var elPanel = elParent.FindChildInLayoutFile( 'InspectItemModel' );
        if ( elPanel )
        {
            if ( ItemInfo.IsCharacter( itemId ) )
            {
                elPanel.AddClass( 'popup-inspect-modelpanel--char2' );
                elPanel.RemoveClass( 'popup-inspect-modelpanel' );
                elPanel.SetScene( 
                    "resource/ui/econ/ItemModelPanelCharMainMenu.res",
                    model,
                    false
                );
                elPanel.SetAttributeString( "mouse_rotate", "false" );
                elPanel.hittest = false;
                var settings = ItemInfo.GetOrUpdateVanityCharacterSettings( itemId );
                settings.panel = elPanel;
                CharacterAnims.PlayAnimsOnPanel( settings );
                elPanel.SetCameraPreset( 1, true );
            }
            else
            {
                elPanel.RemoveClass( 'popup-inspect-modelpanel--char2' );
                elPanel.SetAttributeString( "mouse_rotate", "true" );
                elPanel.hittest = true;
                elPanel.SetScene( 
                    "resource/ui/econ/ItemModelPanelCharWeaponInspect.res",
                    model,
                    false
                );
            }

            elPanel.RemoveClass( 'hidden' );
        }
    };

    var _SetImage = function( elParent, itemId )
    {
        var elPanel = elParent.FindChildInLayoutFile( 'InspectItemImage' );
        if ( elPanel )
        {
            elPanel.itemid = itemId;
            elPanel.RemoveClass( 'hidden' );
            _TintSprayImage( itemId, elPanel );
        }
    };

    var _TintSprayImage = function( id, elImage )
    {
        TintSprayIcon.CheckIsSprayAndTint( id, elImage );
    };

    var _SetCharScene = function ( elParent, characterItemId, weaponItemId )
    {
        var elPanel = elParent.FindChildInLayoutFile( 'InspectModelChar' );
        if ( !elPanel )
            return;

        var settings = ItemInfo.GetOrUpdateVanityCharacterSettings( characterItemId );
        settings.panel = elPanel;
        settings.weaponItemId = weaponItemId;
        settings.cameraPreset = 1;
        
        CharacterAnims.PlayAnimsOnPanel( settings );
    };

    var _SetViewScene = function ( elParent, model, itemId = 0 )
    {
        var elPanel = elParent.FindChildInLayoutFile( 'InspectModelView' );
        if ( elPanel )
        {
            elPanel.SetScene( "resource/ui/econ/itemmodelviewinspect_test.res",
                model,
                false
            );


            elPanel.RemoveClass( 'hidden' );
        }
    };

    var _ToggleViewScene = function ( elParent )
    {
        var elContainer = elParent.FindChildTraverse( 'InspectModelViewContainer' );
        if ( !elContainer ) return;

        var isHidden = elContainer.BHasClass( 'hidden' );
        elContainer.SetHasClass( 'hidden', !isHidden );
    };

    var _CancelCharAnim = function( elParent )
    {
        var elChar = elParent.FindChildInLayoutFile( 'InspectModelChar' );
        var elView = elParent.FindChildInLayoutFile( 'InspectModelView' );

        if ( elChar ) CharacterAnims.CancelScheduledAnim( elChar );
        if ( elView ) CharacterAnims.CancelScheduledAnim( elView );
    };

    var _ShowHideItemPanel = function( elParent, bshow )
    {
        if ( !elParent || !elParent.IsValid() )
            return;
        
        var elContainer = elParent.FindChildTraverse( 'InspectModelContainer' );
        if ( elContainer )
            elContainer.SetHasClass( 'hidden', !bshow );

        if ( bshow )
            $.DispatchEvent( "PlaySoundEffect", "weapon_showSolo", "MOUSE" );
    };

    var _ShowHideCharPanel = function( elParent, bshow )
    {
        if ( !elParent || !elParent.IsValid() )
            return;
        
        var elContainer = elParent.FindChildTraverse( 'InspectModelCharContainer' );
        if ( elContainer )
            elContainer.SetHasClass( 'hidden', !bshow );

        if ( bshow )
            $.DispatchEvent( "PlaySoundEffect", "weapon_showOnChar", "MOUSE" );
    };

    var _ShowHideViewPanel = function( elParent, bshow )
    {
        if ( !elParent || !elParent.IsValid() )
            return;
        
        var elContainer = elParent.FindChildTraverse( 'InspectModelViewContainer' );
        if ( elContainer )
            elContainer.SetHasClass( 'hidden', !bshow );

        if ( bshow )
            $.DispatchEvent( "PlaySoundEffect", "weapon_showOnChar", "MOUSE" );
    };

    var _GetModelPanel = function( elParent )
    {
        return elParent ? elParent.FindChildInLayoutFile( 'InspectItemModel' ) : null;
    };

    var _GetImagePanel = function( elParent )
    {
        return elParent ? elParent.FindChildInLayoutFile( 'InspectItemImage' ) : null;
    };

    return {
        Init: _Init,
        SetCharScene: _SetCharScene,
        SetViewScene: _SetViewScene,
        ToggleViewScene: _ToggleViewScene,
        CancelCharAnim: _CancelCharAnim,
        ShowHideItemPanel: _ShowHideItemPanel,
        ShowHideCharPanel: _ShowHideCharPanel,
        ShowHideViewPanel: _ShowHideViewPanel,
        GetModelPanel: _GetModelPanel,
        GetImagePanel: _GetImagePanel
    };
} )();

( function()
{
} )();
