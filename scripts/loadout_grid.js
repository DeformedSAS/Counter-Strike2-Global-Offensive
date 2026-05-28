// this script was fixed by google's gemini by combining both loadout.js and loadout_grid.js, expect jank but it works..

"use strict";

var LoadoutGrid = ( function() {
    let m_hasRunFirstTime = false;
    let m_equipSlotChangedHandler = null;
    let m_setShuffleEnabledHandler = null;
    let m_inventoryUpdatedHandler = null;
    let m_selectedTeam = 'ct';
    let m_mouseOverSlot = '';
    let m_elDragSource = null;
    let m_dragItemId = '';
    let m_filterItemId = '';
    let m_updatedFromShowItemInLoadout = false;

    let m_currentCharId = { t: '', ct: '', noteam: '' };
    let m_currentCharGlovesId = { t: '', ct: '', noteam: '' };
    let m_currentCharWeaponId = { t: '', ct: '', noteam: '' };

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

    const m_aActiveUsedColumns = [
        'id-loadout-column1',
        'id-loadout-column2',
        'id-loadout-column3',
        'id-loadout-column4',
    ];

    function OnReadyForDisplay() {
        if (!m_hasRunFirstTime) {
            m_hasRunFirstTime = true;
            Init();
        } else {
            FillOutRowItems('ct');
            FillOutRowItems('t');
            UpdateGridFilterIcons();
            UpdateGridShuffleIcons();
            UpdateItemList();
            UpdateCharModel('ct');
            UpdateCharModel('t');
            FillOutGridItems('ct');
            FillOutGridItems('t');
            m_updatedFromShowItemInLoadout = true;
        }

        if (!m_inventoryUpdatedHandler) {
            m_inventoryUpdatedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', OnMyPersonaInventoryUpdated);
        }
    }

    function OnMyPersonaInventoryUpdated() {
        UpdateItemList();
        FillOutRowItems('ct');
        FillOutRowItems('t');
        UpdateCharModel('ct');
        UpdateCharModel('t');
    }

    function OnUnreadyForDisplay() {
        if (m_inventoryUpdatedHandler) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', m_inventoryUpdatedHandler);
            m_inventoryUpdatedHandler = null;
        }
        UiToolkitAPI.HideCustomLayoutTooltip('JsLoadoutItemTooltip');
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

function ChangeSelectedTeamOverride(team) {
    let teamToSelect = team;
    if (m_selectedTeam === team) {
        teamToSelect = (team === 't' ? 'ct' : 't');
    }
    
    m_selectedTeam = teamToSelect;
    $.GetContextPanel().SetHasClass('loadout_t_selected', m_selectedTeam === 't');

    ['ct', 't'].forEach(t => {
        let elSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + t);
        if (elSection) {
            elSection.SetHasClass('hidden', t !== m_selectedTeam);
            let elSlots = elSection.FindChildInLayoutFile('id-loadout-grid-slots-' + t);
            if (elSlots) {
                elSlots.hittest = (t === m_selectedTeam);
                elSlots.hittestchildren = (t === m_selectedTeam);
            }
        }
    });

    FillOutGridItems(m_selectedTeam);
    FillOutRowItems(m_selectedTeam);

    // --- REPAIRED FILTER LOGIC ---
    // 1. Get the dropdown panel
    let elGroupDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-group');
    
    // 2. Validate if the currently selected group makes sense for the new team
    if (typeof _BIsSlotAndTeamConfigurationValid !== 'undefined') {
        if (!_BIsSlotAndTeamConfigurationValid(GetSelectedGroup(), m_selectedTeam)) {
            // Reset to 'all' if the previous filter is invalid for the new team
            if (elGroupDropdown) elGroupDropdown.SetSelected('all');
        }
    }

    // 3. CRITICAL: Force the inventory to rebuild its list for the new team
    // This is what 'ClearFilters' does internally.
    if (typeof UpdateFilters === 'function') {
        UpdateFilters(); 
    }
    
    // 4. Update the character model last to reflect the team change
    if (typeof UpdateCharModel === 'function') {
        UpdateCharModel(m_selectedTeam);
    }

    UiToolkitAPI.HideCustomLayoutTooltip('JsLoadoutItemTooltip');
    $.DispatchEvent('PlaySoundEffect', 'UIPanorama.submenu_select', 'MOUSE');
}

    function SetUpTeamSelectBtns() {
        ['ct', 't'].forEach(team => {
            let elSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + team);
            if (!elSection) return;
            let elBtn = elSection.FindChildInLayoutFile('id-loadout-select-team-btn-' + team);
            if (elBtn) {
                elBtn.Data().team = team;
                ItemDragTargetEvents(elBtn);
                elBtn.SetPanelEvent('onactivate', function() { ChangeSelectedTeamOverride(team); $.DispatchEvent('PlaySoundEffect', 'UIPanorama.submenu_select', 'MOUSE'); });
				elBtn.SetPanelEvent('onmouseover', () => { UiToolkitAPI.HideCustomLayoutTooltip('JsLoadoutItemTooltip'); });
            }
        });
    }

    function OnActivateSideItem(slotName, TeamName) {
        if (m_selectedTeam !== TeamName) {
            ChangeSelectedTeamOverride(TeamName);
            ToggleGroupDropdown(slotName, true);
        } else {
            ClearItemIdFilter();
            ToggleGroupDropdown(slotName, false);
        }
    }

    function UpdateCharModel(team, weaponId = '') {
        let elPanel = $.GetContextPanel().FindChildInLayoutFile('id-loadout-agent-' + team);
        if (!elPanel) return;

        let charId = LoadoutAPI.GetItemID(team, 'customplayer');
        let glovesId = LoadoutAPI.GetItemID(team, 'clothing_hands');
        const settings = ItemInfo.GetOrUpdateVanityCharacterSettings(charId);

        if (team == m_selectedTeam) {
            let selectedGroup = GetSelectedGroup();
            if (['melee', 'secondary0', 'c4', 'equipment2'].includes(selectedGroup)) {
                weaponId = LoadoutAPI.GetItemID(team, selectedGroup);
            } else if (['secondary', 'smg', 'heavy', 'rifle'].includes(selectedGroup)) {
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
            if (!weaponId || weaponId == '0') weaponId = LoadoutAPI.GetItemID(team, 'melee');
        }

        if (charId != m_currentCharId[team] || glovesId != m_currentCharGlovesId[team] || weaponId != m_currentCharWeaponId[team]) {
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
        if (!elSection) return;
        let elGrid = elSection.FindChildInLayoutFile('id-loadout-grid-slots-' + team);
        if (!elGrid) return;

        elGrid.Children().forEach(column => {
            let aPanels = column.Children().filter(panel => panel.GetAttributeString('data-slot', '') !== '');
            aPanels.forEach(panel => {
                let isEquip = column.GetAttributeString('data-slot', '') === 'equipment' || column.GetAttributeString('data-slot', '') === 'grenade';
                UpdateSlotItemImage(team, panel, isEquip, !isEquip, isEquip);
                if (!isEquip) {
                    UpdateName(panel);
                    UpdateMoney(panel, team);
                }
            });
        });
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
                elBtn.SetPanelEvent('oncontextmenu', function () {
                    let filterValue = '';
                    if (LoadoutAPI.IsShuffleEnabled(OverrideTeam(team, slotName), slotName))
                        filterValue = 'shuffle_slot_' + team;
                    else
                        filterValue = 'loadout_slot_' + team;
                    if (slotName === 'spray0')
                        filterValue += '&contextmenuparam=graffiti';
                    OpenContextMenu(elBtn, filterValue);
                });
                elBtn.SetPanelEvent('onmouseover', function () {
                    if (team == m_selectedTeam && entry.equip_on_hover)
                        UpdateCharModel(team, LoadoutAPI.GetItemID(team, slotName));
                    UiToolkitAPI.ShowCustomLayoutParametersTooltip(panelId, 'JsLoadoutItemTooltip', 'file://{resources}/layout/tooltips/tooltip_loadout_item.xml', 'itemid=' + elBtn.Data().itemid +
                        '&' + 'slot=' + slotName +
                        '&' + 'team=' + m_selectedTeam);
                });
                elBtn.SetPanelEvent('onmouseout', function () { UiToolkitAPI.HideCustomLayoutTooltip('JsLoadoutItemTooltip'); });
            }
            else {
                elBtn.ClearPanelEvent('oncontextmenu');
                elBtn.ClearPanelEvent('onmouseover');
                elBtn.ClearPanelEvent('onmouseout');
            }
            elBtn.SetPanelEvent('onactivate', OnActivateSideItem.bind(undefined, slotName, team));
        }
    }

    function UpdateSlotItemImage(team, elPanel, bUseIcon, bReplacable, bIsEquipment = false) {
        let slot = elPanel.GetAttributeString('data-slot', '');
        team = OverrideTeam(team, slot);
        let itemid = LoadoutAPI.GetItemID(team, slot);
        let itemImage = elPanel.FindChild('loudout-item-image-' + slot);
        let elRarity = elPanel.FindChild('id-loadout-item-rarity');

        if (!itemImage) {
            itemImage = $.CreatePanel('ItemImage', elPanel, 'loudout-item-image-' + slot, { class: 'loadout-slot__image' });
            if (!bUseIcon) elRarity = $.CreatePanel('Panel', elPanel, 'id-loadout-item-rarity', { class: 'loadout-slot-rarity' });
            if (bReplacable) {
                $.CreatePanel('Image', elPanel, 'id-loadout-item-filter-icon', { class: 'loadout-slot-filter-icon' });
                let elShuffleIcon = $.CreatePanel('Image', elPanel, 'id-loadout-item-shuffle-icon', { class: 'loadout-slot-shuffle-icon' });
                elShuffleIcon.visible = LoadoutAPI.IsShuffleEnabled(team, slot);
            }
        }

        itemImage.SetHasClass('loadout-slot__image', !bUseIcon);
        itemImage.SetHasClass('loadout-slot-svg__image', bUseIcon);
        
        if (!bIsEquipment && typeof TintSprayIcon !== 'undefined') {
            TintSprayIcon.CheckIsSprayAndTint(itemid, itemImage);
        }

        if (bUseIcon && (team !== "t" || slot !== "equipment3")) {
            itemImage.itemid = '';
            itemImage.SetImage('file://{images}/icons/equipment/' + GetDefName(itemid, slot) + '.svg');
        } else {
            itemImage.itemid = itemid;
        }

        elPanel.Data().itemid = itemid;
        elPanel.Data().visuals_itemid = (slot === 'spray0') ? ItemInfo.GetFauxReplacementItemID(itemid, 'graffiti') : itemid;

        let color = InventoryAPI.GetItemRarityColor(itemid);
        if (elRarity) {
            elRarity.visible = !!color;
            if (color) elRarity.style.backgroundColor = color;
        }
    }

    function UpdateName(elPanel) {
        let elName = elPanel.FindChild('id-loadout-item-name') || $.CreatePanel('Label', elPanel, 'id-loadout-item-name', { class: 'loadout-slot__name stratum-regular' });
        elPanel.SetDialogVariable('item-name', $.Localize(InventoryAPI.GetItemBaseName(elPanel.Data().visuals_itemid)));
        elName.text = $.Localize('{s:item-name}', elPanel);
    }

    function UpdateMoney(elPanel, team) {
        let elMoney = elPanel.FindChild('id-loadout-item-money') || $.CreatePanel('Label', elPanel, 'id-loadout-item-money', { class: 'loadout-slot__money stratum-regular' });
        elPanel.SetDialogVariableInt('money', LoadoutAPI.GetItemGamePrice(team, elPanel.GetAttributeString('data-slot', '')));
        elMoney.text = $.Localize("#buymenu_money", elPanel);
    }

    function GetDefName(itemid, slot) {
        let defName = InventoryAPI.GetItemDefinitionName(itemid);
        if (slot === 'clothing_hands' || slot === 'melee' || slot === 'customplayer' || itemid === '0') return slot;
        return defName ? defName.split('_')[1] : '';
    }

    function OverrideTeam(team, slot) {
        return ['musickit', 'spray0', 'flair0'].includes(slot) ? 'noteam' : team;
    }


    function GetSelectedGroup() {
        var elDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-group');
        if (!elDropdown || !elDropdown.GetSelected() || !elDropdown.GetSelected().id) return 'all';
        return elDropdown.GetSelected().id;
    }

    function GetSelectedItemDef() {
        var elDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-itemdef');
        if (!elDropdown || !elDropdown.GetSelected() || !elDropdown.GetSelected().id) return 'all';
        return elDropdown.GetSelected().id;
    }

function FilterByItemType(itemId, bToggle = false) {
    // 1. Get the broad slot (Rifle, SMG, etc.)
    let group = InventoryAPI.GetSlot(itemId); 
    
    // 2. Get the specific weapon definition (e.g., 'weapon_ak47')
    let itemDefName = InventoryAPI.GetItemDefinitionName(itemId);

    let elGroupDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-group');
    let elItemDefDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-itemdef');
    
    // Set the broad category (Rifle)
    if (elGroupDropdown && group) {
        elGroupDropdown.SetSelected(group.replace('weapon_', ''));
    }
    
    // 3. Set the specific weapon slot (AK-47)
    // This is what prevents it from just selecting the whole category
    if (elItemDefDropdown) {
        // Ensure the dropdown is visible/enabled for this category
        elItemDefDropdown.visible = true; 
        
        if (bToggle && GetSelectedItemDef() == itemDefName) {
            elItemDefDropdown.SetSelected('all');
        } else {
            elItemDefDropdown.SetSelected(itemDefName);
        }
    }

    // 4. Refresh the grid with these specific parameters
    UpdateFilters();
}

    function ToggleGroupDropdown(group, bDisallowToggle = false) {
        let elGroupDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-group');
        let elItemDefDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-itemdef');
        
        if (GetSelectedGroup() == group && !bDisallowToggle) {
            if (GetSelectedItemDef() != 'all') {
                if (elItemDefDropdown) elItemDefDropdown.SetSelected('all');
            } else {
                if (elGroupDropdown) elGroupDropdown.SetSelected('all');
            }
        } else {
            if (elGroupDropdown) elGroupDropdown.SetSelected(group);
            if (elItemDefDropdown && elItemDefDropdown.visible) elItemDefDropdown.SetSelected('all');
        }
        UpdateFilters();
    }

    function UpdateFilters() {
        let group = GetSelectedGroup();
        let elClearBtn = $.GetContextPanel().FindChildInLayoutFile('id-loadout-clear-filters');
        if (elClearBtn) elClearBtn.visible = (group != 'all' || m_filterItemId !== '');
        
        let elItemDefDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-itemdef');
        if (elItemDefDropdown) elItemDefDropdown.visible = false; 

        UpdateItemList();
        UpdateGridFilterIcons();
    }

    function UpdateItemList() {
        let group = GetSelectedGroup();
        let elSortDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-sort');
        let sortType = (elSortDropdown && elSortDropdown.GetSelected()) ? elSortDropdown.GetSelected().id : 'newest';

        let szMainFilter = 'inv_group_equipment';
        if (group === 'spray0') szMainFilter = 'inv_graphic_art';
        if (group === 'flair0') szMainFilter = 'inv_display_slot';

        let team = m_selectedTeam === 'noteam' ? '' : m_selectedTeam;
        let loadoutSlotParams = ',' + team;
        let finalFilterString = group;

        if (group === 'all') {
            finalFilterString = 'any';
        } else if (group === 'secondary0') {
            finalFilterString = 'secondary';
        } else if (group === 'clothing_hands' || group === 'customplayer') {
            finalFilterString = group; 
        }

        let elItemList = $.GetContextPanel().FindChildInLayoutFile('id-loadout-item-list');
        if (elItemList) {
            $.DispatchEvent('SetInventoryFilter', elItemList, szMainFilter, 'any', 'any', sortType, finalFilterString + loadoutSlotParams, '');
        }

        let clearLabel = $.GetContextPanel().FindChildInLayoutFile('id-loadout-clear-filters-label');
        if (clearLabel) clearLabel.visible = (m_filterItemId !== '');
    }

    function ClearFilters() {
        let elGroupDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-group');
        if (elGroupDropdown) elGroupDropdown.SetSelected('all');
        m_filterItemId = '';
        UpdateFilters();
    }


    function InitSortDropDown() {
        let elDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-sort');
        if (!elDropdown) return;
        let count = InventoryAPI.GetSortMethodsCount();
        for (let i = 0; i < count; i++) {
            let id = InventoryAPI.GetSortMethodByIndex(i);
            let newEntry = $.CreatePanel('Label', elDropdown, id, { class: 'DropDownMenu' });
            newEntry.text = $.Localize('#' + id);
            elDropdown.AddOption(newEntry);
        }
        elDropdown.SetSelected(GameInterfaceAPI.GetSettingString("cl_loadout_saved_sort"));
    }

    function ShowHideItemFilterText(bShow) {
        let lbl = $.GetContextPanel().FindChildInLayoutFile('id-loadout-clear-filters-label');
        if (lbl) lbl.visible = bShow;
    }

    function ClearItemIdFilter() { m_filterItemId = ''; }

    function OnItemTileLoaded(elItemTile) {
        elItemTile.SetDraggable(true);
        $.RegisterEventHandler('DragStart', elItemTile, (el, drag) => {
            $.DispatchEvent('CSGOInventoryHideTooltip');
            OnDragStart(elItemTile, drag, elItemTile.GetAttributeString('itemid', '0'), false);
        });
        $.RegisterEventHandler('DragEnd', elItemTile, (el, img) => OnDragEnd(img));
    }

    function ShowLoadoutForItem(itemId) {
        m_filterItemId = itemId;
        m_updatedFromShowItemInLoadout = true;
        FilterByItemType(itemId);
    }

    function UpdateGridFilterIcons() {
        let selectedGroup = GetSelectedGroup();
        let selectedItemDef = GetSelectedItemDef();
        let elGrid = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-slots-' + m_selectedTeam);
        if (elGrid) {
            for (let group of ['secondary0', 'secondary', 'smg', 'heavy', 'rifle']) {
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
                        var fmtName = ItemInfo.GetFormattedName( itemId );
	                    fmtName.SetOnLabel( elPanel );
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
	
function LoadoutSlotItemTileEvents(elPanel) {
    elPanel.SetPanelEvent('onactivate', function () {
        ClearItemIdFilter();
        FilterByItemType(elPanel.Data().itemid, true);
    });

    elPanel.SetPanelEvent('onmouseover', function () {
        m_mouseOverSlot = elPanel.GetAttributeString('data-slot', '');
        UpdateCharModel(m_selectedTeam, LoadoutAPI.GetItemID(m_selectedTeam, m_mouseOverSlot));
        
        UiToolkitAPI.ShowCustomLayoutParametersTooltip(
            'loudout-item-image-' + m_mouseOverSlot, 
            'JsLoadoutItemTooltip', 
            'file://{resources}/layout/tooltips/tooltip_loadout_item.xml', 
            'itemid=' + elPanel.Data().itemid +
            '&slot=' + m_mouseOverSlot +
            '&team=' + m_selectedTeam +
            '&nameonly=true'
        );
    });

    elPanel.SetPanelEvent('onmouseout', function () {
        m_mouseOverSlot = '';
        UiToolkitAPI.HideCustomLayoutTooltip('JsLoadoutItemTooltip');
    });

    elPanel.SetPanelEvent('oncontextmenu', function () {
        let slot = elPanel.GetAttributeString('data-slot', '');
        // Fetch the actual Item ID currently in this slot
        let itemid = LoadoutAPI.GetItemID(m_selectedTeam, slot);
        
        let filterValue = LoadoutAPI.IsShuffleEnabled(m_selectedTeam, slot) ? 
            'shuffle_slot_' + m_selectedTeam : 'loadout_slot_' + m_selectedTeam;

        if (slot === 'spray0') filterValue += '&contextmenuparam=graffiti';

        // Direct call with the ID
        OpenContextMenu(elPanel, filterValue, itemid);
    });

    elPanel.SetDraggable(true);

    // FIX: Use elPanel directly instead of the 'el' argument from the event
    $.RegisterEventHandler('DragStart', elPanel, function(panelID, drag) {
        let slot = elPanel.GetAttributeString('data-slot', '');
        let itemid = LoadoutAPI.GetItemID(m_selectedTeam, slot);
        let bShuffle = LoadoutAPI.IsShuffleEnabled(m_selectedTeam, slot);
        
        OnDragStart(elPanel, drag, itemid, bShuffle);
    });

    $.RegisterEventHandler('DragEnd', elPanel, function(panelID, img) {
        OnDragEnd(img);
    });
}

function OpenContextMenu(elPanel, filterValue, itemid) {
    UiToolkitAPI.HideCustomLayoutTooltip('JsLoadoutItemTooltip');
    
    // Ensure we have a valid ID. 
    // If it's '0', the menu will always be empty.
    let finalId = itemid || elPanel.Data().itemid;

    if (!finalId || finalId === '0' || finalId === 'undefined') {
        // Fallback: try to get it from the panel one last time
        finalId = elPanel.GetAttributeString('data-itemid', '');
    }
    
    // FORMATTING THE PARAMS:
    // We add 'inventory_mode=1' which often forces the menu to look for inventory actions
    let params = 'itemid=' + finalId + 
                 '&populatefiltertext=' + filterValue + 
                 '&inventory_mode=1';

    let contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent(
        elPanel.id, 
        '', 
        'file://{resources}/layout/context_menus/context_menu_inventory_item.xml', 
        params, 
        function() {}
    );

    if (contextMenuPanel) {
        contextMenuPanel.AddClass("ContextMenu_NoArrow");
    }
}

    function ItemDragTargetEvents(elPanel) {
        $.RegisterEventHandler('DragEnter', elPanel, () => { elPanel.AddClass('loadout-drag-enter'); m_mouseOverSlot = elPanel.GetAttributeString('data-slot', ''); });
        $.RegisterEventHandler('DragLeave', elPanel, () => { elPanel.RemoveClass('loadout-drag-enter'); m_mouseOverSlot = ''; });
        $.RegisterEventHandler('DragDrop', elPanel, (id, img) => OnDragDrop(elPanel, img));
    }

    function OnDragStart(elDragSource, drag, itemid, bShuffle) {
        let elDragImage = $.CreatePanel('ItemImage', $.GetContextPanel(), '', { class: 'loadout-drag-icon', textureheight: '128', texturewidth: '128' });
		UiToolkitAPI.HideCustomLayoutTooltip('JsLoadoutItemTooltip');
        elDragImage.itemid = itemid;
        drag.displayPanel = elDragImage;
        drag.offsetX = 96; drag.offsetY = 64;
		elDragImage.AddClass('drag-start');
        m_elDragSource = elDragSource;
		m_elDragSource.AddClass('dragged-away');
        m_dragItemId = itemid;
        $.DispatchEvent('PlaySoundEffect', 'UIPanorama.inventory_item_pickup', 'MOUSE');
    }

    function OnDragEnd(elDragImage) {
        elDragImage.DeleteAsync(0.1);
        elDragImage.AddClass('drag-end');
        m_elDragSource.RemoveClass('dragged-away');
        m_dragItemId = '';
        let elItemList = $('#id-loadout-item-list');
        elItemList.hittest = true;
        elItemList.hittestchildren = true;
    }

    function OnDragDrop(elPanel, elDragImage) {
        let newSlot = elPanel.GetAttributeString('data-slot', '');
        if (newSlot) {
            let equipSuccess = LoadoutAPI.EquipItemInSlot(m_selectedTeam, elDragImage.itemid, newSlot);
            if (equipSuccess) {
                $.DispatchEvent('PlaySoundEffect', 'UIPanorama.inventory_item_putdown', 'MOUSE');
                UpdateItemList();
                FillOutGridItems(m_selectedTeam);
                UpdateCharModel(m_selectedTeam);
            } else {
                $.DispatchEvent('PlaySoundEffect', 'UIPanorama.inventory_item_notequipped', 'MOUSE');
            }
        }
    }

    function RegisterGridItemEvents(team) {
        let elSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + team);
        if (!elSection) return;
        let elGrid = elSection.FindChildInLayoutFile('id-loadout-grid-slots-' + team);
        if (!elGrid) return;

        elGrid.Children().forEach(column => {
            let aPanels = column.Children().filter(panel => panel.GetAttributeString('data-slot', '') !== '');
            aPanels.forEach(panel => {
                if (column.GetAttributeString('data-slot', '') !== 'equipment' && column.GetAttributeString('data-slot', '') !== 'grenade') {
                    LoadoutSlotItemTileEvents(panel);
                    ItemDragTargetEvents(panel);
                }
            });
        });
    }
    return {
        Init: Init,
        OnReadyForDisplay: OnReadyForDisplay,
        OnUnreadyForDisplay: OnUnreadyForDisplay,
        UpdateFilters: UpdateFilters,
        ClearFilters: ClearFilters,
        ToggleGroupDropdown: ToggleGroupDropdown,
        UpdateItemList: UpdateItemList,
        FilterByItemType: FilterByItemType,
        OnItemTileLoaded: OnItemTileLoaded,
        ShowLoadoutForItem: ShowLoadoutForItem,
        ChangeSelectedTeamOverride: ChangeSelectedTeamOverride,
        OnActivateSideItem: OnActivateSideItem
    };

})();

(function () {
    LoadoutGrid.Init();
    $.RegisterEventHandler('ReadyForDisplay', $.GetContextPanel(), LoadoutGrid.OnReadyForDisplay);
    $.RegisterEventHandler('UnreadyForDisplay', $.GetContextPanel(), LoadoutGrid.OnUnreadyForDisplay);
    $.RegisterForUnhandledEvent('ShowLoadoutForItem', LoadoutGrid.ShowLoadoutForItem);
})();