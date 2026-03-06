"use strict";
/// <reference path="csgo.d.ts" />
var NewsPanel;
(function (NewsPanel) {

    const GITHUB_API_URL = "https://api.github.com/repos/DeformedSAS/Counter-Strike2-Global-Offensive/releases";

    function _GetGitHubFeed() {
        $.AsyncWebRequest(GITHUB_API_URL, {
            type: 'GET',
            success: function (data) {
                try {
                    const releases = (typeof data === "string") ? JSON.parse(data) : data;
                    if (!releases || !releases.length) {
                        $.Msg("[PanoramaScript] No GitHub releases found.");
                        return;
                    }

                    const feed = {
                        items: releases.map(r => ({
                            title: r.name || r.tag_name || "Untitled Release",
                            date: r.published_at ? r.published_at.substring(0, 10) : "Unknown date",
                            description: r.body || "No description provided.",
                            imageUrl: null,
                            link: r.html_url || "",
                            categories: []
                        }))
                    };

                    _OnFeedReceived(feed);
                } catch (e) {
                    $.Msg("[PanoramaScript] parse error:", e);
                }
            },
            error: function (err) {
                $.Msg("[PanoramaScript] Failed to fetch GitHub feed:", err);
            }
        });
    }

    function _OnFeedReceived(feed) {
        if ($.GetContextPanel().BHasClass('news-panel--hide-news-panel')) return;

        let elLister = $.GetContextPanel().FindChildInLayoutFile('NewsPanelLister');
        if (!elLister || !feed || !feed.items) return;

        elLister.RemoveAndDeleteChildren();

        let foundFirstNewsItem = false;

        feed.items.forEach(function (item, i) {
            let elEntry = $.CreatePanel('Panel', elLister, 'NewEntry' + i, { acceptsinput: true });

            const isFeatured = !foundFirstNewsItem && !item.categories.includes('Minor');
            if (isFeatured) {
                foundFirstNewsItem = true;
                elEntry.AddClass('new');
            }

            elEntry.BLoadLayoutSnippet(isFeatured ? 'featured-news-full-entry' : 'history-news-full-entry');

            let elImage = elEntry.FindChildInLayoutFile('NewsHeaderImage');
            elImage.SetImage(item.imageUrl || "file://{images}/store/default-news.png");

            let elInfo = $.CreatePanel('Panel', elEntry, 'NewsInfo' + i);
            elInfo.BLoadLayoutSnippet(isFeatured ? 'featured-news-info' : 'history-news-info');

            let description = item.description || "";
            if (description.length > 200) {
                description = description.slice(0, 200) + "...";
            }

            elInfo.SetDialogVariable('news_item_date', item.date);
            elInfo.SetDialogVariable('news_item_title', item.title);
            elInfo.SetDialogVariable('news_item_body', description);

            let blurTarget = elEntry.FindChildInLayoutFile('NewsEntryBlurTarget');
            if (blurTarget) blurTarget.AddBlurPanel(elInfo);

            const clearNew = i == 0;
            elEntry.SetPanelEvent("onactivate", () => {
                SteamOverlayAPI.OpenURL(item.link);
                if (clearNew) {
                    GameInterfaceAPI.SetSettingString('ui_news_last_read_link', item.link);
                    elEntry.RemoveClass('new');
                }
            });
        });
    }

    _GetGitHubFeed();

})(NewsPanel || (NewsPanel = {}));

