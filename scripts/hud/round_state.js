'use strict';

(function () {

    function HasClassInAncestry(panel, className) {
        var curr = panel;
        while (curr) {
            if (typeof curr.BHasClass === 'function' && curr.BHasClass(className)) {
                return true;
            }
            curr = (typeof curr.GetParent === 'function') ? curr.GetParent() : null;
        }
        return false;
    }

    function LoopTitleCheck() {
        var cP = $.GetContextPanel();
        
        // check if winpanel is valid
        if (!cP || !cP.IsValid()) {
            return;
        }

        // to prevent the game from crashing.
        if (typeof GameStateAPI !== 'undefined' && GameStateAPI.IsConnectedOrConnectingToServer && !GameStateAPI.IsConnectedOrConnectingToServer()) {
            return;
        }

        // determines which team won by the css classes.
        var isLocalCT = HasClassInAncestry(cP, 'hud-team-ct');
        var isLocalT = HasClassInAncestry(cP, 'hud-team-t');
        var isCTWin = HasClassInAncestry(cP, 'WinPanelRoot--CTWin');
        var isTWin = HasClassInAncestry(cP, 'WinPanelRoot--TWin');

        if (!isLocalCT && !isLocalT) {
            var inEyeXuid = "";
            if (typeof GameStateAPI !== 'undefined' && GameStateAPI.GetLocalOrInEyePlayerXuid) {
                inEyeXuid = GameStateAPI.GetLocalOrInEyePlayerXuid();
            }
            if (inEyeXuid && inEyeXuid !== "0" && typeof MatchStatsAPI !== 'undefined' && MatchStatsAPI.GetPlayerTeam) {
                var team = MatchStatsAPI.GetPlayerTeam(inEyeXuid);
                if (team === "CT" || team === 3) {
                    isLocalCT = true;
                } else if (team === "T" || team === 2) {
                    isLocalT = true;
                }
            }
        }

        // updates win/loss titles
        var titleText = "";
        if ((isLocalCT && isCTWin) || (isLocalT && isTWin)) {
            titleText = $.Localize("#WinPanel_RoundWon");
        } else if ((isLocalCT && isTWin) || (isLocalT && isCTWin)) {
            titleText = $.Localize("#WinPanel_RoundLost");
        }

        if (titleText !== "") {
            var mainTitle = cP.FindChildInLayoutFile('Title');
            if (mainTitle && mainTitle.text !== titleText) {
                mainTitle.text = titleText;
            }

            var fadedTitle = cP.FindChildInLayoutFile('TitleFaded');
            if (fadedTitle && fadedTitle.text !== titleText) {
                fadedTitle.text = titleText;
            }
        }

        // fetch mvp xuid safely
        var mvpXuid = "";
        if (typeof MatchStatsAPI !== 'undefined' && MatchStatsAPI.GetMVPXuid) {
            mvpXuid = MatchStatsAPI.GetMVPXuid(cP);
        }

        if (!mvpXuid || mvpXuid === "0") {
            var avatarPanel = cP.FindChildInLayoutFile('MVPAvatar');
            if (avatarPanel && avatarPanel.IsValid()) {
                mvpXuid = avatarPanel.GetAttributeString("steamid", "");
                if (!mvpXuid) mvpXuid = avatarPanel.steamid;
            }
        }
        
        if (mvpXuid && mvpXuid !== "0") {
            _SetMVPFlairImage(mvpXuid);
        }

        // this should hide the music kit in the winpanel if the mvp doesn't have one, it follows if the text itself is hidden.
        var elMusicKit = cP.FindChildInLayoutFile('MVPMusicKit');
        var elMusicKitIcon = cP.FindChildInLayoutFile('MVPMusicKitIcon');
        var elMusicKitName = cP.FindChildInLayoutFile('MVPMusicKitName');

        if (elMusicKitIcon && elMusicKitIcon.IsValid()) {
            var hasMusicKitText = elMusicKitName && elMusicKitName.IsValid() && elMusicKitName.text && elMusicKitName.text.trim() !== "";
            var isMusicKitPanelVisible = elMusicKit && elMusicKit.IsValid() && elMusicKit.visible && elMusicKit.style.visibility !== 'collapse';

            if (!hasMusicKitText || !isMusicKitPanelVisible) {
                elMusicKitIcon.style.visibility = 'collapse';
            } else {
                elMusicKitIcon.style.visibility = 'visible';
            }
        }

        _UpdateFunfactVisibility(cP);
        
        $.Schedule(0.15, LoopTitleCheck);
    }
    
    function _SetMVPFlairImage(xuid) {
        if (!xuid) return;

        var cP = $.GetContextPanel();
        if (!cP || !cP.IsValid()) return;

        var elBgImage = cP.FindChildInLayoutFile('MedalBackground');
        if (!elBgImage || !elBgImage.IsValid()) return;

        var safeXuid = String(xuid);
        
        // if the bot is the mvp, hide the badge from the previous mvp.
        if (typeof GameStateAPI !== 'undefined' && typeof GameStateAPI.IsFakePlayer === 'function') {
            if (GameStateAPI.IsFakePlayer(safeXuid)) {
                elBgImage.style.backgroundImage = 'none';
                return;
            }
        }
        
        // safe guards to prevent crashing because of flair
        if (typeof FriendsListAPI === 'undefined' || typeof InventoryAPI === 'undefined') {
            elBgImage.style.backgroundImage = 'none';
            return;
        }

        var flairDefIdx = 0;
        try {
            flairDefIdx = FriendsListAPI.GetFriendDisplayItemDefFeatured( safeXuid );
        } catch(e) {
            flairDefIdx = 0;
        }

        if (!flairDefIdx || flairDefIdx === 0 || flairDefIdx === "0") {
            elBgImage.style.backgroundImage = 'none';
            return;
        }

        var flairItemId = InventoryAPI.GetFauxItemIDFromDefAndPaintIndex( flairDefIdx, 0 );
        if (!flairItemId) {
            elBgImage.style.backgroundImage = 'none';
            return;
        }

        var imagePath = InventoryAPI.GetItemInventoryImage( flairItemId );

        if (imagePath) {
            elBgImage.style.backgroundImage = 'url("file://{images_econ}' + imagePath + '_large.png")';
            elBgImage.style.backgroundPosition = '50% 50%';
            elBgImage.style.backgroundSize = 'cover';
            elBgImage.style.backgroundRepeat = 'no-repeat';
            elBgImage.TriggerClass('WinPanelRow__BG__AnimBg--anim');
        } else {
            elBgImage.style.backgroundImage = 'none';
        }
    }

    var _isWinPanelVisible = false;

    function _OnWinPanelShow() {
        _isWinPanelVisible = false; 
        $.Schedule(1.2, function() {
            var cP = $.GetContextPanel();
            if (!cP || !cP.IsValid()) return;

            if (!cP.BHasClass('WinPanelRoot--ForceHide') && !cP.BHasClass('endofmatch')) {
                _isWinPanelVisible = true;
                var elFunfact = cP.FindChildInLayoutFile('Funfact');
                if (elFunfact && elFunfact.IsValid()) {
                    elFunfact.RemoveClass('hidden');
                    elFunfact.style.visibility = 'visible';
                }
            }
        });
    }

    function _UpdateFunfactVisibility(cP) {
        var elFunfact = cP.FindChildInLayoutFile('Funfact');
        if (!elFunfact || !elFunfact.IsValid()) return;

        var isForceHidden = cP.BHasClass('WinPanelRoot--ForceHide') || cP.BHasClass('endofmatch');

        if (isForceHidden || !_isWinPanelVisible) {
            elFunfact.AddClass('hidden');
            elFunfact.style.visibility = 'collapse';
        }
    }

    $.RegisterForUnhandledEvent('HudWinPanelShowEvent', _OnWinPanelShow);

    LoopTitleCheck();
})();