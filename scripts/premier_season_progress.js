"use strict";
var SeasonProgress;
(function (SeasonProgress) {
    const _m_nWinsForMedal = 25;

    function _Init() {
        SetRating();
    }

function SetRating() {
    const elRatingEmblem = $.GetContextPanel().FindChildInLayoutFile('js-highest-rating');

    // Fake rating and wins
    const rating = Math.floor(Math.random() * 99999);
    const nWins = Math.floor(Math.random() * 200); // random wins
    const nTime = 3600; // 1 hour fake expiration (can set <0 to show expired)

    if (elRatingEmblem) {
        // Show rating emblem if RatingEmblem exists
        const options = {
            root_panel: elRatingEmblem,
            rating_type: 'Premier',
            leaderboard_details: { score: rating },
            do_fx: false,
            full_details: true,
            local_player: true
        };

        if (typeof RatingEmblem !== "undefined" && RatingEmblem.SetXuid) {
            RatingEmblem.SetXuid(options);
            $.Msg("[SeasonProgress] RatingEmblem displayed with rating: " + rating);
        } else {
            $.Msg("[SeasonProgress] RatingEmblem not available, fallback to console output");
            const major = Math.floor(rating / 1000);
            const minor = rating % 1000;
            $.Msg("[SeasonProgress] Major: " + major + ", Minor: " + minor);
        }
    } else {
        $.Msg("[SeasonProgress] js-highest-rating panel not found, fallback to console output");
        const major = Math.floor(rating / 1000);
        const minor = rating % 1000;
        $.Msg("[SeasonProgress] Major: " + major + ", Minor: " + minor);
    }

    _SetProgressBar(rating, nWins);
    _ShowHideExpirationWarning(nWins, nTime);
    _SetInfoIconTooltip(nWins, nTime);
}


    function _SetProgressBar(rating, nWins) {
        const clampedRating = RatingEmblem.GetClampedRating(rating);
        const color = clampedRating;

        let nBars = nWins > 24 && nWins < 50 ? 1 :
                    nWins > 49 && nWins < 75 ? 2 :
                    nWins > 74 && nWins < 100 ? 3 :
                    nWins > 99 && nWins < 125 ? 4 :
                    nWins > 124 ? 5 : 0;
        nBars = nBars < 5 ? nBars + 1 : 5;

        const elParent = $.GetContextPanel().FindChildInLayoutFile('id-premier-season-bars');
        for (let i = 1; i <= nBars; i++) {
            let elBar = elParent.FindChild('bar-' + i);
            if (!elBar) {
                elBar = $.CreatePanel('Panel', elParent, 'bar-' + i);
                elBar.BLoadLayoutSnippet('one-bar');
            }

            const rangeOfMatchesInBar = { min: i === 1 ? 1 : ((i - 1) * _m_nWinsForMedal), max: (i * _m_nWinsForMedal) };
            const widthInnerBar = (nWins >= (rangeOfMatchesInBar.max - 1)) ? 1 : ((nWins - rangeOfMatchesInBar.min) / (_m_nWinsForMedal - 1));

            elBar.FindChildInLayoutFile('id-inner-bar').style.width = (widthInnerBar * 100) + '%';
            elBar.FindChildInLayoutFile('id-inner-bar').SwitchClass('tier', 'rank-tier-' + color);
            elBar.SwitchClass('num-bars', nBars + '-bars');
            elBar.FindChildInLayoutFile('id-inner-medal').SwitchClass('tier', nWins >= rangeOfMatchesInBar.max ? 'rank-tier-' + color : 'rank-tier-none');
        }

        $.GetContextPanel().SetDialogVariableInt('wins', nWins);
        $.GetContextPanel().SetDialogVariableInt('threshold', nBars * _m_nWinsForMedal);
    }

    function _ShowHideExpirationWarning(nWins, nTime) {
        const elParent = $.GetContextPanel().FindChildInLayoutFile('id-premier-bar-container');
        const elImages = elParent.FindChildInLayoutFile('id-premier-bar-icons');

        if (nWins < _m_nWinsForMedal || nTime >= 0) {
            elParent.SetHasClass('show-warning', false);
            elImages.SetPanelEvent('onmouseover', () => {});
            elImages.SetPanelEvent('onmouseout', () => {});
            return;
        }

        if (nTime < 0) {
            elParent.SetHasClass('show-warning', true);
            elImages.SetPanelEvent('onmouseover', () => {
                UiToolkitAPI.ShowTextTooltip('id-premier-bar-icons', '#season_progress_rating_expired');
            });
            elImages.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTextTooltip());
        }
    }

    function _SetInfoIconTooltip(nWins, nTime) {
        const elTooltip = $.GetContextPanel().FindChildInLayoutFile('id-season-progress-tooltip');
        let sTooltip = $.Localize('#season_progress_tooltip-body');

        if (nWins >= _m_nWinsForMedal && nTime > 0) {
            elTooltip.SetDialogVariable('time', FormatText.SecondsToSignificantTimeString(nTime));
            sTooltip += $.Localize('#season_progress_tooltip-expiration_time', elTooltip);
        }

        elTooltip.SetPanelEvent('onmouseover', () => {
            UiToolkitAPI.ShowTitleTextTooltip('id-season-progress-tooltip', '#season_progress_tooltip-title', sTooltip);
        });
        elTooltip.SetPanelEvent('onmouseout', () => UiToolkitAPI.HideTitleTextTooltip());
    }

    function ReadyForDisplay() {
        SetRating();
    }
    SeasonProgress.ReadyForDisplay = ReadyForDisplay;

    function UnReadyForDisplay() {}
    SeasonProgress.UnReadyForDisplay = UnReadyForDisplay;

    function PipRankUpdate() {
        SetRating();
    }
    SeasonProgress.PipRankUpdate = PipRankUpdate;

    // Auto-init
    {
        $.RegisterEventHandler('ReadyForDisplay', $.GetContextPanel(), SeasonProgress.ReadyForDisplay);
        $.RegisterEventHandler('UnreadyForDisplay', $.GetContextPanel(), SeasonProgress.UnReadyForDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_PipRankUpdate', PipRankUpdate);
        _Init();
    }
})(SeasonProgress || (SeasonProgress = {}));
