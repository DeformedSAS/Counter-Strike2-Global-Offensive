"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="avatar.ts" />
/// <reference path="common/sessionutil.ts" />
/// <reference path="mock_adapter.ts" />
/// <reference path="rating_emblem.ts" />
/// <reference path="honor_icon.ts" />
var VanityPlayerInfo;
var OVERRIDE_PREMIER_SCORE = 25000;
(function (VanityPlayerInfo) {

    function CreateOrUpdateVanityInfoPanel(elParent = null, oSettings = null) {
        if (!elParent || !oSettings)
            return;
        _SetName(elParent, oSettings.xuid);
        _SetAvatar(elParent, oSettings.xuid);
        _SetRank(elParent, oSettings.xuid);
        _SetSkillGroup(elParent, oSettings.xuid);
        _SetHonorIcon(elParent, oSettings.xuid);
        _SetLobbyLeader(elParent, oSettings.xuid);
        _ShowSettingsBtn(elParent, oSettings.xuid);
		UpdateVoiceIcon(elParent, oSettings.xuid);

        const container = elParent.FindChildInLayoutFile('vanity-info-container') || elParent;
        _AddOpenPlayerCardAction(container, oSettings.xuid);
    }
    VanityPlayerInfo.CreateOrUpdateVanityInfoPanel = CreateOrUpdateVanityInfoPanel;

    function DeleteVanityInfoPanel(elParent, index) {
        const idPrefix = "id-player-vanity-info-" + index;
        const elPanel = elParent.FindChildInLayoutFile(idPrefix);
        if (elPanel && elPanel.IsValid()) {
            elPanel.DeleteAsync(0);
        }
    }
    VanityPlayerInfo.DeleteVanityInfoPanel = DeleteVanityInfoPanel;

    function _RoundToPixel(context, value, axis) {
        const scale = axis === "x" ? context.actualuiscale_x : context.actualuiscale_y;
        return Math.round(value * scale) / scale;
    }

    function SetVanityInfoPanelPos(elParent, index, oPos, idPrefix, OnlyXOrY) {
        const elPanel = elParent.FindChildInLayoutFile(idPrefix);
        if (elPanel && elPanel.IsValid()) {
            switch (OnlyXOrY) {
                case 'x':
                    elPanel.style.transform = "translateX( " + oPos.x + "px );";
                    break;
                case 'y':
                    elPanel.style.transform = "translateY( " + oPos.x + "px );";
                    break;
                default:
                    elPanel.style.transform = "translate3d( " + _RoundToPixel(elParent, oPos.x, "x") + "px, " + _RoundToPixel(elParent, oPos.y, "y") + "px, 0px );";
                    break;
            }
        }
    }
    VanityPlayerInfo.SetVanityInfoPanelPos = SetVanityInfoPanelPos;

    function _SetName(newPanel, xuid) {
        let name = "#SFUI_UnknownPlayer";
        if (xuid === MyPersonaAPI.GetXuid()) {
            name = MyPersonaAPI.GetName();
        } else if (typeof MockAdapter !== 'undefined' && MockAdapter.IsFakePlayer(xuid)) {
            name = MockAdapter.GetPlayerName(xuid);
        } else {
            name = FriendsListAPI.GetFriendName(xuid) || name;
        }
        newPanel.SetDialogVariable('player_name', name);
    }

    function _SetAvatar(newPanel, xuid) {
        const elParent = newPanel.FindChildInLayoutFile('vanity-avatar-container');
        if (!elParent) return;

        elParent.RemoveAndDeleteChildren();

        let elAvatar = elParent.FindChildInLayoutFile('JsPlayerVanityAvatar-' + xuid);
        if (!elAvatar) {
            elAvatar = $.CreatePanel("Panel", elParent, 'JsPlayerVanityAvatar-' + xuid);
            elAvatar.SetAttributeString('xuid', xuid);
            elAvatar.BLoadLayout('file://{resources}/layout/avatar.xml', false, false);
            elAvatar.BLoadLayoutSnippet("AvatarPlayerCard");
            elAvatar.AddClass('avatar--vanity');
        }
        Avatar.Init(elAvatar, xuid, 'playercard');

        if (typeof MockAdapter !== 'undefined' && MockAdapter.IsFakePlayer(xuid)) {
            const elAvatarImage = elAvatar.FindChildInLayoutFile("JsAvatarImage");
            if (elAvatarImage) elAvatarImage.PopulateFromPlayerSlot(MockAdapter.GetPlayerSlot(xuid));
        }
    }

    function _SetRank(newPanel, xuid, isLocalPlayer) {
        var elRankIcon = newPanel.FindChildInLayoutFile('vanity-xp-icon');
        var elXpBarInner = newPanel.FindChildInLayoutFile('vanity-xp-bar-inner');
        var xpContainer = newPanel.FindChildInLayoutFile('vanity-xp-container');

        if (!xpContainer || !elXpBarInner) return;

        if (isLocalPlayer === undefined) {
            isLocalPlayer = (xuid === MyPersonaAPI.GetXuid());
        }

        if (!isLocalPlayer) {
            xpContainer.visible = false;
            return;
        }

        if (!MyPersonaAPI.IsInventoryValid()) {
            xpContainer.visible = false;
            return;
        }

        var currentLvl = FriendsListAPI.GetFriendLevel(xuid);
        var totalXp = FriendsListAPI.GetFriendXp(xuid);
        var pointsPerLevel = MyPersonaAPI.GetXpPerLevel();

        if (!currentLvl || currentLvl === 0) {
            xpContainer.visible = false;
            return;
        }

        xpContainer.visible = true;

        var hasFreezeFn = typeof _HasXpProgressToFreeze === "function";
        var hasPrimeFn = typeof _IsPlayerPrime === "function";
        var hasPrestigeFn = typeof _ShowPrestigeUpgrade === "function";

        var hasFreeze = hasFreezeFn ? _HasXpProgressToFreeze() : false;
        var isPrime = hasPrimeFn ? _IsPlayerPrime(xuid) : true;

        if (!currentLvl || (!hasFreeze && !isPrime)) {
            newPanel.AddClass('no-valid-xp');
            return;
        }

        var freezeNoPrestige = (!isPrime && hasFreeze);

        if (freezeNoPrestige) {
            elXpBarInner.GetParent().visible = false;
        } else {
            var currentProgress = totalXp % pointsPerLevel;
            var percent = (currentProgress / pointsPerLevel) * 100;
            var safePercent = Math.min(Math.max(percent, 0), 100);

            elXpBarInner.style.width = safePercent + '%';
            elXpBarInner.GetParent().visible = true;
            
            if (hasPrestigeFn) {
                _ShowPrestigeUpgrade(newPanel, xuid, isLocalPlayer);
            }
        }

        if (elRankIcon) {
            elRankIcon.SetImage('file://{images}/icons/xp/level' + currentLvl + '.png');
        }

        newPanel.RemoveClass('no-valid-xp');
    }
	
    function _SetSkillGroup(newPanel, xuid) {
    const isLocalPlayer = (xuid === MyPersonaAPI.GetXuid());
    let rating_type, score, wins;

    if (isLocalPlayer && !PartyListAPI.IsPartySessionActive()) {
        rating_type = 'Premier';
        score = (OVERRIDE_PREMIER_SCORE !== null) ? OVERRIDE_PREMIER_SCORE : MyPersonaAPI.GetPipRankCount(rating_type);
        wins = MyPersonaAPI.GetPipRankWins(rating_type);
    } else {
        rating_type = PartyListAPI.GetFriendCompetitiveRankType(xuid);
        score = (rating_type === 'Premier' && OVERRIDE_PREMIER_SCORE !== null) ? OVERRIDE_PREMIER_SCORE : PartyListAPI.GetFriendCompetitiveRank(xuid);
        wins = PartyListAPI.GetFriendCompetitiveWins(xuid);
    }

    var skillGroup = PartyListAPI.GetFriendCompetitiveRank(xuid, rating_type);
    var winsNeededForRank = SessionUtil.GetNumWinsNeededForRank(rating_type);
    var elRank = newPanel.FindChildInLayoutFile('vanity-skillgroup-frame'); 

    if (wins < winsNeededForRank || (wins >= winsNeededForRank && skillGroup < 1) || !FriendsListAPI.GetFriendPrimeEligible(xuid)) {
        elRank.visible = false;
        if (rating_type !== 'Premier') return;
    }
    var imageName = (rating_type !== 'Competitive') ? rating_type : 'skillgroup';
    elRank.SetImage('file://{images}/icons/skillgroups/' + imageName + skillGroup + '.svg');
    elRank.visible = true;
    let options = {
        root_panel: newPanel,
        do_fx: true,
        full_details: false,
        rating_type: rating_type,
        leaderboard_details: { score: score, matchesWon: wins },
        local_player: isLocalPlayer
    };

    RatingEmblem.SetXuid(options);
    newPanel.SetDialogVariable('rating-text', RatingEmblem.GetRatingDesc(newPanel));
    }

    function _SetHonorIcon(elPanel, xuid) {
        const honorIconOptions = {
            honor_icon_frame_panel: elPanel.FindChildTraverse('jsHonorIcon'),
            debug_xuid: xuid,
            do_fx: false,
            prime_value: PartyListAPI.GetFriendPrimeEligible(xuid)
        };
        HonorIcon.SetOptions(honorIconOptions);
    }
	function _ShowPrestigeUpgrade(elPanel, xuid, isLocalPlayer) {
        let bPrestigeAvailable = isLocalPlayer && (FriendsListAPI.GetFriendLevel(xuid) >= InventoryAPI.GetMaxLevel());
        elPanel.FindChildInLayoutFile('vanity-xp-prestige').SetHasClass('hidden', !bPrestigeAvailable);
        if (bPrestigeAvailable) {
            elPanel.FindChildInLayoutFile('vanity-xp-prestige').SetPanelEvent('onactivate', _OnActivateGetPrestigeButtonClickable);
        }
    }
	var _OnActivateGetPrestigeButtonClickable = function()
	{
		UiToolkitAPI.ShowCustomLayoutPopupParameters(
			'',
			'file://{resources}/layout/popups/popup_inventory_inspect.xml',
			'itemid=' + '0' +                                                                                          
			'&' + 'asyncworkitemwarning=no' +
			'&' + 'asyncworktype=prestigecheck'
		);
	};

    function UpdateVoiceIcon(elAvatar, xuid) {
        Avatar.UpdateTalkingState(elAvatar, xuid);
    }
    VanityPlayerInfo.UpdateVoiceIcon = UpdateVoiceIcon;

    function _SetLobbyLeader(elPanel, xuid) {
        const isLeader = LobbyAPI.GetHostSteamID() === xuid;
        elPanel.SetHasClass('is-not-leader', !isLeader);
        const crown = elPanel.FindChildInLayoutFile('vanity-crown-icon');
        if (crown) crown.SetHasClass('hidden', !isLeader);
    }

    function _HasXpProgressToFreeze() {
        return MyPersonaAPI.HasPrestige() || (MyPersonaAPI.GetCurrentLevel() > 2);
    }

    function _IsPlayerPrime(xuid) {
        return FriendsListAPI.GetFriendPrimeEligible(xuid);
    }

    function _ShowSettingsBtn(elPanel, xuid) {
        elPanel.SetHasClass("show-controls", MyPersonaAPI.GetXuid() === xuid);
    }

    function _AddOpenPlayerCardAction(elPanel, xuid) {
        if (!elPanel) return;
        elPanel.SetPanelEvent("onactivate", function() {
            if (xuid && xuid !== "0") {
                const contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent('', '', 'file://{resources}/layout/context_menus/context_menu_playercard.xml', 'xuid=' + xuid, function() { });
                if (contextMenuPanel) {
                    contextMenuPanel.AddClass("ContextMenu_NoArrow");
                }
            }
        });
    }
})(VanityPlayerInfo || (VanityPlayerInfo = {}));