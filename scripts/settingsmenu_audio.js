"use strict";

var MusicPreview = (function () { // note that this is really bad code but atleast it mostly works properly.. don't try to preview music after leaving a match tho. it's a nightmare. and no ai was used here.

    var m_schfnMusicMvpPreviewEnd = null;
    var m_currentEvent = ""; 

    function _StopMenuMusic() {
        $.DispatchEvent('PlayMainMenuMusic', false, true);
    }

    function _PlayMenuSong() {
        $.DispatchEvent('PlayMainMenuMusic', true, false); 
    }

    function _CleanupCurrent() {
        if (m_schfnMusicMvpPreviewEnd) {
            $.CancelScheduled(m_schfnMusicMvpPreviewEnd);
            m_schfnMusicMvpPreviewEnd = null;
        }
        InventoryAPI.StopItemPreviewMusic();
        m_currentEvent = "";
    }

    function Play(type) {
        if (GameStateAPI.IsLocalPlayerPlayingMatch()) {
            _CleanupCurrent();
            return;
        }

        var itemId = LoadoutAPI.GetItemID('noteam', 'musickit');
        if (!itemId) return;

        var musicId = InventoryAPI.GetItemAttributeValue(itemId, 'music id');
        var musicName = InventoryAPI.GetMusicNameFromMusicID(musicId);
        if (!musicName || musicName === "") {

            _CleanupCurrent();
            _PlayMenuSong();
            return;
        }

        musicName = musicName.replace(/^#musickit_/, '');

        var eventMap = {
            menu: "Music.EndOfMatch." + musicName,
            roundstart: "Music.StartAction." + musicName,
            deathcam: "Music.DeathCam." + musicName,
            mvp: "Music.MVPAnthem." + musicName,
            bomb: "Music.BombPlanted." + musicName,
            tensec: "Music.BombTenSecCount." + musicName,
            round_lost: "Music.LostRound." + musicName,
            loading: "Music.StartRound." + musicName
        };

        var eventName = eventMap[type];
        if (!eventName) return;

        if (m_currentEvent === eventName) return;

        _CleanupCurrent();

        m_currentEvent = eventName;

        $.Schedule(0.01, function() {
            if (m_currentEvent === eventName) {
                _StopMenuMusic();
				 $.DispatchEvent('PlayMainMenuMusic', false, false);
                $.DispatchEvent('PlaySoundEffect', eventName, 'MOUSE');
            }
        });

        m_schfnMusicMvpPreviewEnd = $.Schedule(4.5, function() {
            m_schfnMusicMvpPreviewEnd = null;
            m_currentEvent = ""; 
            
            InventoryAPI.StopItemPreviewMusic();

            $.DispatchEvent('PlayMainMenuMusic', true, true);
            $.Schedule(0.1, function () {
                _PlayMenuSong();
            });
        });
    }

    return {
        Play: Play,
        Stop: function() {
            _CleanupCurrent();
            _PlayMenuSong();
        }
    };

})();