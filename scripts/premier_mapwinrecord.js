"use strict";

var PremierMapWinRecord;
(function (PremierMapWinRecord) {
    const m_numMaps = 7;
    const spiderGraph = $('#jsMapWinsSpiderGraph');
    var m_LobbyPlayerUpdatedEventHandler;
    var m_bEventsRegistered = false;

    function Init() {
        RegisterEventHandlers();
        // Legacy: Check if canvas is ready before first draw
        if (spiderGraph && spiderGraph.BCanvasReady && spiderGraph.BCanvasReady()) {
            Draw();
        } else {
            $.Schedule(0.1, Init);
        }
    }

    function RegisterEventHandlers() {
        if (!m_bEventsRegistered) {
            m_LobbyPlayerUpdatedEventHandler = $.RegisterForUnhandledEvent("PanoramaComponent_Lobby_PlayerUpdated", Draw);
            $.RegisterForUnhandledEvent("CSGOHideMainMenu", UnregisterEventHandlers);
            $.RegisterForUnhandledEvent("CSGOShowMainMenu", RegisterEventHandlers);
            $.RegisterEventHandler('ReadyForDisplay', $.GetContextPanel(), Draw);
            m_bEventsRegistered = true;
        }
    }

    function UnregisterEventHandlers() {
        if (m_bEventsRegistered) {
            $.UnregisterForUnhandledEvent('PanoramaComponent_Lobby_PlayerUpdated', m_LobbyPlayerUpdatedEventHandler);
            m_bEventsRegistered = false;
        }
    }

    function Draw() {
        _DrawParty();
        _MakeMapPanels();
    }
    PremierMapWinRecord.Draw = Draw;

    const oAlpha = {
        'normal': { 'outer': 0.5, 'inner': 0.1 },
        'dim': { 'outer': 0.2, 'inner': 0 },
        'hilit': { 'outer': 1, 'inner': 0.2 },
    };

    function _DrawPlayerPlot(arrValues, rgb, max, plotType = 'normal') {
        let rgbColorOuter = 'rgba(' + rgb + ',' + oAlpha[plotType].outer + ')';
        let rgbColorInner = 'rgba(' + rgb + ',' + oAlpha[plotType].inner + ')';
        
        arrValues = arrValues.map(a => a / max);

        // In legacy, we use DrawGraphPoly but pass parameters individually 
        // if the options object isn't supported.
        const options = {
            line_color: rgbColorOuter,
            line_thickness: 3,
            fill_color_inner: rgbColorInner,
            fill_color_outer: rgbColorInner,
        };
        
        if (spiderGraph.DrawGraphPoly) {
            spiderGraph.DrawGraphPoly(arrValues, options);
        }
    }

    function _GetMapsList() {
        // Since we removed Premier APIs, manually define the map pool
        return ['de_dust2', 'de_mirage', 'de_inferno', 'de_nuke', 'de_overpass', 'de_vertigo', 'de_ancient'];
    }

    function _DrawGuides(maxWinsInASingleMap) {
        if (!spiderGraph) return;

        // Reset the graph
        spiderGraph.ClearJS('rgba(0,0,0,0)');

        // LEGACY FIX: Set properties directly on the panel.
        // Legacy Panorama often uses these as direct panel members.
        spiderGraph.bkg_color = "#00000080";
        spiderGraph.spokes_color = '#ffffff10';
        spiderGraph.spoke_thickness = 2;
        spiderGraph.spoke_softness = 100;
        spiderGraph.spoke_length_scale = 1.2;
        spiderGraph.guideline_color = '#ffffff10';
        spiderGraph.guideline_thickness = 2;
        spiderGraph.guideline_count = maxWinsInASingleMap + 1;
        spiderGraph.scale = 0.70;

        // If DrawGraphBackground is still failing, it may not be exposed in your DLL.
        if (spiderGraph.DrawGraphBackground) {
            spiderGraph.DrawGraphBackground(m_numMaps);
        }
    }

function _SetTitle(totalWins) {
    const pLabel = $('#jsMapWinsLabel');
    if (pLabel) {
        // First, set the variable on the panel so the localized string can find it
        pLabel.SetDialogVariableInt("wins", totalWins);
        
        // Then, apply the localized text which should contain {d:wins} or %wins%
        pLabel.text = $.Localize("#mapwinrecord_graph_title", pLabel);
    }
}

    function _DrawParty(highlightedPlayerXuid = '') {
        if (LobbyAPI.IsSessionActive()) {
            const party = LobbyAPI.GetSessionSettings().members;
            const nPlayers = party.numPlayers;
            let totalWins = 0;
            let maxWinsInASingleMap = 3;
            let mapList = _GetMapsList();
            let wso = [];

            for (let p = 0; p < nPlayers; p++) {
                let xuid = party['machine' + p].player0.xuid;
                // Fetch standard competitive stats
                let playerObj = PartyListAPI.GetFriendCompetitiveRank(xuid);
                wso.push(playerObj || {});
            }

            for (let p = 0; p < nPlayers; p++) {
                let RankWindowObject = wso[p];
                let playerWins = mapList.map((mapName) => { 
                    return Number(RankWindowObject[mapName] || 0); 
                });
                totalWins += playerWins.reduce((a, b) => a + b, 0);
                maxWinsInASingleMap = Math.max(maxWinsInASingleMap, ...playerWins);
            }

            _DrawGuides(maxWinsInASingleMap);
            _SetTitle(totalWins);

            for (let p = 0; p < nPlayers; p++) {
                let xuid = party['machine' + p].player0.xuid;
                let RankWindowObject = wso[p];
                let playerWins = mapList.map((mapName) => { 
                    return Number(RankWindowObject[mapName] || 0); 
                });
                
                const teamColorIdx = PartyListAPI.GetPartyMemberSetting(xuid, 'game/teamcolor');
                const teamColorRgb = TeamColor.GetTeamColor(Number(teamColorIdx));
                let hilite = highlightedPlayerXuid === '' ? 'normal' : highlightedPlayerXuid === xuid ? 'hilit' : 'dim';
                
                _DrawPlayerPlot(playerWins, teamColorRgb, maxWinsInASingleMap, hilite);
            }
        }
    }

    function _MakeMapPanels() {
        let arrMaps = _GetMapsList();
        let elMapContainer = $.GetContextPanel().FindChildTraverse('jsMapWinsSpiderGraph');
        if (!elMapContainer) return;

        elMapContainer.RemoveAndDeleteChildren();
        for (let s = 0; s < m_numMaps; s++) {
            let elMap = $.CreatePanel('Panel', elMapContainer, String(s));
            elMap.BLoadLayoutSnippet('snippet-mwr-map');
            
            let elMapImage = elMap.FindChildInLayoutFile('mwr-map__image');
            if (elMapImage) {
                let imageName = arrMaps[s];
                elMapImage.SetImage("file://{images}/map_icons/map_icon_" + imageName + ".svg");
            }
            
            elMap.SetDialogVariable('map-name', $.Localize('#SFUI_Map_' + arrMaps[s]));
            
            // Note: GraphPositionToUIPosition must be supported by your GraphPanel
            if (spiderGraph.GraphPositionToUIPosition) {
                let vPos = spiderGraph.GraphPositionToUIPosition(s, 1.3);
                elMap.SetPositionInPixels(vPos.x, vPos.y, 0);
            }
        }
    }

    Init();
})(PremierMapWinRecord || (PremierMapWinRecord = {}));