"use strict";

/// <reference path="../csgo.d.ts" />
/// <reference path="popup_capability_header.ts" />
/// <reference path="popup_inspect_action-bar.ts" />
/// <reference path="popup_inspect_shared.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="../inspect.ts" />

var SelectItemForCapability;
(function (SelectItemForCapability) {
    let _m_cp = $.GetContextPanel();
    let _m_elItemList = _m_cp.FindChildInLayoutFile('id-popup-select-item-list');
    let _hUpdateEvent = 0;
    
    SelectItemForCapability.oCapabilityInfo = {
        capability: '',
        initialItemId: '',
        secondaryItemId: '',
        popupVisible: false,
        bWorkshopItemPreview: false,
        bIsMultiSelect: false,
        multiselectItemIds: {},
        multiselectItemIdsArray: []
    };

    function Init() {
        SelectItemForCapability.oCapabilityInfo.initialItemId = _m_cp.GetAttributeString('itemid', '');
        SelectItemForCapability.oCapabilityInfo.secondaryItemId = _m_cp.GetAttributeString('secondaryItemid', '');
        SelectItemForCapability.oCapabilityInfo.bWorkshopItemPreview = _m_cp.GetAttributeString("bWorkshopItemPreview", 'false') === 'true';
        SelectItemForCapability.oCapabilityInfo.capability = _m_cp.GetAttributeString("capability", '');
        SelectItemForCapability.oCapabilityInfo.bIsMultiSelect = (SelectItemForCapability.oCapabilityInfo.capability === "casketstore" || SelectItemForCapability.oCapabilityInfo.capability === "casketretrieve" || SelectItemForCapability.oCapabilityInfo.capability === "delete");
        SelectItemForCapability.oCapabilityInfo.popupVisible = true;
        SelectItemForCapability.oCapabilityInfo.multiselectItemIds = {};
        SelectItemForCapability.oCapabilityInfo.multiselectItemIdsArray = [];
        
        $.DispatchEvent('CapabilityPopupIsOpen', true);
        
        let elInitialImage = _m_cp.FindChildInLayoutFile('id-initial-item-image');
        if (elInitialImage && elInitialImage.IsValid()) {
            elInitialImage.itemid = SelectItemForCapability.oCapabilityInfo.initialItemId;
        }

        if (_m_elItemList && _m_elItemList.IsValid()) {
            _m_elItemList.SetHasClass('inv-multi-select-allow', SelectItemForCapability.oCapabilityInfo.bIsMultiSelect);
            
            if (SelectItemForCapability.oCapabilityInfo.bIsMultiSelect) {
                _m_elItemList.SetAttributeInt("capability_multistatus_selected", 1);
            }
        }

        _m_cp.SetDialogVariable('item-name', InventoryAPI.GetItemName(SelectItemForCapability.oCapabilityInfo.initialItemId));
        _SetTitle();
        
        let elDropDownParent = _m_cp.FindChildInLayoutFile('id-dropdown-container');
        if (elDropDownParent && elDropDownParent.IsValid()) {
            _AddSortDropdownToNavBar(elDropDownParent);
        }
        
        _UpdateMultiSelectDisplay();
    }
    SelectItemForCapability.Init = Init;

    function _SetTitle() {
        let szPrefixString = '#inv_select_item_use_capability';
        let cap = SelectItemForCapability.oCapabilityInfo.capability;
        let initialId = SelectItemForCapability.oCapabilityInfo.initialItemId;

        if (cap === 'can_stattrack_swap') {
            szPrefixString = InventoryAPI.IsTool(initialId) ?
                '#inv_select_item_use_capability' :
                '#inv_select_item_stattrack_swap_capability';
        }
        else if (cap === 'can_collect') {
            let defName = InventoryAPI.GetItemDefinitionName(initialId);
            szPrefixString = (defName === 'casket') ?
                '#inv_select_item_tostoreincasket' :
                '#inv_select_casketitem_tostorethis';
        }
        else if (cap === 'casketcontents') {
            szPrefixString = '#inv_select_casketcontents';
        }
        else if (cap === 'casketretrieve') {
            szPrefixString = '#inv_select_casketretrieve';
        }
        else if (cap === 'casketstore') {
            szPrefixString = '#inv_select_casketstore';
        }
        else if (cap === 'delete') {
            szPrefixString = '#inv_context_delete';
        }
        else if (cap === 'craft_souvenir') {
            szPrefixString = '#inv_select_item_craft_souvenir';
        }
        
        _m_cp.AddClass('PopupSelectItemForCapability_' + cap);
        _m_cp.SetDialogVariable('title', $.Localize(szPrefixString, _m_cp));
    }

    function _AddSortDropdownToNavBar(elDropDownParent) {
        let elDropdown = elDropDownParent.FindChildInLayoutFile('InvSortDropdown');
        if (!elDropdown || !elDropdown.IsValid()) return;

        let count = InventoryAPI.GetSortMethodsCount();
        for (let i = 0; i < count; i++) {
            let sort = InventoryAPI.GetSortMethodByIndex(i);
            let newEntry = $.CreatePanel('Label', elDropdown, sort, {
                class: 'DropDownMenu'
            });
            newEntry.text = $.Localize('#' + sort);
            elDropdown.AddOption(newEntry);
        }
        elDropdown.SetPanelEvent('oninputsubmit', () => UpdateSort());
        elDropdown.SetSelected(GameInterfaceAPI.GetSettingString("newest"));
    }

    function UpdateSort() {
        let elDropdown = _m_cp.FindChildInLayoutFile('InvSortDropdown');
        const sortString = (!elDropdown || !elDropdown.IsValid() || !elDropdown.GetSelected()) ? 'newest' : elDropdown.GetSelected().id;
        let filterApplicationToPhantomItems = '';
        let capabilityFilter = SelectItemForCapability.oCapabilityInfo.capability + ':' + SelectItemForCapability.oCapabilityInfo.initialItemId + filterApplicationToPhantomItems;
        
        if (_m_elItemList && _m_elItemList.IsValid()) {
            $.DispatchEvent('SetInventoryFilter', _m_elItemList, 'any', 'any', 'any', sortString, capabilityFilter, '');
        }
        _ShowHideNoItemsMessage();
    }
    SelectItemForCapability.UpdateSort = UpdateSort;

    function _ShowHideNoItemsMessage() {
        if (!_m_elItemList || !_m_elItemList.IsValid()) return;
        
        let count = _m_elItemList.count;
        let elParent = _m_elItemList.GetParent();
        if (!elParent || !elParent.IsValid()) return;

        let elEmpty = elParent.FindChildInLayoutFile('id-select-item-empty-lister');
        if (!elEmpty || !elEmpty.IsValid()) return;

        if (count > 0) {
            elEmpty.visible = false;
            return;
        }

        let emptyText = '';
        elEmpty.SetDialogVariable('type', InventoryAPI.GetItemName(SelectItemForCapability.oCapabilityInfo.initialItemId));
        
        let cap = SelectItemForCapability.oCapabilityInfo.capability;
        let initialId = SelectItemForCapability.oCapabilityInfo.initialItemId;

        if (cap === 'can_stattrack_swap' && !InventoryAPI.IsTool(initialId))
            emptyText = $.Localize('#inv_empty_lister_for_stattrackswap', elEmpty);
        else if (cap === 'can_collect')
            emptyText = $.Localize('#inv_empty_lister_nocaskets', elEmpty);
        else if (cap === 'craft_souvenir')
            emptyText = $.Localize('#inv_empty_lister_for_craft_souvenir', elEmpty);
        else
            emptyText = $.Localize('#inv_empty_lister_for_use', elEmpty);

        elEmpty.SetDialogVariable('empty-text', emptyText);
        elEmpty.visible = true;
    }

    function _UpdateMultiSelectDisplay() {
        const elMultiSelectDisplay = _m_cp.FindChildInLayoutFile('id-popup-select-multi-item-display');
        if (!elMultiSelectDisplay || !elMultiSelectDisplay.IsValid()) return;

        if (!SelectItemForCapability.oCapabilityInfo.bIsMultiSelect) {
            elMultiSelectDisplay.visible = false;
            return;
        }

        let count = SelectItemForCapability.oCapabilityInfo.multiselectItemIdsArray.length;
        elMultiSelectDisplay.SetDialogVariableInt('count', count);

        let elBtn = _m_cp.FindChildInLayoutFile('id-popup-select-multi-item-btn');
        if (elBtn && elBtn.IsValid()) {
            elBtn.enabled = (count > 0);
            elBtn.SetHasClass('enabled', count > 0);
            if (SelectItemForCapability.oCapabilityInfo.capability === 'delete') {
                elBtn.SetHasClass('Negative', true);
                elBtn.SetHasClass('Positive', false);
            } else {
                elBtn.SetHasClass('Positive', true);
                elBtn.SetHasClass('Negative', false);
            }
        }
        elMultiSelectDisplay.visible = true;
    }

function ClosePopUp() {
        if (_hUpdateEvent) {
            $.UnregisterForUnhandledEvent('UpdateSelectItemForCapabilityPopup', _hUpdateEvent);
            _hUpdateEvent = 0;
        }

        if (_m_elItemList && _m_elItemList.IsValid()) {
            if (typeof _m_elItemList.ClearSelection === 'function') {
                _m_elItemList.ClearSelection();
            }
            _m_elItemList.SetHasClass('inv-multi-select-allow', false);
            $.DispatchEvent('SetInventoryFilter', _m_elItemList, '', '', '', '', '', '');
        }

        SelectItemForCapability.oCapabilityInfo.popupVisible = false;
        SelectItemForCapability.oCapabilityInfo.capability = '';
        SelectItemForCapability.oCapabilityInfo.initialItemId = '';
        SelectItemForCapability.oCapabilityInfo.multiselectItemIds = {};
        SelectItemForCapability.oCapabilityInfo.multiselectItemIdsArray = [];

        // Notify mainmenu_inventory_3.js to run its native close routine (hiding the panel & restoring listers)
        $.DispatchEvent('HideSelectItemForCapabilityPopup');
        $.DispatchEvent('CapabilityPopupIsOpen', false);
        $.DispatchEvent('RefreshActiveInventoryList');
        $.DispatchEvent('UIPopupButtonClicked', '');
        
        // DO NOT call _m_cp.DeleteAsync(0.0) because mainmenu_inventory_3.js manages this panel as a persistent node!
    }
    SelectItemForCapability.ClosePopUp = ClosePopUp;

    function _OnItemTileActivated(itemTile, itemid) {
        if (!SelectItemForCapability.oCapabilityInfo.popupVisible) return;

        $.DispatchEvent('PlaySoundEffect', 'inventory_item_select', 'MOUSE');
        
        let cap = SelectItemForCapability.oCapabilityInfo.capability;
        let initialId = SelectItemForCapability.oCapabilityInfo.initialItemId;

        if (cap === 'can_sticker') {
            _CapabilityCanStickerAction(SortIdsIntoToolAndItemID(itemid, initialId), SelectItemForCapability.oCapabilityInfo.bWorkshopItemPreview);
            return;
        }
        else if (cap === 'nameable') {
            _CapabilityNameableAction(SortIdsIntoToolAndItemID(itemid, initialId));
            return;
        }
        else if (cap === 'can_patch') {
            _CapabilityCanPatchAction(SortIdsIntoToolAndItemID(itemid, initialId));
            return;
        }
        else if (cap === 'decodable') {
            _CapabilityDecodableAction(SortIdsIntoToolAndItemID(itemid, initialId));
            return;
        }
        else if (cap === 'can_stattrack_swap') {
            _CapabilityStatTrakSwapAction(SelectItemForCapability.oCapabilityInfo, itemid);
            return;
        }
        else if (cap === 'can_collect') {
            _CapabilityPutIntoCasketAction(itemid, initialId);
            return;
        }

        if (cap === 'casketretrieve' || cap === 'casketstore' || cap === 'delete') {
            let listPanel = (itemTile && typeof itemTile.FindAncestor === 'function') ? itemTile.FindAncestor("id-popup-select-item-list") : _m_elItemList;
            if (listPanel && listPanel.IsValid()) {
                listPanel.OnItemActivated(itemid);
            }
            return;
        }

        ClosePopUp();
    }

    function SortIdsIntoToolAndItemID(id, initalId, fnWhatIsTool) {
        let bIdIsTool = fnWhatIsTool ? fnWhatIsTool(id) : InventoryAPI.IsTool(id);
        let toolId = bIdIsTool ? id : initalId;
        let itemID = bIdIsTool ? initalId : id;
        return {
            tool: toolId,
            item: itemID
        };
    }

    function _CapabilityCanStickerAction(idsToUse, bWorkshopItemPreview) {
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + idsToUse.item, 'file://{resources}/layout/popups/popup_capability_can_sticker.xml');
        let oSettings = {
            popup_panel: elPanel,
            item_id: idsToUse.item,
            tool_id: idsToUse.tool,
            work_type: 'can_sticker',
            is_workshop_preview: bWorkshopItemPreview
        };
        if (elPanel && elPanel.IsValid()) elPanel.Data().oSettings = oSettings;
        ClosePopUp();
    }

    function _CapabilityNameableAction(idsToUse) {
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + idsToUse.item, 'file://{resources}/layout/popups/popup_capability_nameable.xml');
        let oSettings = {
            item_id: idsToUse.item,
            tool_id: idsToUse.tool,
            work_type: 'nameable'
        };
        if (elPanel && elPanel.IsValid()) elPanel.Data().oSettings = oSettings;
        ClosePopUp();
    }

    function _CapabilityCraftSouvenirAction(itemid, umid) {
        if (InventoryAPI.GetItemStickerCount(itemid) > 0) {
            const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_capability_can_sticker.xml');
            let oSettings = {
                popup_panel: elPanel,
                item_id: itemid,
                remove_sticker_all_at_once: true,
                work_type: 'remove_sticker',
                umid_souvenir: umid
            };
            if (elPanel && elPanel.IsValid()) elPanel.Data().oSettings = oSettings;
        }
        ClosePopUp();
    }

    function _CapabilityCanPatchAction(idsToUse) {
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + idsToUse.item, 'file://{resources}/layout/popups/popup_capability_can_patch.xml');
        let oSettings = {
            item_id: idsToUse.item,
            tool_id: idsToUse.tool,
            work_type: 'can_patch'
        };
        if (elPanel && elPanel.IsValid()) elPanel.Data().oSettings = oSettings;
        ClosePopUp();
    }

    function _CapabilityDecodableAction(idsToUse) {
        const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('popup-inspect-' + idsToUse.item, 'file://{resources}/layout/popups/popup_capability_decodable.xml');
        let oSettings = {
            item_id: idsToUse.item,
            tool_id: idsToUse.tool,
            work_type: 'decodeable'
        };
        if (elPanel && elPanel.IsValid()) elPanel.Data().oSettings = oSettings;
        ClosePopUp();
    }

    function _CapabilityStatTrakSwapAction(capInfo, id) {
        if (InventoryAPI.IsTool(capInfo.initialItemId)) {
            $.DispatchEvent('PlaySoundEffect', 'tab_mainmenu_inventory', 'MOUSE');
            $.DispatchEvent('ShowSelectItemForCapabilityPopup', id, capInfo.initialItemId, capInfo.capability);
            ClosePopUp();
        }
        else {
            const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_capability_can_stattrack_swap.xml');
            let oSettings = {
                tool_id: capInfo.secondaryItemId,
                item_id: capInfo.initialItemId,
                stattrak_swap_second_item_id: id
            };
            if (elPanel && elPanel.IsValid()) elPanel.Data().oSettings = oSettings;
            ClosePopUp();
        }
    }

    function _CapabilityPutIntoCasketAction(idCasket, idItem, cap) {
        $.DispatchEvent('ContextMenuEvent', '');
        if (!cap) {
            $.DispatchEvent('HideSelectItemForCapabilityPopup');
            $.DispatchEvent('UIPopupButtonClicked', '');
            $.DispatchEvent('CapabilityPopupIsOpen', false);
        }
        if (InventoryAPI.GetItemAttributeValue(idCasket, 'modification date')) {
            UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_casket_operation.xml', 'op=add' +
                (cap ? '&nextcapability=' + cap : '') +
                '&spinner=1' +
                '&casket_item_id=' + idCasket +
                '&subject_item_id=' + idItem);
        }
        else {
            const fauxNameTag = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(1200, 0);
            const elPanel = UiToolkitAPI.ShowCustomLayoutPopup('', 'file://{resources}/layout/popups/popup_capability_nameable.xml');
            let oSettings = {
                item_id: idCasket,
                tool_id: fauxNameTag,
                work_type: 'nameable',
                async_work_type_warning_text: '#popup_newcasket_warning'
            };
            if (elPanel && elPanel.IsValid()) elPanel.Data().oSettings = oSettings;
        }
        ClosePopUp();
    }

    function ProceedForMultiStatusCapabilityPopup() {
        let capability = SelectItemForCapability.oCapabilityInfo.capability;
        let arrItemIDs = SelectItemForCapability.oCapabilityInfo.multiselectItemIdsArray;
        
        if (arrItemIDs.length <= 0)
            return;

        switch (capability) {
            case 'casketretrieve':
                {
                    let strItemIDs = arrItemIDs.join(",");
                    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_casket_operation.xml', 'op=remove' +
                        '&nextcapability=batch' +
                        '&spinner=1' +
                        '&casket_item_id=' + SelectItemForCapability.oCapabilityInfo.initialItemId +
                        '&subject_item_id=' + strItemIDs);
                    break;
                }
            case 'casketstore':
                {
                    let strItemIDs = arrItemIDs.join(",");
                    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_casket_operation.xml', 'op=add' +
                        '&nextcapability=batch' +
                        '&spinner=1' +
                        '&casket_item_id=' + SelectItemForCapability.oCapabilityInfo.initialItemId +
                        '&subject_item_id=' + strItemIDs);
                    break;
                }
            case 'delete':
                {
                    let strItemIDs = arrItemIDs.join(",");
                    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_casket_operation.xml', 'op=delete' +
                        '&nextcapability=batch' +
                        '&spinner=1' +
                        '&subject_item_id=' + strItemIDs);
                    break;
                }
        }
        ClosePopUp();
    }
    SelectItemForCapability.ProceedForMultiStatusCapabilityPopup = ProceedForMultiStatusCapabilityPopup;

    function _UpdateSelectItemForCapabilityPopup(capability, itemid, bSelected) {
        if (!SelectItemForCapability.oCapabilityInfo.popupVisible) return false;
        if (SelectItemForCapability.oCapabilityInfo.capability !== capability)
            return false;
        if (!itemid)
            return false;

        if (bSelected) {
            if (!SelectItemForCapability.oCapabilityInfo.multiselectItemIds.hasOwnProperty(itemid)) {
                SelectItemForCapability.oCapabilityInfo.multiselectItemIds[itemid] = bSelected;
                SelectItemForCapability.oCapabilityInfo.multiselectItemIdsArray.push(itemid);
            }
        } else {
            if (SelectItemForCapability.oCapabilityInfo.multiselectItemIds.hasOwnProperty(itemid)) {
                delete SelectItemForCapability.oCapabilityInfo.multiselectItemIds[itemid];
                let index = SelectItemForCapability.oCapabilityInfo.multiselectItemIdsArray.indexOf(itemid);
                if (index > -1) {
                    SelectItemForCapability.oCapabilityInfo.multiselectItemIdsArray.splice(index, 1);
                }
            } else {
                delete SelectItemForCapability.oCapabilityInfo.multiselectItemIds[itemid];
                let index = SelectItemForCapability.oCapabilityInfo.multiselectItemIdsArray.indexOf(itemid);
                if (index > -1) {
                    SelectItemForCapability.oCapabilityInfo.multiselectItemIdsArray.splice(index, 1);
                }
            }
        }

        _UpdateMultiSelectDisplay();
        return true;
    }

{
        _hUpdateEvent = $.RegisterForUnhandledEvent('UpdateSelectItemForCapabilityPopup', _UpdateSelectItemForCapabilityPopup);
        // Re-enable these so the UI close button and Escape key actually trigger ClosePopUp()
        $.RegisterEventHandler('UnreadyForDisplay', _m_cp, ClosePopUp);
        $.RegisterEventHandler('Cancelled', _m_cp, ClosePopUp);
    }
})(SelectItemForCapability || (SelectItemForCapability = {}));