"use strict";
/// <reference path="common/characteranims.ts" />
/// <reference path="common/iteminfo.ts" />
/// <reference path="common/tint_spray_icon.ts" />
var InspectModelImage;
(function (InspectModelImage) {
    let m_elPanel = null;
    let m_elContainer = null;
    let m_useAcknowledge = false;
    let m_itemAttributes = '';
    let m_rarityColor = '';
    let m_isStickerApplyRemove = false;
    let m_isItemInLootlist = false;
    let m_strWorkType = '';
    let m_isWorkshopPreview = false;
    InspectModelImage.m_CameraSettingsPerWeapon = [
        { type: 'weapon_awp', camera: '7', zoom_camera: 'weapon_awp_zoom,weapon_awp_front_zoom' },
        { type: 'weapon_aug', camera: '3', zoom_camera: 'weapon_aug_zoom' },
        { type: 'weapon_sg556', camera: '4', zoom_camera: 'weapon_ak47_zoom,weapon_ak47_front_zoom' },
        { type: 'weapon_ssg08', camera: '6', zoom_camera: 'weapon_ssg08_zoom,weapon_ssg08_front_zoom' },
        { type: 'weapon_ak47', camera: '4', zoom_camera: 'weapon_ak47_zoom,weapon_ak47_front_zoom' },
        { type: 'weapon_m4a1_silencer', camera: '6', zoom_camera: 'weapon_m4a1_silencer_zoom,weapon_m4a1_silencer_front_zoom' },
        { type: 'weapon_famas', camera: '4' },
        { type: 'weapon_g3sg1', camera: '5', zoom_camera: 'weapon_g3sg1_zoom,weapon_g3sg1_front_zoom' },
        { type: 'weapon_galilar', camera: '3', zoom_camera: 'weapon_galilar_zoom' },
        { type: 'weapon_m4a1', camera: '4', zoom_camera: 'weapon_ak47_zoom,weapon_ak47_front_zoom' },
        { type: 'weapon_scar20', camera: '5', zoom_camera: 'weapon_g3sg1_zoom,weapon_g3sg1_front_zoom' },
        { type: 'weapon_mp5sd', camera: '3' },
        { type: 'weapon_xm1014', camera: '4', zoom_camera: 'weapon_xm1014_zoom' },
        { type: 'weapon_m249', camera: '6', zoom_camera: 'weapon_m249_zoom' },
        { type: 'weapon_ump45', camera: '3' },
        { type: 'weapon_bizon', camera: '3' },
        { type: 'weapon_mag7', camera: '3' },
        { type: 'weapon_nova', camera: '5', zoom_camera: 'weapon_g3sg1_zoom,weapon_g3sg1_front_zoom' },
        { type: 'weapon_sawedoff', camera: '3' },
        { type: 'weapon_negev', camera: '5', zoom_camera: 'weapon_negev_zoom' },
        { type: 'weapon_usp_silencer', camera: '2', zoom_camera: '0' },
        { type: 'weapon_elite', camera: '2' },
        { type: 'weapon_tec9', camera: '2' },
        { type: 'weapon_revolver', camera: '1' },
        { type: 'weapon_c4', camera: '3' },
        { type: 'weapon_taser', camera: '0' },
    ];
    function Init(elContainer, itemId, funcGetSettingCallback, itemAttributes) {
        const strViewFunc = funcGetSettingCallback ? funcGetSettingCallback('viewfunc', '') : '';
        m_itemAttributes = itemAttributes ? itemAttributes : '';
        m_isWorkshopPreview = funcGetSettingCallback ? funcGetSettingCallback('workshopPreview', 'false') === 'true' : false;
        m_isStickerApplyRemove = funcGetSettingCallback ? funcGetSettingCallback('stickerApplyRemove', 'false') === 'true' : false;
        m_isItemInLootlist = funcGetSettingCallback ? funcGetSettingCallback('isItemInLootlist', 'false') === 'true' : false;
        if (!InventoryAPI.IsValidItemID(itemId)) {
            return '';
        }
        m_strWorkType = funcGetSettingCallback ? funcGetSettingCallback('asyncworktype', '') : '';
        m_elContainer = elContainer;
        m_useAcknowledge = m_elContainer.Data().useAcknowledge ? m_elContainer.Data().useAcknowledge : false;
        m_rarityColor = InventoryAPI.GetItemRarityColor(itemId);
        if (ItemInfo.ItemDefinitionNameSubstrMatch(itemId, 'tournament_journal_') && strViewFunc === 'graffiti')
            itemId = ItemInfo.GetFauxReplacementItemID(itemId, 'graffiti');
        const model = ItemInfo.GetModelPathFromJSONOrAPI(itemId);
        _InitSceneBasedOnItemType(model, itemId);
        return model;
    }
    InspectModelImage.Init = Init;
    function _InitSceneBasedOnItemType(model, itemId) {
        if (ItemInfo.IsCharacter(itemId)) {
            m_elPanel = _InitCharScene(itemId);
        }
        else if (InventoryAPI.GetLoadoutCategory(itemId) == "melee") {
            m_elPanel = _InitMeleeScene(itemId);
        }
        else if (ItemInfo.IsWeapon(itemId)) {
            DeleteExistingItemPanel(itemId, 'ItemPreviewPanel');
            m_elPanel = _InitWeaponScene(itemId);
        }
        else if (ItemInfo.IsDisplayItem(itemId)) {
            DeleteExistingItemPanel(itemId, 'ItemPreviewPanel');
            m_elPanel = _InitDisplayScene(itemId);
        }
        else if (ItemInfo.IsKeychain(itemId)) {
            m_elPanel = _InitNametagScene(itemId);
        }
        else if (InventoryAPI.GetLoadoutCategory(itemId) == "musickit") {
            m_elPanel = _InitMusicKitScene(itemId);
        }
        else if (ItemInfo.IsSprayPaint(itemId) || ItemInfo.IsSpraySealed(itemId)) {
            DeleteExistingItemPanel(itemId, 'ItemPreviewPanel');
            m_elPanel = _InitSprayScene(itemId);
        }
        else if (ItemInfo.IsCase(itemId)) {
            m_elPanel = model ? _InitCaseScene(itemId) : _SetImage(itemId);
        }
        else if (ItemInfo.IsNameTag(itemId)) {
            m_elPanel = _InitNametagScene(itemId);
        }
        else if (ItemInfo.IsSticker(itemId) || ItemInfo.IsPatch(itemId)) {
            DeleteExistingItemPanel(itemId, 'ItemPreviewPanel');
            m_elPanel = _InitStickerScene(itemId);
        }
        else if (model) {
            if (InventoryAPI.GetLoadoutCategory(itemId) === 'clothing') {
                m_elPanel = _InitGlovesScene(itemId);
            }
            else if (model.includes('models/props/crates/')) {
                m_elPanel = _InitCaseScene(itemId);
            }
        }
        else if (!model) {
            m_elPanel = _SetImage(itemId);
        }
        return m_elPanel;
    }
    function _InitCharScene(itemId, bHide = false, weaponItemId = '') {
        let elPanel = GetExistingItemPanel('CharPreviewPanel');
        let active_item_idx = 5;
        let mapName = _GetBackGroundMap();
        if (!elPanel) {
            elPanel = $.CreatePanel('MapPlayerPreviewPanel', m_elContainer, 'CharPreviewPanel', {
                "require-composition-layer": "true",
                "pin-fov": "vertical",
                class: 'full-width full-height hidden',
                camera: 'cam_char_inspect_wide_intro',
                player: "true",
                map: mapName,
                initial_entity: 'item',
                mouse_rotate: false,
                playername: "vanity_character",
                animgraphcharactermode: "inventory-inspect",
                animgraphturns: "false",
                workshop_preview: m_isWorkshopPreview
            });
            elPanel.Data().loadedMap = mapName;
        }
        elPanel.Data().itemId = itemId;
        const settings = ItemInfo.GetOrUpdateVanityCharacterSettings(itemId);
        elPanel.SetActiveCharacter(active_item_idx);
        settings.panel = elPanel;
        settings.weaponItemId = weaponItemId ? weaponItemId : settings.weaponItemId ? settings.weaponItemId : '';
        CharacterAnims.PlayAnimsOnPanel(settings);
        if (m_strWorkType !== 'can_patch' && m_strWorkType !== 'remove_patch') {
            _TransitionCamera(elPanel, 'char_inspect_wide');
        }
        if (!bHide) {
            elPanel.RemoveClass('hidden');
        }
        _AdditionalMapLoadSettings(elPanel, active_item_idx, mapName);
        let elInspectPanel = GetExistingItemPanel('ItemPreviewPanel');
        if (elInspectPanel) {
            settings.panel = elInspectPanel;
            CharacterAnims.PlayAnimsOnPanel(settings);
        }
        return elPanel;
    }
    function StartWeaponLookat() {
        let elInspectPanel = GetExistingItemPanel('ItemPreviewPanel');
        if (elInspectPanel) {
            elInspectPanel.StartWeaponLookat();
        }
    }
    InspectModelImage.StartWeaponLookat = StartWeaponLookat;
    function EndWeaponLookat() {
        let elInspectPanel = GetExistingItemPanel('ItemPreviewPanel');
        if (elInspectPanel) {
            elInspectPanel.EndWeaponLookat();
        }
    }
    InspectModelImage.EndWeaponLookat = EndWeaponLookat;
    function _SetCSMSplitPlane0DistanceOverride(elPanel, backgroundMap) {
        let flSplitPlane0Distance = 0.0;
        if (backgroundMap === 'de_ancient_vanity') {
            flSplitPlane0Distance = 180.0;
        }
        else if (backgroundMap === 'de_anubis_vanity') {
            flSplitPlane0Distance = 180.0;
        }
        else if (backgroundMap === 'ar_baggage_vanity') {
            flSplitPlane0Distance = 200.0;
        }
        else if (backgroundMap === 'de_dust2_vanity') {
            flSplitPlane0Distance = 160.0;
        }
        else if (backgroundMap === 'de_inferno_vanity') {
            flSplitPlane0Distance = 160.0;
        }
        else if (backgroundMap === 'cs_italy_vanity') {
            flSplitPlane0Distance = 200.0;
        }
        else if (backgroundMap === 'de_mirage_vanity') {
            flSplitPlane0Distance = 180.0;
        }
        else if (backgroundMap === 'de_overpass_vanity') {
            flSplitPlane0Distance = 150.0;
        }
        else if (backgroundMap === 'de_vertigo_vanity') {
            flSplitPlane0Distance = 190.0;
        }
        else if (backgroundMap === 'ui/acknowledge_item') {
            flSplitPlane0Distance = 200.0;
        }
        if (flSplitPlane0Distance > 0.0) {
            elPanel.SetCSMSplitPlane0DistanceOverride(flSplitPlane0Distance);
        }
    }
    function _InitWeaponScene(itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 0,
            camera: 'cam_default',
            initial_entity: 'item',
            mouse_rotate: "true",
            rotation_limit_x: "360",
            rotation_limit_y: "90",
            auto_rotate_x: m_isStickerApplyRemove ? "2" : "35",
            auto_rotate_y: m_isStickerApplyRemove ? "3" : "10",
            auto_rotate_period_x: m_isStickerApplyRemove ? "10" : "15",
            auto_rotate_period_y: m_isStickerApplyRemove ? "10" : "25",
            auto_recenter: false,
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _SetParticlesBg(panel);
        SetItemCameraByWeaponType(itemId, panel, false);
        const settings = ItemInfo.GetOrUpdateVanityCharacterSettings();
        settings.panel = panel;
        settings.weaponItemId = '';
        return panel;
    }
    function _InitMeleeScene(itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 8,
            camera: 'cam_melee_intro',
            initial_entity: 'item',
            mouse_rotate: "true",
            rotation_limit_x: "360",
            rotation_limit_y: "90",
            auto_rotate_x: "35",
            auto_rotate_y: "10",
            auto_rotate_period_x: "15",
            auto_rotate_period_y: "25",
            auto_recenter: false,
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _SetParticlesBg(panel);
        _TransitionCamera(panel, 'melee');
        return panel;
    }
    function _InitStickerScene(itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 1,
            camera: 'cam_sticker_close_intro',
            initial_entity: 'item',
            mouse_rotate: "true",
            rotation_limit_x: "70",
            rotation_limit_y: "60",
            auto_rotate_x: "20",
            auto_rotate_y: "0",
            auto_rotate_period_x: "10",
            auto_rotate_period_y: "10",
            auto_recenter: false,
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _SetParticlesBg(panel);
        _TransitionCamera(panel, 'sticker_close');
        return panel;
    }
    function _InitSprayScene(itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 2,
            camera: 'camera_path_spray',
            initial_entity: 'item',
            mouse_rotate: "false",
            rotation_limit_x: "",
            rotation_limit_y: "",
            auto_rotate_x: "",
            auto_rotate_y: "",
            auto_rotate_period_x: "",
            auto_rotate_period_y: "",
            auto_recenter: false,
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _TransitionCamera(panel, 'path_spray', true, 0);
        return panel;
    }
    function _InitDisplayScene(itemId) {
        let bOverrideItem = InventoryAPI.GetItemDefinitionIndex(itemId) === 996;
        let rotationOverrideX = bOverrideItem ? "360" : "70";
        let autoRotateOverrideX = bOverrideItem ? "180" : "45";
        let autoRotateTimeOverrideX = bOverrideItem ? "100" : "20";
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 3,
            camera: 'cam_display_close_intro',
            initial_entity: 'item',
            mouse_rotate: "true",
            rotation_limit_x: rotationOverrideX,
            rotation_limit_y: "60",
            auto_rotate_x: autoRotateOverrideX,
            auto_rotate_y: "12",
            auto_rotate_period_x: autoRotateTimeOverrideX,
            auto_rotate_period_y: "20",
            auto_recenter: false,
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _SetParticlesBg(panel);
        _TransitionCamera(panel, 'display_close');
        return panel;
    }
    function _InitMusicKitScene(itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 4,
            camera: 'cam_musickit_intro',
            initial_entity: 'item',
            mouse_rotate: "true",
            rotation_limit_x: "55",
            rotation_limit_y: "55",
            auto_rotate_x: "10",
            auto_rotate_y: "0",
            auto_rotate_period_x: "20",
            auto_rotate_period_y: "20",
            auto_recenter: false,
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _SetParticlesBg(panel);
        _TransitionCamera(panel, 'musickit_close');
        return panel;
    }
    function _InitCaseScene(itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 6,
            camera: 'cam_case_intro',
            initial_entity: 'item',
            mouse_rotate: "false",
            rotation_limit_x: "",
            rotation_limit_y: "",
            auto_rotate_x: "",
            auto_rotate_y: "",
            auto_rotate_period_x: "",
            auto_rotate_period_y: "",
            auto_recenter: false,
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _SetParticlesBg(panel);
        _TransitionCamera(panel, m_useAcknowledge ? 'case_new_item' : 'case', m_useAcknowledge ? true : false);
        return panel;
    }
    function _InitGlovesScene(itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 7,
            camera: 'cam_gloves',
            initial_entity: 'item',
            mouse_rotate: "false",
            rotation_limit_x: "",
            rotation_limit_y: "",
            auto_rotate_x: "",
            auto_rotate_y: "",
            auto_rotate_period_x: "",
            auto_rotate_period_y: "",
            auto_recenter: false,
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _SetParticlesBg(panel);
        _TransitionCamera(panel, 'gloves', true);
        return panel;
    }
    function _InitNametagScene(itemId) {
        let oSettings = {
            panel_type: "MapItemPreviewPanel",
            active_item_idx: 1,
            camera: 'cam_nametag_close_intro',
            initial_entity: 'item',
            mouse_rotate: "true",
            rotation_limit_x: "70",
            rotation_limit_y: "60",
            auto_rotate_x: "20",
            auto_rotate_y: "0",
            auto_rotate_period_x: "10",
            auto_rotate_period_y: "10",
            auto_recenter: false,
            player: "false",
        };
        const panel = _LoadInspectMap(itemId, oSettings);
        _SetParticlesBg(panel);
        _TransitionCamera(panel, 'nametag_close');
        return panel;
    }
    function _GetBackGroundMap() {
        if (m_useAcknowledge) {
            return 'ui/acknowledge_item';
        }
        let backgroundMap = GameInterfaceAPI.GetSettingString('ui_inspect_bkgnd_map');
        if (backgroundMap == 'mainmenu') {
            backgroundMap = GameInterfaceAPI.GetSettingString('ui_mainmenu_bkgnd_movie');
        }
        backgroundMap = !backgroundMap ? backgroundMap : backgroundMap + '_vanity';
        return backgroundMap;
    }
    function _LoadInspectMap(itemId, oSettings) {
        let mapName = _GetBackGroundMap();
        let elPanel = GetExistingItemPanel('ItemPreviewPanel');
        if (!elPanel) {
            let strAsyncWorkType = $.GetContextPanel().GetAttributeString("asyncworktype", "");
            elPanel = $.CreatePanel(oSettings.panel_type, m_elContainer, 'ItemPreviewPanel', {
                "require-composition-layer": "true",
                'transparent-background': 'false',
                'disable-depth-of-field': m_useAcknowledge ? 'true' : 'false',
                "pin-fov": "vertical",
                class: 'inspect-model-image-panel inspect-model-image-panel--hidden',
                camera: oSettings.camera,
                player: "true",
                map: mapName,
                initial_entity: 'item',
                mouse_rotate: oSettings.mouse_rotate,
                rotation_limit_x: oSettings.rotation_limit_x,
                rotation_limit_y: oSettings.rotation_limit_y,
                auto_rotate_x: oSettings.auto_rotate_x,
                auto_rotate_y: oSettings.auto_rotate_y,
                auto_rotate_period_x: oSettings.auto_rotate_period_x,
                auto_rotate_period_y: oSettings.auto_rotate_period_y,
                auto_recenter: oSettings.auto_recenter,
                workshop_preview: m_isWorkshopPreview,
                sticker_application_mode: (strAsyncWorkType === "can_sticker"),
                keychain_application_mode: (strAsyncWorkType === "can_keychain"),
                sticker_scrape_mode: strAsyncWorkType === "remove_sticker",
            });
        }
        elPanel.Data().itemId = itemId;
        elPanel.Data().active_item_idx = oSettings.active_item_idx;
        elPanel.Data().loadedMap = mapName;
        elPanel.SetActiveItem(oSettings.active_item_idx);
        elPanel.SetItemItemId(itemId, m_itemAttributes);
        elPanel.RemoveClass('inspect-model-image-panel--hidden');
        _AdditionalMapLoadSettings(elPanel, oSettings.active_item_idx, mapName);
        _SetParticlesBg(elPanel);
        return elPanel;
    }
    function GetExistingItemPanel(panelId) {
        if (!m_elContainer || !m_elContainer.IsValid())
            return null;
        for (let elChild of m_elContainer.Children()) {
            if (elChild && elChild.IsValid() && elChild.id === panelId && !elChild.Data().bPreviousLootlistItemPanel) {
                return elChild;
            }
        }
        return null;
    }
    function DeleteExistingItemPanel(itemId, panelType) {
        let elExistingItemPanel = GetExistingItemPanel(panelType);
        if (!elExistingItemPanel)
            return;
        if (elExistingItemPanel.Data().itemId !== itemId) {
            elExistingItemPanel.Data().bPreviousLootlistItemPanel = true;
            elExistingItemPanel.AddClass('inspect-model-image-panel--hidden');
            elExistingItemPanel.DeleteAsync(.5);
        }
    }
    function _AdditionalMapLoadSettings(elPanel, active_item_idx, mapName) {
        if (elPanel.id === 'CharPreviewPanel') {
            HidePanelItemEntities(elPanel);
            _HidePanelCharEntities(elPanel, true);
            _SetCSMSplitPlane0DistanceOverride(elPanel, mapName);
        }
        else if (elPanel.id === 'id-inspect-image-bg-map') {
            HidePanelItemEntities(elPanel);
            _HidePanelCharEntities(elPanel, false);
        }
        else {
            _HidePanelCharEntities(elPanel, false);
            _HideItemEntities(active_item_idx, elPanel);
            if (mapName === 'de_nuke_vanity') {
                _SetSpotlightBrightness(elPanel);
            }
            else {
                _SetSunBrightness(elPanel);
            }
        }
        _SetWorkshopPreviewPanelProperties(elPanel);
    }
    function _SetWorkshopPreviewPanelProperties(elItemPanel) {
        if (m_isWorkshopPreview) {
            let sTransparentBackground = InventoryAPI.GetPreviewSceneStateAttribute("transparent_background");
            let sBackgroundColor = InventoryAPI.GetPreviewSceneStateAttribute("background_color");
            let sPreviewIdleAnimation = InventoryAPI.GetPreviewSceneStateAttribute("idle_animation");
            if (sTransparentBackground === "1") {
                elItemPanel.SetHideStaticGeometry(true);
                elItemPanel.SetHideParticles(true);
                elItemPanel.SetTransparentBackground(true);
                m_elContainer.SetHasClass('popup-inspect-background', false);
            }
            else if (sBackgroundColor) {
                const oColor = _HexColorToRgb(sBackgroundColor);
                elItemPanel.SetHideStaticGeometry(true);
                elItemPanel.SetHideParticles(true);
                elItemPanel.SetBackgroundColor(oColor.r, oColor.g, oColor.b, 0);
                elItemPanel.SetTransparentBackground(false);
            }
            else {
                elItemPanel.SetHideStaticGeometry(false);
                elItemPanel.SetHideParticles(false);
                elItemPanel.SetBackgroundColor(0, 0, 0, 255);
                elItemPanel.SetTransparentBackground(false);
            }
            if (sPreviewIdleAnimation === "1") {
                elItemPanel.SetWorkshopPreviewIdleAnimation(true);
            }
            else {
                elItemPanel.SetWorkshopPreviewIdleAnimation(false);
            }
        }
    }
    function SetItemCameraByWeaponType(itemId, elItemPanel, bSkipIntro) {
        const category = InventoryAPI.GetLoadoutCategory(itemId);
        const defName = InventoryAPI.GetItemDefinitionName(itemId);
        let strCamera = '3';
        let result = InspectModelImage.m_CameraSettingsPerWeapon.find(({ type }) => type === defName);
        if (result) {
            strCamera = result.camera;
        }
        else {
            switch (category) {
                case 'secondary':
                    strCamera = '0';
                    break;
                case 'smg':
                    strCamera = '2';
                    break;
            }
        }
        _TransitionCamera(elItemPanel, strCamera, bSkipIntro);
    }
    InspectModelImage.SetItemCameraByWeaponType = SetItemCameraByWeaponType;
    let m_scheduleHandle = 0;
    function _TransitionCamera(elPanel, strCamera, bSkipIntro = false, nDuration = 0) {
        elPanel.Data().camera = strCamera;
        if (m_isWorkshopPreview) {
            elPanel.TransitionToCamera('cam_' + strCamera, 0);
            return;
        }
        if (bSkipIntro || m_isItemInLootlist) {
            elPanel.TransitionToCamera('cam_' + strCamera, nDuration);
            return;
        }
        elPanel.TransitionToCamera('cam_' + strCamera + '_intro', 0);
        if (m_scheduleHandle === 0) {
            m_scheduleHandle = $.Schedule(.25, () => {
                if (elPanel.IsValid() && elPanel) {
                    elPanel.TransitionToCamera('cam_' + strCamera, 1);
                }
            });
        }
    }
    function ZoomCamera(bZoom) {
        let elPanel = m_elPanel;
        const defName = InventoryAPI.GetItemDefinitionName(m_elPanel.Data().itemId);
        let result = InspectModelImage.m_CameraSettingsPerWeapon.find(({ type }) => type === defName);
        let strCamera = bZoom ? result?.zoom_camera : result?.camera;
        if (!strCamera || strCamera === '')
            return;
        let aCameras = strCamera.split(',');
        elPanel.SetRotation(0, 0, 1);
        _TransitionCamera(elPanel, aCameras[0], true, .75);
    }
    InspectModelImage.ZoomCamera = ZoomCamera;
    function PanCamera(bPanLeft) {
        let elPanel = m_elPanel;
        const defName = InventoryAPI.GetItemDefinitionName(elPanel.Data().itemId);
        let result = InspectModelImage.m_CameraSettingsPerWeapon.find(({ type }) => type === defName);
        let strCamera = result?.zoom_camera;
        if (!strCamera || strCamera === '')
            return;
        let aCameras = strCamera.split(',');
        let strCameraToUse = bPanLeft ? aCameras[1] : aCameras[0];
        elPanel.SetRotation(0, 0, 1);
        _TransitionCamera(elPanel, strCameraToUse, true, .75);
    }
    InspectModelImage.PanCamera = PanCamera;
    function _SetImage(itemId) {
        let elPanel = GetExistingItemPanel('InspectItemImage');
        if (!elPanel) {
            _SetImageBackgroundMap();
            elPanel = $.CreatePanel('Panel', m_elContainer, 'InspectItemImage');
            elPanel.BLoadLayoutSnippet("snippet-image");
        }
        const elImagePanel = elPanel.FindChildTraverse('ImagePreviewPanel');
        elImagePanel.itemid = itemId;
        elImagePanel.RemoveClass('hidden');
        _TintSprayImage(itemId, elImagePanel);
        return elImagePanel;
    }
    function _SetImageBackgroundMap() {
        let mapName = _GetBackGroundMap();
        let elPanel = $.CreatePanel('MapPlayerPreviewPanel', m_elContainer, 'id-inspect-image-bg-map', {
            "require-composition-layer": "true",
            'transparent-background': 'false',
            'disable-depth-of-field': 'false',
            "pin-fov": "vertical",
            class: 'full-width full-height',
            camera: "cam_default",
            player: "false",
            map: mapName
        });
        _TransitionCamera(elPanel, "default", true, 0);
        _AdditionalMapLoadSettings(elPanel, 0, mapName);
    }
    function _TintSprayImage(id, elImage) {
        TintSprayIcon.CheckIsSprayAndTint(id, elImage);
    }
    function SetCharScene(characterItemId, weaponItemId) {
        ItemInfo.GetOrUpdateVanityCharacterSettings(characterItemId);
        _InitCharScene(characterItemId, true, weaponItemId);
    }
    InspectModelImage.SetCharScene = SetCharScene;
    function ShowHideItemPanel(bshow) {
        if (!m_elContainer.IsValid())
            return;
        const elItemPanel = GetExistingItemPanel('ItemPreviewPanel');
        elItemPanel.SetHasClass('hidden', !bshow);
        if (bshow)
            $.DispatchEvent("CSGOPlaySoundEffect", "weapon_showSolo", "MOUSE");
    }
    InspectModelImage.ShowHideItemPanel = ShowHideItemPanel;
    function ShowHideCharPanel(bshow) {
        if (!m_elContainer.IsValid())
            return;
        const elCharPanel = GetExistingItemPanel('CharPreviewPanel');
        if (elCharPanel)
            elCharPanel.SetHasClass('hidden', !bshow);
        if (bshow)
            $.DispatchEvent("CSGOPlaySoundEffect", "weapon_showOnChar", "MOUSE");
    }
    InspectModelImage.ShowHideCharPanel = ShowHideCharPanel;
    function GetModelPanel() {
        return m_elPanel;
    }
    InspectModelImage.GetModelPanel = GetModelPanel;
    function UpdateModelOnly(itemId) {
        let elpanel = m_elPanel;
        if (elpanel && elpanel.IsValid()) {
            elpanel.SetItemItemId(itemId, '');
        }
    }
    InspectModelImage.UpdateModelOnly = UpdateModelOnly;
    function SwitchMap(elParent) {
        for (let element of ['ItemPreviewPanel', 'CharPreviewPanel', 'id-inspect-image-bg-map']) {
            let elPanel = elParent.FindChildTraverse(element);
            if (elPanel && elPanel.IsValid()) {
                let mapName = _GetBackGroundMap();
                if (mapName !== elPanel.Data().loadedMap) {
                    elPanel.SwitchMap(mapName);
                    elPanel.Data().loadedMap = mapName;
                    _AdditionalMapLoadSettings(elPanel, elPanel.Data().active_item_idx, elPanel.Data().loadedMap);
                    const itemId = elPanel.Data().itemId;
                    const category = InventoryAPI.GetLoadoutCategory(itemId);
                    if (ItemInfo.IsWeapon(itemId) && category !== 'melee') {
                        SetItemCameraByWeaponType(itemId, elPanel, true);
                    }
                    else {
                        _TransitionCamera(elPanel, elPanel.Data().camera, true);
                    }
                }
            }
        }
    }
    InspectModelImage.SwitchMap = SwitchMap;
    function _HidePanelCharEntities(elPanel, bIsPlayerInspect = false) {
        elPanel.FireEntityInput('vanity_character', 'Alpha');
        elPanel.FireEntityInput('vanity_character1', 'Alpha');
        elPanel.FireEntityInput('vanity_character2', 'Alpha');
        elPanel.FireEntityInput('vanity_character3', 'Alpha');
        elPanel.FireEntityInput('vanity_character4', 'Alpha');
        if (!bIsPlayerInspect) {
            elPanel.FireEntityInput('vanity_character5', 'Alpha');
        }
    }
    function HidePanelItemEntities(elPanel) {
        _HideItemEntities(-1, elPanel);
    }
    InspectModelImage.HidePanelItemEntities = HidePanelItemEntities;
    function _HideItemEntities(indexShow, elPanel) {
        let numItemEntitiesInMap = 8;
        for (let i = 0; i <= numItemEntitiesInMap; i++) {
            let itemIndexMod = i === 0 ? '' : i.toString();
            if (indexShow !== i) {
                elPanel.FireEntityInput('item' + itemIndexMod, 'Alpha');
                elPanel.FireEntityInput('light_item' + itemIndexMod, 'Disable');
                elPanel.FireEntityInput('light_item_new' + itemIndexMod, 'Disable');
            }
            else {
                _SetRimLight(itemIndexMod, elPanel);
            }
        }
    }
    function _SetParticlesBg(elPanel) {
        if (!m_useAcknowledge) {
            return;
        }
        const oColor = _HexColorToRgb(m_rarityColor);
        const sColor = `${oColor.r} ${oColor.g} ${oColor.b}`;
        elPanel.FireEntityInput('acknowledge_particle', 'SetControlPoint', '16: ' + sColor);
    }
    function _SetRimLight(indexShow, elPanel) {
        if (m_useAcknowledge) {
            elPanel.FireEntityInput('light_item' + indexShow, 'Disable');
            const oColor = _HexColorToRgb(m_rarityColor);
            const sColor = `${oColor.r} ${oColor.g} ${oColor.b}`;
            let lightNameInMap = "light_item_new" + indexShow;
            elPanel.FireEntityInput(lightNameInMap, 'SetColor', sColor);
        }
        else {
            elPanel.FireEntityInput('light_item_new' + indexShow, 'Disable');
        }
    }
    function _SetSunBrightness(elPanel) {
        elPanel.FireEntityInput('sun', 'SetLightBrightness', '1.1');
    }
    function _SetSpotlightBrightness(elPanel) {
        elPanel.FireEntityInput('main_light', 'SetBrightness', '1.1');
    }
    function _HexColorToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }
})(InspectModelImage || (InspectModelImage = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5zcGVjdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2luc3BlY3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGlEQUFpRDtBQUNqRCwyQ0FBMkM7QUFDM0Msa0RBQWtEO0FBRWxELElBQVUsaUJBQWlCLENBeWtDMUI7QUF6a0NELFdBQVUsaUJBQWlCO0lBRTFCLElBQUksU0FBUyxHQUFrRSxJQUFLLENBQUM7SUFDckYsSUFBSSxhQUFhLEdBQVksSUFBSyxDQUFDO0lBQ25DLElBQUksZ0JBQWdCLEdBQVksS0FBSyxDQUFDO0lBQ3RDLElBQUksZ0JBQWdCLEdBQVcsRUFBRSxDQUFDO0lBQ2xDLElBQUksYUFBYSxHQUFXLEVBQUUsQ0FBQztJQUMvQixJQUFJLHNCQUFzQixHQUFZLEtBQUssQ0FBQztJQUM1QyxJQUFJLGtCQUFrQixHQUFZLEtBQUssQ0FBQztJQUN4QyxJQUFJLGFBQWEsR0FBVyxFQUFFLENBQUM7SUFDL0IsSUFBSSxtQkFBbUIsR0FBWSxLQUFLLENBQUM7SUEwQjlCLDJDQUF5QixHQUE0QjtRQUUvRCxFQUFFLElBQUksRUFBRSxZQUFZLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUcsdUNBQXVDLEVBQUU7UUFDMUYsRUFBRSxJQUFJLEVBQUUsWUFBWSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFHLGlCQUFpQixFQUFFO1FBQ3BFLEVBQUUsSUFBSSxFQUFFLGNBQWMsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRyx5Q0FBeUMsRUFBRTtRQUM5RixFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUcsMkNBQTJDLEVBQUU7UUFDaEcsRUFBRSxJQUFJLEVBQUUsYUFBYSxFQUFFLE1BQU0sRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFHLHlDQUF5QyxFQUFFO1FB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