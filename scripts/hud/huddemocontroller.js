"use strict";

var HudDemoController = (function() {
    var scales = [0.25, 0.5, 1.0, 2.0, 4.0];
    var currentScaleIndex = 2;
    var isInternalUpdate = false;

    function EatClick() {
        // Prevents clicks from bleeding through the UI panel into the game
    }

    function OnPlayClicked() {
        // Toggles play/pause state using native console command
        GameInterfaceAPI.ConsoleCommand("demo_togglepause");
    }

    function OnStepTimeBackward() {
        GameInterfaceAPI.ConsoleCommand("demo_goto -320"); // ~5 seconds back at 64-tick
    }

    function OnStepTimeForward() {
        GameInterfaceAPI.ConsoleCommand("demo_goto 320"); // ~5 seconds forward
    }

    function OnStepInterval(direction) {
        if (direction === 0) {
            GameInterfaceAPI.ConsoleCommand("demo_gototick 0");
        } else {
            // Uses relative demo jumps for previous/next round skipping
            GameInterfaceAPI.ConsoleCommand("demo_goto " + (direction > 0 ? "+1" : "-1"));
        }
    }

    function CycleTimeScale() {
        currentScaleIndex = (currentScaleIndex + 1) % scales.length;
        var newScale = scales[currentScaleIndex];
        GameInterfaceAPI.ConsoleCommand("demo_timescale " + newScale);

        var timeScaleLabel = $("#TimeScale");
        if (timeScaleLabel) {
            timeScaleLabel.text = newScale + "x";
        }
    }

    function OnStopPlayback() {
        GameInterfaceAPI.ConsoleCommand("stopdemo");
    }

    function OnSliderChanged() {
        var slider = $("#Slider");
        if (!slider || isInternalUpdate) return;

        var targetTick = Math.floor(slider.value);
        GameInterfaceAPI.ConsoleCommand("demo_gototick " + targetTick);
    }

    return {
        EatClick: EatClick,
        OnPlayClicked: OnPlayClicked,
        OnStepTimeBackward: OnStepTimeBackward,
        OnStepTimeForward: OnStepTimeForward,
        OnStepInterval: OnStepInterval,
        CycleTimeScale: CycleTimeScale,
        OnStopPlayback: OnStopPlayback,
        OnSliderChanged: OnSliderChanged
    };
})();