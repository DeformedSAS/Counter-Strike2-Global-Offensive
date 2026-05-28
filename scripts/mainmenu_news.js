"use strict";
/// <reference path="csgo.d.ts" />
var NewsPanel;
(function (NewsPanel) {

    const NEWS_FEED_URL = "https://raw.githubusercontent.com/DeformedSAS/Counter-Strike2-Global-Offensive/main/news.json";

    function _GetGitHubFeed() {
        $.AsyncWebRequest(NEWS_FEED_URL, {
            type: 'GET',
            success: function (data) {
                try {
                    const feed = (typeof data === "string") ? JSON.parse(data) : data;
                    
                    if (!feed || !feed.items) {
                        $.Msg("[PanoramaScript] Invalid news.json format.");
                        return;
                    }
                    _OnFeedReceived(feed);
                } catch (e) {
                    $.Msg("[PanoramaScript] Error parsing news.json:", e);
                }
            },
            error: function (err) {
                $.Msg("[PanoramaScript] Failed to fetch news.json:", err);
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
            const isFeatured = !foundFirstNewsItem && (!item.categories || !item.categories.includes('Minor'));
            
            if (isFeatured) {
                foundFirstNewsItem = true;
                elEntry.AddClass('new');
            }

            elEntry.BLoadLayoutSnippet(isFeatured ? 'featured-news-full-entry' : 'history-news-full-entry');
            let elImage = elEntry.FindChildInLayoutFile('NewsHeaderImage');
            if (elImage) {
                elImage.SetImage(item.imageUrl || "file://{images}/store/default-news.png");
            }

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
                if (item.link) {
                    SteamOverlayAPI.OpenURL(item.link);
                }
                if (clearNew) {
                    GameInterfaceAPI.SetSettingString('ui_news_last_read_link', item.link || "");
                    elEntry.RemoveClass('new');
                }
            });
        });
    }

    _GetGitHubFeed();

})(NewsPanel || (NewsPanel = {}));