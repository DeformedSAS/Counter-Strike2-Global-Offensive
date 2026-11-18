'use strict';

var MainMenuVanityContextMenu = (function () {

    var team;

    function _Init() {
        team = $.GetContextPanel().GetAttributeString("team", "");
        var strType = $.GetContextPanel().GetAttributeString("type", "");

        var elContextMenuBodyNoScroll = $.GetContextPanel().FindChildTraverse('ContextMenuBodyNoScroll');
        var elContextMenuBodyWeapons = $.GetContextPanel().FindChildTraverse('ContextMenuBodyWeapons');

        if (elContextMenuBodyNoScroll) elContextMenuBodyNoScroll.RemoveAndDeleteChildren();
        if (elContextMenuBodyWeapons) elContextMenuBodyWeapons.RemoveAndDeleteChildren();

        if (strType === 'weapons') {
            if (elContextMenuBodyNoScroll) elContextMenuBodyNoScroll.style.visibility = 'collapse';
            if (elContextMenuBodyWeapons) elContextMenuBodyWeapons.style.visibility = 'visible';
            MakeWeaponBtns();
        } else if (strType === 'maps') {
            if (elContextMenuBodyWeapons) elContextMenuBodyWeapons.style.visibility = 'collapse';
            if (elContextMenuBodyNoScroll) elContextMenuBodyNoScroll.style.visibility = 'visible';
            MakeMapBtns();
        } else {
            if (elContextMenuBodyWeapons) elContextMenuBodyWeapons.style.visibility = 'collapse';
            if (elContextMenuBodyNoScroll) elContextMenuBodyNoScroll.style.visibility = 'visible';
            MakeMainCatBtns();
        }

        $.Schedule(0.0, function() {
            if ($.GetContextPanel() && $.GetContextPanel().IsValid()) {
                $.GetContextPanel().SetFocus();
            }
        });
    }

    function addVanityPopupMenuItem(id, label, onClick, parentPanel) {
        var parent = parentPanel || $.GetContextPanel().FindChildTraverse('ContextMenuBodyNoScroll');
        var elItem = $.CreatePanel('Button', parent, id);
        elItem.BLoadLayoutSnippet('snippet-vanity-item');
        var elLabel = elItem.FindChildTraverse('id-vanity-item__label');
        if (elLabel) {
            elLabel.text = (label.charAt(0) === '#') ? $.Localize(label) : label;
        }
        elItem.SetPanelEvent('onactivate', onClick);
        return elItem;
    }

    function MakeMainCatBtns() {
        addVanityPopupMenuItem('ChangeVanityMap', '#mainmenu_change_vanity_map', function () {
            var elVanityContextMenu = UiToolkitAPI.ShowCustomLayoutContextMenuParameters(
                '',
                'id-vanity-contextmenu-maps',
                'file://{resources}/layout/context_menus/context_menu_mainmenu_vanity.xml',
                'type=maps'
            );
            if (elVanityContextMenu && elVanityContextMenu.IsValid()) {
                elVanityContextMenu.AddClass('ContextMenu_NoArrow');
            }
            $.DispatchEvent('ContextMenuEvent', '');
        });

        addVanityPopupMenuItem('ChangeWeapon', '#mainmenu_change_vanity_weapon', function () {
            var elVanityContextMenu = UiToolkitAPI.ShowCustomLayoutContextMenuParameters(
                '',
                'id-vanity-contextmenu-weapons',
                'file://{resources}/layout/context_menus/context_menu_mainmenu_vanity.xml',
                'type=weapons&team=' + team
            );
            if (elVanityContextMenu && elVanityContextMenu.IsValid()) {
                elVanityContextMenu.AddClass('ContextMenu_NoArrow');
            }
            $.DispatchEvent('ContextMenuEvent', '');
        });

        var otherTeam = (team == '2') ? 'ct' : 't';
        addVanityPopupMenuItem(
            'switchTo_' + otherTeam,
            '#mainmenu_switch_vanity_to_' + otherTeam,
            function () {
                $.DispatchEvent("MainMenuSwitchVanity", otherTeam);
                $.DispatchEvent('ContextMenuEvent', '');
            }
        ).AddClass('BottomSeparator');

        addVanityPopupMenuItem('GoToLoadout', '#mainmenu_go_to_character_loadout', function () {
            $.DispatchEvent("MainMenuGoToCharacterLoadout", team);
            $.DispatchEvent('ContextMenuEvent', '');
        });

        var otherTeamCharacterID = LoadoutAPI.GetItemID(otherTeam, 'customplayer');
        var otherTeamSettings = ItemInfo.GetOrUpdateVanityCharacterSettings(otherTeamCharacterID);
        ItemInfo.PrecacheVanityCharacterSettings(otherTeamSettings);
    }

    function MakeWeaponBtns() {
        var elContextMenuBodyWeapons = $.GetContextPanel().FindChildTraverse('ContextMenuBodyWeapons');
        if (!elContextMenuBodyWeapons) {
            elContextMenuBodyWeapons = $.GetContextPanel().FindChildTraverse('ContextMenuBodyNoScroll');
        }

        function createWeaponButton(parent, weaponID) {
            var elItem = $.CreatePanel('Button', parent, weaponID);
            elItem.BLoadLayoutSnippet('snippet-vanity-item');
            elItem.AddClass('vanity-item--weapon');
            var elLabel = elItem.FindChildTraverse('id-vanity-item__label');
            
            var weaponName = ItemInfo.GetName(weaponID);
            if (!weaponName || weaponName === '') {
                weaponName = InventoryAPI.GetItemName(weaponID);
            }
            elLabel.text = weaponName ? weaponName : weaponID;

            var elRarity = elItem.FindChildTraverse('id-vanity-item__rarity');
            var rarityColor = ItemInfo.GetRarityColor(weaponID) || InventoryAPI.GetItemRarityColor(weaponID);
            if (rarityColor && elRarity) {
                elRarity.style.backgroundColor = `gradient(linear, 0% 0%, 100% 0%, from(${rarityColor}), color-stop(0.0125, #00000000), to(#00000000));`;
            }

            elItem.SetPanelEvent('onactivate', function () {
                var shortTeam = CharacterAnims.NormalizeTeamName(team, true);
                var loadoutSubSlot = ItemInfo.GetSlotSubPosition(weaponID);
                GameInterfaceAPI.SetSettingString(`ui_vanitysetting_loadoutslot_${shortTeam}`, loadoutSubSlot);
                $.DispatchEvent('ForceRestartVanity');
                $.DispatchEvent('ContextMenuEvent', '');
                $.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.generic_button_press', 'MOUSE' );
            });

            return elItem;
        }

        var standardWeaponsRaw = ItemInfo.GetLoadoutWeapons(team) || [];
        var advancedWeapons = [
            "17293822569102704686",
            "17293822569102704687",
            "17293822569102704683",
            "17293822569102704684",
            "17293822569102704685",
            "17293822569102704671"
        ];

        var standardWeapons = standardWeaponsRaw.map(function (pair) {
            return Array.isArray(pair) ? pair[1] : pair;
        });

        standardWeapons.concat(advancedWeapons).forEach(function (weaponID) {
            if (weaponID) {
                createWeaponButton(elContextMenuBodyWeapons, weaponID);
            }
        });
    }

    function MakeMapBtns() {
        var elContextMenuBodyNoScroll = $.GetContextPanel().FindChildTraverse('ContextMenuBodyNoScroll');
        
        var aMaps = [
            { token: '#SFUI_Map_de_cache', value: 'cache' },
            { token: '#SFUI_Map_de_ancient', value: 'ancient' },
            { token: '#SFUI_Map_de_ancient_day', value: 'ancient_day' },
            { token: '#SFUI_Map_de_ancient_night', value: 'ancient_night' },
            { token: '#SFUI_Map_de_anubis', value: 'anubis' },
            { token: '#SFUI_Map_de_overpass', value: 'overpass' },
            { token: '#SFUI_Map_de_vertigo', value: 'vertigo' },
            { token: '#SFUI_Map_cs_office', value: 'office' },
            { token: '#SFUI_Map_cs_italy', value: 'italy' },
            { token: '#SFUI_Map_de_nuke', value: 'nuke' },
            { token: '#SFUI_Map_de_nuke_outside', value: 'nuke_outside' },
            { token: '#SFUI_Map_de_dust2', value: 'dust2' },
            { token: '#SFUI_Map_de_train', value: 'train' },
            { token: '#SFUI_Map_de_mirage', value: 'mirage' },
            { token: '#SFUI_Map_de_inferno', value: 'inferno' },
            { token: 'Warehouse', value: 'warehouse' }
        ];

        for (var i = 0; i < aMaps.length; i++) {
            var mapObj = aMaps[i];
            (function (mapData) {
                addVanityPopupMenuItem('context-menu-vanity-' + mapData.value, mapData.token, function () {
                    GameInterfaceAPI.SetSettingString('ui_mainmenu_bkgnd_movie', mapData.value);
                    $.DispatchEvent('CSGOMainInitBackgroundMovie', $.GetContextPanel());
                    $.DispatchEvent('ContextMenuEvent', '');
                }, elContextMenuBodyNoScroll);
            })(mapObj);
        }
    }

    return {
        Init: _Init,
    };

})();