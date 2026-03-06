"use strict";

// -----------------------------------------------------------------------------
// FAKE / MOCKED APIs FOR PANORAMA (NO console.log)
// -----------------------------------------------------------------------------

var $ = $ || {
    GetContextPanel: () => ({
        FindChildTraverse: (id) => ({
            id: id,
            enabled: true,
            style: {},
            RemoveAndDeleteChildren: () => $.Msg(`[UI] Cleared children of ${id}`),
            SetHasClass: (cls, state) => $.Msg(`[UI] ${id}: class '${cls}' = ${state}`),
            SetDialogVariable: (name, val) => $.Msg(`[UI] ${id}: dialog var '${name}' = ${val}`),
            TriggerClass: (cls) => $.Msg(`[UI] Trigger class '${cls}' on ${id}`),
        }),
        RegisterForReadyEvents: (b) => $.Msg(`[UI] Registered for ready events (${b})`),
        RemoveClass: (cls) => $.Msg(`[UI] Removed class '${cls}'`),
        TriggerClass: (cls) => $.Msg(`[UI] Triggered '${cls}'`),
    }),
    RegisterForUnhandledEvent: (eventName, fn) => {
        $.Msg(`[EVENT] Registered for ${eventName}`);
        return fn;
    },
    UnregisterForUnhandledEvent: (eventName, fn) => {
        $.Msg(`[EVENT] Unregistered from ${eventName}`);
    },
    RegisterEventHandler: (event, panel, handler) => {
        $.Msg(`[EVENT] Registered handler '${event}'`);
        return handler;
    },
    CancelScheduled: (handle) => $.Msg(`[SCHEDULE] Cancelled handle ${handle}`),
    CreatePanel: (type, parent, id) => ({
        id: id,
        BLoadLayout: (layout, a, b) => $.Msg(`[UI] Loaded layout '${layout}' for ${id}`),
        Data: (data) => {
            if (data) this._data = data;
            return this._data || {};
        },
    }),
    Msg: (t) => $.DispatchEvent('PanoramaComponent_Debug_Message', t),
    Warning: (t) => $.DispatchEvent('PanoramaComponent_Debug_Warning', t),
};

// Fake Game Interface API
var GameInterfaceAPI = {
    SetSettingString: (key, val) => $.Msg(`[GAME] SetSettingString(${key}, ${val})`),
};

// Fake Store API
var StoreAPI = {
    GetXpEarned: () => 2300,
    GetXpRequired: () => 5000,
};

// Fake ItemTileStore
var ItemTileStore = {
    Init: (panel, data) => {
        $.Msg(`[ITEM] Initialized ${data.name} (id=${data.id}, price=${data.price})`);
    },
};

// -----------------------------------------------------------------------------
// ACTUAL RANKUP REDEMPTION STORE LOGIC
// -----------------------------------------------------------------------------

var RankUpRedemptionStore = RankUpRedemptionStore || {};

(function (RankUpRedemptionStore) {
    let m_redeemableBalance = 0;
    let m_timeStamp = -1;
    let m_profileCustomizationHandler;
    let m_profileUpdateHandler;
    let m_registered = false;
    let m_schTimer;

    function _msg(text) {
        $.Msg("[MESSAGE] " + text);
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
        });
        $.RegisterEventHandler('UnreadyForDisplay', $.GetContextPanel(), () => {
            if (m_schTimer) {
                $.CancelScheduled(m_schTimer);
                m_schTimer = null;
            }
        });
    }

    function StoreAPI_GetPersonalStore() {
        return {
            generation_time: Date.now(),
            items: {
                'item1': { name: 'Classic Knife', price: 100 },
                'item2': { name: 'Dragon Lore', price: 200 },
                'item3': { name: 'Music Kit', price: 300 },
                'item4': { name: 'Sticker Capsule', price: 400 },
            },
            redeemable_balance: Math.floor(Math.random() * 100),
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
        if (!itemData) return $.Warning(`Item not found: ${itemId}`);

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

    function _UpdateAllItemStyles() {}

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

function _SetXpProgress(percent)
{
    var elXpBar = $.GetContextPanel().FindChildInLayoutFile('JsPlayerXpBarInner');
    if (!elXpBar)
    {
        $.Msg('[RankUpRedemptionStore] Warning: JsPlayerXpBarInner not found.');
        return;
    }

    // Handle undefined or invalid percent
    if (percent === undefined || isNaN(percent))
    {
        $.Msg('[RankUpRedemptionStore] Warning: Invalid percent value: ' + percent);
        percent = 0; // fallback to 0%
    }

    // Clamp between 0–100
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;

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
            _msg(`Redeemed ${m_redeemableBalance} points successfully!`);
            m_redeemableBalance = 0;
            _UpdateStoreState();
        } else {
            _msg('No redeemable balance available.');
        }
    }

    function Init() {
        $.Msg('[RankUpRedemptionStore] Initializing...');
        RegisterForInventoryUpdate();
        CheckForPopulateItems(true);
    }

    RankUpRedemptionStore.Init = Init;
    RankUpRedemptionStore.OnRedeem = OnRedeem;

})(RankUpRedemptionStore);

// -----------------------------------------------------------------------------
// TEST (you can remove this bottom part if it auto-runs in layout)
// -----------------------------------------------------------------------------
RankUpRedemptionStore.Init();
$.Schedule(2.0, () => RankUpRedemptionStore.OnRedeem());
