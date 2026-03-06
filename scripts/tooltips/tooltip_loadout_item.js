"use strict";

if (!$.TooltipLoadoutItem) {
    $.TooltipLoadoutItem = {};
}

$.TooltipLoadoutItem.SetupTooltip = function () {
    var ctx = $.GetContextPanel();
    if (!ctx) return;

    var id = ctx.GetAttributeString("itemid", "");
    var nameOnly = ctx.GetAttributeString("nameonly", "");
    var slot = ctx.GetAttributeString("slot", "");
    var idForItemName = id;

    if (slot === "spray0") {
        idForItemName = ItemInfo.GetFauxReplacementItemID(id, "graffiti");
    }
    ctx.SetDialogVariable("name", InventoryAPI.GetItemName(idForItemName));
    var color = InventoryAPI.GetItemRarityColor(id);
    var nameLabel = ctx.FindChildInLayoutFile("id-tooltip-layout-name");
    if (nameLabel) {
        nameLabel.style.color = color || "white";
    }
    var descLabel = ctx.FindChildInLayoutFile("id-tooltip-layout-desc");
    var separator = ctx.FindChildInLayoutFile("id-tooltip-layout-seperator");
    if (descLabel) descLabel.visible = nameOnly === "true";
    if (separator) separator.visible = nameOnly === "true";
	
    if (nameOnly === "true") {
        var defName = InventoryAPI.GetItemDefinitionName(id);
        defName = defName ? defName.replace("weapon_", "") : "";
        ctx.SetDialogVariable("desc", $.Localize("#csgo_item_usage_desc_" + defName));
    }
};
