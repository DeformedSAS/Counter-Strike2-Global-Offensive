'use strict';

var MainMenuYTMusic = (function() {
var _jsPayload = `
    (function() {
        /* -------------------------------------------------------------
           1. INJECT CLEAN STYLES
           ------------------------------------------------------------- */
        var styleId = 'ytm-panorama-theme';
        var existingStyle = document.getElementById(styleId);
        if (existingStyle) existingStyle.remove();

        var style = document.createElement('style');
        style.id = styleId;
        style.type = 'text/css';
        style.textContent = \`
            /* Global Font Overrides */
            html, body, ytmusic-app, ytmusic-app-layout,
            ytmusic-nav-bar, ytmusic-search-box, ytmusic-guide-entry-renderer,
            ytmusic-two-row-item-renderer, ytmusic-responsive-list-item-renderer,
            ytmusic-player-bar, ytmusic-section-header-renderer,
            ytmusic-responsive-header-renderer, ytmusic-description-shelf-renderer,
            ytmusic-player-page, ytmusic-tab-renderer, ytmusic-guide-section-renderer,
            .title, .subtitle, .second-subtitle, .description, .text,
            .description-shelf, ytmusic-song-lyrics-renderer,
            .ytmusic-song-lyrics-renderer, .time-info, .duration, .fixed-columns,
            .secondary-flex-columns, ytmusic-player-queue-item {
                font-family: 'Stratum2', 'Arial Unicode MS', sans-serif !important;
            }

            /* Condensed Font for Artist Names & Subtitles */
            ytmusic-responsive-header-renderer .subtitle a,
            ytmusic-responsive-header-renderer .strapline-text,
            ytmusic-responsive-header-renderer .strapline-text a,
            ytmusic-responsive-header-renderer a[href*="/channel/"],
            ytmusic-responsive-header-renderer a[href*="/artist/"],
            ytmusic-player-bar .byline a,
            ytmusic-player-bar .subtitle a,
            ytmusic-two-row-item-renderer .subtitle a,
            ytmusic-two-row-item-renderer[aspect-ratio="MUSIC_TWO_ROW_ITEM_THUMBNAIL_ASPECT_RATIO_CIRCLE"] .title,
            ytmusic-two-row-item-renderer[aspect-ratio="MUSIC_TWO_ROW_ITEM_THUMBNAIL_ASPECT_RATIO_CIRCLE"] .title a,
            ytmusic-responsive-list-item-renderer .secondary-flex-columns a,
            ytmusic-responsive-list-item-renderer .secondary-flex-columns a[href*="/channel/"],
            ytmusic-responsive-list-item-renderer .secondary-flex-columns a[href*="/artist/"],
            ytmusic-description-shelf-renderer .footer,
            ytmusic-header-renderer .subtitle {
                font-family: 'ST2MDCOND', 'ST2BDCOND', 'Stratum2 Condensed', 'Stratum2', sans-serif !important;
                font-weight: normal !important;
                letter-spacing: 0.03em !important;
                background: transparent !important;
            }

            /* Lock Base Container Surfaces */
            ytmusic-app-layout,
            ytmusic-app-layout #guide-wrapper,
            ytmusic-guide-renderer,
            #nav-bar-background,
            #content,
            ytmusic-browse-response {
                background: transparent !important;
                background-color: transparent !important;
            }

            /* Fixed Ambient Background Glow Spreading Left */
            ytmusic-background,
            #background.ytmusic-app-layout,
            ytmusic-background #background {
                display: block !important;
                position: fixed !important;
                top: -10% !important;
                left: -10% !important;
                width: 120vw !important;
                height: 120vh !important;
                opacity: 1.0 !important;
                filter: blur(65px) brightness(220%) saturate(200%) !important;
                transform: scale(1.2) !important;
                z-index: -1 !important;
                pointer-events: none !important;
                transition: none !important;
            }

            /* Hide HTML5 Video Stream Canvas */
            ytmusic-player video,
            .html5-main-video {
                opacity: 0 !important;
                visibility: hidden !important;
            }

            /* Custom Fallback Overlay Cover Art Container */
            #custom-album-cover-overlay {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                height: 100% !important;
                z-index: 99 !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                background-color: transparent !important;
                pointer-events: none !important;
            }

            #custom-album-cover-overlay img {
                max-width: 80% !important;
                max-height: 80% !important;
                object-fit: contain !important;
                box-shadow: 0 12px 40px rgba(0,0,0,0.85) !important;
                border-radius: 8px !important;
            }
        \`;
        (document.head || document.documentElement).appendChild(style);

        /* -------------------------------------------------------------
           2. CONDITIONAL OVERLAY INJECTION
           ------------------------------------------------------------- */
        function syncCoverArt() {
            var playerContainer = document.querySelector('ytmusic-player');
            var playerPage = document.querySelector('ytmusic-player-page');

            // Hide overlay if player is collapsed/disabled
            if (!playerContainer || (playerPage && playerPage.hasAttribute('player-disabled_'))) {
                var existingOverlay = document.getElementById('custom-album-cover-overlay');
                if (existingOverlay) existingOverlay.remove();
                return;
            }

            // Check if native YTM album thumbnail is already rendered on screen
            var nativeImg = document.querySelector('ytmusic-player #thumbnail img');
            var isNativeImgVisible = nativeImg && nativeImg.src && nativeImg.offsetWidth > 0 && nativeImg.offsetHeight > 0;

            if (isNativeImgVisible) {
                // Remove custom overlay so it doesn't double-render over native album art
                var existingOverlay = document.getElementById('custom-album-cover-overlay');
                if (existingOverlay) existingOverlay.remove();
                return;
            }

            // Otherwise (video playing), inject custom album cover overlay
            var overlay = document.getElementById('custom-album-cover-overlay');
            if (!overlay) {
                overlay = document.createElement('div');
                overlay.id = 'custom-album-cover-overlay';
                var img = document.createElement('img');
                img.id = 'custom-album-cover-img';
                overlay.appendChild(img);
                playerContainer.appendChild(overlay);
            }

            var overlayImg = document.getElementById('custom-album-cover-img');
            var barImg = document.querySelector('ytmusic-player-bar .image, ytmusic-player-bar img');
            if (barImg && barImg.src && overlayImg) {
                var highResUrl = barImg.src.replace(/w\\d+-h\\d+/, 'w1080-h1080').replace(/s\\d+/, 's1080');
                if (overlayImg.src !== highResUrl) {
                    overlayImg.src = highResUrl;
                }
            }
        }

        setInterval(syncCoverArt, 500);
    })();
`;
    var _Init = function() {
        var elYTMusicHTML = $.GetContextPanel().FindChildTraverse('YTMusicHTML');
        if (elYTMusicHTML) {
            elYTMusicHTML.SetURL('https://music.youtube.com');
        }
    };

    function _OnHTMLFinishRequest(objHtmlEventTarget, sUrl) {
        var elYTMusicHTML = $.GetContextPanel().FindChildTraverse('YTMusicHTML');
        if (elYTMusicHTML) {
            elYTMusicHTML.RunJavascript(_jsPayload);
        }
    }

    function _HTMLOpenPopupTab(objHtmlEventTarget, objHtml, sUrl) {
        SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser(sUrl);
    }

    return {
        Init: _Init,
        OnHTMLFinishRequest: _OnHTMLFinishRequest,
        HTMLOpenPopupTab: _HTMLOpenPopupTab
    };
})();

(function() {
    MainMenuYTMusic.Init();
    $.RegisterEventHandler("HTMLOpenPopupTab", $.GetContextPanel(), MainMenuYTMusic.HTMLOpenPopupTab);
    $.RegisterEventHandler("HTMLFinishRequest", $.GetContextPanel(), MainMenuYTMusic.OnHTMLFinishRequest);
})();