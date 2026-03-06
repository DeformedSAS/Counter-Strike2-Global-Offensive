"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="mock_adapter.ts" />
var BuyMenu;
(function (BuyMenu) {
    let m_oldWeaponItemId;
    let _UpdateCharacter = function (team, weaponItemId, charItemId, bForceRefresh, bResetAgentAngles) {
        if ((weaponItemId == m_oldWeaponItemId) && !bForceRefresh) {
            return;
        }
        let elPreviewPanel = $.GetContextPanel().FindChildTraverse("id-buymenu-agent");
        if (!elPreviewPanel)
            return;
        if (!weaponItemId) {
            weaponItemId = MockAdapter.GetPlayerActiveWeaponItemId(MockAdapter.GetLocalPlayerXuid());
        }
        if (!team) {
            team = MockAdapter.GetPlayerTeamName(MockAdapter.GetLocalPlayerXuid());
        }
        let teamstring = CharacterAnims.NormalizeTeamName(team, true);
        let settings = ItemInfo.GetOrUpdateVanityCharacterSettings(LoadoutAPI.GetItemID(teamstring, 'customplayer'));
        settings.panel = elPreviewPanel;
        settings.team = teamstring;
        settings.cameraPreset = 18;
        settings.weaponItemId = weaponItemId;
        settings.charItemId = charItemId;
        if (settings.charItemId == '0' || settings.charItemId === LoadoutAPI.GetDefaultItem(teamstring, 'customplayer')) {
            settings.modelOverride = MockAdapter.GetPlayerModel(MockAdapter.GetLocalPlayerXuid());
        }
        CharacterAnims.PlayAnimsOnPanel(settings);
		
        elPreviewPanel.SetFlashlightAmount( 2.1 );
        elPreviewPanel.SetFlashlightFOV( 55 );
        elPreviewPanel.SetFlashlightColor( 2.35, 2.2, 2.0 ); 


        elPreviewPanel.SetAmbientLightColor( 0.5, 0.45, 0.4 );


        elPreviewPanel.SetDirectionalLightModify( 0 );
        elPreviewPanel.SetDirectionalLightColor( 1.05, 1.0, 0.9 );
        elPreviewPanel.SetDirectionalLightDirection( -0.2, 0.92, -0.35 );


        elPreviewPanel.SetDirectionalLightModify( 1 );
        elPreviewPanel.SetDirectionalLightColor( 0.35, 0.3, 0.25 );
        elPreviewPanel.SetDirectionalLightDirection( 0.1, -0.5, 0.6 );


        elPreviewPanel.SetDirectionalLightModify( 2 );
        elPreviewPanel.SetDirectionalLightColor( 0.2, 0.18, 0.15 );
        elPreviewPanel.SetDirectionalLightDirection( 0.5, 0.4, -0.6 );
		
		
        m_oldWeaponItemId = weaponItemId;
    };
    $.RegisterForUnhandledEvent("BuyMenu_UpdateCharacter", _UpdateCharacter);
})(BuyMenu || (BuyMenu = {}));
