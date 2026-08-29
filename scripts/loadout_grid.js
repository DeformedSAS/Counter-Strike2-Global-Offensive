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
        
        if (!m_equipSlotChangedHandler) {
            m_equipSlotChangedHandler = $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_PlayerEquipSlotChanged', OnPlayerEquipSlotChanged);
        }
    }

    function OnMyPersonaInventoryUpdated() {
        UpdateItemList();
        FillOutRowItems('ct');
        FillOutRowItems('t');
        FillOutGridItems('ct');
        FillOutGridItems('t');
    }

    function OnPlayerEquipSlotChanged(pos, subslot, oldItemId, newItemId) {
        if (oldItemId == newItemId)
            return;

        let slot = InventoryAPI.GetSlot(newItemId);
        if (!slot && oldItemId) {
            slot = InventoryAPI.GetSlot(oldItemId);
        }
        
        if (m_filterItemId === oldItemId || (slot && m_filterItemId && InventoryAPI.GetSlot(m_filterItemId) === slot)) {
            if (newItemId && newItemId !== '0') {
                m_filterItemId = newItemId;
            }
        }

        FillOutRowItems('ct');
        FillOutRowItems('t');
        FillOutGridItems('ct');
        FillOutGridItems('t');
        
        let targetTeam = m_selectedTeam;
        if (slot) {
            if (LoadoutAPI.GetItemID('ct', slot) === newItemId || LoadoutAPI.GetItemID('ct', slot) === '0') {
                targetTeam = 'ct';
            } else if (LoadoutAPI.GetItemID('t', slot) === newItemId || LoadoutAPI.GetItemID('t', slot) === '0') {
                targetTeam = 't';
            }
        }

        if (slot === 'customplayer') {
            m_currentCharId[targetTeam] = '';
            UpdateCharModel(targetTeam);
        } else if (slot === 'clothing_hands') {
            m_currentCharGlovesId['ct'] = '';
            m_currentCharGlovesId['t'] = '';
            UpdateCharModel('ct');
            UpdateCharModel('t');
        } else {
            let validWeaponPrefixes = ['melee', 'secondary', 'smg', 'rifle', 'heavy', 'c4', 'equipment'];
            let isWeapon = slot && validWeaponPrefixes.some(prefix => slot.startsWith(prefix));

            if (isWeapon || (!newItemId || newItemId === '0')) {
                m_currentCharWeaponId[targetTeam] = '';
                UpdateCharModel(targetTeam, newItemId);
            }
        }
    }

    function OnUnreadyForDisplay() {
        if (m_inventoryUpdatedHandler) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', m_inventoryUpdatedHandler);
            m_inventoryUpdatedHandler = null;
        }
        
        if (m_equipSlotChangedHandler) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_Inventory_PlayerEquipSlotChanged', m_equipSlotChangedHandler);
            m_equipSlotChangedHandler = null;
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
        if (elItemList) {
            elItemList.SetAttributeInt('DragScrollSpeedHorizontal', 0);
            elItemList.SetAttributeInt('DragScrollSpeedVertical', 0);
        }
        RegisterGridItemEvents('ct');
        RegisterGridItemEvents('t');
    }

    function ChangeSelectedTeamOverride(team) {
        let teamToSelect = (m_selectedTeam === team) ? (team === 't' ? 'ct' : 't') : team;
        
        let targetSlot = '';
        if (m_filterItemId && m_filterItemId !== '0') {
            let elGrid = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-slots-' + m_selectedTeam);
            if (elGrid) {
                for (let columnId of m_aActiveUsedColumns) {
                    let elColumn = elGrid.FindChildInLayoutFile(columnId);
                    if (!elColumn) continue;
                    for (let elPanel of elColumn.Children()) {
                        let panelItemId = LoadoutAPI.GetItemID(m_selectedTeam, elPanel.GetAttributeString('data-slot', ''));
                        if (panelItemId === m_filterItemId || elPanel.Data().itemid === m_filterItemId) {
                            targetSlot = elPanel.GetAttributeString('data-slot', '');
                            break;
                        }
                    }
                    if (targetSlot) break;
                }
            }
        }

        m_selectedTeam = teamToSelect;
        $.GetContextPanel().SetHasClass('loadout_t_selected', m_selectedTeam === 't');

        if (targetSlot) {
            let equivalentItemId = LoadoutAPI.GetItemID(m_selectedTeam, targetSlot);
            if (equivalentItemId && equivalentItemId !== '0') {
                m_filterItemId = equivalentItemId;
                let elClearBtn = $.GetContextPanel().FindChildInLayoutFile('id-loadout-clear-filters');
                if (elClearBtn) {
                    elClearBtn.SetDialogVariable('item_name', $.Localize(InventoryAPI.GetItemBaseName(equivalentItemId)));
                }
            } else {
                ClearItemIdFilter();
            }
        } else {
            ClearItemIdFilter();
        }

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

        UpdateFilters();
        
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
        
        let sideTeam = OverrideTeam(TeamName, slotName);
        let sideItemId = LoadoutAPI.GetItemID(sideTeam, slotName);
        
        let validWeaponPrefixes = ['melee', 'secondary', 'smg', 'rifle', 'heavy', 'c4', 'equipment'];
        let slotType = InventoryAPI.GetSlot(sideItemId);
        let isWeapon = slotType && validWeaponPrefixes.some(prefix => slotType.startsWith(prefix));

        if (sideTeam === 'noteam' || sideTeam === m_selectedTeam) {
            if (isWeapon) {
                m_currentCharWeaponId[m_selectedTeam] = '';
                UpdateCharModel(m_selectedTeam, sideItemId);
            } else {
                UpdateCharModel(m_selectedTeam);
            }
        }
    }

    function UpdateCharModel(team, weaponId = '') {
        let elPanel = $.GetContextPanel().FindChildInLayoutFile('id-loadout-agent-' + team);
        if (!elPanel) return;

        let charId = LoadoutAPI.GetItemID(team, 'customplayer');
        let glovesId = LoadoutAPI.GetItemID(team, 'clothing_hands');
        const settings = ItemInfo.GetOrUpdateVanityCharacterSettings(charId);

        if (!weaponId || weaponId == '0') {
            if (team == m_selectedTeam && m_filterItemId && m_filterItemId !== '0') {
                let slot = InventoryAPI.GetSlot(m_filterItemId);
                if (slot && LoadoutAPI.GetItemID(team, slot) === m_filterItemId) {
                    weaponId = m_filterItemId;
                }
            }
        }

        if (weaponId && weaponId !== '0') {
            let slot = InventoryAPI.GetSlot(weaponId);
            if (slot) {
                let currentItemInSlot = LoadoutAPI.GetItemID(team, slot);
                let noteamItem = LoadoutAPI.GetItemID('noteam', slot);
                
                if (currentItemInSlot !== weaponId && noteamItem !== weaponId) {
                    let isWeaponValid = false;
                    let validSlots = [
                        'rifle0', 'rifle1', 'rifle2', 'rifle3', 'rifle4', 'rifle5',
                        'smg0', 'smg1', 'smg2', 'smg3', 'smg4', 'smg5',
                        'secondary0', 'secondary1', 'secondary2', 'secondary3', 'secondary4', 'secondary5',
                        'heavy0', 'heavy1', 'heavy2', 'heavy3', 'heavy4', 'heavy5',
                        'melee', 'c4', 'equipment0', 'equipment1', 'equipment2', 'equipment3'
                    ];
                    
                    for (let s of validSlots) {
                        if (LoadoutAPI.GetItemID(team, s) === weaponId || LoadoutAPI.GetItemID('noteam', s) === weaponId) {
                            isWeaponValid = true;
                            break;
                        }
                    }
                    
                    if (!isWeaponValid) {
                        weaponId = ''; 
                    }
                }
            }
        }

        if (!weaponId || weaponId == '0') {
            weaponId = m_currentCharWeaponId[team];
            if (!weaponId || weaponId == '0') {
                let defaultSlots = ['rifle0', 'secondary0', 'smg0', 'heavy0', 'melee'];
                for (let ds of defaultSlots) {
                    let id = LoadoutAPI.GetItemID(team, ds);
                    if (id && id !== '0') {
                        weaponId = id;
                        break;
                    }
                }
                if (!weaponId || weaponId == '0') weaponId = LoadoutAPI.GetItemID(team, 'rifle0');
            }
        }

        if (charId != m_currentCharId[team] || glovesId != m_currentCharGlovesId[team] || weaponId != m_currentCharWeaponId[team]) {
            m_currentCharId[team] = charId;
            m_currentCharGlovesId[team] = glovesId;
            m_currentCharWeaponId[team] = weaponId;
            settings.panel = elPanel;
            settings.weaponItemId = weaponId;
            CharacterAnims.PlayAnimsOnPanel(settings);
        } else {
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
        if (!elSection) return;
        let elRow = elSection.FindChildInLayoutFile('id-loadout-row-slots-' + team);
        if (!elRow) return;

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
            
            if (elBtn) {
                elBtn.SetAttributeString('data-itemid', itemid);
                elBtn.SetPanelEvent('oncontextmenu', function () {
                    let filterValue = '';
                    if (LoadoutAPI.IsShuffleEnabled(OverrideTeam(team, slotName), slotName))
                        filterValue = 'shuffle_slot_' + team;
                    else
                        filterValue = 'loadout_slot_' + team;
                    if (slotName === 'spray0')
                        filterValue += '&contextmenuparam=graffiti';
                    OpenContextMenu(elBtn, filterValue, itemid);
                });
                
                elBtn.SetPanelEvent('onmouseover', function () {
                    let sideTeam = OverrideTeam(team, slotName);
                    let sideItemId = LoadoutAPI.GetItemID(sideTeam, slotName);
                    
                    let selectedGroup = GetSelectedGroup();
                    let hasFilter = (m_filterItemId && m_filterItemId !== '0') || selectedGroup !== 'all';

                    if (team == m_selectedTeam && entry.equip_on_hover && !hasFilter) {
                        let validWeaponPrefixes = ['melee', 'secondary', 'smg', 'rifle', 'heavy', 'c4', 'equipment'];
                        let slotType = InventoryAPI.GetSlot(sideItemId);
                        let isWeapon = slotType && validWeaponPrefixes.some(prefix => slotType.startsWith(prefix));

                        if (sideTeam === 'noteam' || sideTeam === m_selectedTeam) {
                            if (isWeapon) {
                                UpdateCharModel(team, sideItemId);
                            }
                        }
                    }
                    
                    UiToolkitAPI.ShowCustomLayoutParametersTooltip(panelId, 'JsLoadoutItemTooltip', 'file://{resources}/layout/tooltips/tooltip_loadout_item.xml', 'itemid=' + elBtn.Data().itemid +
                        '&' + 'slot=' + slotName +
                        '&' + 'team=' + m_selectedTeam);
                });

                elBtn.SetPanelEvent('onmouseout', function () { 
                    UiToolkitAPI.HideCustomLayoutTooltip('JsLoadoutItemTooltip');
                    
                    let selectedGroup = GetSelectedGroup();
                    let hasFilter = (m_filterItemId && m_filterItemId !== '0') || selectedGroup !== 'all';

                    if (team == m_selectedTeam) {
                        if (hasFilter) {
                            if (m_filterItemId && m_filterItemId !== '0') {
                                let slot = InventoryAPI.GetSlot(m_filterItemId);
                                let validTeamWeapon = LoadoutAPI.GetItemID(m_selectedTeam, slot);
                                if (validTeamWeapon === m_filterItemId) {
                                    UpdateCharModel(m_selectedTeam, m_filterItemId);
                                } else {
                                    UpdateCharModel(m_selectedTeam);
                                }
                            }
                        } else {
                            UpdateCharModel(team); 
                        }
                    }
                });
            }
            elBtn.SetPanelEvent('onactivate', OnActivateSideItem.bind(undefined, slotName, team));
        }
    }

    function UpdateSlotItemImage(team, elPanel, bUseIcon, bReplacable, bIsEquipment = false) {
        let slot = elPanel.GetAttributeString('data-slot', '');
        let actualTeam = OverrideTeam(team, slot);
        let itemid = LoadoutAPI.GetItemID(actualTeam, slot);
        let itemImage = elPanel.FindChild('loudout-item-image-' + slot);
        let elRarity = elPanel.FindChild('id-loadout-item-rarity');

        if (!itemImage) {
            let childId = 'loudout-item-image-' + slot;
            itemImage = $.CreatePanel('ItemImage', elPanel, childId, { class: 'loadout-slot__image' });
            if (!bUseIcon) elRarity = $.CreatePanel('Panel', elPanel, 'id-loadout-item-rarity', { class: 'loadout-slot-rarity' });
            if (bReplacable) {
                $.CreatePanel('Image', elPanel, 'id-loadout-item-filter-icon', { class: 'loadout-slot-filter-icon' });
                let elShuffleIcon = $.CreatePanel('Image', elPanel, 'id-loadout-item-shuffle-icon', { class: 'loadout-slot-shuffle-icon' });
                elShuffleIcon.visible = LoadoutAPI.IsShuffleEnabled(actualTeam, slot);
            }
        }

        itemImage.SetHasClass('loadout-slot__image', !bUseIcon);
        itemImage.SetHasClass('loadout-slot-svg__image', bUseIcon);
        
        if (!bIsEquipment && typeof TintSprayIcon !== 'undefined') {
            TintSprayIcon.CheckIsSprayAndTint(itemid, itemImage);
        }
        
        if (bUseIcon && (actualTeam !== "t" || slot !== "equipment3")) {
            itemImage.itemid = '';
            let defName = GetDefName(itemid, slot);
            
            if (defName.startsWith('item_')) {
                defName = defName.replace('item_', '');
            }
            if (defName === 'grenade4') {
                defName = 'flashbang'; 
            }

            itemImage.SetImage('file://{images}/icons/equipment/' + defName + '.svg');
        } else {
            itemImage.itemid = itemid;
        }

        elPanel.Data().itemid = itemid;
        elPanel.SetAttributeString('data-itemid', itemid);
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
        return defName ? defName.replace('weapon_', '') : '';
    }

    function OverrideTeam(team, slot) {
        return ['musickit', 'spray0', 'flair0'].includes(slot) ? 'noteam' : team;
    }

    function GetSelectedGroup() {
        var elDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-group');
        if (!elDropdown || !elDropdown.GetSelected() || !elDropdown.GetSelected().id) return 'all';
        return elDropdown.GetSelected().id;
    }

    function FilterByItemType(itemId, bToggle = false) {
        if (!itemId || itemId === '0') return;

        m_filterItemId = itemId;
        let defName = InventoryAPI.GetItemDefinitionName(itemId);

        let elClearBtn = $.GetContextPanel().FindChildInLayoutFile('id-loadout-clear-filters');
        if (elClearBtn) {
            elClearBtn.SetDialogVariable('item_name', $.Localize(InventoryAPI.GetItemBaseName(itemId)));
        }

        let elGroupDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-group');
        if (elGroupDropdown) {
            elGroupDropdown.SetSelected('all');
        }

        UpdateFilters();
    }

    function ToggleGroupDropdown(group, bDisallowToggle = false) {
        m_filterItemId = '';
        let elGroupDropdown = $.GetContextPanel().FindChildInLayoutFile('id-loadout-filter-group');
        
        if (GetSelectedGroup() == group && !bDisallowToggle) {
            if (elGroupDropdown) elGroupDropdown.SetSelected('all');
        } else {
            if (elGroupDropdown) elGroupDropdown.SetSelected(group);
        }
        UpdateFilters();
    }

    function UpdateFilters() {
        let group = GetSelectedGroup();
        let elClearBtn = $.GetContextPanel().FindChildInLayoutFile('id-loadout-clear-filters');
        if (elClearBtn) elClearBtn.visible = (group != 'all' || m_filterItemId !== '');
        
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
        let slotParam = (group === 'all') ? 'any' : group;

        let loadoutSlotParams = ',' + team;
        if (m_filterItemId && m_filterItemId !== '0') {
            let defName = InventoryAPI.GetItemDefinitionName(m_filterItemId);
            if (defName) {
                let slot = InventoryAPI.GetSlot(m_filterItemId);
                slotParam = slot ? slot : 'any';
                loadoutSlotParams = ',item_definition:' + defName + ',' + team;
            }
        }

        let elItemList = $.GetContextPanel().FindChildInLayoutFile('id-loadout-item-list');
        if (elItemList) {
            $.DispatchEvent('SetInventoryFilter', 
                elItemList, 
                szMainFilter, 
                'any', 
                'any', 
                sortType, 
                slotParam + loadoutSlotParams, 
                ''
            );
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

        elDropdown.RemoveAllOptions();

        let count = InventoryAPI.GetSortMethodsCount();
        for (let i = 0; i < count; i++) {
            let id = InventoryAPI.GetSortMethodByIndex(i);
            let newEntry = $.CreatePanel('Label', elDropdown, id, { class: 'DropDownMenu' });
            newEntry.text = $.Localize('#' + id);
            elDropdown.AddOption(newEntry);
        }

        let savedSort = GameInterfaceAPI.GetSettingString("cl_inventory_saved_filter2");
        if (savedSort && savedSort !== '') {
            elDropdown.SetSelected(savedSort);
        } else {
            elDropdown.SetSelected(InventoryAPI.GetSortMethodByIndex(0));
        }

        elDropdown.SetPanelEvent('oninputsubmit', function() {
            let selected = elDropdown.GetSelected();
            if (selected) {
                GameInterfaceAPI.SetSettingString("cl_inventory_saved_filter2", selected);
                UpdateItemList();
            }
        });
    }  

    function ShowHideItemFilterText(bShow) {
        let lbl = $.GetContextPanel().FindChildInLayoutFile('id-loadout-clear-filters-label');
        if (lbl) lbl.visible = bShow;
    }

    function ClearItemIdFilter() { 
        m_filterItemId = ''; 
        
        let elClearBtn = $.GetContextPanel().FindChildInLayoutFile('id-loadout-clear-filters');
        if (elClearBtn) {
            elClearBtn.SetDialogVariable('item_name', '');
        }
    }

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
        let rawItemDef = (typeof GetSelectedItemDef === 'function') ? GetSelectedItemDef() : (m_filterItemId && m_filterItemId !== '0' ? InventoryAPI.GetItemDefinitionName(m_filterItemId) : '');
        let selectedItemDef = rawItemDef ? rawItemDef : '';
        
        let elGrid = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-slots-' + m_selectedTeam);
        if (elGrid) {
            for (let group of ['secondary0', 'secondary', 'smg', 'rifle']) {
                let btn = elGrid.FindChildInLayoutFile('id-loadout-btn-' + group);
                if (btn) {
                    btn.checked = Boolean(group == selectedGroup && (!selectedItemDef || selectedItemDef == 'all'));
                }
            }
            for (let columnId of m_aActiveUsedColumns) {
                let elColumn = elGrid.FindChildInLayoutFile(columnId);
                if (!elColumn) continue;
                
                for (let elPanel of elColumn.Children()) {
                    let elFilterIcon = elPanel.FindChildInLayoutFile('id-loadout-item-filter-icon');
                    if (elFilterIcon) {
                        let slot = elPanel.GetAttributeString('data-slot', '');
                        let itemId = LoadoutAPI.GetItemID(m_selectedTeam, slot);
                        let itemDef = InventoryAPI.GetItemDefinitionName(itemId);
                        
                        if (m_filterItemId && m_filterItemId !== '0') {
                            let isMatch = (itemId === m_filterItemId);
                            elFilterIcon.visible = isMatch;
                            
                            elPanel.hittest = true; 
                            elPanel.SetHasClass('dimmed', !isMatch);
                        } else if (selectedGroup !== 'all') {
                            let isMatch = (slot === selectedGroup);
                            elFilterIcon.visible = isMatch;
                            elPanel.hittest = true;
                            elPanel.SetHasClass('dimmed', false);
                        } else {
                            elFilterIcon.visible = Boolean(selectedItemDef && itemDef == selectedItemDef);
                            elPanel.hittest = true;
                            elPanel.SetHasClass('dimmed', false);
                        }
                    }
                }
            }
        }
        
        for (let team of ['ct', 't']) {
            let elSection = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-section-' + team);
            if (!elSection) continue;
            let elRow = elSection.FindChildInLayoutFile('id-loadout-row-slots-' + team);
            if (!elRow) continue;
            for (let elPanel of elRow.Children()) {
                let elFilterIcon = elPanel.FindChildInLayoutFile('id-loadout-item-filter-icon');
                if (elFilterIcon) {
                    let slot = elPanel.GetAttributeString('data-slot', '');
                    
                    if (team == m_selectedTeam) {
                        let isMatch = (slot == selectedGroup);
                        elFilterIcon.visible = Boolean(isMatch);
                        elPanel.hittest = true;
                        elPanel.SetHasClass('dimmed', false);
                    }
                    else {
                        elFilterIcon.visible = false;
                        elPanel.hittest = true;
                        elPanel.SetHasClass('dimmed', false);
                    }
                }
            }
        }
    }

    function UpdateGridShuffleIcons() {
        let elGrid = $.GetContextPanel().FindChildInLayoutFile('id-loadout-grid-slots-' + m_selectedTeam);
        if (elGrid) {
            for (let columnId of m_aActiveUsedColumns) {
                let elColumn = elGrid.FindChildInLayoutFile(columnId);
                if (!elColumn) continue;
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
            if (!elSection) continue;
            let elRow = elSection.FindChildInLayoutFile('id-loadout-row-slots-' + team);
            if (!elRow) continue;
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
        if (!elPanel) return;

        elPanel.SetPanelEvent('onactivate', function () {
            let slot = elPanel.GetAttributeString('data-slot', '');
            let itemId = LoadoutAPI.GetItemID(m_selectedTeam, slot);

            if (itemId && itemId !== '0') {
                FilterByItemType(itemId, true);
                UpdateCharModel(m_selectedTeam, itemId);
            } else {
                ToggleGroupDropdown(slot, false);
                UpdateCharModel(m_selectedTeam);
            }
        });

        elPanel.SetPanelEvent('onmouseover', function () {
            m_mouseOverSlot = elPanel.GetAttributeString('data-slot', '');
            let tileItemId = LoadoutAPI.GetItemID(m_selectedTeam, m_mouseOverSlot);
            
            let selectedGroup = GetSelectedGroup();
            let hasFilter = (m_filterItemId && m_filterItemId !== '0') || selectedGroup !== 'all';

            let nonWeaponSlots = ['musickit', 'flair0', 'spray0'];
            if (!hasFilter && !nonWeaponSlots.includes(m_mouseOverSlot)) {
                if (tileItemId && tileItemId !== '0') {
                    UpdateCharModel(m_selectedTeam, tileItemId);
                }
            }
            
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
            
            let selectedGroup = GetSelectedGroup();
            let hasFilter = (m_filterItemId && m_filterItemId !== '0') || selectedGroup !== 'all';

            if (!hasFilter) {
                UpdateCharModel(m_selectedTeam);
            } else if (m_filterItemId && m_filterItemId !== '0') {
                let slot = InventoryAPI.GetSlot(m_filterItemId);
                let validTeamWeapon = LoadoutAPI.GetItemID(m_selectedTeam, slot);
                if (validTeamWeapon === m_filterItemId) {
                    UpdateCharModel(m_selectedTeam, m_filterItemId);
                }
            }
        });

        elPanel.SetPanelEvent('oncontextmenu', function () {
            let slot = elPanel.GetAttributeString('data-slot', '');
            let itemid = LoadoutAPI.GetItemID(m_selectedTeam, slot);
            
            let filterValue = LoadoutAPI.IsShuffleEnabled(m_selectedTeam, slot) ? 
                'shuffle_slot_' + m_selectedTeam : 'loadout_slot_' + m_selectedTeam;

            if (slot === 'spray0') filterValue += '&contextmenuparam=graffiti';

            OpenContextMenu(elPanel, filterValue, itemid);
        });

        elPanel.SetDraggable(true);

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

function OpenContextMenu( elPanel ) 
{
    UiToolkitAPI.HideCustomLayoutTooltip( 'JsLoadoutItemTooltip' );

    let id = elPanel.Data().itemid || elPanel.GetAttributeString( 'itemid', '' );
    if ( !id ) return;

    // dont pass restricted shit, shows up all options in the context menu, has issues, doesn't always work for some context buttons. always works for delete item and inspect.
    let params = 'itemid=' + id + '&populatefiltertext=(not found)';

    let contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParameters(
        elPanel.id,
        '',
        'file://{resources}/layout/context_menus/context_menu_inventory_item.xml',
        params
    );

    if ( contextMenuPanel && contextMenuPanel.IsValid() ) 
    {
        contextMenuPanel.AddClass( "ContextMenu_NoArrow" );
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
        if (m_elDragSource) m_elDragSource.RemoveClass('dragged-away');
        m_dragItemId = '';
        let elItemList = $('#id-loadout-item-list');
        if (elItemList) {
            elItemList.hittest = true;
            elItemList.hittestchildren = true;
        }
    }

    function OnDragDrop(elPanel, elDragImage) {
        let newSlot = elPanel.GetAttributeString('data-slot', '');
        if (newSlot) {
            let equipSuccess = LoadoutAPI.EquipItemInSlot(m_selectedTeam, elDragImage.itemid, newSlot);
            if (equipSuccess) {
                $.DispatchEvent('PlaySoundEffect', 'UIPanorama.inventory_item_putdown', 'MOUSE');
                UpdateItemList();
                FillOutGridItems(m_selectedTeam);
                
                if (newSlot === 'customplayer') {
                    m_currentCharId[m_selectedTeam] = '';
                    UpdateCharModel(m_selectedTeam);
                } else if (newSlot === 'clothing_hands') {
                    m_currentCharGlovesId['ct'] = '';
                    m_currentCharGlovesId['t'] = '';
                    UpdateCharModel('ct');
                    UpdateCharModel('t');
                } else {
                    let slotType = InventoryAPI.GetSlot(elDragImage.itemid);
                    let validWeaponPrefixes = ['melee', 'secondary', 'smg', 'rifle', 'heavy', 'c4', 'equipment'];
                    let isWeapon = slotType && validWeaponPrefixes.some(prefix => slotType.startsWith(prefix));

                    if (isWeapon) {
                        m_currentCharWeaponId[m_selectedTeam] = '';
                        UpdateCharModel(m_selectedTeam, elDragImage.itemid);
                    } else {
                        UpdateCharModel(m_selectedTeam);
                    }
                }
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
                if (column.GetAttributeString('data-slot', '') !== 'equipment' && column.GetAttributeString('data-slot', '') !== 'grenadeTiles') {
                    LoadoutSlotItemTileEvents(panel);
                    ItemDragTargetInstances(panel);
                }
            });
        });
    }

    function ItemDragTargetInstances(elPanel) {
        ItemDragTargetEvents(elPanel);
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
    $.RegisterEventHandler('UnreadyForDisplay', $.GetContextPanel(), LoadoutGrid.OnReadyFirstImageHandler ? LoadoutGrid.OnReadyFirstImageHandler : LoadoutGrid.OnUnreadyForDisplay);
    $.RegisterForUnhandledEvent('ShowLoadoutForItem', LoadoutGrid.ShowLoadoutForItem);
})();