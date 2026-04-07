"use strict";
var SeasonProgress;
(function (SeasonProgress) {
    var _m_nWinsForMedal = 25;

    var MY_SPOOFED_RATING = 39000; // your set elo rating.
    var MY_SPOOFED_WINS = 150;      // you set wins.
    var MY_SPOOFED_TIME = 3600;    // time in seconds for expiration.

    function _Init() {
        SetRating();
    }

    function SetRating() {
        var elRatingEmblem = $.GetContextPanel().FindChildInLayoutFile('js-highest-rating');

        var rating = MY_SPOOFED_RATING;
        var nWins = MY_SPOOFED_WINS;
        var nTime = MY_SPOOFED_TIME;

        if (elRatingEmblem) {
            var options = {
                root_panel: elRatingEmblem,
                rating_type: 'Premier',
                leaderboard_details: { score: rating },
                do_fx: false,
                full_details: true,
                local_player: true
            };

            if (typeof RatingEmblem !== "undefined" && RatingEmblem.SetXuid) {
                RatingEmblem.SetXuid(options);
            }
        }

        _SetProgressBar(rating, nWins);
        _ShowHideExpirationWarning(nWins, nTime);
        _SetInfoIconTooltip(nWins, nTime);
    }

    function _SetProgressBar(rating, nWins) {
        var clampedRating = 0;
        if (typeof RatingEmblem !== "undefined" && RatingEmblem.GetClampedRating) {
            clampedRating = RatingEmblem.GetClampedRating(rating);
        }
        
        var color = clampedRating;

        var nBars = nWins > 24 && nWins < 50 ? 1 :
                    nWins > 49 && nWins < 75 ? 2 :
                    nWins > 74 && nWins < 100 ? 3 :
                    nWins > 99 && nWins < 125 ? 4 :
                    nWins > 124 ? 5 : 0;
        
        nBars = nBars < 5 ? nBars + 1 : 5;

        var elParent = $.GetContextPanel().FindChildInLayoutFile('id-premier-season-bars');
        if (!elParent) return;

        for (var i = 1; i <= nBars; i++) {
            var elBar = elParent.FindChild('bar-' + i);
            if (!elBar) {
                elBar = $.CreatePanel('Panel', elParent, 'bar-' + i);
                elBar.BLoadLayoutSnippet('one-bar');
            }

            var rangeMin = i === 1 ? 1 : ((i - 1) * _m_nWinsForMedal);
            var rangeMax = (i * _m_nWinsForMedal);
            var widthInnerBar = (nWins >= (rangeMax - 1)) ? 1 : ((nWins - rangeMin) / (_m_nWinsForMedal - 1));

            var elInnerBar = elBar.FindChildInLayoutFile('id-inner-bar');
            if (elInnerBar) {
                elInnerBar.style.width = (widthInnerBar * 100) + '%';
                elInnerBar.SwitchClass('tier', 'rank-tier-' + color);
            }

            elBar.SwitchClass('num-bars', nBars + '-bars');

            var elInnerMedal = elBar.FindChildInLayoutFile('id-inner-medal');
            if (elInnerMedal) {
                elInnerMedal.SwitchClass('tier', nWins >= rangeMax ? 'rank-tier-' + color : 'rank-tier-none');
            }
        }

        $.GetContextPanel().SetDialogVariableInt('wins', nWins);
        $.GetContextPanel().SetDialogVariableInt('threshold', nBars * _m_nWinsForMedal);
    }

    function _ShowHideExpirationWarning(nWins, nTime) {
        var elParent = $.GetContextPanel().FindChildInLayoutFile('id-premier-bar-container');
        if (!elParent) return;
        
        var elImages = elParent.FindChildInLayoutFile('id-premier-bar-icons');
        if (!elImages) return;

        if (nWins < _m_nWinsForMedal || nTime >= 0) {
            elParent.SetHasClass('show-warning', false);
            elImages.ClearPanelEvent('onmouseover');
            elImages.ClearPanelEvent('onmouseout');
            return;
        }

        if (nTime < 0) {
            elParent.SetHasClass('show-warning', true);
            elImages.SetPanelEvent('onmouseover', function() {
                UiToolkitAPI.ShowTextTooltip('id-premier-bar-icons', '#season_progress_rating_expired');
            });
            elImages.SetPanelEvent('onmouseout', function() {
                UiToolkitAPI.HideTextTooltip();
            });
        }
    }

    function _SetInfoIconTooltip(nWins, nTime) {
        var elTooltip = $.GetContextPanel().FindChildInLayoutFile('id-season-progress-tooltip');
        if (!elTooltip) return;

        var sTooltip = $.Localize('#season_progress_tooltip-body');

        if (nWins >= _m_nWinsForMedal && nTime > 0) {
            if (typeof FormatText !== "undefined") {
                elTooltip.SetDialogVariable('time', FormatText.SecondsToSignificantTimeString(nTime));
                sTooltip += $.Localize('#season_progress_tooltip-expiration_time', elTooltip);
            }
        }

        elTooltip.SetPanelEvent('onmouseover', function() {
            UiToolkitAPI.ShowTitleTextTooltip('id-season-progress-tooltip', '#season_progress_tooltip-title', sTooltip);
        });
        elTooltip.SetPanelEvent('onmouseout', function() {
            UiToolkitAPI.HideTitleTextTooltip();
        });
    }

    function ReadyForDisplay() { SetRating(); }
    SeasonProgress.ReadyForDisplay = ReadyForDisplay;

    function PipRankUpdate() { SetRating(); }
    SeasonProgress.PipRankUpdate = PipRankUpdate;

    (function() {
        $.RegisterEventHandler('ReadyForDisplay', $.GetContextPanel(), SeasonProgress.ReadyForDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_PipRankUpdate', PipRankUpdate);
        _Init();
    })();

})(SeasonProgress || (SeasonProgress = {}));