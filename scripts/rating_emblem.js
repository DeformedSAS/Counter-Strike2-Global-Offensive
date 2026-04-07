"use strict";

var RatingEmblem;
(function (RatingEmblem) {
    
    function _msg(msg) {
        // $.Msg(msg);
    }

    function _GetMainPanel(root_panel) {
        if (root_panel &&
            root_panel.IsValid() &&
            root_panel.FindChildTraverse('jsPremierRating') &&
            root_panel.FindChildTraverse('jsPremierRating').IsValid()) {
            return root_panel.FindChildTraverse('jsPremierRating').GetParent();
        } else {
            return null;
        }
    }

    RatingEmblem.GetRatingDesc = function(root_panel) {
        var elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().ratingDesc : '';
    };

    RatingEmblem.GetTooltipText = function(root_panel) {
        var elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().tooltipText : '';
    };

    RatingEmblem.GetTierColorClass = function(root_panel) {
        var elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().colorClassName : '';
    };

    RatingEmblem.GetEomDescText = function(root_panel) {
        var elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().eomDescText : '';
    };

    RatingEmblem.GetIntroText = function(root_panel) {
        var elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().introText : '';
    };

    RatingEmblem.GetWinCountString = function(root_panel) {
        var elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().winCountText : '';
    };

    RatingEmblem.GetPromotionState = function(root_panel) {
        var elMain = _GetMainPanel(root_panel);
        return elMain ? elMain.Data().promotionState : '';
    };

    RatingEmblem.SetXuid = function(options) {
        var rating = undefined;
        var wins = undefined;
        var rank = undefined;
        var pct = undefined;
        var bFullDetails = options.hasOwnProperty('full_details') ? options.full_details : false;
        var rating_type = options.rating_type;
        var root_panel = _GetMainPanel(options.root_panel);

        if (!root_panel) return false;

        rating = options.leaderboard_details.score;
        wins = options.leaderboard_details.matchesWon;
        rank = options.leaderboard_details.rank;
        pct = options.leaderboard_details.pct;

        root_panel.SwitchClass('type', rating_type);
        
        if (bFullDetails) {
            root_panel.SetDialogVariable('rating_type', rating_type);
        }

        var elSkillGroupImage = null;
        var imagePath = '';
        var winsNeededForRank = (typeof SessionUtil !== 'undefined') ? SessionUtil.GetNumWinsNeededForRank(rating_type) : 10;
        
        var isloading = (rating === undefined || rating < 0);
        var bRatingExpired = !isloading && rating === 0;
        var bTooFewWins = wins === undefined || wins < winsNeededForRank;
        var bHasRating = !bRatingExpired && !bTooFewWins && !isloading;

        var ratingDesc = '';
        var tooltipText = '';
        var eomDescText = '';
        var tooltipExtraText = '';
        var colorClassName = '';
        var introText = '';
        var promotionState = '';
        var winCountText = '';

        if (!wins || wins < 0) wins = 0;

        if (isloading) {
            ratingDesc = $.Localize('#SFUI_LOADING');
        }

        root_panel.SetDialogVariableInt("wins", wins);

        if (rating_type === 'Wingman' || rating_type === 'Competitive') {
            elSkillGroupImage = root_panel.FindChildTraverse('jsRating-' + rating_type);
            var locTypeModifer = rating_type === 'Competitive' ? '' : rating_type.toLowerCase();
            imagePath = (locTypeModifer !== '') ? locTypeModifer : 'skillgroup';
            
            var elCompWinsNeeded = root_panel.FindChildTraverse('jsRating-CompetitiveWinsNeeded');
            if (elCompWinsNeeded) elCompWinsNeeded.visible = !isloading && bTooFewWins && options.local_player;

            if (bTooFewWins || isloading) {
                if (elSkillGroupImage) {
                    elSkillGroupImage.SetImage('file://{images}/icons/skillgroups/' + imagePath + '_none.svg');
                    if (!isloading && options.local_player) {
                        var winsneeded = Math.max(0, winsNeededForRank - wins);
                        elSkillGroupImage.SetDialogVariableInt('wins', wins);
                        elSkillGroupImage.SetDialogVariableInt('wins-needed', winsneeded);
                        if (bFullDetails) {
                            ratingDesc = $.Localize('#skillgroup_0' + locTypeModifer);
                            root_panel.SetDialogVariableInt("winsneeded", winsneeded);
                            tooltipText = $.Localize('#tooltip_skill_group_none' + imagePath + ':f', root_panel);
                        }
                    }
                }
            }
            else if (bRatingExpired) {
                if (elSkillGroupImage) elSkillGroupImage.SetImage('file://{images}/icons/skillgroups/' + imagePath + '_expired.svg');
                if (bFullDetails) {
                    ratingDesc = $.Localize('#skillgroup_expired' + locTypeModifer);
                    tooltipText = $.Localize('#tooltip_skill_group_expired' + locTypeModifer);
                }
            }
            else {
                if (elSkillGroupImage) elSkillGroupImage.SetImage('file://{images}/icons/skillgroups/' + imagePath + rating + '.svg');
                if (bFullDetails) {
                    ratingDesc = $.Localize('#skillgroup_' + rating);
                    tooltipText = $.Localize('#tooltip_skill_group_generic' + locTypeModifer);
                }
            }
        }
        else if (rating_type === 'Premier') {
            var elPremierRating = root_panel.FindChildTraverse('jsPremierRating');
            var presentation = options.presentation ? options.presentation : 'simple';
            
            var elSimple = root_panel.FindChildTraverse('JsSimpleNumbers');
            if (elSimple) elSimple.visible = (presentation === 'simple');
            
            var elDigital = root_panel.FindChildTraverse('JsDigitPanels');
            if (elDigital) elDigital.visible = (presentation === 'digital');

            var majorRating = '';
            var minorRating = '';
            root_panel.SwitchClass('tier', 'tier-0');
            _SetPremierBackgroundImage(root_panel, rating);

            if (rating && rating > 0) {
                var clampedRating = RatingEmblem.GetClampedRating(rating);
                root_panel.SwitchClass('tier', 'tier-' + clampedRating);
                colorClassName = 'tier-' + clampedRating;
                
                var arrRating = RatingEmblem.SplitRating(rating);
                majorRating = arrRating[0];
                minorRating = arrRating[1];

                if (bFullDetails) {
                    if (rank && typeof LeaderboardsAPI !== 'undefined' && rank <= LeaderboardsAPI.GetPremierLeaderboardTopBestCount()) {
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
                        var winsneeded = (winsNeededForRank - wins);
                        root_panel.SetDialogVariableInt("winsneeded", winsneeded);
                        tooltipText = $.Localize('#tooltip_cs_rating_none:f', root_panel);
                        eomDescText = $.Localize('#cs_rating_wins_needed_verbose:f', root_panel);
                        introText = $.Localize('#cs_rating_wins_needed_verbose_intro:f', root_panel);
                        if (options.local_player) {
                            ratingDesc = $.Localize('#cs_rating_wins_needed:f', root_panel);
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
                var winText = $.Localize('#tooltip_skill_group_wins:f', root_panel);
                tooltipText = (tooltipText !== '') ? tooltipText + '<br><br>' + winText : winText;
                winCountText = $.Localize('#wins_count:f', root_panel);
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
    };

    RatingEmblem.GetClampedRating = function(rating) {
        var remappedRating = Math.floor(rating / 1000.00 / 5);
        return Math.max(0, Math.min(remappedRating, 6));
    };

    function _SetPremierBackgroundImage(root_panel, rating) {
        var bgImage = (rating && rating > 0) ? 'premier_rating_bg_large.svg' : 'premier_rating_bg_large_none.svg';
        var elImage = root_panel.FindChildInLayoutFile('jsPremierRatingBg');
        if (elImage) elImage.SetImage('file://{images}/icons/ui/' + bgImage);
    }

    function _SetEomStyleOverrides(options, root_panel) {
        var elDigits = root_panel.FindChildInLayoutFile('JsDigitPanels');
        if (elDigits) elDigits.SwitchClass('emblemstyle', options.eom_digipanel_class_override ? options.eom_digipanel_class_override : '');
    }

    function _SetPremierRatingValue(root_panel, major, minor, premierPresentation) {
        root_panel.SetDialogVariable('rating-major', major);
        root_panel.SetDialogVariable('rating-minor', minor);
        
        if (premierPresentation === 'digital' && typeof DigitPanelFactory !== 'undefined') {
            var elMajor = root_panel.FindChildTraverse('jsPremierRatingMajor');
            var elMinor = root_panel.FindChildTraverse('jsPremierRatingMinor');
            var bFastSet = false;
            
            if (elMajor && !elMajor.FindChildTraverse('DigitPanel')) {
                DigitPanelFactory.MakeDigitPanel(elMajor, 2, '', 1, "#digitpanel_digits_premier");
                bFastSet = true;
            }
            if (elMinor && !elMinor.FindChildTraverse('DigitPanel')) {
                DigitPanelFactory.MakeDigitPanel(elMinor, 4, '', 1, "#digitpanel_digits_premier");
                bFastSet = true;
            }
            
            if (elMajor) DigitPanelFactory.SetDigitPanelString(elMajor, major, bFastSet);
            if (elMinor) DigitPanelFactory.SetDigitPanelString(elMinor, minor, bFastSet);
        }
    }

    RatingEmblem.SplitRating = function(rating) {
        var matchType = '0';
        if (rating === 5000 || rating === 10000 || rating === 15000 ||
            rating === 20000 || rating === 25000 || rating === 30000)
            matchType = '2';
        else if (rating === 5000 - 1 || rating === 10000 - 1 || rating === 15000 - 1 ||
            rating === 20000 - 1 || rating === 25000 - 1 || rating === 30000 - 1)
            matchType = '1';
        
        rating = rating / 1000.00;
        var strRating = (String((rating).toFixed(3))).padStart(6, '0');
        var major = strRating.slice(0, 2);
        var minor = strRating.slice(-3);
        
        major = major.replace(/^00/g, '  ');
        major = major.replace(/^0/g, ' ');
        if (major === '  ') {
            minor = minor.replace(/^00/g, '  ');
            minor = minor.replace(/^0/g, ' ');
        } else {
            minor = ',' + minor;
        }
        return [major, minor, matchType];
    };

})(RatingEmblem || (RatingEmblem = {}));