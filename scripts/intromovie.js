'use strict';

function ShowIntroMovie() {
    $.Schedule(0.3, function() {
        var movieName = "file://{resources}/videos/intro.webm";
        var launcherType = MyPersonaAPI.GetLauncherType();
        if (launcherType == "perfectworld") {
            movieName = "file://{resources}/videos/intro-perfectworld.webm";
        }

        var panel = $("#IntroMoviePlayer");
        panel.style.opacity = '0'; 
        panel.SetMovie(movieName);
        panel.SetFocus();
		$.RegisterKeyBind($("#IntroMoviePlayer"), "key_enter,key_space,key_escape", SkipIntroMovie);

        $.Schedule(0.0, function() {
            panel.style.opacity = '1'; 
        });

        PlayIntroMovie();
    });
}

function PlayIntroMovie() {
    var panel = $("#IntroMoviePlayer");
    $.DispatchEvent('PlaySoundEffect', 'UIPanorama.submenu_slidein', 'MOUSE');
    panel.Play();
}

function FadeOutAndHide() {
    var panel = $("#IntroMoviePlayer");
    panel.style.opacity = '0'; 
    $.Schedule(1.0, HideIntroMovie); 
}

function SkipIntroMovie() {
    $("#IntroMoviePlayer").Stop();
    FadeOutAndHide();
}

function DestroyMoviePlayer() {
    $("#IntroMoviePlayer").SetMovie("");
}

function HideIntroMovie() {
    DestroyMoviePlayer();
    $.DispatchEvent("CSGOHideIntroMovie");
}


(function() {
    $.RegisterForUnhandledEvent("CSGOShowIntroMovie", ShowIntroMovie);
    $.RegisterEventHandler("MoviePlayerPlaybackEnded", $("#IntroMoviePlayer"), FadeOutAndHide);
})();
