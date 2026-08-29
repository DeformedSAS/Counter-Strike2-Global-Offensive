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
		
        $.Schedule(0.15, LoopTitleCheck);
    }
    
    function _SetMVPFlairImage(xuid) {
        if (!xuid) return;

        var cP = $.GetContextPanel();
        if (!cP || !cP.IsValid()) return;

        var elBgImage = cP.FindChildInLayoutFile('MedalBackground');
        if (!elBgImage || !elBgImage.IsValid()) return;

        var safeXuid = String(xuid);
        
        // safe guards to prevent crashing because of flair
        if (typeof FriendsListAPI === 'undefined' || typeof InventoryAPI === 'undefined') {
            elBgImage.style.backgroundImage = 'none';
            return;
        }

        var flairDefIdx = 0;
        try {
            flairDefIdx = FriendsListAPI.GetFriendDisplayItemDefFeatured( safeXuid );
        } catch(e) {
            // handle server disconnect
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
            elBgImage.AddClass('WinPanelRow__BG__AnimBg--anim');
        } else {
            elBgImage.style.backgroundImage = 'none';
        }
    }

    LoopTitleCheck();
})();

// there are multiple safe points to prevent crashing, as i'm not sure what really caused the crashing when disconnecting from a server or bot match.