"use strict";
/// <reference path="../csgo.d.ts" />
/// <reference path="../inspect.ts" />
/// <reference path="../common/iteminfo.ts" />
/// <reference path="popup_can_apply_pick_slot.ts" />
/// <reference path="popup_inspect_async-bar.ts" />
var CapabilityCanPatch;
(function (CapabilityCanPatch) {
    function ResetPos() {
        $.GetContextPanel().Data().charCardinal = 'e';
        $.GetContextPanel().Data().bFirstCameraAnim = false;
        $.GetContextPanel().Data().prevCameraSlot = 0;
    }
    CapabilityCanPatch.ResetPos = ResetPos;
    function PreviewPatchOnChar(toolId, activeIndex, contextPanel) {
        $.DispatchEvent('PlaySoundEffect', 'sticker_nextPosition', 'MOUSE');
        let elPreviewPanel = contextPanel.FindChildInLayoutFile('CanApplyItemModel');
        let elCharPanel = elPreviewPanel.FindChildInLayoutFile("CharPreviewPanel");
        if (!elCharPanel || !elCharPanel.IsValid()) {
            return;
        }
        InventoryAPI.PreviewStickerInModelPanel(toolId, activeIndex, elCharPanel);
        CameraAnim(activeIndex, contextPanel);
    }
    CapabilityCanPatch.PreviewPatchOnChar = PreviewPatchOnChar;
    ;
    function CameraAnim(activeIndex, contextPanel) {
        let prevCameraSlot = contextPanel.Data().prevCameraSlot;
        if ((prevCameraSlot === activeIndex || activeIndex == -1) && prevCameraSlot)
            return;
        let elPreviewPanel = contextPanel.FindChildInLayoutFile('CanApplyItemModel');
        if (!InventoryAPI.IsItemInfoValid(elPreviewPanel.Data().id))
            return;
        contextPanel.Data().bFirstCameraAnim = true;
        InventoryAPI.HighlightPatchBySlot(activeIndex);
        _UpdatePreviewPanelSettingsForPatchPosition(elPreviewPanel.Data().id, activeIndex, contextPanel);
        prevCameraSlot = activeIndex;
    }
    CapabilityCanPatch.CameraAnim = CameraAnim;
    ;
    let m_positionData = [
        { type: 'chest', loadoutSlot: 'melee', direction: 'e' },
        { type: 'rightarm', loadoutSlot: 'rifle1', direction: 'n' },
        { type: 'rightleg', loadoutSlot: 'rifle1', direction: 'n' },
        { type: 'rightside', loadoutSlot: 'rifle1', direction: 'n' },
        { type: 'back', loadoutSlot: 'rifle1', direction: 'w' },
        { type: 'leftarm', loadoutSlot: 'rifle1', direction: 's' },
        { type: 'leftside', loadoutSlot: 'rifle1', direction: 's' },
        { type: 'leftleg', loadoutSlot: 'rifle1', direction: 's' },
    ];
    function _UpdatePreviewPanelSettingsForPatchPosition(charItemId, activeIndex = 0, contextPanel) {
        const elPreviewPanel = contextPanel.FindChildInLayoutFile('CanApplyItemModel');
        const charTeam = InventoryAPI.GetItemTeam(elPreviewPanel.Data().id);
        const setting_team = charTeam.search('Team_CT') !== -1 ? 'ct' : 't';
        const patchPosition = InventoryAPI.GetCharacterPatchPosition(charItemId, activeIndex.toString());
        const oPositionData = m_positionData.filter(entry => entry.type === patchPosition)[0];
        if (!oPositionData) {
            contextPanel.Data().bFirstCameraAnim = false;
            return;
        }
        InspectModelImage.SetCharScene(elPreviewPanel.Data().id, LoadoutAPI.GetItemID(setting_team, oPositionData.loadoutSlot), contextPanel);
        if (contextPanel.Data().charCardinal !== oPositionData.direction) {
            contextPanel.Data().charCardinal = oPositionData.direction;
        }
        const elModelPanel = elPreviewPanel.FindChildInLayoutFile("CharPreviewPanel");
        $.Schedule(.1, () => { elModelPanel.SetCardinalFacing(contextPanel.Data().charCardinal); });
        const camSuffix = !patchPosition ? 'wide_intro' : patchPosition + _CameraForModel(charItemId, activeIndex);
        elModelPanel.Data().camera = 'char_inspect_' + camSuffix;
        elModelPanel.TransitionToCamera('cam_char_inspect_' + camSuffix, 1.2);
    }
    function _CameraForModel(charItemId, activeIndex) {
        const modelplayer = ItemInfo.GetModelPlayer(charItemId);
        if (modelplayer.indexOf('tm_jungle_raider_variantb2') !== -1 && activeIndex === 2) {
            return '_low';
        }
        if (modelplayer.indexOf('tm_professional_letg') !== -1 && activeIndex === 0) {
            return '_shoulder';
        }
        if (modelplayer.indexOf('tm_professional_letg') !== -1 && activeIndex === 2) {
            return '_offset';
        }
        if (modelplayer.indexOf('tm_professional_leth') !== -1 && activeIndex === 2) {
            return '_shoulder_top_left';
        }
        return '';
    }
})(CapabilityCanPatch || (CapabilityCanPatch = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9wdXBfY2FwYWJpbGl0eV9jYW5fcGF0Y2guanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi9jb250ZW50L2NzZ28vcGFub3JhbWEvc2NyaXB0cy9wb3B1cHMvcG9wdXBfY2FwYWJpbGl0eV9jYW5fcGF0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFDQUFxQztBQUNyQyxzQ0FBc0M7QUFDdEMsOENBQThDO0FBQzlDLHFEQUFxRDtBQUNyRCxtREFBbUQ7QUFFbkQsSUFBVSxrQkFBa0IsQ0EwSDNCO0FBMUhELFdBQVUsa0JBQWtCO0lBTzNCLFNBQWdCLFFBQVE7UUFFdkIsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLFlBQVksR0FBRyxHQUFHLENBQUE7UUFDN0MsQ0FBQyxDQUFDLGVBQWUsRUFBRSxDQUFDLElBQUksRUFBRSxDQUFDLGdCQUFnQixHQUFHLEtBQUssQ0FBQztRQUNwRCxDQUFDLENBQUMsZUFBZSxFQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsY0FBYyxHQUFHLENBQUMsQ0FBQztJQUMvQyxDQUFDO0lBTGUsMkJBQVEsV0FLdkIsQ0FBQTtJQUVELFNBQWdCLGtCQUFrQixDQUFFLE1BQWMsRUFBRSxXQUFtQixFQUFFLFlBQXFCO1FBRTdGLENBQUMsQ0FBQyxhQUFhLENBQUUscUJBQXFCLEVBQUUsc0JBQXNCLEVBQUUsT0FBTyxDQUFFLENBQUM7UUFDMUUsSUFBSSxjQUFjLEdBQUcsWUFBWSxDQUFDLHFCQUFxQixDQUFFLG1CQUFtQixDQUFFLENBQUM7UUFDL0UsSUFBSSxXQUFXLEdBQUcsY0FBYyxDQUFDLHFCQUFxQixDQUFFLGtCQUFrQixDQUFFLENBQUM7UUFFN0UsSUFBSSxDQUFDLFdBQVcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEVBQUUsRUFDMUM7WUFDQyxPQUFPO1NBQ1A7UUFFRCxZQUFZLENBQUMsMEJBQTBCLENBQUUsTUFBTSxFQUFFLFdBQVcsRUFBRSxX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