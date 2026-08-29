"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="popup_inspect_shared.ts" />
/// <reference path="../generated/items_event_current_generated_store.ts" />
var CanApplyHeader;
(function (CanApplyHeader) {
    function Init(oTitleSettings) {
        oTitleSettings.headerPanel.RemoveClass('hidden');
        _SetTitle(oTitleSettings);
        _SetUpDesc(oTitleSettings);
        _SetUpWarning(oTitleSettings);
    }
    CanApplyHeader.Init = Init;
    function _SetTitle(oTitleSettings) {
        if (oTitleSettings.type === 'sticker' && !oTitleSettings.isRemove) {
            const listStickers = ItemInfo.GetitemStickerList(oTitleSettings.itemId);
            oTitleSettings.contextPanel.SetDialogVariableInt("sticker_count", listStickers.length + 1);
            oTitleSettings.contextPanel.SetDialogVariableInt("max_stickers", 5);
            oTitleSettings.contextPanel.SetDialogVariable("CanApplyTitle", $.Localize('#popup_can_sticker_button', oTitleSettings.contextPanel));
            return;
        }
        let title = oTitleSettings.isRemove ? '#SFUI_InvContextMenu_can_stick_Wear_full_' + oTitleSettings.type : '#SFUI_InvContextMenu_stick_use_' + oTitleSettings.type;
        switch (InspectShared.GetPopupSetting('work_type')) {
            case 'remove_sticker':
                if (InspectShared.GetPopupSetting('remove_sticker_all_at_once', oTitleSettings.contextPanel))
                    title = '#SFUI_InvUse_Remove_Stickers';
                break;
            case 'can_wrap_sticker':
                title = oTitleSettings.toolId ? '#CSGO_Tool_WrapStickerInDisplayCase_Title' : '#CSGO_Tool_UnWrapStickerInDisplayCase_Title';
                break;
            case 'craft_souvenir':
                title = "#popup_craft_souvenir_button";
                break;
        }
        oTitleSettings.contextPanel.SetDialogVariable("CanApplyTitle", $.Localize(title, oTitleSettings.contextPanel));
    }
    function _SetUpDesc(oTitleSettings) {
        const currentName = InventoryAPI.GetItemNameUncustomized(oTitleSettings.itemId);
        oTitleSettings.contextPanel.SetDialogVariable('tool_target_name', currentName);
        let desc = oTitleSettings.isRemove ? '#popup_can_stick_scrape_full_' + oTitleSettings.type : '#popup_can_stick_desc';
        switch (InspectShared.GetPopupSetting('work_type')) {
            case 'remove_sticker':
                if (InspectShared.GetPopupSetting('remove_sticker_all_at_once', oTitleSettings.contextPanel))
                    desc += '_wipestickers';
                break;
            case 'can_wrap_sticker':
                desc = '';
                break;
            case 'craft_souvenir':
                desc = '#popup_craft_souvenir_desc';
                break;
        }
        oTitleSettings.contextPanel.SetDialogVariable("CanApplyDesc", $.Localize(desc, oTitleSettings.contextPanel));
    }
    function _SetUpWarning(oTitleSettings) {
        const elLabel = oTitleSettings.headerPanel.FindChildTraverse('id-can-apply-warning');
        switch (InspectShared.GetPopupSetting('work_type')) {
            case 'can_wrap_sticker':
                elLabel.visible = true;
                elLabel.FindChildInLayoutFile('id-can-apply-warning-text').SetLocString(oTitleSettings.toolId ? '#CSGO_Tool_WrapStickerInDisplayCase_Desc' : '#CSGO_Tool_UnWrapStickerInDisplayCase_Desc');
                return;
            case 'craft_souvenir':
                elLabel.visible = true;
                const balanceCredits = InspectShared.GetPopupSetting('credits_owned_souvenir');
                elLabel.SetDialogVariableInt('credits_owned_souvenir', balanceCredits);
                elLabel.SetDialogVariableLocString('event_credits', '#CSGO_TournamentPass_' + g_ActiveTournamentInfo.location + '_credits');
                elLabel.FindChildInLayoutFile('id-can-apply-warning-text').SetLocString('#popup_craft_souvenir_warn');
                return;
        }
        if (oTitleSettings.isRemove && InspectShared.GetPopupSetting('work_type') == 'remove_keychain') {
            elLabel.visible = true;
            const numKeychainRemoveToolChargesRemaining = InventoryAPI.GetCacheTypeElementFieldByIndex('KeychainRemoveToolCharges', 0, 'charges');
            elLabel.SetDialogVariableInt('item_count', numKeychainRemoveToolChargesRemaining);
            elLabel.FindChildInLayoutFile('id-can-apply-warning-text').SetLocString('#Notify_KeychainRemoveTool_ChargesUseToRemove');
            return;
        }
        elLabel.visible = !oTitleSettings.isRemove;
        if (oTitleSettings.isRemove) {
            return;
        }
        let warningText = _GetWarningTradeRestricted(oTitleSettings);
        warningText = !warningText ? '#SFUI_InvUse_Warning_use_can_stick_' + oTitleSettings.type : warningText;
        if (ItemInfo.IsFauxOrRentalOrPreviewTool(oTitleSettings.toolId)) {
            warningText = '#SFUI_InvUse_Warning_use_can_stick_previewonly_' + oTitleSettings.type;
            let bPhantomDisplayItemCannotApply = true;
            oTitleSettings.contextPanel.SetHasClass('can_apply_previewonly_phantom_display', bPhantomDisplayItemCannotApply);
        }
        warningText = $.Localize(warningText, elLabel);
        oTitleSettings.contextPanel.SetDialogVariable("CanApplyWarning", warningText);
    }
    function _GetWarningTradeRestricted(oTitleSettings) {
        let strSpecialWarning = '';
        let strSpecialParam = null;
        const bIsPerfectWorld = MyPersonaAPI.GetLauncherType() === "perfectworld" ? true : false;
        if (!bIsPerfectWorld) {
            if (InventoryAPI.IsMarketable(oTitleSettings.itemId)) {
                if (!InventoryAPI.IsPotentiallyMarketable(oTitleSettings.toolId)) {
                    strSpecialParam = String(InventoryAPI.GetItemAttributeValue(oTitleSettings.toolId, "tradable after date"));
                    if (strSpecialParam !== undefined && strSpecialParam !== null) {
                        strSpecialWarning = _GetSpecialWarningString(oTitleSettings, strSpecialParam, "marketrestricted");
                    }
                }
                else {
                    strSpecialWarning = _GetStickerMarketDateGreater(oTitleSettings);
                }
            }
        }
        else {
            strSpecialWarning = _GetStickerMarketDateGreater(oTitleSettings);
        }
        return strSpecialWarning;
    }
    function _GetStickerMarketDateGreater(oTitleSettings) {
        const rtTradableAfterSticker = InventoryAPI.GetItemAttributeValue(oTitleSettings.toolId, "{uint32}tradable after date");
        const rtTradableAfterWeapon = InventoryAPI.GetItemAttributeValue(oTitleSettings.itemId, "{uint32}tradable after date");
        if (rtTradableAfterSticker != undefined && rtTradableAfterSticker != null &&
            (rtTradableAfterWeapon == undefined || rtTradableAfterWeapon == null || rtTradableAfterSticker > rtTradableAfterWeapon)) {
            let strSpecialParam = null;
            strSpecialParam = String(InventoryAPI.GetItemAttributeValue(oTitleSettings.toolId, "tradable after date"));
            if (strSpecialParam != undefined && strSpecialParam != null) {
                return _GetSpecialWarningString(oTitleSettings, strSpecialParam, "traderestricted");
            }
        }
        return '';
    }
    function _GetSpecialWarningString(oTitleSettings, strSpecialParam, warningText) {
        const elLabel = oTitleSettings.headerPanel.FindChildInLayoutFile('id-can-apply-warning');
        elLabel.SetDialogVariable('date', strSpecialParam);
        return "#popup_can_stick_warning_" + warningText + "_" + oTitleSettings.type;
    }
})(CanApplyHeader || (CanApplyHeader = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY2FuX2FwcGx5X2hlYWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9jYW5fYXBwbHlfaGVhZGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFDckMsOENBQThDO0FBQzlDLGdEQUFnRDtBQUNoRCw0RUFBNEU7QUFrQjVFLElBQVUsY0FBYyxDQStMdkI7QUEvTEQsV0FBVSxjQUFjO0lBRXZCLFNBQWdCLElBQUksQ0FBRSxjQUFrQztRQUV2RCxjQUFjLENBQUMsV0FBVyxDQUFDLFdBQVcsQ0FBRSxRQUFRLENBQUUsQ0FBQztRQUVuRCxTQUFTLENBQUUsY0FBYyxDQUFFLENBQUM7UUFDNUIsVUFBVSxDQUFFLGNBQWMsQ0FBRSxDQUFDO1FBQzdCLGFBQWEsQ0FBRSxjQUFjLENBQUUsQ0FBQztJQUNqQyxDQUFDO0lBUGUsbUJBQUksT0FPbkIsQ0FBQTtJQUVELFNBQVMsU0FBUyxDQUFFLGNBQWtDO1FBR3JELElBQUksY0FBYyxDQUFDLElBQUksS0FBSyxTQUFTLElBQUksQ0FBQyxjQUFjLENBQUMsUUFBUSxFQUNqRTtZQUNDLE1BQU0sWUFBWSxHQUFHLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBRSxjQUFjLENBQUMsTUFBTSxDQUFFLENBQUM7WUFFMUUsY0FBYyxDQUFDLFlBQVksQ0FBQyxvQkFBb0IsQ0FBRSxlQUFlLEVBQUUsWUFBWSxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUUsQ0FBQztZQUM3RixjQUFjLENBQUMsWUFBWSxDQUFDLG9CQUFvQixDQUFFLGNBQWMsRUFBRSxDQUFDLENBQUUsQ0FBQztZQUN0RSxjQUFjLENBQUMsWUFBWSxDQUFDLGlCQUFpQixDQUFFLGVBQWUsRUFBRSxDQUFDLENBQUMsUUFBUSxDQUFFLDJCQUEyQixFQUFFLGNBQWMsQ0FBQyxZQUFZLENBQUUsQ0FBQyxDQUFDO1lBQ3hJLE9B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