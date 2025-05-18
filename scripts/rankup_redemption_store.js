"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/formattext.ts" />
/// <reference path="common/iteminfo.ts" />
/// <reference path="itemtile_store.ts" />

var RankUpRedemptionStore = RankUpRedemptionStore || {}; // 

(function (RankUpRedemptionStore) {
    let m_redeemableBalance = 0;
    let m_timeStamp = -1;
    let m_timeoutScheduleHandle;
    let m_profileCustomizationHandler;
    let m_profileUpdateHandler;
    let m_registered = false;
    let m_schTimer;

    function _msg(text) {
    }

    function RegisterForInventoryUpdate() {
        if (m_registered) return;
        m_registered = true;
        _UpdateStoreState();
        CheckForPopulateItems();
        m_profileUpdateHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', OnInventoryUpdated);
        m_profileCustomizationHandler = $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_ItemCustomizationNotification', OnItemCustomization);
        $.GetContextPanel().RegisterForReadyEvents(true);
        $.RegisterEventHandler('ReadyForDisplay', $.GetContextPanel(), () => {
            _UpdateStoreState();
            CheckForPopulateItems(true);
            if (!m_profileUpdateHandler) {
                m_profileUpdateHandler = $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', OnInventoryUpdated);
            }
            if (!m_profileCustomizationHandler) {
                m_profileCustomizationHandler = $.RegisterForUnhandledEvent('PanoramaComponent_Inventory_ItemCustomizationNotification', OnItemCustomization);
            }
        });
        $.RegisterEventHandler('UnreadyForDisplay', $.GetContextPanel(), () => {
            if (m_schTimer) {
                $.CancelScheduled(m_schTimer);
                m_schTimer = null;
            }
            if (m_profileUpdateHandler) {
                $.UnregisterForUnhandledEvent('PanoramaComponent_MyPersona_InventoryUpdated', m_profileUpdateHandler);
                m_profileUpdateHandler = null;
            }
            if (m_profileCustomizationHandler) {
                $.UnregisterForUnhandledEvent('PanoramaComponent_Inventory_ItemCustomizationNotification', m_profileCustomizationHandler);
                m_profileCustomizationHandler = null;
            }
        });
    };

    function StoreAPI_GetPersonalStore() {
        return {
            generation_time: Date.now(),
            items: {
                'item1': { name: 'Item One', price: 100 },
                'item2': { name: 'Item Two', price: 200 },
                'item3': { name: 'Item Three', price: 300 },
                'item4': { name: 'Item Four', price: 400 },
            },
            redeemable_balance: 50 
        };
    }

    function CheckForPopulateItems(bFirstTime = false, claimedItemId = '') {
        const objStore = StoreAPI_GetPersonalStore(); 
        const genTime = objStore ? objStore.generation_time : 0; 

        if (genTime != m_timeStamp || claimedItemId) {
            if (genTime != m_timeStamp) {
                m_timeStamp = genTime;
                GameInterfaceAPI.SetSettingString('cl_redemption_reset_timestamp', genTime);
            }
            PopulateItems(bFirstTime, claimedItemId);
        }
    }

    function _CreateItemPanel(itemId, index, bFirstTime, claimedItemId = '') {
        const objStore = StoreAPI_GetPersonalStore();
        const itemData = objStore.items[itemId];

        if (!itemData) {
            console.warn(`Item not found: ${itemId}`);
            return;
        }

        const elItemContainer = $.GetContextPanel().FindChildTraverse('jsRrsItemContainer');
        let elGhostItem = $.CreatePanel('Panel', elItemContainer, 'itemdrop-' + index + '-' + itemId);
        elGhostItem.BLoadLayout('file://{resources}/layout/itemtile_store.xml', false, false);

        const oItemData = {
            id: itemId,
            name: itemData.name,
            price: itemData.price,
            isDropItem: true,
            noDropsEarned: false,
        };
        ItemTileStore.Init(elGhostItem, oItemData);
        elGhostItem.Data().itemid = itemId;
        elGhostItem.Data().cost = itemData.price;
        elGhostItem.Data().index = index;

        _OnGhostItemActivate(elGhostItem, itemId);
    }

    function PopulateItems(bFirstTime = false, claimedItemId = '') {
        const objStore = StoreAPI_GetPersonalStore();

        $.GetContextPanel().RemoveClass('waiting');
        if (bFirstTime) {
            $.GetContextPanel().TriggerClass('reveal-store');
        }

        const elItemContainer = $.GetContextPanel().FindChildTraverse('jsRrsItemContainer');
        elItemContainer.RemoveAndDeleteChildren();

        const arrItemIds = objStore ? Object.keys(objStore.items) : ['-', '-', '-', '-'];
        for (let i = 0; i < arrItemIds.length; i++) {
            _CreateItemPanel(arrItemIds[i], i, bFirstTime, claimedItemId);
        }

        _UpdateAllItemStyles();
    }

    function _UpdateAllItemStyles() {
    }

    function _UpdateStoreState() {
        const objStore = StoreAPI_GetPersonalStore();
        m_redeemableBalance = objStore ? objStore.redeemable_balance : 0;
        const elClaimButton = $.GetContextPanel().FindChildTraverse('jsRrsClaimButton');
        elClaimButton.enabled = m_redeemableBalance !== 0;
        elClaimButton.SetHasClass('hide', m_redeemableBalance === 0);
        if (m_redeemableBalance > 0) {
            elClaimButton.SetDialogVariable('value', m_redeemableBalance);
        }
        _SetXpProgress();
    }

    function _SetXpProgress() {
        const elXpBar = $.GetContextPanel().FindChildTraverse('jsRrsXpBar');
        const xpValue = StoreAPI.GetXpEarned();
        const xpRequired = StoreAPI.GetXpRequired();
        const percent = Math.floor((xpValue / xpRequired) * 100);
        elXpBar.style.width = percent + '%';
    }

    function OnInventoryUpdated() {
        CheckForPopulateItems();
        _UpdateStoreState();
    }

    function OnItemCustomization(itemId) {
        CheckForPopulateItems(true, itemId);
        _UpdateStoreState();
    }

    function OnRedeem() {
        if (m_redeemableBalance > 0) {
            _msg('Redeemed successfully!');
        } else {
            _msg('No redeemable balance available.');
        }
    }

    function Init() {
        RegisterForInventoryUpdate();
        CheckForPopulateItems(true);
    }

    RankUpRedemptionStore.Init = Init;
    RankUpRedemptionStore.OnRedeem = OnRedeem;

})(RankUpRedemptionStore);
