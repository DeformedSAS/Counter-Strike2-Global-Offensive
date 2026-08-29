'use strict';

var LoadingScreen = ( function() {

    var cvars = [ 'mp_roundtime', 'mp_fraglimit', 'mp_maxrounds' ];
    var cvalues = [ '0', '0', '0' ];
    const MAX_SLIDES = 5;
    const SLIDE_DURATION = 4;
    const NUM_FUN_MESSAGES = 51; // total count of all fun loading screen localizations
    
    let m_slideShowJob = null;
    let m_funTextJob = null;
    let m_mapName = null;
    let m_numImageLoading = 0;
    let m_matchCheckJob = null;
	let m_delayEndSlideShowJob = null;

    var _Init = function ()
    {
        LDNScreenMusicS2('loading');
        $('#ProgressBar').value = 0;

        $('#LoadingScreenGameMode').AddClass("hidden_no_info");
        $('#LoadingScreenMapName').AddClass("hidden_no_info");
        $('#LoadingScreenInfo').AddClass("hidden_no_info");
        $('#LoadingScreenGamemodeInfo').AddClass("hidden_no_info");
        $('#LoadingScreenGameModeIcon').AddClass("hidden_no_info");
        $('#BlaBlaTrucSeperator').AddClass("hidden_no_info");

        $('#LoadingScreenMapName').text = "";
        $('#LoadingScreenGameMode' ).SetLocalizationString( "" );
        $('#LoadingScreenModeDesc').text = "";
        $('#LoadingScreenGameModeIcon').SetImage("");

        var elBackgroundImage = $.GetContextPanel().FindChildInLayoutFile('BackgroundMapImage');
        if (elBackgroundImage) {
            elBackgroundImage.SetImage("file://{images}/map_icons/screenshots/1080p/default.png");
        }
        
        const elSlideShow = $.GetContextPanel().FindChildTraverse('LoadingScreenSlideShow');
        if (elSlideShow) {
            elSlideShow.RemoveAndDeleteChildren();
        }
        $('#LoadingScreenIcon').visible = false;
        
        m_numImageLoading = 0;
		
		if ( m_delayEndSlideShowJob !== null )
        {
        $.CancelScheduled( m_delayEndSlideShowJob );
        m_delayEndSlideShowJob = null;
        }

        if (m_slideShowJob !== null && m_slideShowJob !== undefined) {
            $.CancelScheduled(m_slideShowJob);
            m_slideShowJob = null;
        }

        if (m_matchCheckJob !== null && m_matchCheckJob !== undefined) {
            $.CancelScheduled(m_matchCheckJob);
            m_matchCheckJob = null;
        }

        _UpdateFunLoadingText();
        _StartFunTextTimer();

        m_mapName = null;
    }

    function _GetRandomFunLoadingToken() {
        const randomIndex = Math.floor(Math.random() * NUM_FUN_MESSAGES);
        return '#LoadingProgress_CSFunLoading' + randomIndex;
    }

    function _UpdateFunLoadingText() {
        const elStatusText = $('#ProgressStatusTextFun');
        if (elStatusText && elStatusText.IsValid()) {
            const token = _GetRandomFunLoadingToken();
            elStatusText.SetLocalizationString(token);
        }
    }

    function _StopFunTextTimer() {
        if (m_funTextJob !== null && m_funTextJob !== undefined) {
            $.CancelScheduled(m_funTextJob);
            m_funTextJob = null;
        }
    }

    function _StartFunTextTimer() {
        _StopFunTextTimer();

        m_funTextJob = $.Schedule(3.5, function() {
            m_funTextJob = null;
            _UpdateFunLoadingText();
            _StartFunTextTimer();
        });
    }

    function _CreateSlide(n) {
        const suffix = n == 0 ? '' : '_' + n;
        const imagePath = 'file://{images}/map_icons/screenshots/1080p/' + m_mapName + suffix + '.png';
        const elSlideShow = $.GetContextPanel().FindChildTraverse('LoadingScreenSlideShow');
        if (!elSlideShow) return false;

        const elSlide = $.CreatePanel('Image', elSlideShow, 'slide_' + n);
        elSlide.BLoadLayoutSnippet('snippet-loadingscreen-slide');
        elSlide.SetImage(imagePath);
        elSlide.Data().imagePath = imagePath;
        elSlide.SwitchClass('viz', 'hide');
        
        const titleToken = '#loadingscreen_title_' + m_mapName + suffix;
        let title = $.Localize(titleToken);
        if (title == titleToken)
            title = '';
        elSlide.SetDialogVariable('screenshot-title', title);

        m_numImageLoading++;
        $.RegisterEventHandler('ImageLoaded', elSlide, () => {
            m_numImageLoading--;
            if (m_numImageLoading <= 0)
                _StartSlideShow();
        });
        $.RegisterEventHandler('ImageFailedLoad', elSlide, () => {
            elSlide.DeleteAsync(0.0);
            m_numImageLoading--;
            if (m_numImageLoading <= 0)
                _StartSlideShow();
        });
        return true;
    }

    function _InitSlideShow() {
        if (m_slideShowJob)
            return;

        if (!m_mapName || m_mapName === "") {
            m_mapName = GameStateAPI.GetMapName() || '';
        }

        for (let n = 0; n < MAX_SLIDES; n++) {
            _CreateSlide(n);
        }
        _CheckForMatchStart();
    }

    function _StartSlideShow() {
        const elSlideShow = $.GetContextPanel().FindChildTraverse('LoadingScreenSlideShow');
        if (!elSlideShow) return;
        const arrSlides = elSlideShow.Children();
        if (arrSlides.length === 0) return;

        const randomOffset = Math.floor(Math.random() * arrSlides.length);
        _NextSlide(randomOffset, true);
    }

    function _NextSlide(n, bFirst = false) {
        m_slideShowJob = null;
        const elSlideShow = $.GetContextPanel().FindChildTraverse('LoadingScreenSlideShow');
        if (!elSlideShow) return;
        const arrSlides = elSlideShow.Children();
        if (arrSlides.length <= 1)
            return;
        if (n >= arrSlides.length)
            n = n - arrSlides.length;
        let m = n - 1;
        if (m < 0)
            m = arrSlides.length - 1;
        if (arrSlides[n]) {
            if (bFirst)
                arrSlides[n].SwitchClass('viz', 'show-first');
            else
                arrSlides[n].SwitchClass('viz', 'show');
        }
        const slide = arrSlides[m];
        if (slide)
            $.Schedule(0.25, () => {
                if (slide && slide.IsValid())
                    slide.SwitchClass('viz', 'hide');
            });
        m_slideShowJob = $.Schedule(SLIDE_DURATION, () => _NextSlide(n + 1));
    }

    function _EndSlideShow()
    {
        if ( m_slideShowJob !== null && m_slideShowJob !== undefined )
        {
            $.CancelScheduled( m_slideShowJob );
            m_slideShowJob = null;
        }

        if ( m_matchCheckJob !== null && m_matchCheckJob !== undefined )
        {
            $.CancelScheduled( m_matchCheckJob );
            m_matchCheckJob = null;
        }

        _StopFunTextTimer();
		
		if ( m_delayEndSlideShowJob !== null )
        {
        $.CancelScheduled( m_delayEndSlideShowJob );
        m_delayEndSlideShowJob = null;
        }

        const elSlideShow = $.GetContextPanel().FindChildTraverse('LoadingScreenSlideShow');
        if ( elSlideShow )
        {
            elSlideShow.RemoveAndDeleteChildren();
        }
    }

    function _CheckForMatchStart()
    {
        m_matchCheckJob = null;

        var isPlaying = GameStateAPI.IsLocalPlayerPlayingMatch();
        var teamNum = GameStateAPI.GetPlayerTeamNumber ? GameStateAPI.GetPlayerTeamNumber(GameStateAPI.GetLocalPlayerXuid()) : 0;

        if ( isPlaying || teamNum > 0 )
        {
            if ( m_delayEndSlideShowJob !== null )
            {
                $.CancelScheduled( m_delayEndSlideShowJob );
            }

            m_delayEndSlideShowJob = $.Schedule( 1.5, function() {
                m_delayEndSlideShowJob = null;
                _EndSlideShow();
            });
        }
        else
        {
            m_matchCheckJob = $.Schedule( 0.1, _CheckForMatchStart );
        }
    }

    function _OnMapLoadFinished() {
        _EndSlideShow();
    }

    var _UpdateLoadingScreenInfo = function (mapName, prettyMapName, prettyGameModeName, gameType, gameMode, descriptionText)
    {
        for ( var j = 0; j < cvars.length; ++ j )
        {
            var val = GameInterfaceAPI.GetSettingString( cvars[j] );
            if ( val !== '0' )
            {
                cvalues[j] = val;
            }
        }

        for ( var j = 0; j < cvars.length; ++ j )
        {
            const regex = new RegExp( '\\${d:'+cvars[j]+'}', 'gi' );
            descriptionText = descriptionText.replace( regex, cvalues[j] );
            $.GetContextPanel().SetDialogVariable( cvars[j], cvalues[j] );
        }

        if (mapName)
        {
            m_mapName = mapName || GameStateAPI.GetMapName();

            var elBackgroundImage = $.GetContextPanel().FindChildInLayoutFile('BackgroundMapImage');        
            if (elBackgroundImage) {
                elBackgroundImage.SetImage("file://{images}/map_icons/screenshots/1080p/default.png");
            }

            var mapIconFailedToLoad = function () {
                $('#LoadingScreenMapName').RemoveClass("loading-screen-content__info__text-title-short");
                $('#LoadingScreenMapName').AddClass("loading-screen-content__info__text-title-long");
                $('#LoadingScreenIcon').visible = false;
            }

            $('#LoadingScreenIcon').visible = true;
            $.RegisterEventHandler('ImageFailedLoad', $('#LoadingScreenIcon'), mapIconFailedToLoad.bind(undefined));
            $('#LoadingScreenMapName').RemoveClass("loading-screen-content__info__text-title-long");
            $('#LoadingScreenMapName').AddClass("loading-screen-content__info__text-title-short");
            $('#LoadingScreenIcon').SetImage('file://{images}/map_icons/map_icon_' + m_mapName + '.svg');

            $( '#LoadingScreenIcon' ).AddClass('show');
            if (elBackgroundImage) {
                elBackgroundImage.RemoveClass('show');
            }

            if (prettyMapName != "")
                $( '#LoadingScreenMapName' ).SetProceduralTextThatIPromiseIsLocalizedAndEscaped(prettyMapName, false);
            else
                $( '#LoadingScreenMapName' ).SetLocalizationString(GameStateAPI.GetMapDisplayNameToken(m_mapName));
        }

        var elInfoBlock = $('#LoadingScreenInfo');

        if (gameMode)
        {
            elInfoBlock.RemoveClass('hidden');
            if (prettyGameModeName != "")
                $( '#LoadingScreenGameMode' ).SetProceduralTextThatIPromiseIsLocalizedAndEscaped(prettyGameModeName, false);
            else
                $( '#LoadingScreenGameMode' ).SetLocalizationString('#sfui_gamemode_' + gameMode);
            
            if (GameStateAPI.IsQueuedMatchmakingMode_Team() || m_mapName === 'lobby_mapveto')
                $('#LoadingScreenGameModeIcon').SetImage("file://{images}/icons/ui/competitive_teams.svg");
            else
                $('#LoadingScreenGameModeIcon').SetImage('file://{images}/icons/ui/' + gameMode + '.svg');

            if (descriptionText != "")
                $( '#LoadingScreenModeDesc' ).SetProceduralTextThatIPromiseIsLocalizedAndEscaped(descriptionText, false);
            else
                $( '#LoadingScreenModeDesc' ).SetLocalizationString("");                                        
        }
        else
            elInfoBlock.AddClass('hidden');

        $('#LoadingScreenGameMode').RemoveClass("hidden_no_info");
        $('#LoadingScreenMapName').RemoveClass("hidden_no_info");
        $('#LoadingScreenInfo').RemoveClass("hidden_no_info");
        $('#LoadingScreenGamemodeInfo').RemoveClass("hidden_no_info");
        $('#LoadingScreenGameModeIcon').RemoveClass("hidden_no_info");
        $('#BlaBlaTrucSeperator').RemoveClass("hidden_no_info");

        _InitSlideShow();
    }
    
    var LDNScreenMusicS2 = function ( type )
    {
        var itemId = LoadoutAPI.GetItemID('noteam', 'musickit');
        var musicId = InventoryAPI.GetItemAttributeValue(itemId, 'music id');
        var musicName = InventoryAPI.GetMusicNameFromMusicID(musicId);
        musicName = musicName.replace(/^#musickit_/, '');

        if (type == 'loading' && GameStateAPI.GetCSGOGameUIStateName() == 'CSGO_GAME_UI_STATE_LOADINGSCREEN') {
            InventoryAPI.PlayItemPreviewMusic(itemId, 'startround_01.mp3');
            InventoryAPI.StopItemPreviewMusic();
    
            var randomAction = Math.random() < 0.5 ? "Music.StartAction_01." : "Music.StartAction_02.";
    
            $.DispatchEvent('PlaySoundEffect', 'Music.StartAction.' + musicName, 'MOUSE');
        }
    }

    var _SetCharacterAnim = function ( elPanel, settings )
    {
    }

    return {
        Init                    : _Init,
        UpdateLoadingScreenInfo : _UpdateLoadingScreenInfo,
        OnMapLoadFinished       : _OnMapLoadFinished
    }
})();

( function() {
    $.RegisterForUnhandledEvent('PopulateLoadingScreen', LoadingScreen.UpdateLoadingScreenInfo);
    $.RegisterForUnhandledEvent('QueueConnectToServer', LoadingScreen.Init);
    $.RegisterForUnhandledEvent('UnloadLoadingScreenAndReinit', LoadingScreen.Init);
})();