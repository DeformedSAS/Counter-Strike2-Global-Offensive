"use strict";
/// <reference path="csgo.d.ts" />
/// <reference path="common/async.ts" />

var XpShopTrack;
(function (XpShopTrack) {
    let pieAnimDuration = 1;
    const nXPperStar = StoreAPI.GetXpShopStarXp();

    function XpShopInit(settings) {
        const elRootPanel = settings.xpshop_track_frame_panel;
        if (!elRootPanel || !elRootPanel.IsValid())
            return;
        const elTrack = elRootPanel.FindChildTraverse('jsRadialTrack');
        if (!elTrack)
            return;

        const nStarsEarned = settings.xpshop_track_value > 0 ? Math.floor(settings.xpshop_track_value / nXPperStar) : 0;
        const nXpProgressTowardsNextStar = settings.xpshop_track_value % nXPperStar;
        const nPercentProgressTowardsNextStar = nXpProgressTowardsNextStar / nXPperStar * 100;

        elRootPanel.SetDialogVariableInt('progress-to-next-star', nPercentProgressTowardsNextStar);
        elRootPanel.SetDialogVariableInt('stars-earned', nStarsEarned);
        elRootPanel.SetDialogVariableInt('max-stars', StoreAPI.GetXpShopMaxTrackLevel());

        elTrack.style.clip = 'radial(50% 50%, 0deg, ' + Math.floor(nPercentProgressTowardsNextStar / 100 * 360) + 'deg)';
        elTrack.style.transitionDuration = '0s';
        elRootPanel.Data().prev_xpshop_track_value = settings.xpshop_track_value;

        SetComplete(elRootPanel, nStarsEarned >= StoreAPI.GetXpShopMaxTrackLevel());
    }
    XpShopTrack.XpShopInit = XpShopInit;

    function PlayActivateParticles(settings) {
        return;
    }
    XpShopTrack.PlayActivateParticles = PlayActivateParticles;

    function SetComplete(elRoot, bSet = true) {
        elRoot.SetHasClass('complete', bSet);
        elRoot.SetDialogVariable('xpshop-track-tooltip', bSet ?
            $.Localize('#xpshop_track_complete_tooltip') :
            $.Localize('#xpshop_track_tooltip'));
    }

    async function XpShopUpdate(settings) {
        const elRootPanel = settings.xpshop_track_frame_panel;
        if (!elRootPanel || !elRootPanel.IsValid())
            return;

        const elTrack = elRootPanel.FindChildTraverse('jsRadialTrack');
        if (!elTrack)
            return;

        const prevTrackXp = elRootPanel.Data().prev_xpshop_track_value;
        if (prevTrackXp === undefined) {
            return;
        }

        const oldStars = Math.floor(prevTrackXp / nXPperStar);
        const newStars = Math.floor(settings.xpshop_track_value / nXPperStar);
        const starsEarned = newStars - oldStars;

        elRootPanel.SetDialogVariableInt('stars-earned', oldStars);

        if (oldStars >= StoreAPI.GetXpShopMaxTrackLevel()) {
            SetComplete(elRootPanel);
            return;
        }

        elTrack.style.transitionDuration = pieAnimDuration + 's';

        for (let i = 0; i < starsEarned; i++) {
            elRootPanel.AddClass("in-motion");
            elTrack.style.transitionDuration = pieAnimDuration + 's';
            elTrack.style.clip = 'radial(50% 50%, 0deg, 360deg)';
            elRootPanel.SetDialogVariableInt('progress-to-next-star', 100);
            UiToolkitAPI.PlaySoundEvent("UI.XP.Star.Filling");

            await Async.Delay(pieAnimDuration);

            elRootPanel.SetDialogVariableInt('stars-earned', oldStars + i + 1);
            elRootPanel.AddClass("earned-star");
            elTrack.style.transitionDuration = '0s';

            elRootPanel.style.transitionProperty = 'brightness';
            elRootPanel.style.transitionDuration = '.1s';
            UiToolkitAPI.PlaySoundEvent("UI.XP.Star.Full");

            elRootPanel.style.brightness = '2';
            await Async.Delay(0.2);
            elRootPanel.style.brightness = '1';
            await Async.Delay(0.2);

            elTrack.style.clip = 'radial(50% 50%, 0deg, 0deg)';
            elRootPanel.SetDialogVariableInt('progress-to-next-star', 0);
            elTrack.style.transitionDuration = pieAnimDuration + 's';
        }

        const deltaXp = settings.xpshop_track_value % nXPperStar;
        if (newStars >= StoreAPI.GetXpShopMaxTrackLevel()) {
            SetComplete(elRootPanel);
            return;
        }

        if (deltaXp > 0) {
            elRootPanel.AddClass("in-motion");
            const nPercentProgressTowardsNextStar = deltaXp / nXPperStar * 100;
            const nDegrees = Math.floor(nPercentProgressTowardsNextStar / 100 * 360);

            elRootPanel.SetDialogVariableInt('progress-to-next-star', nPercentProgressTowardsNextStar);
            elRootPanel.SetDialogVariableInt('stars-earned', newStars);
            elTrack.style.clip = 'radial(50% 50%, 0deg, ' + nDegrees + 'deg)';
            UiToolkitAPI.PlaySoundEvent("UI.XP.Star.Filling");
            elRootPanel.Data().prev_xpshop_track_value = settings.xpshop_track_value;
        }

        await Async.Delay(0.5);
        elRootPanel.RemoveClass("in-motion");
    }
    XpShopTrack.XpShopUpdate = XpShopUpdate;
})(XpShopTrack || (XpShopTrack = {}));