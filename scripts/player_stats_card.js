"use strict";

var PlayerStatsCard;
(function (PlayerStatsCard) {
    var CARD_ID = 'card';

    function Init(elParent, xuid, index) {
        var elCard = $.CreatePanel('Panel', elParent, CARD_ID);
        elCard.BLoadLayout("file://{resources}/layout/player_stats_card.xml", false, false);

        var nSlot = 0;
        try {
            nSlot = GameStateAPI.GetPlayerSlot( xuid );
        } catch (e) {
            nSlot = 0; 
        }

        elCard.SetDialogVariableInt('playerslot', Number(nSlot));
        elCard.SetDialogVariableInt('xuid', Number(xuid));
        
        var localXuid = MockAdapter.GetLocalPlayerXuid();
        elCard.SetHasClass('localplayer', xuid === localXuid);
        
        var snippet = '';
        var mode = MockAdapter.GetGameModeInternalName(false);
        switch (mode) {
            case 'training':
            case 'deathmatch':
                snippet = 'snippet-banner-dm';
                break;
            case 'gungameprogressive':
                snippet = "snippet-banner-ar";
                break;
            default:
                snippet = 'snippet-banner-classic';
                break;
        }

        var elJsBanner = elCard.FindChildTraverse('JsBanner');
        if (elJsBanner) elJsBanner.BLoadLayoutSnippet(snippet);

        var elBannerBG = elCard.FindChildTraverse('JsBannerBG');
        if (elBannerBG) {
            elBannerBG.SetImage('file://{images}/stats_cards/stats_card_banner_' + index + '.png');
        }

        var elCardBG = elCard.FindChildTraverse('JsCardBG');
        if (elCardBG) {
            var maxCoord = 100;
            var minCoord = -100;
            var randX = Math.floor(Math.random() * (maxCoord - minCoord) + minCoord);
            var randY = Math.floor(Math.random() * (maxCoord - minCoord) + minCoord);
            elCardBG.style.backgroundPosition = randX + '% ' + randY + '%';
        }

        _SetHonorIcon(elCard, xuid);
        return elCard;
    }
    PlayerStatsCard.Init = Init;

    function SetAccolade(elCard, accValue, accName, accPosition) {
        if (!isNaN(Number(accValue))) {
            accValue = String(Math.floor(Number(accValue)));
        }
        elCard.SetDialogVariable('accolade-value-string', accValue);
        elCard.SetDialogVariableTime('accolade-value-time', Number(accValue));
        elCard.SetDialogVariableInt('accolade-value-int', Number(accValue));
        
        var secondPlaceSuffix = (accPosition != '1') ? '_2' : '';
        elCard.SetDialogVariable('accolade-the-title', $.Localize('#accolade_' + accName + secondPlaceSuffix));
        elCard.SetDialogVariable('accolade-desc', $.Localize('#accolade_' + accName + '_desc' + secondPlaceSuffix, elCard));
        
        var valueToken = '#accolade_' + accName + '_value';
        var valueLocalized = $.Localize(valueToken, elCard);
        if (valueToken == valueLocalized) valueLocalized = '';
        
        elCard.SetDialogVariable('accolade-value', valueLocalized);
        elCard.SetHasClass('show-accolade', true);
    }
    PlayerStatsCard.SetAccolade = SetAccolade;

    function SetAvatar(elCard, xuid) {
    var elAvatarImage = elCard.FindChildTraverse('jsAvatar');
    
    if (elAvatarImage) {
        elAvatarImage.steamid = xuid;
        elAvatarImage.SetAttributeString("steamid", xuid);
        var team = MockAdapter.GetPlayerTeamName(xuid) || "CT";
        elAvatarImage.SwitchClass('teamstyle', 'team--' + team);
    }
    var name = "#SFUI_UnknownPlayer";

    if (xuid === MyPersonaAPI.GetXuid()) {
        name = MyPersonaAPI.GetName();
    } else if (typeof MockAdapter !== 'undefined' && MockAdapter.IsFakePlayer(xuid)) {
        name = MockAdapter.GetPlayerName(xuid);
    } else {
        var matchName = MockAdapter.GetPlayerName(xuid);
        if (matchName && matchName !== "#SFUI_UnknownPlayer") {
            name = matchName;
        } else {
            name = FriendsListAPI.GetFriendName(xuid) || "#SFUI_UnknownPlayer";
        }
    }
    elCard.SetDialogVariable('player_name', name);
    }
    PlayerStatsCard.SetAvatar = SetAvatar;

    function SetFlair(elCard, xuid) {
        var flairItemId = InventoryAPI.GetFlairItemId(xuid);
        if (flairItemId === "0" || !flairItemId) {
            var flairDefIdx = FriendsListAPI.GetFriendDisplayItemDefFeatured(xuid);
            flairItemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(flairDefIdx, 0);
            if (flairItemId === "0" || !flairItemId || flairDefIdx == 65535)
                return false;
        }
        var imagePath = InventoryAPI.GetItemInventoryImage(flairItemId);
        var elFlairImage = elCard.FindChildTraverse('jsFlairImage');
        if (elFlairImage) {
            elFlairImage.SetImage('file://{images_econ}' + imagePath + '_small.png');
            elCard.AddClass('show-flair');
        }
    }
    PlayerStatsCard.SetFlair = SetFlair;

    function SetSkillGroup(elCard, xuid) {
        var elEmblem = elCard.FindChildTraverse('jsRatingEmblem');
        if (!elEmblem) return;

        var rating_type = PartyListAPI.GetFriendCompetitiveRank(xuid, rating_type);
        var score = MockAdapter.GetPlayerCompetitiveRanking(xuid);
        var wins = "";
        
        var options = {
            root_panel: elEmblem,
            do_fx: true,
            full_details: true,
            rating_type: rating_type,
            leaderboard_details: { score: score, matchesWon: wins },
            local_player: xuid === MyPersonaAPI.GetXuid()
        };
        
        var bShowSkillGroup = RatingEmblem.SetXuid(options);
        if (bShowSkillGroup) {
            elCard.AddClass('show-skillgroup');
        } else {
            elCard.RemoveClass('show-skillgroup');
        }
    }
    PlayerStatsCard.SetSkillGroup = SetSkillGroup;

    function _SetHonorIcon(elPanel, xuid) {
        var elHonor = elPanel.FindChildTraverse('jsHonorIcon');
        if (!elHonor) return;

        var honorIconOptions = {
            honor_icon_frame_panel: elHonor,
            do_fx: true,
            //xptrail_value: GameStateAPI.GetPlayerXpTrailLevel(xuid)
        };
        HonorIcon.SetOptions(honorIconOptions);
    }

    function SetStats(elCard, xuid, arrBestStats) {
        var oStats = MockAdapter.GetPlayerStatsJSO(xuid);
        var score = MockAdapter.GetPlayerScore(xuid);
        
        if (arrBestStats) {
            for (var i = 0; i < arrBestStats.length; i++) {
                var oBest = arrBestStats[i];
                var statKey = oBest.stat;
                if (oStats[statKey] > 0 && (!oBest.value || oStats[statKey] > oBest.value)) {
                    oBest.value = oStats[statKey];
                    oBest.elCard = elCard;
                }
            }
        }

        elCard.SetDialogVariableInt('playercardstats-kills', Number(oStats.kills || 0));
        elCard.SetDialogVariableInt('playercardstats-deaths', Number(oStats.deaths || 0));
        elCard.SetDialogVariableInt('playercardstats-assists', Number(oStats.assists || 0));
        elCard.SetDialogVariableInt('playercardstats-adr', Number(oStats.adr || 0));
        elCard.SetDialogVariableInt('playercardstats-hsp', Number(oStats.hsp || 0));
        elCard.SetDialogVariableInt('playercardstats-ef', Number(oStats.enemiesflashed || 0));
        elCard.SetDialogVariableInt('playercardstats-ud', Number(oStats.utilitydamage || 0));
        elCard.SetDialogVariableInt('playercardstats-score', Number(score || 0));
        elCard.SetDialogVariableInt('playercardstats-gglevel', Number(Math.floor((score || 0) / 2)));
        elCard.SetDialogVariableInt('playercardstats-knifekills', Number(oStats.knifekills || 0));
        elCard.AddClass('show-stats');
    }
    PlayerStatsCard.SetStats = SetStats;

    function SetTeammateColor(elCard, xuid) {
        var panels = elCard.FindChildrenWithClassTraverse('colorize-teammate-color');
        var teammateColor = MockAdapter.GetPlayerColor(xuid);
        var teamName = MockAdapter.GetPlayerTeamName(xuid);
        var teamColor = teammateColor ? teammateColor : (teamName == 'CT' ? '#5ab8f4' : '#f0c941');
        
        for (var i = 0; i < panels.length; i++) {
            panels[i].style.washColor = (teamColor !== '') ? teamColor : 'black';
        }
    }
    PlayerStatsCard.SetTeammateColor = SetTeammateColor;

    async function RevealStats(elCard) {
        var slidingPanels = elCard.FindChildrenWithClassTraverse('sliding-panel');
        for (var i = 0; i < slidingPanels.length; i++) {
            await Async.Delay(0.1);
            if (slidingPanels[i] && slidingPanels[i].IsValid()) {
                slidingPanels[i].AddClass('slide');
            }
        }
    }
    PlayerStatsCard.RevealStats = RevealStats;

    function HighlightStat(elCard, stat) {
        elCard.AddClass('highlight-' + stat);
    }
    PlayerStatsCard.HighlightStat = HighlightStat;

})(PlayerStatsCard || (PlayerStatsCard = {}));