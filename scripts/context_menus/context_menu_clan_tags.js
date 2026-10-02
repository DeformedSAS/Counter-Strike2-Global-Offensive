"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../popups/popup_custom_layout.ts" />
var PlayerCardContextMenuClanTags;
(function (PlayerCardContextMenuClanTags) {
    let m_myPrevClanId = 0;

    function Init() {
        const elClanTagContextMenu = $('#id-scrolling-tag-container');
        if (!elClanTagContextMenu) return;

        elClanTagContextMenu.RemoveAndDeleteChildren();

        const currentClanIDStr = GameInterfaceAPI.GetSettingString('cl_clanid') || "0";
        const myXuid = MyPersonaAPI.GetXuid();

        const elClearItem = AddTextButtonItem(
            elClanTagContextMenu, 
            'noclan', 
            $.Localize('#ClanTag_Clear_ClanTag'), 
            () => EquipClanWithSpinner(0)
        );
        
        const hasNoClan = (currentClanIDStr === "0" || currentClanIDStr === "");
        elClearItem.SetHasClass('current-clantag', hasNoClan);
        elClearItem.enabled = !hasNoClan;

        const nNumClans = MyPersonaAPI.GetMyClanCount();
        for (let i = 0; i < nNumClans; i++) {
            const clanID32 = MyPersonaAPI.GetMyClanId32BitByIndex(i);
            const clanID64 = MyPersonaAPI.GetMyClanIdByIndex(i);

            let clanTag = MyPersonaAPI.GetMyClanTagById(clanID64) || MyPersonaAPI.GetMyClanTagById(clanID32) || "";
            let clanName = MyPersonaAPI.GetMyClanNameById(clanID64) || MyPersonaAPI.GetMyClanNameById(clanID32) || "";

            const isEquipped = (currentClanIDStr === String(clanID32));
            if (isEquipped) {
                m_myPrevClanId = clanID32;
            }

            AddClanTagItem(
                elClanTagContextMenu, 
                'clanid' + i, 
                clanID32, 
                '[' + clanTag + ']', 
                clanName, 
                isEquipped
            );
        }

        AddTextButtonItem(elClanTagContextMenu, 'id-manage-groups', $.Localize('#ClanTag_Manage_Groups'), () => {
            const url = 'https://' + SteamOverlayAPI.GetSteamCommunityURL() + '/profiles/' + myXuid + '/groups/';
            SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser(url);
            $.DispatchEvent('ContextMenuEvent', '');
        });
    }
    PlayerCardContextMenuClanTags.Init = Init;

    function AddClanTagItem(elParent, id, clanID32, tagText, nameText, isEquipped) {
        const elItem = $.CreatePanel('Button', elParent, id);
        elItem.BLoadLayoutSnippet('snippet-clantag-item');

        const elClanTagLabel = elItem.FindChildTraverse('id-clan-tag__label');
        if (elClanTagLabel) elClanTagLabel.text = tagText;

        elItem.SetHasClass('current-clantag', isEquipped);
        elItem.enabled = !isEquipped;

        const elClanNameLabel = elItem.FindChildTraverse('id-clan-name__label');
        if (elClanNameLabel) elClanNameLabel.text = nameText;

        elItem.SetPanelEvent('onactivate', () => EquipClanWithSpinner(clanID32));
    }

    function AddTextButtonItem(elParent, id, labelText, fnActivate) {
        const elItem = $.CreatePanel('Button', elParent, id);
        elItem.BLoadLayoutSnippet('snippet-clantag-text-button');

        const elLabel = elItem.FindChildTraverse('id-clantag-text-button__label');
        if (elLabel) elLabel.text = labelText;

        elItem.SetPanelEvent('onactivate', fnActivate);
        return elItem;
    }

    function EquipClanWithSpinner(clanID) {
        $.DispatchEvent('ContextMenuEvent', '');

        let elPopup = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_custom_layout.xml');
        let oSettings = {
            image: '',
            message: $.Localize('#ClanTag_Updating'),
            show_spinner: true,
            no_min_width: true,
            show_loading_bar: false,
            hide_buttons: true,
            timeout: 1
        };
        if (elPopup && elPopup.Data) {
            elPopup.Data().oSettings = oSettings;
        }

        //GameInterfaceAPI.ConsoleCommand('cl_clanid ' + clanID);
        GameInterfaceAPI.SetSettingString('cl_clanid', String(clanID));

        $.Schedule(0.4, () => {
            $.DispatchEvent('UIPopupButtonClicked', '');
        });
    }
})(PlayerCardContextMenuClanTags || (PlayerCardContextMenuClanTags = {}));