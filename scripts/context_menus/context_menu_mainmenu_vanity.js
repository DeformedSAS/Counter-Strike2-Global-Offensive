'use strict';

var MainMenuVanityContextMenu = (function () {

    var team;

    function _Init() {
        team = $.GetContextPanel().GetAttributeString("team", "");

        var elContextMenuBodyNoScroll = $.GetContextPanel().FindChildTraverse('ContextMenuBodyNoScroll');
        var elContextMenuBodyWeapons = $.GetContextPanel().FindChildTraverse('ContextMenuBodyWeapons');

        elContextMenuBodyNoScroll.RemoveAndDeleteChildren();
        elContextMenuBodyWeapons.RemoveAndDeleteChildren();

        function addVanityPopupMenuItem(id, label, onClick) {
            var elItem = $.CreatePanel('Button', elContextMenuBodyNoScroll, id);
            elItem.BLoadLayoutSnippet('snippet-vanity-item');
            elItem.FindChildTraverse('id-vanity-item__label').text = $.Localize(label);
            elItem.SetPanelEvent('onactivate', onClick);
            return elItem;
        }

        function createWeaponButton(parent, weaponID) {
            var elItem = $.CreatePanel('Button', parent, weaponID);
            elItem.BLoadLayoutSnippet('snippet-vanity-item');
            elItem.AddClass('vanity-item--weapon');
            var elLabel = elItem.FindChildTraverse('id-vanity-item__label');
            elLabel.text = ItemInfo.GetName(weaponID);

            var elRarity = elItem.FindChildTraverse('id-vanity-item__rarity');
            var rarityColor = ItemInfo.GetRarityColor(weaponID);
            elRarity.style.backgroundColor = `gradient(linear, 0% 0%, 100% 0%, from(${rarityColor}), color-stop(0.0125, #00000000), to(#00000000));`;

            elItem.SetPanelEvent('onactivate', function () {
                var shortTeam = CharacterAnims.NormalizeTeamName(team, true);
                var loadoutSubSlot = ItemInfo.GetSlotSubPosition(weaponID);
                GameInterfaceAPI.SetSettingString(`ui_vanitysetting_loadoutslot_${shortTeam}`, loadoutSubSlot);
                $.DispatchEvent('ForceRestartVanity');
                $.DispatchEvent('ContextMenuEvent', '');
            });

            return elItem;
        }

        var otherTeam = (team == 2) ? 'ct' : 't';
        addVanityPopupMenuItem(
            'switchTo_' + otherTeam,
            '#mainmenu_switch_vanity_to_' + otherTeam,
            function () {
                $.DispatchEvent("MainMenuSwitchVanity", otherTeam);
                $.DispatchEvent('ContextMenuEvent', '');
            }
        ).AddClass('BottomSeparator');

        var standardWeapons = ItemInfo.GetLoadoutWeapons(team) || [];
        var advancedWeapons = [
            "17293822569102704686",
            "17293822569102704687",
            "17293822569102704683",
            "17293822569102704684",
            "17293822569102704685",
            "17293822569102704671"
        ];

        standardWeapons.concat(advancedWeapons).forEach(function (weaponID) {
            createWeaponButton(elContextMenuBodyWeapons, weaponID);
        });

        var otherTeamCharacterID = LoadoutAPI.GetItemID(otherTeam, 'customplayer');
        var otherTeamSettings = ItemInfo.GetOrUpdateVanityCharacterSettings(otherTeamCharacterID);
        ItemInfo.PrecacheVanityCharacterSettings(otherTeamSettings);
    }

    return {
        Init: _Init,
    };

})();
