"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="digitpanel.ts" />
/// <reference path="common/sessionutil.ts" />
var RatingEmblem;
(function (RatingEmblem) {
    function _msg(msg) {
    }
    function _GetMainPanel(root_panel) {
        if (root_panel &&
            root_panel.IsValid() &&
            root_panel.FindChildTraverse('jsPremierRating') &&
            root_panel.FindChildTraverse('jsPremierRating').IsValid()) {
            return root_panel.FindChildTraverse('jsPremierRating').GetParent();
        }
        else {
            return null;
        }
    }
    function GetRatingDesc(root_panel) {
        let elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().ratingDesc : '';
    }
    RatingEmblem.GetRatingDesc = GetRatingDesc;
    function GetTooltipText(root_panel) {
        let elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().tooltipText : '';
    }
    RatingEmblem.GetTooltipText = GetTooltipText;
    function GetTierColorClass(root_panel) {
        let elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().colorClassName : '';
    }
    RatingEmblem.GetTierColorClass = GetTierColorClass;
    function GetEomDescText(root_panel) {
        let elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().eomDescText : '';
    }
    RatingEmblem.GetEomDescText = GetEomDescText;
    function GetIntroText(root_panel) {
        let elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().introText : '';
    }
    RatingEmblem.GetIntroText = GetIntroText;
    function GetWinCountString(root_panel) {
        let elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().winCountText : '';
    }
    RatingEmblem.GetWinCountString = GetWinCountString;
    function GetPromotionState(root_panel) {
        let elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().promotionState : '';
    }
    RatingEmblem.GetPromotionState = GetPromotionState;
    function SetXuid(options) {
        let rating = undefined;
        let wins = undefined;
        let rank = undefined;
        let pct = undefined;
        let bFullDetails = options.hasOwnProperty('full_details') ? options.full_details : false;
        let do_fx = options.do_fx;
        let rating_type = options.rating_type;
        let root_panel = _GetMainPanel(options.root_panel);
        if (!root_panel)
            return false;
        let debug_wins = false;
        if (debug_wins) {
            wins = Math.floor(Math.random() * 20);
        }
        //rating = options.leaderboard_details.score;
        //wins = options.leaderboard_details.matchesWon;
        //rank = options.leaderboard_details.rank;
        //pct = options.leaderboard_details.pct;
        _msg(rating_type + root_panel.id);
        root_panel.SwitchClass('type', rating_type);
        if (bFullDetails) {
            _msg('making strings');
            root_panel.SetDialogVariable('rating_type', rating_type);
        }
        let elSkillGroupImage = null;
        let imagePath = '';
        let winsNeededForRank = SessionUtil ? SessionUtil.GetNumWinsNeededForRank(rating_type) : 10;
        let isloading = (rating === undefined || rating < 0);
        let bRatingExpired = !isloading && rating === 0;
        let bTooFewWins = wins === undefined || wins < winsNeededForRank;
        let bHasRating = !bRatingExpired && !bTooFewWins && !isloading;
        let ratingDesc = '';
        let tooltipText = '';
        let eomDescText = '';
        let tooltipExtraText = '';
        let colorClassName = '';
        let introText = '';
        let promotionState = '';
        let winCountText = '';
        if (!wins || wins < 0) {
            wins = 0;
        }
        if (isloading) {
            ratingDesc = $.Localize('#SFUI_LOADING');
        }
        root_panel.SetDialogVariableInt("wins", wins);
        if (rating_type === 'Wingman' || rating_type === 'Competitive') {
            elSkillGroupImage = root_panel.FindChildTraverse('jsRating-' + rating_type);
            let locTypeModifer = rating_type === 'Competitive' ? '' : rating_type.toLowerCase();
            imagePath = locTypeModifer !== '' ? locTypeModifer : 'skillgroup';
            const elCompWinsNeeded = root_panel.FindChildTraverse('jsRating-CompetitiveWinsNeeded');
            elCompWinsNeeded.visible = !isloading && bTooFewWins && options.local_player;
            if (bTooFewWins || isloading) {
                elSkillGroupImage.SetImage('file://{images}/icons/skillgroups/' + imagePath + '_none.svg');
                if (!isloading && options.local_player) {
                    const winsneeded = Math.max(0, winsNeededForRank - wins);
                    elSkillGroupImage.SetDialogVariableInt('wins', wins);
                    elSkillGroupImage.SetDialogVariableInt('wins-needed', winsneeded);
                    if (bFullDetails) {
                        ratingDesc = $.Localize('#skillgroup_0' + locTypeModifer);
                        root_panel.SetDialogVariableInt("winsneeded", winsneeded);
                        tooltipText = $.Localize('#tooltip_skill_group_none' + imagePath, root_panel);
                    }
                }
            }
            else if (bRatingExpired) {
                elSkillGroupImage.SetImage('file://{images}/icons/skillgroups/' + imagePath + '_expired.svg');
                if (bFullDetails) {
                    ratingDesc = $.Localize('#skillgroup_expired' + locTypeModifer);
                    tooltipText = $.Localize('#tooltip_skill_group_expired' + locTypeModifer);
                }
            }
            else {
                elSkillGroupImage.SetImage('file://{images}/icons/skillgroups/' + imagePath + rating + '.svg');
                if (bFullDetails) {
                    ratingDesc = $.Localize('#skillgroup_' + rating);
                    tooltipText = $.Localize('#tooltip_skill_group_generic' + locTypeModifer);
                }
            }
        }
        else if (rating_type === 'Premier') {
            let elPremierRating = root_panel.FindChildTraverse('jsPremierRating');
            let presentation = options.presentation ? options.presentation : 'simple';
            root_panel.FindChildTraverse('JsSimpleNumbers').visible = presentation === 'simple';
            root_panel.FindChildTraverse('JsDigitPanels').visible = presentation === 'digital';
            let majorRating = '';
            let minorRating = '';
            root_panel.SwitchClass('tier', 'tier-0');
            _SetPremierBackgroundImage(root_panel, rating);
            if (rating && rating > 0) {
                let clampedRating = GetClampedRating(rating);
                root_panel.SwitchClass('tier', 'tier-' + clampedRating);
                colorClassName = 'tier-' + clampedRating;
                let arrRating = SplitRating(rating);
                majorRating = arrRating[0];
                minorRating = arrRating[1];
                if (do_fx && rating) {
                    RatingParticleControls.UpdateRatingEffects(elPremierRating, majorRating, minorRating.slice(-3), parseInt(arrRating[2]));
                }
                if (bFullDetails) {
                    if (rank && rank <= LeaderboardsAPI.GetPremierLeaderboardTopBestCount()) {
                        root_panel.SetDialogVariableInt('rank', rank);
                        ratingDesc = $.Localize('#cs_rating_rank', root_panel);
                        eomDescText = ratingDesc;
                    }
                    else if (pct) {
                        root_panel.SetDialogVariable('percentile', pct.toFixed(2) + '');
                        ratingDesc = $.Localize('#cs_rating_percentile', root_panel);
                        eomDescText = ratingDesc;
                    }
                    else {
                        ratingDesc = $.Localize('#cs_rating_generic');
                    }
                    if (arrRating[2] === '2') {
                        tooltipExtraText = $.Localize('#cs_rating_relegation_nextmatch');
                        introText = $.Localize('#cs_rating_relegation_match');
                        eomDescText = $.Localize('#cs_rating_relegation_nextmatch');
                        ratingDesc = $.Localize('#cs_rating_relegation_nextmatch');
                        promotionState = 'relegation';
                    }
                    else if (arrRating[2] === '1') {
                        tooltipExtraText = $.Localize('#cs_rating_promotion_nextmatch');
                        introText = $.Localize('#cs_rating_promotion_match');
                        eomDescText = $.Localize('#cs_rating_promotion_nextmatch');
                        ratingDesc = $.Localize('#cs_rating_promotion_nextmatch');
                        promotionState = 'promotion';
                    }
                    tooltipText = $.Localize('#tooltip_cs_rating_generic');
                }
            }
            else {
                if (bFullDetails) {
                    if (isloading) {
                        ratingDesc = $.Localize('#skillgroup_loading');
                    }
                    else if (bTooFewWins) {
                        let winsneeded = (winsNeededForRank - wins);
                        root_panel.SetDialogVariableInt("winsneeded", winsneeded);
                        tooltipText = $.Localize('#tooltip_cs_rating_none', root_panel);
                        eomDescText = $.Localize('#cs_rating_wins_needed_verbose', root_panel);
                        introText = $.Localize('#cs_rating_wins_needed_verbose_intro', root_panel);
                        if (options.local_player) {
                            ratingDesc = $.Localize('#cs_rating_wins_needed', root_panel);
                        }
                        else {
                            ratingDesc = $.Localize('#cs_rating_none');
                        }
                    }
                    else if (bRatingExpired) {
                        ratingDesc = $.Localize('#cs_rating_expired');
                        tooltipText = $.Localize('#tooltip_cs_rating_expired');
                        eomDescText = $.Localize('#eom-skillgroup-expired-premier', root_panel);
                        introText = $.Localize('#eom-skillgroup-expired-premier', root_panel);
                    }
                }
            }
            _SetEomStyleOverrides(options, root_panel);
            _SetPremierRatingValue(root_panel, majorRating, minorRating, presentation);
        }
        if (bFullDetails) {
            if (tooltipExtraText !== '') {
                tooltipText = tooltipText + '<br><br>' + tooltipExtraText;
            }
            if (wins) {
                root_panel.SetDialogVariableInt('wins', wins);
                let winText = $.Localize('#tooltip_skill_group_wins', root_panel);
                tooltipText = (tooltipText !== '') ? tooltipText + '<br><br>' + winText : winText;
                winCountText = $.Localize('#wins_count', root_panel);
            }
            root_panel.Data().ratingDesc = ratingDesc;
            root_panel.Data().tooltipText = tooltipText;
            root_panel.Data().colorClassName = colorClassName;
            root_panel.Data().eomDescText = eomDescText;
            root_panel.Data().introText = introText;
            root_panel.Data().promotionState = promotionState;
            root_panel.Data().winCountText = winCountText;
        }
        root_panel.SwitchClass('rating_type', rating_type);
        return bHasRating;
    }
    RatingEmblem.SetXuid = SetXuid;
    function GetClampedRating(rating) {
        let remappedRating = Math.floor(rating / 1000.00 / 5);
        return Math.max(0, Math.min(remappedRating, 6));
    }
    RatingEmblem.GetClampedRating = GetClampedRating;
    function _SetPremierBackgroundImage(root_panel, rating) {
        let bgImage = (rating && rating > 0) ? 'premier_rating_bg_large.svg' : 'premier_rating_bg_large_none.svg';
        let elImage = root_panel.FindChildInLayoutFile('jsPremierRatingBg');
        elImage.SetImage('file://{images}/icons/ui/' + bgImage);
    }
    function _SetEomStyleOverrides(options, root_panel) {
        root_panel.FindChildInLayoutFile('JsDigitPanels').SwitchClass('emblemstyle', options.eom_digipanel_class_override ? options.eom_digipanel_class_override : '');
    }
    function _SetPremierRatingValue(root_panel, major, minor, premierPresentation) {
        root_panel.SetDialogVariable('rating-major', major);
        root_panel.SetDialogVariable('rating-minor', minor);
        if (premierPresentation === 'digital') {
            const elMajor = $.GetContextPanel().FindChildTraverse('jsPremierRatingMajor');
            const elMinor = $.GetContextPanel().FindChildTraverse('jsPremierRatingMinor');
            let bFastSet = false;
            if (!$.GetContextPanel().FindChildTraverse('DigitPanel')) {
                DigitPanelFactory.MakeDigitPanel(elMajor, 2, '', 1, "#digitpanel_digits_premier");
                DigitPanelFactory.MakeDigitPanel(elMinor, 4, '', 1, "#digitpanel_digits_premier");
                bFastSet = true;
            }
            DigitPanelFactory.SetDigitPanelString(elMajor, major, bFastSet);
            DigitPanelFactory.SetDigitPanelString(elMinor, minor, bFastSet);
        }
    }
    function SplitRating(rating) {
        let matchType = '0';
        if (rating === 5000 || rating === 10000 || rating === 15000 ||
            rating === 20000 || rating === 25000 || rating === 30000)
            matchType = '2';
        else if (rating === 5000 - 1 || rating === 10000 - 1 || rating === 15000 - 1 ||
            rating === 20000 - 1 || rating === 25000 - 1 || rating === 30000 - 1)
            matchType = '1';
        rating = rating / 1000.00;
        let strRating = (String((rating).toFixed(3))).padStart(6, '0');
        let major = strRating.slice(0, 2);
        let minor = strRating.slice(-3);
        major = major.replace(/^00/g, '  ');
        major = major.replace(/^0/g, ' ');
        if (major === '  ') {
            minor = minor.replace(/^00/g, '  ');
            minor = minor.replace(/^0/g, ' ');
        }
        else {
            minor = ',' + minor;
        }
        return [major, minor, matchType];
    }
    RatingEmblem.SplitRating = SplitRating;
})(RatingEmblem || (RatingEmblem = {}));
var RatingParticleControls;
(function (RatingParticleControls) {
    function GetAllChildren(panel) {
        const children = panel.Children();
        return [...children, ...children.flatMap(GetAllChildren)];
    }
    function IsParticleScenePanel(panel) {
        return panel.type === "ParticleScenePanel";
    }
    function ColorConvert(tier) {
        let rarityColors = [
            ["common", 176, 195, 217],
            ["uncommon", 94, 152, 217],
            ["rare", 75, 105, 255],
            ["mythical", 136, 71, 255],
            ["legendary", 211, 44, 230],
            ["ancient", 235, 75, 75],
            ["unusual", 255, 215, 0],
        ];
        if (tier < 0 || tier >= rarityColors.length)
            return { R: 0, G: 0, B: 0 };
        let R = rarityColors[tier][1];
        let G = rarityColors[tier][2];
        let B = rarityColors[tier][3];
        return { R, G, B };
    }
    RatingParticleControls.ColorConvert = ColorConvert;
    function UpdateRatingEffects(panelId, MajorRating, MinorRating, matchType) {
        const AllPanels = GetAllChildren(panelId);
        let ratingEffect = [
            "particles/ui/premier_ratings_bg.vpcf",
            "particles/ui/premier_ratings_promomatch.vpcf",
            "particles/ui/premier_ratings_relegation.vpcf"
        ];
        let tier = Math.floor(+MajorRating / 5.0);
        let tierColor = ColorConvert(tier);
        for (const panel of AllPanels) {
            if (IsParticleScenePanel(panel)) {
                if (+MajorRating > 0) {
                    panel.StartParticles();
                    panel.SetParticleNameAndRefresh(ratingEffect[matchType]);
                    panel.SetControlPoint(16, tierColor.R, tierColor.G, tierColor.B);
                }
                else {
                    panel.StopParticlesImmediately(true);
                }
            }
        }
    }
    RatingParticleControls.UpdateRatingEffects = UpdateRatingEffects;
})(RatingParticleControls || (RatingParticleControls = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmF0aW5nX2VtYmxlbS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3JhdGluZ19lbWJsZW0udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQUNsQyxzQ0FBc0M7QUFDdEMsOENBQThDO0FBcUI5QyxJQUFVLFlBQVksQ0FrYXJCO0FBbGFELFdBQVUsWUFBWTtJQUVyQixTQUFTLElBQUksQ0FBRyxHQUFXO0lBRzNCLENBQUM7SUFFRCxTQUFTLGFBQWEsQ0FBRyxVQUFtQjtRQUUzQyxJQUFLLFVBQVU7WUFDZCxVQUFVLENBQUMsT0FBTyxFQUFFO1lBQ3BCLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBRSxpQkFBaUIsQ0FBRTtZQUNqRCxVQUFVLENBQUMsaUJBQWlCLENBQUUsaUJBQWlCLENBQUUsQ0FBQyxPQUFPLEVBQUUsRUFDNUQ7WUFDQyxPQUFPLFVBQVUsQ0FBQyxpQkFBaUIsQ0FBRSxpQkFBaUIsQ0FBRSxDQUFDLFNBQVMsRUFBRSxDQUFDO1NBQ3JFO2FBRUQ7WUFDQyxPQUFPLElBQUksQ0FBQztTQUNaO0lBQ0YsQ0FBQztJQUVELFNBQWdCLGFBQWEsQ0FBRyxVQUFtQjtRQUVsRCxJQUFJLE1BQU0sR0FBRyxhQUFhLENBQUUsVUFBVSxDQUFFLENBQUM7UUFDekMsT0FBTyxNQUFNLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztJQUMvQyxDQUFDO0lBSmUsMEJBQWEsZ0JBSTVCLENBQUE7SUFFRCxTQUFnQixjQUFjLENBQUcsVUFBbUI7UUFFbkQsSUFBSSxNQUFNLEdBQUcsYUFBYSxDQUFFLFVBQVUsQ0FBRSxDQUFDO1FBQ3pDLE9BQU8sTUFBTSxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7SUFD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