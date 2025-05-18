"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="rating_emblem.ts" />
/// <reference path="common/formattext.ts" />
var SeasonProgress;
(function (SeasonProgress) {
    const _m_nWinsForMedal = 25;
    function _Init() {
        SetRating();
    }
    function SetRating() {
        let elRatingEmblem = $.GetContextPanel().FindChildInLayoutFile('js-highest-rating');
        let rating = MyPersonaAPI.GetPipRankHighest("Premier");
        let options;
        options = {
            root_panel: elRatingEmblem,
            rating_type: 'Premier',
            leaderboard_details: { score: rating },
            do_fx: true,
            full_details: false,
            local_player: true
        };
        RatingEmblem.SetXuid(options);
        _SetProgressBar(rating);
    }
    SeasonProgress.SetRating = SetRating;
    function _SetProgressBar(rating) {
        let nWins = MyPersonaAPI.GetPipRankWins("Premier");
        let clampedRating = RatingEmblem.GetClampedRating(rating);
        let color = clampedRating;
        let nBars = nWins > 24 && nWins < 50 ? 1 :
            nWins > 49 && nWins < 75 ? 2 :
                nWins > 74 && nWins < 100 ? 3 :
                    nWins > 99 && nWins < 125 ? 4 :
                        nWins > 124 ? 5 :
                            0;
        nBars = nBars < 5 ? nBars + 1 : 5;
        let elParent = $.GetContextPanel().FindChildInLayoutFile('id-premier-season-bars');
        for (let i = 1; i <= nBars; i++) {
            let elBar = elParent.FindChild('bar-' + i);
            if (!elBar) {
                elBar = $.CreatePanel('Panel', elParent, 'bar-' + i);
                elBar.BLoadLayoutSnippet('one-bar');
            }
            let rangeOfMatchesInBar = { min: i == 1 ? 1 : ((i - 1) * _m_nWinsForMedal), max: (i * _m_nWinsForMedal) };
            let widthInnerBar = (nWins >= (rangeOfMatchesInBar.max - 1)) ? 1 : ((nWins - rangeOfMatchesInBar.min) / (_m_nWinsForMedal - 1));
            elBar.FindChildInLayoutFile('id-inner-bar').style.width = (widthInnerBar * 100) + '%';
            elBar.FindChildInLayoutFile('id-inner-bar').SwitchClass('tier', 'rank-tier-' + color);
            elBar.SwitchClass('num-bars', nBars + '-bars');
            elBar.FindChildInLayoutFile('id-inner-medal').SwitchClass('tier', nWins >= rangeOfMatchesInBar.max ? 'rank-tier-' + color : 'rank-tier-none');
        }
        clampedRating = clampedRating < 1 ? 1 : clampedRating + 1;
        let itemDef = InventoryAPI.GetItemDefinitionIndexFromDefinitionName('premier season coin s=2 c=' + clampedRating + ' b=' + nBars);
        let itemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex(itemDef, 0);
        $.GetContextPanel().FindChildInLayoutFile('id-medal-end').itemid = itemId;
        $.GetContextPanel().SetDialogVariableInt('wins', nWins);
        $.GetContextPanel().SetDialogVariableInt('threshold', nBars * 25);
        _ShowHideExpirationWarning();
        _SetInfoIconTooltip();
    }
    function _ShowHideExpirationWarning() {
        let nTime = MyPersonaAPI.GetPipRankExpiration("Premier");
        let nWins = MyPersonaAPI.GetPipRankWins("Premier");
        let elParent = $.GetContextPanel().FindChildInLayoutFile('id-premier-bar-container');
        if (nWins < _m_nWinsForMedal || nTime >= 0) {
            elParent.SetHasClass('show-warning', false);
            let elImages = elParent.FindChildInLayoutFile('id-premier-bar-icons');
            elImages.SetPanelEvent('onmouseover', () => {
                return;
            });
            elImages.SetPanelEvent('onmouseout', () => {
                return;
            });
            return;
        }
        if (nTime < 0) {
            elParent.SetHasClass('show-warning', true);
            let elImages = elParent.FindChildInLayoutFile('id-premier-bar-icons');
            elImages.SetPanelEvent('onmouseover', () => {
                UiToolkitAPI.ShowTextTooltip('id-premier-bar-icons', '#season_progress_rating_expired');
            });
            elImages.SetPanelEvent('onmouseout', () => {
                UiToolkitAPI.HideTextTooltip();
            });
        }
    }
    function _SetInfoIconTooltip() {
        let nTime = MyPersonaAPI.GetPipRankExpiration("Premier");
        let nWins = MyPersonaAPI.GetPipRankWins("Premier");
        let elTooltip = $.GetContextPanel().FindChildInLayoutFile('id-season-progress-tooltip');
        let sTooltip = $.Localize('#season_progress_tooltip-body');
        if (nWins >= _m_nWinsForMedal && nTime > 0) {
            elTooltip.SetDialogVariable('time', FormatText.SecondsToSignificantTimeString(nTime));
            sTooltip = sTooltip + $.Localize('#season_progress_tooltip-expiration_time', elTooltip);
        }
        elTooltip.SetPanelEvent('onmouseover', () => {
            UiToolkitAPI.ShowTitleTextTooltip('id-season-progress-tooltip', '#season_progress_tooltip-title', sTooltip);
        });
        elTooltip.SetPanelEvent('onmouseout', () => {
            UiToolkitAPI.HideTitleTextTooltip();
        });
    }
    function ReadyForDisplay() {
        SetRating();
    }
    SeasonProgress.ReadyForDisplay = ReadyForDisplay;
    function UnReadyForDisplay() {
    }
    SeasonProgress.UnReadyForDisplay = UnReadyForDisplay;
    function PipRankUpdate() {
        SetRating();
    }
    SeasonProgress.PipRankUpdate = PipRankUpdate;
    {
        $.RegisterEventHandler('ReadyForDisplay', $.GetContextPanel(), SeasonProgress.ReadyForDisplay);
        $.RegisterEventHandler('UnreadyForDisplay', $.GetContextPanel(), SeasonProgress.UnReadyForDisplay);
        $.RegisterForUnhandledEvent('PanoramaComponent_MyPersona_PipRankUpdate', PipRankUpdate);
        _Init();
    }
})(SeasonProgress || (SeasonProgress = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJlbWllcl9zZWFzb25fcHJvZ3Jlc3MuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wcmVtaWVyX3NlYXNvbl9wcm9ncmVzcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBQ2xDLHlDQUF5QztBQUN6Qyw2Q0FBNkM7QUFFN0MsSUFBVSxjQUFjLENBa0x2QjtBQWxMRCxXQUFVLGNBQWM7SUFFcEIsTUFBTSxnQkFBZ0IsR0FBRyxFQUFFLENBQUM7SUFFNUIsU0FBUyxLQUFLO1FBRVYsU0FBUyxFQUFFLENBQUM7SUFDaEIsQ0FBQztJQUVELFNBQWdCLFNBQVM7UUFHckIsSUFBSSxjQUFjLEdBQUcsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLHFCQUFxQixDQUFFLG1CQUFtQixDQUFFLENBQUM7UUFDdEYsSUFBSSxNQUFNLEdBQUcsWUFBWSxDQUFDLGlCQUFpQixDQUFFLFNBQVMsQ0FBRSxDQUFDO1FBTXpELElBQUksT0FBOEIsQ0FBQztRQUNuQyxPQUFPLEdBQUc7WUFDTixVQUFVLEVBQUUsY0FBYztZQUMxQixXQUFXLEVBQUUsU0FBUztZQUN0QixtQkFBbUIsRUFBRSxFQUFFLEtBQUssRUFBQyxNQUFNLEVBQUU7WUFDckMsS0FBSyxFQUFFLElBQUk7WUFDWCxZQUFZLEVBQUUsS0FBSztZQUNuQixZQUFZLEVBQUUsSUFBSTtTQUNyQixDQUFBO1FBRUQsWUFBWSxDQUFDLE9BQU8sQ0FBRSxPQUFPLENBQUUsQ0FBQztRQUVoQyxlQUFlLENBQUUsTUFBTSxDQUFFLENBQUM7SUFDOUIsQ0FBQztJQXZCZSx3QkFBUyxZQXVCeEIsQ0FBQTtJQUVELFNBQVMsZUFBZSxDQUFFLE1BQWE7UUFFbkMsSUFBSSxLQUFLLEdBQUcsWUFBWSxDQUFDLGNBQWMsQ0FBRSxTQUFTLENBQUUsQ0FBQztRQU1yRCxJQUFJLGFBQWEsR0FBRyxZQUFZLENBQUMsZ0JBQWdCLENB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