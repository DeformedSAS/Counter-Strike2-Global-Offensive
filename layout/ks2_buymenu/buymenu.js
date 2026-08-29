'use strict';

/// <reference path="csgo.d.ts" />
/// <reference path="mock_adapter.ts" />

var BuyMenu = (function () {

    var category_definitions = [
        { id: "CategoryContainer1", title: "#LoadoutSlot_Equipment", key: "1", slots: [ { prefix: "equipment", count: 4 } ] },
        { id: "CategoryContainer2", title: "#LoadoutSlot_Secondary",   key: "2", slots: [ { prefix: "secondary", count: 5 } ] },
        { id: "CategoryContainer3", title: "#LoadoutSlot_SMG",         key: "3", slots: [ { prefix: "smg",       count: 5 } ] },
        { id: "CategoryContainer4", title: "#LoadoutSlot_Heavy",       key: "4", slots: [ { prefix: "heavy",     count: 6 } ] },
        { id: "CategoryContainer5", title: "#LoadoutSlot_Rifle",       key: "5", slots: [ { prefix: "rifle",     count: 6 } ] },
        { id: "CategoryContainer6", title: "#LoadoutSlot_Grenade",     key: "6", slots: [ { prefix: "grenade",   count: 6 } ] }
    ];

    var buyNameMap = {
        "item_kevlar": "vest",
        "item_assaultsuit": "vesthelm",
        "item_defuser": "defuser",
        "item_taser": "taser",
        "item_heavyarmor": "heavyarmor"
    };

    var m_oldWeaponItemId;
    var m_cachedAgentId = null;
    var m_cachedAgentTeam = null;

    function _getNormalizedTeam() {
        var rawTeam = "t";
        if (typeof MockAdapter !== 'undefined' && MockAdapter.GetPlayerTeamName) {
            rawTeam = MockAdapter.GetPlayerTeamName(MockAdapter.GetLocalPlayerXuid()) || "t";
        }
        
        if (typeof CharacterAnims !== 'undefined' && CharacterAnims.NormalizeTeamName) {
            return CharacterAnims.NormalizeTeamName(rawTeam, true);
        }

        rawTeam = String(rawTeam).toLowerCase();
        if (rawTeam.indexOf('ct') !== -1 || rawTeam.indexOf('counter') !== -1) {
            return 'ct';
        }
        return 't';
    }

    function _getAgentId(team) {
        if (m_cachedAgentTeam !== team || !m_cachedAgentId) {
            m_cachedAgentTeam = team;
            m_cachedAgentId = (typeof LoadoutAPI !== 'undefined' && LoadoutAPI.GetItemID) 
                ? LoadoutAPI.GetItemID(team, 'customplayer') 
                : null;
        }
        return m_cachedAgentId;
    }

    function _GetPlayerMoney() {
        var xuid = (typeof MockAdapter !== 'undefined' && MockAdapter.GetLocalPlayerXuid) ? MockAdapter.GetLocalPlayerXuid() : '';
        
        if (typeof GameStateAPI !== 'undefined' && typeof GameStateAPI.GetPlayerMoney === 'function') {
            var money = GameStateAPI.GetPlayerMoney(xuid || '');
            if (money !== undefined && money !== null && money !== '') {
                return parseInt(money, 10) || 0;
            }
        }
        
        if (typeof MockAdapter !== 'undefined' && typeof MockAdapter.GetPlayerMoney === 'function') {
            return parseInt(MockAdapter.GetPlayerMoney(xuid), 10) || 0;
        }

        return 16000;
    }

    function _IsItemOwnedInRound(buyname, rawName, itemID) {
        if (!buyname && (!itemID || itemID === '0')) return false;

        if (typeof GameStateAPI !== 'undefined') {
            if (buyname && typeof GameStateAPI.IsPlayerHoldingWeapon === 'function' && (GameStateAPI.IsPlayerHoldingWeapon(buyname) || GameStateAPI.IsPlayerHoldingWeapon(rawName))) {
                return true;
            }
            if (buyname && typeof GameStateAPI.PlayerHasItem === 'function' && (GameStateAPI.PlayerHasItem(buyname) || GameStateAPI.PlayerHasItem(rawName))) {
                return true;
            }
            if (itemID && itemID !== '0' && typeof GameStateAPI.IsItemInInventory === 'function' && GameStateAPI.IsItemInInventory(itemID)) {
                return true;
            }
        }

        if (typeof InventoryAPI !== 'undefined' && itemID && itemID !== '0') {
            if (typeof InventoryAPI.IsItemInInventory === 'function' && InventoryAPI.IsItemInInventory(itemID)) {
                return true;
            }
        }

        if (typeof MockAdapter !== 'undefined') {
            if (buyname && typeof MockAdapter.PlayerHasItem === 'function' && MockAdapter.PlayerHasItem(buyname)) {
                return true;
            }
            if (itemID && typeof MockAdapter.GetPlayerActiveWeaponItemId === 'function') {
                if (MockAdapter.GetPlayerActiveWeaponItemId(MockAdapter.GetLocalPlayerXuid()) === itemID) {
                    return true;
                }
            }
        }

        return false;
    }

    function _buildItemData(id, slotid, team) {
        if (!id || id === '0') return null;

        var name = null;
        if (typeof ItemInfo !== 'undefined' && typeof ItemInfo.GetName === 'function') {
            name = ItemInfo.GetName(id);
        } else if (typeof InventoryAPI !== 'undefined' && typeof InventoryAPI.GetItemName === 'function') {
            name = InventoryAPI.GetItemName(id);
        }
        
        if (!name) return null;

        var desc = "";
        if (typeof ItemInfo !== 'undefined' && typeof ItemInfo.GetDescription === 'function') {
            desc = ItemInfo.GetDescription(id);
        }
        
        if (!desc && typeof InventoryAPI !== 'undefined' && typeof InventoryAPI.GetItemDefinitionName === 'function') {
            var defName = InventoryAPI.GetItemDefinitionName(id);
            if (defName) {
                defName = defName.replace("weapon_", "").replace("item_", "");
                var locTag = "#csgo_item_usage_desc_" + defName;
                var localizedDesc = $.Localize(locTag);
                if (localizedDesc !== locTag) {
                    desc = localizedDesc;
                }
            }
        }

        var rawName = (typeof InventoryAPI !== 'undefined' && typeof InventoryAPI.GetRawDefinitionKey === 'function') 
            ? InventoryAPI.GetRawDefinitionKey(id, "name") || "" 
            : "";

        var nameSuffix = rawName.split("weapon_")[1] || rawName.split("item_")[1] || rawName;
        var buyname = buyNameMap[rawName] || nameSuffix;

        var gamePrice = 0;
        if (typeof LoadoutAPI !== 'undefined' && typeof LoadoutAPI.GetItemGamePrice === 'function') {
            gamePrice = LoadoutAPI.GetItemGamePrice(team, slotid);
        } else if (typeof ItemInfo !== 'undefined' && typeof ItemInfo.GetStoreOriginalPrice === 'function') {
            gamePrice = ItemInfo.GetStoreOriginalPrice(id, team);
        }

        return {
            slot: slotid,
            id: id,
            name: name,
            icon: nameSuffix,
            buyname: buyname,
            rawName: rawName,
            price: parseInt(gamePrice, 10) || 0,
            description: desc || ""
        };
    }

    function _BuildAllItems() {
        var team = _getNormalizedTeam();
        var playerMoney = _GetPlayerMoney();

        category_definitions.forEach(function (catDef) {
            var container = $('#' + catDef.id);
            if (!container) return;

            container.RemoveAndDeleteChildren();

            var catPanel = $.CreatePanel('Panel', container, '');
            catPanel.BLoadLayoutSnippet('ItemCategory');

            var keyLabel = catPanel.FindChildTraverse('WedgeKeybinding');
            var titleLabel = catPanel.FindChildTraverse('CategoryName');

            if (keyLabel) keyLabel.text = catDef.key;
            if (titleLabel) titleLabel.text = $.Localize(catDef.title);

            var buttonsContainer = catPanel.FindChildTraverse('ItemButtons');
            if (!buttonsContainer) return;

            var itemIndex = 1;

            catDef.slots.forEach(function (slotGroup) {
                for (var i = 0; i < slotGroup.count; i++) {
                    var slotid = slotGroup.prefix + i;
                    var itemID = (typeof LoadoutAPI !== 'undefined' && typeof LoadoutAPI.GetItemID === 'function') 
                        ? LoadoutAPI.GetItemID(team, slotid) 
                        : null;
                        
                    var itemData = _buildItemData(itemID, slotid, team);

                    if (!itemData) continue;

                    var itemPanel = $.CreatePanel('Panel', buttonsContainer, 'ItemSlot_' + slotid);
                    itemPanel.BLoadLayoutSnippet('ItemPanel');

                    var buyBtn = itemPanel.FindChildTraverse('BuyButton');
                    var nameLabel = itemPanel.FindChildTraverse('ItemName');
                    var priceLabel = itemPanel.FindChildTraverse('ItemPrice');
                    var iconImg = itemPanel.FindChildTraverse('ItemIcon');
                    var wedgeKeyLabel = itemPanel.FindChildTraverse('WedgeKeybinding');

                    if (wedgeKeyLabel) wedgeKeyLabel.text = itemIndex;
                    if (nameLabel) nameLabel.text = itemData.name;
                    if (priceLabel) priceLabel.text = "$" + itemData.price;
                    if (iconImg) iconImg.SetImage('file://{images}/icons/equipment/' + itemData.icon + '.svg');

                    var isAffordable = (playerMoney >= itemData.price);
                    var isOwned = _IsItemOwnedInRound(itemData.buyname, itemData.rawName, itemID);
                    var notAffordable = !isAffordable && !isOwned;

                    var cantAffordClasses = ['cant-afford', 'buywheel-cant-afford', 'unaffordable', 'cant_afford', 'disabled', 'no-money'];
                    var ownedClasses = ['owned', 'already-owned', 'buywheel-already-owned', 'already_owned', 'equipped', 'in-inventory'];

                    cantAffordClasses.forEach(function (cls) {
                        itemPanel.SetHasClass(cls, notAffordable);
                        if (buyBtn) buyBtn.SetHasClass(cls, notAffordable);
                    });

                    ownedClasses.forEach(function (cls) {
                        itemPanel.SetHasClass(cls, isOwned);
                        if (buyBtn) buyBtn.SetHasClass(cls, isOwned);
                    });

                    if (buyBtn) {
                        buyBtn.enabled = !isOwned;

                        buyBtn.SetPanelEvent('onactivate', function (data, cantAfford, owned) {
                            if (owned) return;
                            _BuyItem(data, cantAfford);
                        }.bind(null, itemData, notAffordable, isOwned));

                        buyBtn.SetPanelEvent('onmouseover', function (data) {
                            _HoverItem(data);
                        }.bind(null, itemData));

                        buyBtn.SetPanelEvent('onmouseout', function () {
                            _UnHoverItem();
                        });
                    }

                    itemIndex++;
                }
            });
        });
    }

    function _HoverItem(data) {
        if (!data) return;

        var el_itemStats = $('#ItemDesc');
        var el_itemName = $('#WeaponNameAndRarity');

        if (el_itemName) {
            el_itemName.text = data.name || "";
            var rarityColor = (typeof InventoryAPI !== 'undefined' && typeof InventoryAPI.GetItemRarityColor === 'function') 
                ? InventoryAPI.GetItemRarityColor(data.id) 
                : null;
            el_itemName.style.color = rarityColor || "#5e98d9";
        }

        if (el_itemStats) {
            var rawDesc = data.description || "";
            var validDesc = (rawDesc.trim() !== "" && rawDesc !== "item-desc") ? rawDesc : "";

            el_itemStats.SetDialogVariable('item-name', data.name || "");
            el_itemStats.SetDialogVariable('s:item-name', data.name || "");
            el_itemStats.SetDialogVariable('item-desc', validDesc);
            el_itemStats.SetDialogVariable('s:item-desc', validDesc);

            var descLabel = el_itemStats.FindChildTraverse('ItemDescLabel');
            if (descLabel) {
                descLabel.text = validDesc;
                descLabel.SetHasClass('Hidden', validDesc === "");
            }

            el_itemStats.SetHasClass('Hidden', false);
        }

        var team = _getNormalizedTeam();
        _UpdateCharacter(null, data.id, _getAgentId(team), true);
    }

    function _UnHoverItem() {
        var el_itemStats = $('#ItemDesc');
        if (el_itemStats) {
            el_itemStats.SetHasClass('Hidden', true);
        }
    }

    function _BuyItem(data, cantAfford) {
        if (cantAfford) {
            $.DispatchEvent('PlaySoundEffect', 'UIPanorama.buymenu_failure', 'MOUSE');
            return;
        }

        if (!data || !data.buyname) return;

        GameInterfaceAPI.ConsoleCommand("buy " + data.buyname);

        if (+GameInterfaceAPI.GetSettingString('closeonbuy')) {
            $.DispatchEvent('BuyMenu_Back');
        }

        $.DispatchEvent('PlaySoundEffect', 'UIPanorama.buymenu_purchase', 'MOUSE');
    }

    function _UpdateCharacter(team, weaponItemId, charItemId, bForceRefresh) {
        if (typeof CharacterAnims === 'undefined') return;

        if ((weaponItemId == m_oldWeaponItemId) && !bForceRefresh) {
            return;
        }

        var elPreviewPanel = $.GetContextPanel().FindChildTraverse("id-buymenu-agent");
        if (!elPreviewPanel) {
            elPreviewPanel = $('#id-buymenu-agent');
        }
        if (!elPreviewPanel) return;

        var teamstring = _getNormalizedTeam();
        
        if (!charItemId || charItemId === '0') {
            charItemId = _getAgentId(teamstring);
        }

        var settings = ItemInfo.GetOrUpdateVanityCharacterSettings(charItemId);

        settings.panel = elPreviewPanel;
        settings.team = teamstring;
        settings.cameraPreset = 18;
        settings.weaponItemId = weaponItemId;
        settings.charItemId = charItemId;

        if (!charItemId || charItemId == '0' || charItemId === LoadoutAPI.GetDefaultItem(teamstring, 'customplayer')) {
            settings.modelOverride = MockAdapter.GetPlayerModel(MockAdapter.GetLocalPlayerXuid());
        }

        CharacterAnims.PlayAnimsOnPanel(settings);

        elPreviewPanel.SetFlashlightAmount(2.1);
        elPreviewPanel.SetFlashlightFOV(55);
        elPreviewPanel.SetFlashlightColor(2.35, 2.2, 2.0);
        elPreviewPanel.SetAmbientLightColor(0.5, 0.45, 0.4);
        elPreviewPanel.SetDirectionalLightModify(0);
        elPreviewPanel.SetDirectionalLightColor(1.05, 1.0, 0.9);
        elPreviewPanel.SetDirectionalLightDirection(-0.2, 0.92, -0.35);

        m_oldWeaponItemId = weaponItemId;
    }

    function _Init() {
        _BuildAllItems();
    }

    return {
        Init: _Init,
        BuildAllItems: _BuildAllItems,
        UpdateCharacter: _UpdateCharacter
    };

})();

(function () {
    BuyMenu.Init();
    $.RegisterForUnhandledEvent("BuyMenu_UpdateCharacter", BuyMenu.BuildAllItems);
    $.RegisterForUnhandledEvent("BuyMenu_UpdateCharacter", BuyMenu.UpdateCharacter);
    try {
        $.RegisterForUnhandledEvent("PanoramaComponent_MyPersona_InventoryUpdated", BuyMenu.BuildAllItems);
    } catch (e) {}
})();