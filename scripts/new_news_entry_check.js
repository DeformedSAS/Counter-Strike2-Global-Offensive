"use strict";
/// <reference path="csgo.d.ts" />
var NewNewsEntryCheck;
(function (NewNewsEntryCheck) {
    let _m_RSSFeedReceivedEventHandler = null;
    function GetRssFeed() {
        BlogAPI.RequestRSSFeed();
    }
    NewNewsEntryCheck.GetRssFeed = GetRssFeed;
    function _OnRssFeedReceived(feed) {
        let foundFirstNewsItem = false;
        let lastReadItem = GameInterfaceAPI.GetSettingString('ui_news_last_read_link');
        feed['items'].forEach(function (item, i) {
            if (!foundFirstNewsItem && !item.categories.includes('Minor')) {
                foundFirstNewsItem = true;
                if (item.link != lastReadItem) {
                    UiToolkitAPI.ShowCustomLayoutPopupParameters('', 'file://{resources}/layout/popups/popup_news.xml', 'date=' + item.date + "&" +
                        'title=' + item.title + "&" +
                        'link=' + item.link);
                    GameInterfaceAPI.SetSettingString('ui_news_last_read_link', item.link);
                }
            }
        });
    }
    function RegisterForRssReceivedEvent() {
        if (!_m_RSSFeedReceivedEventHandler)
            _m_RSSFeedReceivedEventHandler = $.RegisterForUnhandledEvent("PanoramaComponent_Blog_RSSFeedReceived", _OnRssFeedReceived);
    }
    NewNewsEntryCheck.RegisterForRssReceivedEvent = RegisterForRssReceivedEvent;
    function UnRegisterForRssReceivedEvent() {
        if (_m_RSSFeedReceivedEventHandler) {
            $.UnregisterForUnhandledEvent("PanoramaComponent_Blog_RSSFeedReceived", _m_RSSFeedReceivedEventHandler);
            _m_RSSFeedReceivedEventHandler = null;
        }
    }
    NewNewsEntryCheck.UnRegisterForRssReceivedEvent = UnRegisterForRssReceivedEvent;
    {
        GetRssFeed();
    }
})(NewNewsEntryCheck || (NewNewsEntryCheck = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibmV3X25ld3NfZW50cnlfY2hlY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9uZXdfbmV3c19lbnRyeV9jaGVjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsa0NBQWtDO0FBRWxDLElBQVUsaUJBQWlCLENBeUQxQjtBQXpERCxXQUFVLGlCQUFpQjtJQUUxQixJQUFJLDhCQUE4QixHQUFrQixJQUFJLENBQUM7SUFFdEQsU0FBZ0IsVUFBVTtRQUU1QixPQUFPLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDMUIsQ0FBQztJQUhrQiw0QkFBVSxhQUc1QixDQUFBO0lBRUQsU0FBUyxrQkFBa0IsQ0FBRSxJQUFtQjtRQUd6QyxJQUFJLGtCQUFrQixHQUFHLEtBQUssQ0FBQztRQUNyQyxJQUFJLFlBQVksR0FBRyxnQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBRSx3QkFBd0IsQ0FBRSxDQUFDO1FBRWpGLElBQUksQ0FBRSxPQUFPLENBQUUsQ0FBQyxPQUFPLENBQUUsVUFBVSxJQUFJLEVBQUUsQ0FBQztZQUl6QyxJQUFLLENBQUMsa0JBQWtCLElBQUksQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBRSxPQUFPLENBQUUsRUFDaEU7Z0JBQ2Esa0JBQWtCLEdBQUcsSUFBSSxDQUFDO2dCQUUxQixJQUFLLElBQUksQ0FBQyxJQUFJLElBQUksWUFBWSxFQUMxQztvQkFDQyxZQUFZLENBQUMsK0JBQStCLENBQUUsRUFBRSxFQUFFLGlEQUFpRCxFQUNsRyxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxHQUFHO3dCQUN6QixRQUFRLEdBQUcsSUFBSSxDQUFDLEtBQUssR0FBRyxHQUFHO3dCQUMzQixPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBRSxDQUFDO29CQUVSLGdCQUFnQixDQUFDLGdCQUFnQixDQUFFLHdCQUF3QixFQUFFLElBQUksQ0FBQyxJQUFJLENBQUUsQ0FBQztpQkFDeEY7YUFDRDtRQUNGLENBQUMsQ0FBRSxDQUFDO0lBQ0wsQ0FBQztJQUVFLFNBQWdCLDJCQUEyQjtRQUV2QyxJQUFLLENBQUMsOEJBQThCO1lBQ2hDLDhCQUE4QixHQUFHLENBQUMsQ0FBQyx5QkFBeUIsQ0FBRSx3Q0FBd0MsRUFBRSxrQkFBa0IsQ0FBRSxDQUFDO0lBQ3JJLENBQUM7SUFKZSw2Q0FBMkIsOEJBSTFDLENBQUE7SUFFRCxTQUFnQiw2QkFBNkI7UUFFekMsSUFBSSw4QkFBOEIsRUFDbEM7WUFDSSxDQUFDLENBQUMsMkJBQTJCLENBQUUsd0NBQXdDLEVBQUUsOEJBQThCLENBQUUsQ0FBQztZQUMxRyw4QkFBOEIsR0FBRyxJQUFJLENBQUM7U0FDekM7SUFDTCxDQUFDO0lBUGUsK0NBQTZCLGdDQU81QyxDQUFBO0lBS0o7UUFDQyxVQUFVLEVBQUUsQ0FBQztLQUNiO0FBQ0YsQ0FBQyxFQXpEUyxpQkFBaUIsS0FBakIsaUJBQWlCLFFBeUQxQiJ9