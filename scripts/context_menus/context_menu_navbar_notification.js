"use strict";

var ContextMenuNavBarNotification;
(function (ContextMenuNavBarNotification) {

    function SetupContextMenu() {
        const panel = $.GetContextPanel();
        const icon        = panel.GetAttributeString("icon", "");
        const title       = panel.GetAttributeString("title", "");
        const color       = panel.GetAttributeString("color", "");
        const tooltip     = panel.GetAttributeString("tooltip", "");
        const gcConnecting = panel.GetAttributeString("gcconnecting", "");
        let link = panel.GetAttributeString("link", "");
        if (!link || link === "undefined") link = "";
        const root = $.CreatePanel("Panel", panel, "");
        root.BLoadLayoutSnippet("notification");
        panel.FindChildInLayoutFile("id-notification-gc-icon")
            .SetHasClass("show", gcConnecting === "true");
        const elIcon = panel.FindChildInLayoutFile("id-notification-icon");
        elIcon.SetHasClass("show", gcConnecting !== "true");

        if (gcConnecting !== "true") {
            elIcon.SetImage(`file://{images}/icons/ui/${icon}.svg`);
            if (color) elIcon.SetHasClass(color, true);
        }
        const elLink = panel.FindChildInLayoutFile("id-notification-link");
        if (link) {
            elLink.SetPanelEvent("onactivate", 
                () => SteamOverlayAPI.OpenUrlInOverlayOrExternalBrowser(link)
            );
        } else {
            elLink.SetPanelEvent("onactivate", () => {});
        }
        panel.SetHasClass("show-title", title !== "");
        panel.SetHasClass("show-tooltip", tooltip !== "");
        panel.SetHasClass("show-link", link !== "");
        panel.SetDialogVariable("title", title);
        panel.SetDialogVariable("tooltip", $.Localize(tooltip));
        panel.SetDialogVariable("link", link);

        panel.FindChildInLayoutFile("id-notification-text-block")
            .SetHasClass(color, true);
    }
    ContextMenuNavBarNotification.SetupContextMenu = SetupContextMenu;

})(ContextMenuNavBarNotification || (ContextMenuNavBarNotification = {}));
