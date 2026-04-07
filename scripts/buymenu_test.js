"use strict";

// Item definitions: name, price, icon, console command
var g_ItemData = {
    // Pistols
    "glock":   { name: "Glock-18", price: 200, icon: "file://{images}/icons/equipment/glock.svg" },
    "usp_silencer": { name: "USP-S", price: 200, icon: "file://{images}/icons/equipment/usp_silencer.svg" },
    "p250":    { name: "P250", price: 300, icon: "file://{images}/icons/equipment/p250.svg" },
    "deagle":  { name: "Desert Eagle", price: 700, icon: "file://{images}/icons/equipment/deagle.svg" },
    "fiveseven": { name: "Five-SeveN", price: 500, icon: "file://{images}/icons/equipment/fiveseven.svg" },
    "tec9":    { name: "Tec-9", price: 500, icon: "file://{images}/icons/equipment/tec9.svg" },
    "elite": { name: "Dual Berettas", price: 400, icon: "file://{images}/icons/equipment/elite.svg" },

    // SMGs
    "mac10":   { name: "MAC-10", price: 1050, icon: "file://{images}/icons/equipment/mac10.svg" },
    "mp9":     { name: "MP9", price: 1250, icon: "file://{images}/icons/equipment/mp9.svg" },
    "mp7":     { name: "MP7", price: 1500, icon: "file://{images}/icons/equipment/mp7.svg" },
    "ump45":   { name: "UMP-45", price: 1200, icon: "file://{images}/icons/equipment/ump45.svg" },
    "p90":     { name: "P90", price: 2350, icon: "file://{images}/icons/equipment/p90.svg" },
    "bizon":   { name: "PP-Bizon", price: 1400, icon: "file://{images}/icons/equipment/bizon.svg" },

    // Rifles
    "ak47":    { name: "AK-47", price: 2700, icon: "file://{images}/icons/equipment/ak47.svg" },
    "m4a1":    { name: "M4A4", price: 2900, icon: "file://{images}/icons/equipment/m4a1.svg" },
    "m4a1_silencer": { name: "M4A1-S", price: 2900, icon: "file://{images}/icons/equipment/m4a1_silencer.svg" },
    "famas":   { name: "FAMAS", price: 1900, icon: "file://{images}/icons/equipment/famas.svg" },
    "galilar": { name: "Galil AR", price: 1800, icon: "file://{images}/icons/equipment/galilar.svg" },
    "aug":     { name: "AUG", price: 3300, icon: "file://{images}/icons/equipment/aug.svg" },
    "sg556":   { name: "SG 553", price: 3000, icon: "file://{images}/icons/equipment/sg556.svg" },

    // Snipers
    "awp":     { name: "AWP", price: 4750, icon: "file://{images}/icons/equipment/awp.svg" },
    "ssg08":   { name: "SSG 08", price: 1700, icon: "file://{images}/icons/equipment/ssg08.svg" },
    "scar20":  { name: "SCAR-20", price: 5000, icon: "file://{images}/icons/equipment/scar20.svg" },
    "g3sg1":   { name: "G3SG1", price: 5000, icon: "file://{images}/icons/equipment/g3sg1.svg" },

    // Heavy
    "nova":    { name: "Nova", price: 1050, icon: "file://{images}/icons/equipment/nova.svg" },
    "xm1014":  { name: "XM1014", price: 2000, icon: "file://{images}/icons/equipment/xm1014.svg" },
    "mag7":    { name: "MAG-7", price: 1300, icon: "file://{images}/icons/equipment/mag7.svg" },
    "sawedoff":{ name: "Sawed-Off", price: 1200, icon: "file://{images}/icons/equipment/sawedoff.svg" },
    "m249":    { name: "M249", price: 5200, icon: "file://{images}/icons/equipment/m249.svg" },
    "negev":   { name: "Negev", price: 1700, icon: "file://{images}/icons/equipment/negev.svg" },

    // Grenades
    "hegrenade": { name: "HE Grenade", price: 300, icon: "file://{images}/icons/equipment/hegrenade.svg" },
    "flashbang": { name: "Flashbang", price: 200, icon: "file://{images}/icons/equipment/flashbang.svg" },
    "smokegrenade": { name: "Smoke Grenade", price: 300, icon: "file://{images}/icons/equipment/smokegrenade.svg" },
    "molotov": { name: "Molotov", price: 400, icon: "file://{images}/icons/equipment/molotov.svg" },
    "incgrenade": { name: "Incendiary Grenade", price: 500, icon: "file://{images}/icons/equipment/incgrenade.svg" },
    "decoy":   { name: "Decoy Grenade", price: 50, icon: "file://{images}/icons/equipment/decoy.svg" },

    // Equipment
    "vest":    { name: "Kevlar", price: 650, icon: "file://{images}/icons/equipment/kevlar.svg" },
    "vesthelm":{ name: "Kevlar + Helmet", price: 1000, icon: "file://{images}/icons/equipment/helmet.svg" },
    "defuser": { name: "Defuse Kit", price: 400, icon: "file://{images}/icons/equipment/defuser.svg" },
    "taser":   { name: "Zeus x27", price: 200, icon: "file://{images}/icons/equipment/taser.svg" }
};

// Issue buy command
function BuyWeapon(weapon) {
    GameInterfaceAPI.ConsoleCommand("buy " + weapon);
}

// Populate category container with item panels
function PopulateCategory(containerId, items) {
    var container = $("#" + containerId);
    container.RemoveAndDeleteChildren();

    items.forEach(function(weapon) {
        var data = g_ItemData[weapon];
        if (!data) return;

        var panel = $.CreatePanel("Panel", container, "");
        panel.BLoadLayoutSnippet("ItemPanel");

        panel.FindChildInLayoutFile("ItemName").text = data.name;
        panel.FindChildInLayoutFile("ItemPrice").text = "$" + data.price;
        panel.FindChildInLayoutFile("ItemIcon").SetImage(data.icon);

        var buyButton = panel.FindChildInLayoutFile("BuyButton");
        buyButton.SetPanelEvent("onactivate", function() {
            BuyWeapon(weapon);
        });
    });
}

// Detect team side using XUID
function GetTeamSide() {
    var xuid = GameStateAPI.GetLocalPlayerXuid();
    if (!xuid || xuid === "0") return "SPEC";

    var team = GameStateAPI.GetPlayerTeamNumber(xuid); // 2 = T, 3 = CT, 0/other = none
    if (team === 2) return "T";
    if (team === 3) return "CT";
    return "SPEC";
}

// Initialize categories based on side
// Initialize categories based on side
function PopulateAll() {
    var side = GetTeamSide();

    // Equipment (shared)
    PopulateCategory("CategoryContainer1", ["vest","vesthelm","defuser","taser"]);

    // Pistols
    if (side === "T") {
        PopulateCategory("CategoryContainer2", ["glock","p250","deagle","tec9","elite"]);
    } else if (side === "CT") {
        PopulateCategory("CategoryContainer2", ["usp_silencer","p250","deagle","fiveseven","elite"]);
    } else {
        PopulateCategory("CategoryContainer2", ["glock","usp_silencer","p250","deagle","fiveseven","tec9","elite"]);
    }

    // Mid-tier (SMGs + Heavy)
    if (side === "T") {
        // no mp9, no mag7
        PopulateCategory("CategoryContainer3", [
            "mac10","mp7","ump45","p90","bizon",
            "nova","xm1014","sawedoff","m249","negev"
        ]);
    } else if (side === "CT") {
        PopulateCategory("CategoryContainer3", [
            "mp9","mp7","ump45","p90","bizon",
            "nova","xm1014","mag7","m249","negev"
        ]);
    } else {
        // spectator/dev: show all
        PopulateCategory("CategoryContainer3", [
            "mac10","mp9","mp7","ump45","p90","bizon",
            "nova","xm1014","mag7","sawedoff","m249","negev"
        ]);
    }

    // Rifles + Snipers
    if (side === "T") {
        PopulateCategory("CategoryContainer4", ["ak47","galilar","sg556","awp","ssg08","g3sg1"]);
    } else if (side === "CT") {
        PopulateCategory("CategoryContainer4", ["m4a1","m4a1_silencer","famas","aug","awp","ssg08","scar20"]);
    } else {
        PopulateCategory("CategoryContainer4", [
            "ak47","galilar","sg556","m4a1","m4a1_silencer","famas","aug",
            "awp","ssg08","scar20","g3sg1"
        ]);
    }

    // Grenades
    if (side === "T") {
        // no incendiary
        PopulateCategory("CategoryContainer5", ["hegrenade","flashbang","smokegrenade","molotov","decoy"]);
    } else if (side === "CT") {
        PopulateCategory("CategoryContainer5", ["hegrenade","flashbang","smokegrenade","incgrenade","decoy"]);
    } else {
        PopulateCategory("CategoryContainer5", ["hegrenade","flashbang","smokegrenade","molotov","incgrenade","decoy"]);
    }
}


// Looping update so side changes are reflected
function UpdateBuyMenu() {
    PopulateAll();
    $.Schedule(0.5, UpdateBuyMenu); // re-run every 0.5s while menu is open
}

// Start the loop when the menu opens
(function() {
    UpdateBuyMenu();
})();
