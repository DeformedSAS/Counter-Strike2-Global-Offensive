'use strict';

var ItemTile = (function() {

    function _OnTileUpdated() {
        var id = $.GetContextPanel().GetAttributeString('itemid', '0');
        if (id === '0') return;

        var idForDisplay = id;
        if ($.GetContextPanel().GetAttributeString('filter_category', '') === 'inv_graphic_art') {
            idForDisplay = ItemInfo.GetFauxReplacementItemID(id, 'graffiti');
        }

        _SetItemName(idForDisplay);
        _SetItemRarity(id);
        _SetEquippedState(id);
        _SetStickers(id);
        _SetRecentLabel(id);
        _TintSprayImage(id);
        _DisableTile(id);
        _SetBackground(id);
        _SetMultiSelect(id);

        var loadImage = $.GetContextPanel().GetAttributeString('loadimage', '');
        if (loadImage) {
            _SetImage(id);
        }
    }

    function _SetItemName(id) {
        var fmtName = ItemInfo.GetFormattedName(id);
        fmtName.SetOnLabel($('#JsItemName'));
    }

    function _SetBackground(id) {
        var elTeamTile = $.GetContextPanel().FindChildInLayoutFile('ItemTileTeam');
        var subSlot = ItemInfo.GetSlotSubPosition(id);
        if (subSlot == 'customplayer') {
            elTeamTile.visible = true;
            var isCT = ItemInfo.IsItemCt(id);
            if (isCT) {
                elTeamTile.SetImage("file://{images}/icons/ui/ct_logo_1c.svg");
                elTeamTile.style.washColor = '#B5D4EE';
            } else {
                elTeamTile.SetImage("file://{images}/icons/ui/t_logo_1c.svg");
                elTeamTile.style.washColor = '#EAD18A';
            }
        } else {
            elTeamTile.visible = false;
        }
    }

    function _SetMultiSelect(id) {
        var capInfo = _GetPopUpCapability();
        if (capInfo && capInfo.multiselectItemIds && capInfo.multiselectItemIds.hasOwnProperty(id)) {
            $.GetContextPanel().SetHasClass('capability_multistatus_selected', true);
        }
    }

    function _SetImage(id) {
        $.GetContextPanel().FindChildInLayoutFile('ItemImage').itemid = id;
    }

    function _SetItemRarity(id) {
        var color = ItemInfo.GetRarityColor(id);
        if (!color) return;
        $.GetContextPanel().FindChildInLayoutFile('JsRarity').style.backgroundColor = color;
    }

    function _SetEquippedState(id) {
        var subSlot = ItemInfo.GetSlotSubPosition(id);
        for (var team of ['t','ct','noteam']) {
            if (!ItemInfo.IsShuffleEnabled(id, team) || subSlot === "flair0" || subSlot === "spray0") {
                if (ItemInfo.IsEquipped(id, team)) {
                    _SetEquipIcon(false, team);
                }
            } else if (ItemInfo.IsShuffleEnabled(id, team) && ItemInfo.IsItemInShuffleForTeam(id, team)) {
                _SetEquipIcon(true, team);
            }
        }
    }

    function _SetEquipIcon(isShuffle, team) {
        if (team === 'noteam') team = 'ct';
        var elDot = $.GetContextPanel().FindChildInLayoutFile('ItemEquipped-' + team);
        elDot.RemoveClass('hidden');
        elDot.AddClass('item-tile__equipped__radiodot--filled');
        elDot.SetHasClass('shuffle', isShuffle);
    }

    function _SetStickers(id) {
        var listStickers = ItemInfo.GetitemStickerList(id);
        var elParent = $.GetContextPanel().FindChildInLayoutFile('StickersOnWeapon');
        elParent.RemoveAndDeleteChildren();
        listStickers.forEach(function(entry) {
            $.CreatePanel('Image', elParent, 'ItemImage' + entry.image, {
                src: 'file://{images_econ}' + entry.image + '.png',
                scaling: 'stretch-to-fit-preserve-aspect',
                class: 'item-tile__stickers__image'
            });
        });
    }

    function _SetRecentLabel(id) {
        var isRecentValue = InventoryAPI.GetItemSessionPropertyValue(id, 'recent');
        var isUpdatedValue = InventoryAPI.GetItemSessionPropertyValue(id, 'updated');
        var elPanel = $.GetContextPanel().FindChildInLayoutFile('JsRecent');
        if (isUpdatedValue === '1' || isRecentValue === '1') {
            var locString = '#inv_session_prop_recent';
            if (isRecentValue === '1') {
                var pickupMethod = InventoryAPI.GetItemSessionPropertyValue(id, 'item_pickup_method');
                if (pickupMethod === 'quest_reward') {
                    locString = '#inv_session_prop_quest_reward';
                }
            } else {
                locString = '#inv_session_prop_updated';
            }
            elPanel.RemoveClass('hidden');
            elPanel.text = $.Localize(locString);
            return;
        }
        elPanel.AddClass('hidden');
    }

    function _TintSprayImage(id) {
        var elImage = $.GetContextPanel().FindChildInLayoutFile('ItemImage');
        TintSprayIcon.CheckIsSprayAndTint(id, elImage);
    }

    function _DisableTile(id) {
        var capInfo = _GetPopUpCapability();
        if (capInfo && capInfo.capability === 'can_sticker' && !ItemInfo.ItemMatchDefName(id, 'sticker')) {
            $.GetContextPanel().enabled = (ItemInfo.GetStickerSlotCount(id) > ItemInfo.GetStickerCount(id));
        } else if (capInfo && capInfo.capability === 'can_patch' && !ItemInfo.ItemMatchDefName(id, 'patch')) {
            $.GetContextPanel().enabled = (ItemInfo.GetStickerSlotCount(id) > ItemInfo.GetStickerCount(id));
        }
    }

    function _OnActivate() {
        var id = $.GetContextPanel().GetAttributeString('itemid', '0');
        var capInfo = _GetPopUpCapability();
        if (capInfo) {
            $.DispatchEvent('PlaySoundEffect', 'inventory_item_select', 'MOUSE');
            InventoryAPI.PrecacheCustomMaterials(id);

            if (capInfo.capability === 'nameable') {
                _CapabilityNameableAction(SortIdsIntoToolAndItemID(id, capInfo.initialItemId));
            } else if (capInfo.capability === 'can_sticker') {
                _CapabilityCanStickerAction(SortIdsIntoToolAndItemID(id, capInfo.initialItemId));
            } else if (capInfo.capability === 'can_patch') {
                _CapabilityCanPatchAction(SortIdsIntoToolAndItemID(id, capInfo.initialItemId));
            } else if (capInfo.capability === 'decodable') {
                _CapabilityDecodableAction(SortIdsIntoToolAndItemID(id, capInfo.initialItemId));
            } else if (capInfo.capability === 'can_stattrack_swap') {
                _CapabilityStatTrakSwapAction(capInfo, id);
            } else if (capInfo.capability === 'can_collect') {
                _CapabilityPutIntoCasketAction(id, capInfo.initialItemId);
            } else if (capInfo.capability === 'casketcontents') {
                _CapabilityItemInsideCasketAction(capInfo.initialItemId, id);
            } else if (capInfo.capability === 'casketretrieve') {
                $.GetContextPanel().ToggleClass('capability_multistatus_selected');
                $.DispatchEvent('UpdateSelectItemForCapabilityPopup', capInfo.capability, id,
                    $.GetContextPanel().BHasClass('capability_multistatus_selected'));
            } else if (capInfo.capability === 'casketstore') {
                $.GetContextPanel().ToggleClass('capability_multistatus_selected');
                $.DispatchEvent('UpdateSelectItemForCapabilityPopup', capInfo.capability, id,
                    $.GetContextPanel().BHasClass('capability_multistatus_selected'));
            }
            return;
        }

        var filterValue = $.GetContextPanel().GetAttributeString('context_menu_filter', null);
        var filterForContextMenuEntries = filterValue ? '&populatefiltertext=' + filterValue : '';
        var contextMenuPanel = UiToolkitAPI.ShowCustomLayoutContextMenuParametersDismissEvent(
            '', '', 'file://{resources}/layout/context_menus/context_menu_inventory_item.xml',
            'itemid=' + id + filterForContextMenuEntries, function() {}
        );
        contextMenuPanel.AddClass("ContextMenu_NoArrow");
    }

    function _GetPopUpCapability() {
        if (typeof InventoryPanel === "object") {
            var capInfo = InventoryPanel.GetCapabilityInfo();
            if (capInfo.popupVisible) {
                return capInfo;
            }
        }
        return null;
    }

    function SortIdsIntoToolAndItemID(id, initialId) {
        var toolId = InventoryAPI.IsTool(id) ? id : initialId;
        var itemID = InventoryAPI.IsTool(id) ? initialId : id;
        return { tool: toolId, item: itemID };
    }

    function _CapabilityNameableAction(idsToUse) {
        UiToolkitAPI.ShowCustomLayoutPopupParameters(
            '',
            'file://{resources}/layout/popups/popup_capability_nameable.xml',
            'nametag-and-itemtoname=' + idsToUse.tool + ',' + idsToUse.item +
            '&asyncworktype=nameable'
        );
    }

    function _CapabilityCanStickerAction(idsToUse) {
        UiToolkitAPI.ShowCustomLayoutPopupParameters(
            '',
            'file://{resources}/layout/popups/popup_capability_can_sticker.xml',
            'sticker-and-itemtosticker=' + idsToUse.tool + ',' + idsToUse.item +
            '&asyncworktype=can_sticker'
        );
    }

    function _CapabilityCanPatchAction(idsToUse) {
        UiToolkitAPI.ShowCustomLayoutPopupParameters(
            '',
            'file://{resources}/layout/popups/popup_capability_can_sticker.xml',
            'sticker-and-itemtosticker=' + idsToUse.tool + ',' + idsToUse.item +
            '&asyncworktype=can_patch'
        );
    }

    function _CapabilityDecodableAction(idsToUse) {
        UiToolkitAPI.ShowCustomLayoutPopupParameters(
            '',
            'file://{resources}/layout/popups/popup_capability_decodable.xml',
            'key-and-case=' + idsToUse.tool + ',' + idsToUse.item +
            '&asyncworktype=decodeable'
        );
    }

    function _CapabilityPutIntoCasketAction(idCasket, idItem, cap) {
        $.DispatchEvent('ContextMenuEvent', '');
        if (!cap) {
            $.DispatchEvent('HideSelectItemForCapabilityPopup');
            $.DispatchEvent('UIPopupButtonClicked', '');
            $.DispatchEvent('CapabilityPopupIsOpen', false);
        }
        UiToolkitAPI.ShowCustomLayoutPopupParameters(
            '',
            'file://{resources}/layout/popups/popup_casket_operation.xml',
            'op=add' +
            (cap ? '&nextcapability=' + cap : '') +
            '&spinner=1' +
            '&casket_item_id=' + idCasket +
            '&subject_item_id=' + idItem
        );
    }

    function _CapabilityItemInsideCasketAction(idCasket, idItem) {
        UiToolkitAPI.ShowCustomLayoutPopupParameters(
            '',
            'file://{resources}/layout/popups/popup_inventory_inspect.xml',
            'itemid=' + idItem +
            '&inspectonly=true' +
            '&insidecasketid=' + idCasket +
            '&showequip=false' +
            '&allowsave=false',
            'none'
        );
    }

    function _CapabilityStatTrakSwapAction(capInfo, id) {
        if (InventoryAPI.IsTool(capInfo.initialItemId)) {
            $.DispatchEvent("ShowSelectItemForCapabilityPopup", 'can_stattrack_swap', id, capInfo.initialItemId);
        } else {
            UiToolkitAPI.ShowCustomLayoutPopupParameters(
                '',
                'file://{resources}/layout/popups/popup_capability_can_stattrack_swap.xml',
                'swaptool=' + capInfo.secondaryItemId +
                '&swapitem1=' + capInfo.initialItemId +
                '&swapitem2=' + id
            );
        }
    }

    function _Ondblclick() {
        var id = $.GetContextPanel().GetAttributeString('itemid', '0');
        if (ItemInfo.GetSlotSubPosition(id) || ItemInfo.ItemMatchDefName(id, 'sticker')) {
            $.DispatchEvent("InventoryItemPreview", id);
            $.DispatchEvent('ContextMenuEvent', '');
        }
    }

    function _ShowTooltip() {
        var id = $.GetContextPanel().GetAttributeString('itemid', '0');
        if (!InventoryAPI.IsItemInfoValid(id)) return;
        UiToolkitAPI.ShowCustomLayoutParametersTooltip(
            'ItemImage',
            'JsItemTooltip',
            'file://{resources}/layout/tooltips/tooltip_inventory_item.xml',
            'itemid=' + id
        );
    }

    function _HideTooltip() {
        UiToolkitAPI.HideCustomLayoutTooltip('JsItemTooltip');
    }

    return {
        OnTileUpdated: _OnTileUpdated,
        OnActivate: _OnActivate,
        ShowTooltip: _ShowTooltip,
        HideTooltip: _HideTooltip,
        Ondblclick: _Ondblclick
    };
})();

(function() {
    $.RegisterEventHandler('CSGOInventoryItemLoaded', $.GetContextPanel(), ItemTile.OnTileUpdated);
    $.RegisterEventHandler('UpdateItemTile', $.GetContextPanel(), ItemTile.OnTileUpdated);
})();







                                       
                                                                                                         

                                      
    
   	                             

   	             
   	    
   	   	                                          
   	   	                                                                                 
   	   	                                                                                                                                        
   	   	       
   	    

   	                                                
    

                            
    
   	                                                                                 
   	                                                
    

                         
    
   	                                                               
    

                                
    
   	                               

   	                                               
   		            
   		                 
   		                                                                
   		                        
   	  
    

                         
    
   	                                                        

   	                                     
   	   
   		                                            
   		                               
   	   
    




                                                                                                    
                                    
                                                                                                    
                                
   	                                                             
    

                                         
   	                                        
    

                                 
    
   	                                                                                 
   	 
   		                         
   		                                                    
   		                                                                    
   		                                                  
   		                                                   
   		                                                   
		
   		                             
   			                                      
   		                     
   			                                        
   		    
   			                                   
   	 
	
   	             
    

           

   	             	                
     

                                                   
                                
                                 
    
   	                                 
   	 
   		                                                                
   	 
		
   	                                                                                                       
    

                                                                  
                                 
                          
    
   	                                 
   	 	
   		                                                                      
   		                        
   		                                           
   	 

   	                     
    

                                        
    
   	                     

   	                           	
   	                                              
   		                                              
	
   	                        
   	 
   		                                   

   		                        
   			             
   	 
		
   	                                      
    
