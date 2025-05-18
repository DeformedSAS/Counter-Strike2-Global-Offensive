'use strict';

function ShowIntroMovie() {
    var movieName = "file://{resources}/videos/intro.webm";
    var launcherType = MyPersonaAPI.GetLauncherType();
    if (launcherType == "perfectworld") {
        movieName = "file://{resources}/videos/intro-perfectworld.webm";
    }

    $("#IntroMoviePlayer").SetMovie(movieName);
    $("#IntroMoviePlayer").SetFocus();
    //$.RegisterKeyBind($("#IntroMoviePlayer"), "key_enter,key_space,key_escape", SkipIntroMovie);
    PlayIntroMovie();
}

function PlayIntroMovie() {
    $("#IntroMoviePlayer").style.opacity = '1'; 
    $.Schedule(0.1, function() { 
        $("#IntroMoviePlayer").Play();
        $.DispatchEvent('PlaySoundEffect', 'UIPanorama.submenu_slidein', 'MOUSE');
        
        $.Schedule(7.0, FadeOutAndSkip);
    });
}

function FadeOutAndSkip() {
    $("#IntroMoviePlayer").style.opacity = '0';
    $.Schedule(2.0, SkipIntroMovie); 
}

function SkipIntroMovie() {
    $("#IntroMoviePlayer").Stop();
    HideIntroMovie();
}

function DestroyMoviePlayer() {
    $("#IntroMoviePlayer").SetMovie("");
}

function HideIntroMovie() {
    $.Schedule(0.0, DestroyMoviePlayer);
    $.DispatchEvent("CSGOHideIntroMovie");
}

(function() {  
    $.RegisterForUnhandledEvent("CSGOShowIntroMovie", ShowIntroMovie);
    $.RegisterEventHandler("MoviePlayerPlaybackEnded", $("#IntroMoviePlayer"), HideIntroMovie);
})();
