"use strict";

var PremierMapWinRecord;
(function (PremierMapWinRecord) {
    const m_numMaps = 7;
    var m_bEventsRegistered = false;
    var m_LobbyPlayerUpdatedEventHandler;
    var m_LeaderboardHoverPlayerEventHandler;

    var m_arrMaps = ['de_cache', 'de_anubis', 'de_inferno', 'de_mirage', 'de_dust2', 'de_nuke', 'de_ancient'];
    
    var m_manualWinrates = null;

    var useManualOverrides = true;

    var manualOverrides = {
        'de_cache': 0.5,
        'de_anubis': 0.1,
        'de_inferno': 0.7,
        'de_mirage': 0.9,
        'de_dust2': 0.7,
        'de_nuke': 0.8,
        'de_ancient': 0.2
    };

    function Init() {
        RegisterEventHandlers();
        Draw();
    }

    function RegisterEventHandlers() {
        if (!m_bEventsRegistered) {
            m_LobbyPlayerUpdatedEventHandler = $.RegisterForUnhandledEvent("PanoramaComponent_Lobby_PlayerUpdated", Draw);
            try {
                m_LeaderboardHoverPlayerEventHandler = $.RegisterForUnhandledEvent("LeaderboardHoverPlayer", _HighlightPlayer);
            } catch (e) {
            }

            $.RegisterForUnhandledEvent("CSGOHideMainMenu", UnregisterEventHandlers);
            $.RegisterForUnhandledEvent("CSGOShowMainMenu", RegisterEventHandlers);
            $.RegisterEventHandler('ReadyForDisplay', $.GetContextPanel(), Draw);
            
            m_bEventsRegistered = true;
        }
    }

    function UnregisterEventHandlers() {
        if (m_bEventsRegistered) {
            if (m_LobbyPlayerUpdatedEventHandler) {
                $.UnregisterForUnhandledEvent('PanoramaComponent_Lobby_PlayerUpdated', m_LobbyPlayerUpdatedEventHandler);
            }
            if (m_LeaderboardHoverPlayerEventHandler) {
                try {
                    $.UnregisterForUnhandledEvent('LeaderboardHoverPlayer', m_LeaderboardHoverPlayerEventHandler);
                } catch(e) {}
            }
            m_bEventsRegistered = false;
        }
    }

    function _HighlightPlayer(xuid) {
        Draw('', xuid);
    }

    function _GetPlayerTeamColorRgb(xuid) {
        try {
            if (typeof PartyListAPI !== 'undefined' && typeof TeamColor !== 'undefined') {
                var teamColor = PartyListAPI.GetPartyMemberSetting(xuid, 'game/teamcolor');
                if (teamColor !== null && teamColor !== undefined && teamColor !== '') {
                    var rgbColor = TeamColor.GetTeamColor(Number(teamColor));
                    if (typeof rgbColor === 'string' && rgbColor.length > 0) {
                        return rgbColor;
                    }
                }
            }
        } catch (e) {}
        return '231, 83, 158'; 
    }

    function _GetMapsList() {
        try {
            if (typeof FriendsListAPI !== 'undefined' && typeof FriendsListAPI.GetFriendCompetitivePremierWindowStatsObject === 'function') {
                let maps = Object.keys(FriendsListAPI.GetFriendCompetitivePremierWindowStatsObject("0"));
                if (maps && maps.length >= 7) return maps;
            }
        } catch(e) {}
        return m_arrMaps;
    }

    function SetMapWinrates(winrateMap, overrideRgbColor) {
        if (typeof winrateMap === 'object' && winrateMap !== null) {
            m_manualWinrates = winrateMap;
        } else {
            m_manualWinrates = null;
        }
        Draw(overrideRgbColor);
    }
    PremierMapWinRecord.SetMapWinrates = SetMapWinrates;

  function Draw(overrideRgbColor, highlightedPlayerXuid = '') {
    let pContainer = $.GetContextPanel().FindChildTraverse('jsMapWinsSpiderGraph');
    if (!pContainer) return;

    let w = pContainer.actuallayoutwidth;
    let h = pContainer.actuallayoutheight;

    if (!w || !h || w <= 0 || h <= 0 || w === 440) {
        $.Schedule(0.05, function() { Draw(overrideRgbColor, highlightedPlayerXuid); });
        return;
    }

    pContainer.RemoveAndDeleteChildren();

        let cx = w / 2;
        let cy = h / 2;
        
        let iconRadius = (Math.min(w, h) / 2) * 0.88; 
        let maxRadius = iconRadius * 0.82;            

        _DrawGridWeb(pContainer, cx, cy, maxRadius, iconRadius, 3);

        let activeWinrates = m_manualWinrates || (useManualOverrides ? manualOverrides : null);

        if (typeof LobbyAPI !== 'undefined' && LobbyAPI.IsSessionActive()) {
            let session = LobbyAPI.GetSessionSettings();
            if (session && session.members) {
                let party = session.members;
                let nPlayers = party.numPlayers || 0;
                let mapList = _GetMapsList();
                let wso = [];

                let lbFallbackName = '';
                if (typeof LeaderboardsAPI !== 'undefined') {
                    if (typeof LeaderboardsAPI.GetPremierLeaderboardName === 'function') {
                        lbFallbackName = LeaderboardsAPI.GetPremierLeaderboardName() + '.party';
                    } else if (typeof LeaderboardsAPI.GetCurrentSeasonPremierLeaderboard === 'function') {
                        lbFallbackName = LeaderboardsAPI.GetCurrentSeasonPremierLeaderboard() + '.party';
                    }
                }

                for (let p = 0; p < nPlayers; p++) {
                    let machineObj = party['machine' + p];
                    let xuid = (machineObj && machineObj.player0) ? machineObj.player0.xuid : '';
                    if (!xuid) continue;

                    let playerObj = null;

                    if (!activeWinrates && typeof PartyListAPI !== 'undefined') {
                        if (typeof PartyListAPI.GetFriendCompetitiveRankType === 'function' && PartyListAPI.GetFriendCompetitiveRankType(xuid) === "Premier") {
                            var partyScore = PartyListAPI.GetFriendCompetitiveRank(xuid);
                            var partyWins = PartyListAPI.GetFriendCompetitiveWins(xuid);
                            if (partyScore || partyWins)
                                playerObj = PartyListAPI.GetFriendCompetitivePremierWindowStatsObject(xuid);
                        }
                        if (!playerObj && lbFallbackName && typeof LeaderboardsAPI !== 'undefined' && typeof LeaderboardsAPI.GetEntryDetailsObjectByXuid === 'function') {
                            let objLbRow = LeaderboardsAPI.GetEntryDetailsObjectByXuid(lbFallbackName, xuid);
                            if (objLbRow && objLbRow.XUID && objLbRow.rankWindowStats)
                                playerObj = objLbRow.rankWindowStats;
                        }
                        if (!playerObj && typeof PartyListAPI.GetFriendCompetitivePremierWindowStatsObject === 'function')
                            playerObj = PartyListAPI.GetFriendCompetitivePremierWindowStatsObject(xuid);
                    }
                    wso.push({ xuid: xuid, stats: playerObj });
                }

                let maxWinsInASingleMap = 3;
                if (!activeWinrates) {
                    for (let p = 0; p < wso.length; p++) {
                        let RankWindowObject = wso[p].stats || {};
                        let playerWins = mapList.map((mapName) => Number(RankWindowObject[mapName] || 0));
                        maxWinsInASingleMap = Math.max(maxWinsInASingleMap, Math.max.apply(null, playerWins));
                    }
                }

                for (let p = 0; p < wso.length; p++) {
                    let xuid = wso[p].xuid;
                    let mapDataNormalized = {};

                    if (activeWinrates) {
                        mapDataNormalized = activeWinrates;
                    } else {
                        let RankWindowObject = wso[p].stats || {};
                        for (let m = 0; m < m_numMaps; m++) {
                            let mapName = mapList[m] || m_arrMaps[m];
                            let wins = Number(RankWindowObject[mapName] || 0);
                            mapDataNormalized[mapName] = maxWinsInASingleMap > 0 ? (wins / maxWinsInASingleMap) : 0;
                        }
                    }

                    let playerRgb = (typeof overrideRgbColor === 'string' && overrideRgbColor.indexOf(',') !== -1)
                                    ? overrideRgbColor
                                    : _GetPlayerTeamColorRgb(xuid);

                    let alphaScale = (highlightedPlayerXuid === '' || highlightedPlayerXuid === xuid) ? 1.0 : 0.3;

                    _DrawDataPolygon(pContainer, cx, cy, maxRadius, mapDataNormalized, playerRgb, alphaScale);
                }
            }
        } else {
            let localXuid = (typeof MyPersonaAPI !== 'undefined' && typeof MyPersonaAPI.GetXUID64 === 'function') ? MyPersonaAPI.GetXUID64() : '';
            let playerRgb = (typeof overrideRgbColor === 'string' && overrideRgbColor.indexOf(',') !== -1)
                            ? overrideRgbColor
                            : _GetPlayerTeamColorRgb(localXuid);

            _DrawDataPolygon(pContainer, cx, cy, maxRadius, activeWinrates || null, playerRgb, 1.0);
        }

        _PlaceMapIcons(pContainer, cx, cy, iconRadius);
    }
    PremierMapWinRecord.Draw = Draw;

function _DrawGridWeb(container, cx, cy, maxRadius, iconRadius, ringsCount = 3) {
    let bgPoints = [];
    for (let i = 0; i < m_numMaps; i++) {
        let angle = (i * (2 * Math.PI / m_numMaps)) - (Math.PI / 2);
        bgPoints.push({
            x: cx + (maxRadius * Math.cos(angle)),
            y: cy + (maxRadius * Math.sin(angle))
        });
    }

    _DrawSolidPolygonFill(container, bgPoints, 'rgba(15, 17, 20, 0.40)');

    let hubRadius = maxRadius * 0.12;
    let hubPoints = [];
    for (let i = 0; i < m_numMaps; i++) {
        let angle = (i * (2 * Math.PI / m_numMaps)) - (Math.PI / 2);
        hubPoints.push({
            x: cx + (hubRadius * Math.cos(angle)),
            y: cy + (hubRadius * Math.sin(angle))
        });
    }
    for (let i = 0; i < hubPoints.length; i++) {
        _DrawLineSegment(container, hubPoints[i], hubPoints[(i + 1) % hubPoints.length], 'spider-grid-edge');
    }
	
    for (let r = 1; r <= ringsCount; r++) {
        let ringRadius = (maxRadius / ringsCount) * r;
        let ringPoints = [];

        for (let i = 0; i < m_numMaps; i++) {
            let angle = (i * (2 * Math.PI / m_numMaps)) - (Math.PI / 2);
            ringPoints.push({
                x: cx + (ringRadius * Math.cos(angle)),
                y: cy + (ringRadius * Math.sin(angle))
            });
        }

        for (let i = 0; i < ringPoints.length; i++) {
            _DrawLineSegment(container, ringPoints[i], ringPoints[(i + 1) % ringPoints.length], 'spider-grid-edge');
        }
    }

    for (let i = 0; i < m_numMaps; i++) {
        let angle = (i * (2 * Math.PI / m_numMaps)) - (Math.PI / 2);
        let iconPt = {
            x: cx + (iconRadius * Math.cos(angle)),
            y: cy + (iconRadius * Math.sin(angle))
        };
        _DrawLineSegment(container, { x: cx, y: cy }, iconPt, 'spider-grid-spoke');
    }
}

    function _DrawDataPolygon(container, cx, cy, maxRadius, dataMap, rgbColor, alphaScale = 1.0) {
        let points = [];
        let arrMaps = _GetMapsList();

        for (let i = 0; i < m_numMaps; i++) {
            let mapName = arrMaps[i] || m_arrMaps[i];
            
            let rawVal = (dataMap && dataMap[mapName] !== undefined) ? Number(dataMap[mapName]) : 0;
            
            let val = (isNaN(rawVal) || rawVal === 0) ? 0.1 : Math.max(0.0, Math.min(1.0, rawVal));
            
            let angle = (i * (2 * Math.PI / m_numMaps)) - (Math.PI / 2);
            let r = maxRadius * val;

            points.push({
                x: cx + (r * Math.cos(angle)),
                y: cy + (r * Math.sin(angle))
            });
        }

        let fillAlpha = (0.18 * alphaScale).toFixed(2);
        _DrawSolidPolygonFill(container, points, 'rgba(' + rgbColor + ', ' + fillAlpha + ')');

        let strokeAlpha = (1.0 * alphaScale).toFixed(2);
        let strokeColor = 'rgba(' + rgbColor + ', ' + strokeAlpha + ')';
        for (let i = 0; i < points.length; i++) {
            _DrawLineSegment(container, points[i], points[(i + 1) % points.length], 'spider-poly-edge', strokeColor);
        }
    }

    function _DrawSolidPolygonFill(container, points, colorCss) {
        let minY = points[0].y, maxY = points[0].y;
        for (let i = 1; i < points.length; i++) {
            if (points[i].y < minY) minY = points[i].y;
            if (points[i].y > maxY) maxY = points[i].y;
        }

        let step = 1.0; 
        for (let y = minY; y <= maxY; y += step) {
            let nodeX = [];
            let j = points.length - 1;

            for (let i = 0; i < points.length; i++) {
                if ((points[i].y < y && points[j].y >= y) || (points[j].y < y && points[i].y >= y)) {
                    let x = points[i].x + (y - points[i].y) / (points[j].y - points[i].y) * (points[j].x - points[i].x);
                    nodeX.push(x);
                }
                j = i;
            }

            nodeX.sort((a, b) => a - b);

            for (let k = 0; k < nodeX.length; k += 2) {
                if (nodeX[k + 1]) {
                    let line = $.CreatePanel('Panel', container, '');
                    line.style.x = nodeX[k] + 'px';
                    line.style.y = y + 'px';
                    line.style.width = (nodeX[k + 1] - nodeX[k]) + 'px';
                    line.style.height = '1.0px';
                    line.style.backgroundColor = colorCss;
                }
            }
        }
    }

    function _DrawLineSegment(container, p1, p2, className, strokeColor) {
        let dx = p2.x - p1.x;
        let dy = p2.y - p1.y;
        let len = Math.sqrt(dx * dx + dy * dy);
        let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI);

        let line = $.CreatePanel('Panel', container, '');
        line.AddClass(className);
        if (typeof strokeColor === 'string') {
            line.style.backgroundColor = strokeColor;
        }
        line.style.x = p1.x + 'px';
        line.style.y = p1.y + 'px';
        line.style.width = len + 'px';
        line.style.transform = 'rotateZ(' + angleDeg + 'deg)';
    }

    function _PlaceMapIcons(container, cx, cy, iconRadius) {
        let arrMaps = _GetMapsList();
        for (let s = 0; s < m_numMaps; s++) {
            let angle = (s * (2 * Math.PI / m_numMaps)) - (Math.PI / 2);
            let posX = cx + (iconRadius * Math.cos(angle));
            let posY = cy + (iconRadius * Math.sin(angle));

            let elMap = $.CreatePanel('Panel', container, "map_icon_" + s);
            elMap.BLoadLayoutSnippet('snippet-mwr-map');

            let elMapImage = elMap.FindChildInLayoutFile('mwr-map__image');
            if (elMapImage) {
                let imageName = arrMaps[s] || m_arrMaps[s];
                elMapImage.SetImage("file://{images}/map_icons/map_icon_" + imageName + ".svg");
            }

            elMap.style.x = posX + 'px';
            elMap.style.y = posY + 'px';
        }
    }

    Init();
})(PremierMapWinRecord || (PremierMapWinRecord = {}));

// yes this script is entirely ai made.. it somehow figured out how to make a spidergraph. it's close to cs2's funnily enough.