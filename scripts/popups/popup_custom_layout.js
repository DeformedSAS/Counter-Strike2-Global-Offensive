"use strict";
/// <reference path="../csgo.d.ts" />
var PopupCustomLayout;
(function (PopupCustomLayout) {
    let g_sWatchEvent;
    let g_nWatchEventHandlerId;
    function CleanupWatchEvent() {
        if (g_sWatchEvent !== undefined && g_nWatchEventHandlerId !== undefined) {
            $.UnregisterForUnhandledEvent(g_sWatchEvent, g_nWatchEventHandlerId);
        }
        g_sWatchEvent = undefined;
        g_nWatchEventHandlerId = undefined;
    }
    function Init() {
        const oSettings = $.GetContextPanel().Data().oSettings;
        $.GetContextPanel().SetHasClass('HideTitle', oSettings.title === undefined || oSettings.title === null || oSettings.title === '');
        $.GetContextPanel().SetDialogVariable("title", oSettings.title);
        $.GetContextPanel().SetDialogVariable("message", oSettings.message);
        $.GetContextPanel().SetHasClass('NoMinWidth', oSettings.no_min_width);
        $("#popupimage").SetImage(oSettings.image);
        $("#Spinner").SetHasClass("SpinnerVisible", oSettings.show_spinner != 0);
        if (oSettings.show_loading_bar) {
            let progressBar = $("#ProgressBar");
            progressBar.SetHasClass("ProgressBarVisible", true);
            progressBar.min = 0.0;
            progressBar.max = 1.0;
            progressBar.value = 0.0;
            $.Schedule(0.1, UpdateProgressBar);
        }
        if (oSettings.timeout > 0) {
            $.Schedule(oSettings.timeout, () => {
                CleanupWatchEvent();
                $.DispatchEvent('UIPopupButtonClicked', '');
            });
        }
        $.GetContextPanel().SetHasClass('HideButtons', oSettings.hide_buttons);
        if (oSettings.watch_event && oSettings.watch_event_callback) {
            const sWatchEvent = oSettings.watch_event;
            const nCallbackHandle = oSettings.watch_event_callback;
            CleanupWatchEvent();
            g_sWatchEvent = sWatchEvent;
            g_nWatchEventHandlerId = $.RegisterForUnhandledEvent(sWatchEvent, () => {
                CleanupWatchEvent();
                UiToolkitAPI.InvokeJSCallback(nCallbackHandle);
                OnOKPressed();
            });
        }
    }
    PopupCustomLayout.Init = Init;
    ;
    function OnOKPressed() {
        CleanupWatchEvent();
        let callbackHandle = $.GetContextPanel().GetAttributeInt("callback", -1);
        if (callbackHandle != -1) {
            UiToolkitAPI.InvokeJSCallback(callbackHandle, 'OK');
        }
        $.DispatchEvent('UIPopupButtonClicked', '');
    }
    function UpdateProgressBar() {
        let loadingBarCallbackHandle = $.GetContextPanel().GetAttributeInt("loadingBarCallback", -1);
        if (loadingBarCallbackHandle != -1) {
            $("#ProgressBar").value = UiToolkitAPI.InvokeJSCallback(loadingBarCallbackHandle);
            $.Schedule(0.1, UpdateProgressBar);
        }
    }
    {
    }
})(PopupCustomLayout || (PopupCustomLayout = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY3VzdG9tX2xheW91dC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL3BvcHVwcy9wb3B1cF9jdXN0b21fbGF5b3V0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQSxxQ0FBcUM7QUFrQnJDLElBQVUsaUJBQWlCLENBc0gxQjtBQXRIRCxXQUFVLGlCQUFpQjtJQU92QixJQUFJLGFBQWlDLENBQUM7SUFDdEMsSUFBSSxzQkFBMEMsQ0FBQztJQUUvQyxTQUFTLGlCQUFpQjtRQUV0QixJQUFLLGFBQWEsS0FBSyxTQUFTLElBQUksc0JBQXNCLEtBQUssU0FBUyxFQUN4RTtZQUNJLENBQUMsQ0FBQywyQkFBMkIsQ0FBRSxhQUFhLEVBQUUsc0JBQXNCLENBQUUsQ0FBQztTQUMxRTtRQUNELGFBQWEsR0FBRyxTQUFTLENBQUM7UUFDMUIsc0JBQXNCLEdBQUcsU0FBUyxDQUFDO0lBQ3ZDLENBQUM7SUFFRCxTQUFnQixJQUFJO1FBRWhCLE1BQU0sU0FBUyxHQUFHLENBQUMsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxTQUFTLENBQUM7UUFFdkQsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLFdBQVcsQ0FBRSxXQUFXLEVBQUUsU0FBUyxDQUFDLEtBQUssS0FBSyxTQUFTLElBQUksU0FBUyxDQUFDLEtBQUssS0FBSyxJQUFJLElBQUksU0FBUyxDQUFDLEtBQUssS0FBSyxFQUFFLENBQUUsQ0FBQztRQUNwSSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsaUJBQWlCLENBQUUsT0FBTyxFQUFFLFNBQVMsQ0FBQyxLQUFLLENBQUUsQ0FBQztRQUVsRSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsaUJBQWlCLENBQUUsU0FBUyxFQUFFLFNBQVMsQ0FBQyxPQUFPLENBQUUsQ0FBQztRQUV0RSxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsV0FBVyxDQUFF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