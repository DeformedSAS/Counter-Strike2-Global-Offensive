"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="inspect.ts" />
/// <reference path="common/iteminfo.ts" />
/// <reference path="common/tint_spray_icon.ts" />
/// <reference path="common/formattext.ts" />
var LoadoutGrid;
(function (LoadoutGrid) {
    let m_hasRunFirstTime = false;
    let m_equipSlotChangedHandler;
    let m_setShuffleEnabledHandler;
    let m_inventoryUpdatedHandler;
    let m_selectedTeam;
    let m_mouseOverSlot;
    let m_elDragSource;
    let m_dragItemId;
    let m_filterItemId = '';
    let m_updatedFromShowItemInLoadout = false;
    let m_currentCharId = {
        t: '',
        ct: '',
        noteam: '',
    };
    let m_currentCharGlovesId = {
        t: '',
        ct: '',
        noteam: '',
    };
    let m_currentCharWeaponId = {
        t: '',
        ct: '',
        noteam: '',
    };
    let m_currentPetId = {
        t: '',
        ct: '',
        noteam: '',
    };
    const m_arrGenericCharacterGlobalSlots = [
        { slot: 'customplayer', category: 'customplayer' },
        { slot: 'clothing_hands', category: 'clothing' },
        { slot: 'melee', category: 'melee', equip_on_hover: true },
        { slot: 'equipment2', category: 'equipment2', equip_on_hover: true },
        { slot: 'c4', category: 'c4', required_team: 't', equip_on_hover: true },
        { slot: 'musickit', category: 'musickit' },
        { slot: 'flair0', category: 'flair0' },
        { slot: 'spray0', category: 'spray' },
    ];
    function _BCanFitIntoNonWeaponSlot(category, team) {
        return m_arrGenericCharacterGlobalSlots.find((entry) => { return entry.category === category && (!entry.required_team || (entry.required_team === team)); })
            ? true
            : false;
    }
    function _BIsSlotAndTeamConfigurationValid(slot, team) {
        return m_arrGenericCharacterGlobalSlots.find((entry) => { return entry.slot === slot && entry.required_team && (entry.required_team !== team); })
            ? false
            : true;
    }
    function OnReadyForDisplay() {
        if (!m_hasRunFirstTime) {
            m_hasRunFirstTime = true;
            Init();
        }
        else {
            FillOutRowItems('ct');
            FillOutRowItems('t');
            UpdateGridFilterIcons();
            UpdateGridShuffleIcons();
            UpdateItemList();
            UpdateCharModel('ct');
            UpdateCharModel('t');
            FillOutGridItems('ct');
            FillOutGridItems('t');
            m_updatedFromShowItemInLoadout = m_updatedFromShowItemInLoadout ? false : false;
        }
        m_equipSlotChangedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_Loadout_EquipSlotChanged', OnEquipSlotChanged);
        m_setShuffleEnabledHandler = $.RegisterForUnhandledEvent('PanoramaComponent_Loadout_SetShuffleEnabled', UpdateGridShuffleIcons);
        m_inventoryUpdatedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', () => {
            OnMyPersonaInventoryUpdated();
        });
    }
    function OnMyPersonaInventoryUpdated() {
        UpdateItemList();
        FillOutRowItems('ct');
        FillOutRowItems('t');
        UpdateCharModel('ct');
        UpdateCharModel('t');
    }
    function OnUnreadyForDisplay() {
        if (m_equipSlotChangedHandler) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_Loadout_EquipSlotChanged', m_equipSlotChangedHandler);
            m_equipSlotChangedHandler = null;
        }
        if (m_setShuffleEnabledHandler) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_Loadout_SetShuffleEnabled', m_setShuffleEnabledHandler);
            m_setShuffleEnabledHandler = null;
        }
        if (m_inventoryUpdatedHandler) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', m_inventoryUpdatedHandler);
            m_inventoryUpdatedHandler = null;
        }
        UiToolkitAPI.HideCustomLayoutTooltip('JsLoadoutItemTooltip');
    }
    function OnEquipSlotChanged(team, slot, oldItemId, newItemId, bNew) {
        if (team == 't' || team == 'ct') {
            FillOutGridItems(team);
            if (['melee', 'secondary', 'smg', 'rifle', 'c4', 'equipment2'].includes(InventoryAPI.GetLoadoutCategory(newItemId)))
                UpdateCharModel(team, newItemId);
            else
                UpdateCharModel(team);
        }
        FillOutRowItems('ct');
        FillOutRowItems('t');
        UpdateGridFilterIcons();
    }
    function Init() {
        UpdateCharModel('ct');
        UpdateCharModel('t');
        SetUpTeamSelectBtns();
        InitSortDropDown();
        UpdateGridShuffleIcons();
        $.DispatchEvent("Activated", $.GetContextPanel().FindChildInLayoutFile('id-loadout-select-team-btn-t'), "mouse");
        $.DispatchEvent("Activated", $.GetContextPanel().FindChildInLayoutFile('id-loadout-select-team-btn-ct'), "mouse");
        let elItemList = $('#id-loadout-item-list');
        elItemList.SetAttributeInt('DragScrollSpeedHorizontal', 0);
        elItemList.SetAttributeInt('DragScrollSpeedVertical', 0);
        RegisterGridItemEvents('ct');
        RegisterGridItemEvents('t');
    }
    function SetUpTeamSelectBtns() {
        let aSectionSuffexes = ['ct', 't'];
        for (let suffex of aSectionSuffexes) {
            let elSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + suffex);
            let elBtn = elSection.FindChildInLayoutFile('id-loadout-select-team-btn-' + suffex);
            elBtn.Data().team = suffex;
            ItemDragTargetEvents(elBtn);
            elBtn.SetPanelEvent('onactivate', ChangeSelectedTeam);
            elBtn.SetPanelEvent('onmouseover', () => { UiToolkitAPI.HideCustomLayoutTooltip('JsLoadoutItemTooltip'); });
        }
    }
    function ChangeSelectedTeam() {
        let suffex = (m_selectedTeam == 't' ? 'ct' : 't');
        let elSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + suffex);
        $.GetContextPanel().SetHasClass('loadout_t_selected', suffex === 't');
        elSection.FindChildInLayoutFile('id-loadout-grid-slots-' + suffex).hittest = true;
        let oppositeTeam = suffex === 't' ? 'ct' : 't';
        let elOppositeSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + oppositeTeam);
        elOppositeSection.FindChildInLayoutFile('id-loadout-grid-slots-' + oppositeTeam).hittest = false;
        m_selectedTeam = suffex;
        FillOutGridItems(m_selectedTeam);
        FillOutRowItems(m_selectedTeam);
        if (!_BIsSlotAndTeamConfigurationValid(GetSelectedGroup(), m_selectedTeam)) {
            let elGroupDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-group');
            elGroupDropdown.SetSelected('all');
        }
        else {
            UpdateFilters();
        }
        UiToolkitAPI.HideCustomLayoutTooltip('JsLoadoutItemTooltip');
        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.submenu_select', 'MOUSE');
    }
    function OnActivateSideItem(slotName, TeamName) {
        if (m_selectedTeam !== TeamName) {
            ChangeSelectedTeam();
            ToggleGroupDropdown(slotName, true);
        }
        else {
            ClearItemIdFilter();
            ToggleGroupDropdown(slotName, false);
        }
    }
    function UpdateCharModel(team, weaponId = '') {
        let elPanel = $.GetContextPanel().FindChildInLayoutFile('id-loadout-agent-' + team);
        if (!elPanel)
            return;
        let charId = LoadoutAPI.GetItemID(team, 'customplayer');
        let glovesId = LoadoutAPI.GetItemID(team, 'clothing_hands');
        const settings = ItemInfo.GetOrUpdateVanityCharacterSettings(charId);
        if (team == m_selectedTeam) {
            let selectedGroup = GetSelectedGroup();
            if (['melee', 'secondary0', 'c4', 'equipment2'].includes(selectedGroup)) {
                weaponId = LoadoutAPI.GetItemID(team, selectedGroup);
            }
            else if (['secondary', 'smg', 'rifle'].includes(selectedGroup)) {
                let selectedItemDef = GetSelectedItemDef();
                if (selectedItemDef != 'all') {
                    let itemDefIndex = InventoryAPI.GetItemDefinitionIndexFromDefinitionName(selectedItemDef);
                    if (LoadoutAPI.IsItemDefEquipped(team, itemDefIndex)) {
                        let slot = LoadoutAPI.GetSlotEquippedWithDefIndex(team, itemDefIndex);
                        weaponId = LoadoutAPI.GetItemID(team, slot);
                    }
                }
            }
        }
        if (!weaponId || weaponId == '0') {
            weaponId = m_currentCharWeaponId[team];
            if (!weaponId || weaponId == '0')
                weaponId = LoadoutAPI.GetItemID(team, 'melee');
        }
        if (charId != m_currentCharId[team] ||
            glovesId != m_currentCharGlovesId[team] ||
            weaponId != m_currentCharWeaponId[team]) {
            m_currentCharId[team] = charId;
            m_currentCharGlovesId[team] = glovesId;
            m_currentCharWeaponId[team] = weaponId;
            settings.panel = elPanel;
            settings.weaponItemId = weaponId;
            CharacterAnims.PlayAnimsOnPanel(settings);
        }
    }
    function FillOutGridItems(team) {
        let elSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + team);
        let elGrid = elSection.FindChildInLayoutFile('id-loadout-grid-slots-' + team);
        for (let column of elGrid.Children()) {
            let aPanels = column.Children().filter(panel => panel.GetAttributeString('data-slot', '') !== '');
            for (let i = 0; i < aPanels.length; i++) {
                if (column.GetAttributeString('data-slot', '') === 'equipment' ||
                    column.GetAttributeString('data-slot', '') === 'grenade') {
                    UpdateSlotItemImage(team, aPanels[i], true, false, true);
                }
                else {
                    UpdateSlotItemImage(team, aPanels[i], false, true);
                    UpdateName(aPanels[i]);
                    UpdateMoney(aPanels[i], team);
                    UpdateIsRentable(aPanels[i], team);
                }
            }
        }
    }
    function FillOutRowItems(team) {
        let elSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + team);
        let elRow = elSection.FindChildInLayoutFile('id-loadout-row-slots-' + team);
        for (let entry of m_arrGenericCharacterGlobalSlots) {
            if (entry.required_team && entry.required_team !== team)
                continue;
            let panelId = 'id-loadout-row-slots-' + entry.slot + '-' + team;
            let elBtn = elRow.FindChild(panelId);
            if (!elBtn) {
                elBtn = $.CreatePanel('ItemImage', elRow, panelId, {
                    class: 'loadout-model-panel__slot'
                });
                elBtn.SetAttributeString('data-slot', entry.slot);
            }
            let slotName = entry.slot;
            let itemid = LoadoutAPI.GetItemID(OverrideTeam(team, slotName), slotName);
            let useIconSlots = ['musickit', 'spray0', 'flair0'];
            let bUseIcon = useIconSlots.includes(slotName) && itemid === '0' ? true : false;
            UpdateSlotItemImage(team, elBtn, bUseIcon, true);
            if (itemid && itemid != '0' && elBtn) {
                elBtn.SetPanelEvent('oncontextmenu', () => {
                    let filterValue = '';
                    if (LoadoutAPI.IsShuffleEnabled(OverrideTeam(team, slotName), slotName))
                        filterValue = 'shuffle_slot_' + team;
                    else
                        filterValue = 'loadout_slot_' + team;
                    if (slotName === 'spray0')
                        filterValue += '&contextmenuparam=graffiti';
                    OpenContextMenu(elBtn, filterValue);
                });
                elBtn.SetPanelEvent('onmouseover', () => {
                    if (team == m_selectedTeam && entry.equip_on_hover)
                        UpdateCharModel(team, LoadoutAPI.GetItemID(team, slotName));
                    UiToolkitAPI.ShowCustomLayoutParametersTooltip(panelId, 'JsLoadoutItemTooltip', 'file://{resources}/layout/tooltips/tooltip_loadout_item.xml', 'itemid=' + elBtn.Data().itemid +
                        '&' + 'slot=' + slotName +
                        '&' + 'team=' + m_selectedTeam);
                });
                elBtn.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideCustomLayoutTooltip('JsLoadoutItemTooltip'); });
            }
            else {
                elBtn.ClearPanelEvent('oncontextmenu');
                elBtn.ClearPanelEvent('onmouseover');
                elBtn.ClearPanelEvent('onmouseout');
            }
            elBtn.SetPanelEvent('onactivate', () => OnActivateSideItem(slotName, team));
        }
    }
    function BTeamHasIconForSlot(team, slot) {
        return (team == "t" && slot == "equipment3") ? false : true;
    }
    function UpdateSlotItemImage(team, elPanel, bUseIcon, bReplacable, bIsEquipment = false) {
        let slot = elPanel.GetAttributeString('data-slot', '');
        team = OverrideTeam(team, slot);
        let itemImage = elPanel.FindChild('loudout-item-image-' + slot);
        let itemid = LoadoutAPI.GetItemID(team, slot);
        let elRarity = elPanel.FindChild('id-loadout-item-rarity');
        if (!itemImage) {
            itemImage = $.CreatePanel('ItemImage', elPanel, 'loudout-item-image-' + slot, {
                class: 'loadout-slot__image'
            });
            if (slot === 'spray0') {
                itemImage.SetAttributeInt('ItemInventoryImagePurpose', 1);
            }
            if (!bUseIcon) {
                elRarity = $.CreatePanel('Panel', elPanel, 'id-loadout-item-rarity', {
                    class: 'loadout-slot-rarity'
                });
            }
            if (bReplacable) {
                $.CreatePanel('Image', elPanel, 'id-loadout-item-filter-icon', {
                    class: 'loadout-slot-filter-icon'
                });
                let elShuffleIcon = $.CreatePanel('Image', elPanel, 'id-loadout-item-shuffle-icon', {
                    class: 'loadout-slot-shuffle-icon'
                });
                elShuffleIcon.visible = LoadoutAPI.IsShuffleEnabled(team, slot);
            }
        }
        itemImage.SetHasClass('loadout-slot__image', !bUseIcon);
        itemImage.SetHasClass('loadout-slot-svg__image', bUseIcon);
        if (!bIsEquipment) {
            TintSprayImage(itemImage, itemid);
        }
        if (bUseIcon && BTeamHasIconForSlot(team, slot)) {
            itemImage.itemid = '';
            itemImage.SetImage('file://{images}/icons/equipment/' + GetDefName(itemid, slot) + '.svg');
        }
        else {
            itemImage.itemid = itemid;
        }
        if (LoadoutAPI.IsShuffleEnabled(team, slot)) {
            let sShuffleIds = GetShuffleItems(team, slot);
            let elContainer = elPanel.FindChild('loudout-item-image-' + slot + '-shuffle');
            if (!elContainer) {
                elContainer = $.CreatePanel('Panel', elPanel, 'loudout-item-image-' + slot + '-shuffle', {});
            }
            for (let element of sShuffleIds) {
                $.CreatePanel('ItemImage', elContainer, 'loudout-item-image-' + slot, {
                    class: 'loadout-slot__image'
                });
            }
        }
        elPanel.Data().itemid = itemid;
        elPanel.Data().visuals_itemid = itemid;
        if (slot === 'spray0') {
            elPanel.Data().visuals_itemid = ItemInfo.GetFauxReplacementItemID(itemid, 'graffiti');
        }
        let color = InventoryAPI.GetItemRarityColor(itemid);
        if (elRarity) {
            elRarity.visible = color ? true : false;
            if (color)
                elRarity.style.backgroundColor = color;
            return;
        }
    }
    function TintSprayImage(itemImage, itemId) {
        TintSprayIcon.CheckIsSprayAndTint(itemId, itemImage);
    }
    function UpdateName(elPanel) {
        let elName = elPanel.FindChild('id-loadout-item-name');
        if (!elName) {
            elName = $.CreatePanel('Label', elPanel, 'id-loadout-item-name', {
                class: 'loadout-slot__name stratum-regular',
                text: '{s:item-name}'
            });
        }
        elPanel.SetDialogVariable('item-name', $.Localize(InventoryAPI.GetItemBaseName(elPanel.Data().visuals_itemid)));
    }
    function UpdateMoney(elPanel, team) {
        let elMoney = elPanel.FindChild('id-loadout-item-money');
        if (!elMoney) {
            elMoney = $.CreatePanel('Label', elPanel, 'id-loadout-item-money', {
                class: 'loadout-slot__money stratum-regular',
                text: '{d:money}'
            });
        }
        elPanel.SetDialogVariableInt('money', LoadoutAPI.GetItemGamePrice(team, elPanel.GetAttributeString('data-slot', '')));
        elMoney.text = $.Localize("#buymenu_money", elPanel);
    }
    function GetDefName(itemid, slot) {
        let defName = InventoryAPI.GetItemDefinitionName(itemid);
        let aDefName = [];
        if (slot === 'clothing_hands' || slot === 'melee' || slot === 'customplayer' || itemid === '0') {
            return slot;
        }
        else {
            aDefName = defName ? defName.split('_') : [];
            return aDefName[1];
        }
    }
    function UpdateIsRentable(elPanel, team) {
        let elLabel = elPanel.FindChild('id-loadout-item-is-rentable');
        if (!elLabel) {
            elLabel = $.CreatePanel('Label', elPanel, 'id-loadout-item-is-rentable', {
                html: 'true',
                class: 'item-tile__rental-expiration stratum-regular-italic',
                text: '#item-rental-time-remaining'
            });
        }
        let slot = elPanel.GetAttributeString('data-slot', '');
        let itemId = LoadoutAPI.GetItemID(team, slot);
        if (!InventoryAPI.IsRental(itemId)) {
            elLabel.AddClass('hide');
            return;
        }
        let expirationDate = InventoryAPI.GetExpirationDate(itemId);
        if (expirationDate <= 0) {
            elLabel.AddClass('hide');
            return;
        }
        let oLocData = FormatText.FormatRentalTime(expirationDate);
        elLabel.SetHasClass('item-expired', oLocData.isExpired);
        elLabel.SetDialogVariable('time-remaining', oLocData.time);
        elLabel.text = $.Localize(oLocData.locString, elLabel);
        elLabel.RemoveClass('hide');
    }
    function OverrideTeam(team, slot) {
        let noteamSlots = ['musickit', 'spray0', 'flair0'];
        return noteamSlots.includes(slot) ? 'noteam' : team;
    }
    function LoadoutSlotItemTileEvents(elPanel) {
        elPanel.SetPanelEvent('onactivate', () => {
            ClearItemIdFilter();
            FilterByItemType(elPanel.Data().itemid, true);
        });
        elPanel.SetPanelEvent('onmouseover', () => {
            m_mouseOverSlot = elPanel.GetAttributeString('data-slot', '');
            UpdateCharModel(m_selectedTeam, LoadoutAPI.GetItemID(m_selectedTeam, m_mouseOverSlot));
            UiToolkitAPI.ShowCustomLayoutParametersTooltip('loudout-item-image-' + m_mouseOverSlot, 'JsLoadoutItemTooltip', 'file://{resources}/layout/tooltips/tooltip_loadout_item.xml', 'itemid=' + elPanel.Data().itemid +
                '&' + 'slot=' + m_mouseOverSlot +
                '&' + 'team=' + m_selectedTeam +
                '&' + 'nameonly=' + 'true');
        });
        elPanel.SetPanelEvent('onmouseout', () => {
            m_mouseOverSlot = '';
            elPanel.SetPanelEvent('onmouseout', () => { UiToolkitAPI.HideCustomLayoutTooltip('JsLoadoutItemTooltip'); });
        });
        elPanel.SetPanelEvent('oncontextmenu', () => {
            let slot = elPanel.GetAttributeString('data-slot', '');
            let filterValue = '';
            if (LoadoutAPI.IsShuffleEnabled(m_selectedTeam, slot))
                filterValue = 'shuffle_slot_' + m_selectedTeam;
            else
                filterValue = 'loadout_slot_' + m_selectedTeam;
            if (slot === 'spray0')
                filterValue += '&contextmenuparam=graffiti';
            OpenContextMenu(elPanel, filterValue);
        });
        elPanel.SetDraggable(true);
        $.RegisterEventHandler('DragStart', elPanel, (elPanel, drag) => {
            if (m_mouseOverSlot !== null) {
                let itemid = LoadoutAPI.GetItemID(m_selectedTeam, m_mouseOverSlot);
                let bShuffle = LoadoutAPI.IsShuffleEnabled(m_selectedTeam, m_mouseOverSlot);
                OnDragStart(elPanel, drag, itemid, bShuffle);
            }
        });
        $.RegisterEventHandler('DragEnd', elPanel, (elRadial, elDragImage) => {
            OnDragEnd(elDragImage);
        });
    }
    function OpenContextMenu(elPanel, filterValue) {
        UiToolkitAPI.HideCustomLayoutTooltip('JsLoadoutItemTooltip');
        let filterForContextMenuEntries = '&populatefiltertext=' + filterValue;
        let contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('', '', 'file://{resources}/layout/context_menus/context_menu_inventory_item.xml', 'itemid=' + elPanel.Data().itemid + filterForContextMenuEntries, () => { });
        contextMenuPanel.AddClass("ContextMenu_NoArrow");
    }
    function ItemDragTargetEvents(elPanel) {
        $.RegisterEventHandler('DragEnter', elPanel, () => {
            elPanel.AddClass('loadout-drag-enter');
            m_mouseOverSlot = elPanel.GetAttributeString('data-slot', '');
        });
        $.RegisterEventHandler('DragLeave', elPanel, () => {
            elPanel.RemoveClass('loadout-drag-enter');
            m_mouseOverSlot = '';
        });
        $.RegisterEventHandler('DragDrop', elPanel, (dispayId, elDragImage) => {
            OnDragDrop(elPanel, elDragImage);
        });
    }
    function OnDragStart(elDragSource, drag, itemid, bShuffle) {
        let elDragImage = $.CreatePanel('ItemImage', $.GetContextPanel(), '', {
            class: 'loadout-drag-icon',
            textureheight: '128',
            texturewidth: '128'
        });
        elDragImage.itemid = itemid;
        elDragImage.Data().bShuffle = bShuffle;
        TintSprayImage(elDragImage, itemid);
        drag.displayPanel = elDragImage;
        drag.offsetX = 96;
        drag.offsetY = 64;
        drag.removePositionBeforeDrop = false;
        elDragImage.AddClass('drag-start');
        m_elDragSource = elDragSource;
        m_elDragSource.AddClass('dragged-away');
        m_dragItemId = itemid;
        UpdateValidDropTargets();
        let elItemList = $('#id-loadout-item-list');
        elItemList.hittest = false;
        elItemList.hittestchildren = false;
        $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.inventory_item_pickup', 'MOUSE');
    }
    function OnDragEnd(elDragImage) {
        elDragImage.DeleteAsync(0.1);
        elDragImage.AddClass('drag-end');
        m_elDragSource.RemoveClass('dragged-away');
        m_dragItemId = '';
        UpdateValidDropTargets();
        let elItemList = $('#id-loadout-item-list');
        elItemList.hittest = true;
        elItemList.hittestchildren = true;
    }
    function OnDragDrop(elPanel, elDragImage) {
        let newSlot = elPanel.GetAttributeString('data-slot', '');
        if (newSlot !== null) {
            if (newSlot === 'side_slots' && m_selectedTeam === elPanel.GetAttributeString('data-team', '')) {
                let itemId = elDragImage.itemid;
                let bShuffle = elDragImage.Data().bShuffle;
                if (ItemInfo.IsSpraySealed(itemId)) {
                    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_capability_decodable.xml', 'key-and-case=,' + itemId +
                        '&' + 'asyncworktype=decodeable');
                }
                else {
                    let category = InventoryAPI.GetLoadoutCategory(itemId);
                    if (_BCanFitIntoNonWeaponSlot(category, m_selectedTeam)) {
                        let slot = category === 'spray' ? 'spray0' : category === 'clothing' ? 'clothing_hands' : category;
                        let team = OverrideTeam(m_selectedTeam, slot);
                        let elRow = $.GetContextPanel().FindChildInLayoutFile('id-loadout-row-slots-' + m_selectedTeam);
                        let elItemPanel = elRow.FindChildInLayoutFile('id-loadout-row-slots-' + slot + '-' + m_selectedTeam);
                        let isSameId = elDragImage.itemid === elItemPanel.Data().itemid ? true : false;
                        let equipSuccess = TryEquipItemInSlot(team, itemId, slot);
                        PlayDropSounds(equipSuccess, isSameId);
                        if (equipSuccess && bShuffle) {
                            LoadoutAPI.SetShuffleEnabled(team, slot, true);
                        }
                    }
                }
                return;
            }
            let canEquip = LoadoutAPI.CanEquipItemInSlot(m_selectedTeam, elDragImage.itemid, newSlot);
            if (canEquip) {
                let itemId = elDragImage.itemid;
                let bShuffle = elDragImage.Data().bShuffle;
                if (InventoryAPI.IsValidItemID(itemId)) {
                    let itemDefIndex = InventoryAPI.GetItemDefinitionIndex(itemId);
                    let oldSlot = LoadoutAPI.GetSlotEquippedWithDefIndex(m_selectedTeam, itemDefIndex);
                    let isSameId = elDragImage.itemid === elPanel.Data().itemid ? true : false;
                    let equipSuccess = TryEquipItemInSlot(m_selectedTeam, itemId, newSlot);
                    PlayDropSounds(equipSuccess, isSameId);
                    if (equipSuccess && bShuffle) {
                        LoadoutAPI.SetShuffleEnabled(m_selectedTeam, newSlot, true);
                    }
                    elPanel.TriggerClass('drop-target');
                    $.Schedule(.5, () => { if (elPanel) {
                        elPanel.RemoveClass('drop-target');
                    } });
                    elPanel.hittestchildren = false;
                    $.Schedule(1, () => { elPanel.hittestchildren = true; });
                    let oldTile = FindGridTile(oldSlot);
                    if (oldTile) {
                        oldTile.AddClass('old-item-slot');
                        $.Schedule(.5, () => { if (oldTile) {
                            oldTile.RemoveClass('old-item-slot');
                        } });
                    }
                }
            }
        }
    }
    function PlayDropSounds(equipSuccess, isSameId) {
        if (equipSuccess && !isSameId) {
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.inventory_item_putdown', 'MOUSE');
        }
        else {
            $.DispatchEvent('CSGOPlaySoundEffect', 'UIPanorama.inventory_item_notequipped', 'MOUSE');
        }
    }
    const m_aActiveUsedColumns = [
        'id-loadout-column1',
        'id-loadout-column2',
        'id-loadout-column3',
    ];
    function UpdateValidDropTargets() {
        if (m_dragItemId && InventoryAPI.IsValidItemID(m_dragItemId)) {
            let category = InventoryAPI.GetLoadoutCategory(m_dragItemId);
            if (!category || _BCanFitIntoNonWeaponSlot(category, m_selectedTeam)) {
                let elBtn = $.GetContextPanel().FindChildInLayoutFile('id-loadout-agent-' + m_selectedTeam);
                elBtn.SetHasClass('loadout-valid-target', true);
                return;
            }
        }
        let aSectionSuffexes = ['ct', 't'];
        for (let suffex of aSectionSuffexes) {
            let elBtn = $.GetContextPanel().FindChildInLayoutFile('id-loadout-agent-' + suffex);
            elBtn.SetHasClass('loadout-valid-target', false);
        }
        let elSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + m_selectedTeam);
        let elGrid = elSection.FindChildInLayoutFile('id-loadout-grid-slots-' + m_selectedTeam);
        for (let columnId of m_aActiveUsedColumns) {
            let elColumn = elGrid.FindChildInLayoutFile(columnId);
            for (let elPanel of elColumn.Children()) {
                let slot = elPanel.GetAttributeString('data-slot', '');
                let canEquip = LoadoutAPI.CanEquipItemInSlot(m_selectedTeam, m_dragItemId, slot);
                elPanel.SetHasClass('loadout-valid-target', canEquip);
            }
        }
    }
    function FindGridTile(oldSlot) {
        let elGrid = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-slots-' + m_selectedTeam);
        {
            for (let columnId of m_aActiveUsedColumns) {
                let elColumn = elGrid.FindChildInLayoutFile(columnId);
                for (let elPanel of elColumn.Children()) {
                    let slot = elPanel.GetAttributeString('data-slot', '');
                    if (slot === oldSlot) {
                        return elPanel;
                    }
                }
            }
        }
        return null;
    }
    function InitSortDropDown() {
        let elDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-sort');
        let count = InventoryAPI.GetSortMethodsCount();
        for (let i = 0; i < count; i++) {
            let id = InventoryAPI.GetSortMethodByIndex(i);
            let newEntry = $.CreatePanel('Label', elDropdown, id, { class: 'DropDownMenu' });
            newEntry.text = $.Localize('#' + id);
            elDropdown.AddOption(newEntry);
        }
        elDropdown.SetSelected(GameInterfaceAPI.GetSettingString("cl_loadout_saved_sort"));
    }
    function UpdateFilters() {
        let group = GetSelectedGroup();
        if (!_BIsSlotAndTeamConfigurationValid(group, m_selectedTeam)) {
            $.DispatchEvent("Activated", $.GetContextPanel().FindChildInLayoutFile('id-loadout-select-team-btn-t'), "mouse");
            return;
        }
        let elClearBtn = $.GetContextPanel().FindChildInLayoutFile('id-loadout-clear-filters');
        elClearBtn.visible = (group != 'all' || m_filterItemId !== '');
        let itemDefNames = null;
        if (['secondary', 'smg', 'rifle'].includes(group)) {
            itemDefNames = JSON.parse(LoadoutAPI.GetGroupItemDefNames(m_selectedTeam, group));
            itemDefNames.sort();
        }
        let elItemDefDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-itemdef');
        if (itemDefNames) {
            let prevSelected = GetSelectedItemDef();
            elItemDefDropdown.RemoveAllOptions();
            {
                let elOption = $.CreatePanel('Label', elItemDefDropdown, 'all', { class: 'DropDownMenu' });
                elOption.text = $.Localize('#inv_filter_all_' + group);
                elItemDefDropdown.AddOption(elOption);
            }
            let itemDefNames = JSON.parse(LoadoutAPI.GetGroupItemDefNames(m_selectedTeam, group)).sort();
            for (let itemDefName of itemDefNames) {
                let itemDefIndex = InventoryAPI.GetItemDefinitionIndexFromDefinitionName(itemDefName);
                let itemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(itemDefIndex, 0);
                let elOption = $.CreatePanel('Label', elItemDefDropdown, itemDefName, { class: 'DropDownMenu' });
                elOption.text = $.Localize(InventoryAPI.GetItemBaseName(itemId));
                elItemDefDropdown.AddOption(elOption);
                ;
            }
            elItemDefDropdown.visible = true;
            if (elItemDefDropdown.HasOption(prevSelected))
                elItemDefDropdown.SetSelected(prevSelected);
            else
                elItemDefDropdown.SetSelected('all');
        }
        else {
            elItemDefDropdown.visible = false;
            elItemDefDropdown.SetSelected('all');
            UpdateItemList();
        }
        UpdateGridFilterIcons();
    }
    LoadoutGrid.UpdateFilters = UpdateFilters;
    function UpdateItemList() {
        let loadoutSlotParams = m_selectedTeam;
        let group = GetSelectedGroup();
        loadoutSlotParams += ',flexible_loadout_group:' + (group == 'all' ? 'any' : group);
        let elItemDefDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-itemdef');
        if (elItemDefDropdown.visible) {
            let itemDefName = GetSelectedItemDef();
            if (itemDefName != 'all')
                loadoutSlotParams += ',item_definition:' + itemDefName;
        }
        let elSortDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-sort');
        let sortType = elSortDropdown.GetSelected().id;
        if (GameInterfaceAPI.GetSettingString("cl_loadout_saved_sort") != sortType) {
            GameInterfaceAPI.SetSettingString("cl_loadout_saved_sort", sortType);
            GameInterfaceAPI.ConsoleCommand("host_writeconfig");
        }
        if (m_filterItemId !== '' &&
            InventoryAPI.IsValidItemID(m_filterItemId) &&
            group === InventoryAPI.GetRawDefinitionKey(m_filterItemId, 'flexible_loadout_group') &&
            m_updatedFromShowItemInLoadout) {
            loadoutSlotParams += ',item_id:' + m_filterItemId;
        }
        else if (m_filterItemId) {
            ClearItemIdFilter();
        }
        let elItemList = $.GetContextPanel().FindChildInLayoutFile('id-loadout-item-list');
        $.DispatchEvent('SetInventoryFilter', elItemList, 'any', 'any', 'any', sortType, loadoutSlotParams, '');
        UpdateGridFilterIcons();
        ShowHideItemFilterText(m_filterItemId != '');
    }
    LoadoutGrid.UpdateItemList = UpdateItemList;
    function ClearFilters() {
        let elGroupDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-group');
        if ($.GetContextPanel().FindChildInLayoutFile('id-loadout-clear-filters-label').visible) {
            ShowHideItemFilterText(false);
            ClearItemIdFilter();
            UpdateItemList();
            return;
        }
        elGroupDropdown.SetSelected('all');
    }
    LoadoutGrid.ClearFilters = ClearFilters;
    function ShowHideItemFilterText(bShow) {
        $.GetContextPanel().FindChildInLayoutFile('id-loadout-clear-filters-label').visible = bShow;
    }
    function FilterByItemType(itemId, bToggle = false) {
        let group = InventoryAPI.GetRawDefinitionKey(itemId, 'flexible_loadout_group');
        let elGroupDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-group');
        let elItemDefDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-itemdef');
        if (bToggle && GetSelectedGroup() == group && !elItemDefDropdown.visible) {
            elGroupDropdown.SetSelected('all');
            return;
        }
        elGroupDropdown.SetSelected(group);
        if (elItemDefDropdown.visible) {
            let itemDefName = InventoryAPI.GetItemDefinitionName(itemId);
            if (bToggle && GetSelectedItemDef() == itemDefName)
                elItemDefDropdown.SetSelected('all');
            else
                elItemDefDropdown.SetSelected(itemDefName);
        }
    }
    function ToggleGroupDropdown(group, bDisallowToggle = false) {
        let elGroupDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-group');
        let elItemDefDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-itemdef');
        if (GetSelectedGroup() == group && !bDisallowToggle) {
            if (GetSelectedItemDef() != 'all')
                elItemDefDropdown.SetSelected('all');
            else
                elGroupDropdown.SetSelected('all');
        }
        else {
            elGroupDropdown.SetSelected(group);
            if (elItemDefDropdown.visible)
                elItemDefDropdown.SetSelected('all');
        }
    }
    LoadoutGrid.ToggleGroupDropdown = ToggleGroupDropdown;
    function OnItemTileLoaded(elItemTile) {
        elItemTile.SetPanelEvent('onactivate', () => { });
        elItemTile.SetDraggable(true);
        $.RegisterEventHandler('DragStart', elItemTile, (elItemTile, drag) => {
            $.DispatchEvent('CSGOInventoryHideTooltip');
            OnDragStart(elItemTile, drag, elItemTile.GetAttributeString('itemid', '0'), false);
        });
        $.RegisterEventHandler('DragEnd', elItemTile, (elItemTile, elDragImage) => {
            OnDragEnd(elDragImage);
        });
    }
    function ShowLoadoutForItem(itemId) {
        if (!DoesItemTeamMatchTeamRequired(m_selectedTeam, itemId)) {
            ChangeSelectedTeam();
        }
        m_filterItemId = itemId;
        m_updatedFromShowItemInLoadout = true;
        let elClearBtn = $.GetContextPanel().FindChildInLayoutFile('id-loadout-clear-filters');
        elClearBtn.SetDialogVariable('item_name', InventoryAPI.GetItemName(m_filterItemId));
        ShowHideItemFilterText(true);
        FilterByItemType(itemId);
    }
    function ClearItemIdFilter() {
        m_filterItemId = m_filterItemId !== '' ? '' : '';
    }
    function DoesItemTeamMatchTeamRequired(team, id) {
        if (team === 't') {
            return ItemInfo.IsItemT(id) || ItemInfo.IsItemAnyTeam(id);
        }
        if (team === 'ct') {
            return ItemInfo.IsItemCt(id) || ItemInfo.IsItemAnyTeam(id);
        }
        return false;
    }
    function UpdateGridFilterIcons() {
        let selectedGroup = GetSelectedGroup();
        let selectedItemDef = GetSelectedItemDef();
        let elGrid = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-slots-' + m_selectedTeam);
        if (elGrid) {
            for (let group of ['secondary0', 'secondary', 'smg', 'rifle']) {
                let btn = elGrid.FindChildInLayoutFile('id-loadout-btn-' + group);
                if (btn) {
                    btn.checked = (group == selectedGroup && (!selectedItemDef || selectedItemDef == 'all'));
                }
            }
            for (let columnId of m_aActiveUsedColumns) {
                let elColumn = elGrid.FindChildInLayoutFile(columnId);
                for (let elPanel of elColumn.Children()) {
                    let elFilterIcon = elPanel.FindChildInLayoutFile('id-loadout-item-filter-icon');
                    if (elFilterIcon) {
                        let slot = elPanel.GetAttributeString('data-slot', '');
                        let itemId = LoadoutAPI.GetItemID(m_selectedTeam, slot);
                        let itemDef = InventoryAPI.GetItemDefinitionName(itemId);
                        elFilterIcon.visible = (itemDef == selectedItemDef);
                    }
                }
            }
        }
        for (let team of ['ct', 't']) {
            let elSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + team);
            let elRow = elSection.FindChildInLayoutFile('id-loadout-row-slots-' + team);
            for (let elPanel of elRow.Children()) {
                let elFilterIcon = elPanel.FindChildInLayoutFile('id-loadout-item-filter-icon');
                if (elFilterIcon) {
                    if (team == m_selectedTeam) {
                        let slot = elPanel.GetAttributeString('data-slot', '');
                        elFilterIcon.visible = (slot == selectedGroup);
                    }
                    else {
                        elFilterIcon.visible = false;
                    }
                }
            }
        }
        UpdateCharModel(m_selectedTeam);
    }
    function UpdateGridShuffleIcons() {
        let elGrid = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-slots-' + m_selectedTeam);
        if (elGrid) {
            for (let columnId of m_aActiveUsedColumns) {
                let elColumn = elGrid.FindChildInLayoutFile(columnId);
                for (let elPanel of elColumn.Children()) {
                    let elShuffleIcon = elPanel.FindChildInLayoutFile('id-loadout-item-shuffle-icon');
                    if (elShuffleIcon) {
                        let slot = elPanel.GetAttributeString('data-slot', '');
                        elShuffleIcon.visible = LoadoutAPI.IsShuffleEnabled(OverrideTeam(m_selectedTeam, slot), slot);
                    }
                }
            }
        }
        for (let team of ['ct', 't']) {
            let elSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + team);
            let elRow = elSection.FindChildInLayoutFile('id-loadout-row-slots-' + team);
            for (let elPanel of elRow.Children()) {
                let elShuffleIcon = elPanel.FindChildInLayoutFile('id-loadout-item-shuffle-icon');
                if (elShuffleIcon) {
                    let slot = elPanel.GetAttributeString('data-slot', '');
                    elShuffleIcon.visible = LoadoutAPI.IsShuffleEnabled(OverrideTeam(team, slot), slot);
                }
            }
        }
    }
    function GetSelectedGroup() {
        let elDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-group');
        return (elDropdown?.visible ? elDropdown.GetSelected()?.id : null) ?? 'all';
    }
    function GetSelectedItemDef() {
        let elDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-itemdef');
        return (elDropdown?.visible ? elDropdown.GetSelected()?.id : null) ?? 'all';
    }
    function GetShuffleItems(team, slot) {
        return JSON.parse(LoadoutAPI.GetShuffleItems(team, slot));
    }
    function RegisterGridItemEvents(team) {
        let elSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + team);
        let elGrid = elSection.FindChildInLayoutFile('id-loadout-grid-slots-' + team);
        for (let column of elGrid.Children()) {
            let aPanels = column.Children().filter(panel => panel.GetAttributeString('data-slot', '') !== '');
            for (let i = 0; i < aPanels.length; i++) {
                if (column.GetAttributeString('data-slot', '') !== 'equipment' &&
                    column.GetAttributeString('data-slot', '') !== 'grenade') {
                    LoadoutSlotItemTileEvents(aPanels[i]);
                    ItemDragTargetEvents(aPanels[i]);
                }
            }
        }
    }
    function TryEquipItemInSlot(szTeam, szItemID, szSlot) {
        let bSuccess = LoadoutAPI.EquipItemInSlot(szTeam, szItemID, szSlot);
        if (!bSuccess && LoadoutAPI.CanEquipItemInSlot(szTeam, szItemID, szSlot)) {
            UiToolkitAPI.ShowGenericPopupOk($.Localize('#LoadoutLockedPopupTitle'), $.Localize('#LoadoutLockedPopupText'), '', () => { });
        }
        return bSuccess;
    }
    {
        $.RegisterEventHandler('ReadyForDisplay', $.GetContextPanel(), OnReadyForDisplay);
        $.RegisterEventHandler('UnreadyForDisplay', $.GetContextPanel(), OnUnreadyForDisplay);
        $.RegisterForUnhandledEvent('LoadoutFilterByItemType', FilterByItemType);
        $.RegisterEventHandler('CSGOInventoryItemLoaded', $.GetContextPanel(), OnItemTileLoaded);
        $.RegisterForUnhandledEvent('ShowLoadoutForItem', ShowLoadoutForItem);
    }
})(LoadoutGrid || (LoadoutGrid = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9hZG91dF9ncmlkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vY29udGVudC9jc2dvL3Bhbm9yYW1hL3NjcmlwdHMvbG9hZG91dF9ncmlkLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxrQ0FBa0M7QUFDbEMsbUNBQW1DO0FBQ25DLDJDQUEyQztBQUMzQyxrREFBa0Q7QUFDbEQsNkNBQTZDO0FBRTdDLElBQVUsV0FBVyxDQTIyQ3BCO0FBMzJDRCxXQUFVLFdBQVc7SUFFcEIsSUFBSSxpQkFBaUIsR0FBRyxLQUFLLENBQUM7SUFDOUIsSUFBSSx5QkFBd0MsQ0FBQztJQUM3QyxJQUFJLDBCQUF5QyxDQUFDO0lBQzlDLElBQUkseUJBQXdDLENBQUM7SUFDN0MsSUFBSSxjQUEwQixDQUFDO0lBQy9CLElBQUksZUFBdUIsQ0FBQztJQUM1QixJQUFJLGNBQXVCLENBQUM7SUFDNUIsSUFBSSxZQUFvQixDQUFDO0lBQ3pCLElBQUksY0FBYyxHQUFXLEVBQUUsQ0FBQztJQUNoQyxJQUFJLDhCQUE4QixHQUFZLEtBQUssQ0FBQztJQUVwRCxJQUFJLGVBQWUsR0FBRztRQUNyQixDQUFDLEVBQUUsRUFBRTtRQUNMLEVBQUUsRUFBRSxFQUFFO1FBQ04sTUFBTSxFQUFFLEVBQUU7S0FDVixDQUFDO0lBRUYsSUFBSSxxQkFBcUIsR0FBRztRQUMzQixDQUFDLEVBQUUsRUFBRTtRQUNMLEVBQUUsRUFBRSxFQUFFO1FBQ04sTUFBTSxFQUFFLEVBQUU7S0FDVixDQUFDO0lBRUYsSUFBSSxxQkFBcUIsR0FBRztRQUMzQixDQUFDLEVBQUUsRUFBRTtRQUNMLEVBQUUsRUFBRSxFQUFFO1FBQ04sTUFBTSxFQUFFLEVBQUU7S0FDVixDQUFDO0lBR0YsSUFBSSxjQUFjLEdBQUc7UUFDcEIsQ0FBQyxFQUFFLEVBQUU7UUFDTCxFQUFFLEVBQUUsRUFBRTtRQUNOLE1BQU0sRUFBRSxFQUFFO0tBQ1YsQ0FBQztJQUlGLE1BQU0sZ0NBQWdDLEdBQUc7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