"use strict";
/// <reference path="csgo.d.ts" />
var HonorIcon;
(function (HonorIcon) {
    function ColorConvert(tier) {
        let rarityColors = [
            ["default", 176, 195, 217, 0, 0, -.8, "particles/ui/ui_exp_streak_t0.vpcf"],
            ["common", 176, 195, 217, 0, 0, -.8, "particles/ui/ui_exp_streak_t1.vpcf"],
            ["uncommon", 94, 152, 217, 0, .2, -.5, "particles/ui/ui_exp_streak_t2.vpcf"],
            ["rare", 75, 105, 255, 0, .35, -.2, "particles/ui/ui_exp_streak_t3.vpcf"],
            ["mythical", 136, 71, 255, 0, .3, .1, "particles/ui/ui_exp_streak_t4.vpcf"],
            ["legendary", 211, 44, 230, 0, .35, .2, "particles/ui/ui_exp_streak_t5.vpcf"],
            ["ancient", 235, 75, 75, 0, .5, .2, "particles/ui/ui_exp_streak_t6.vpcf"],
            ["unusual", 235, 75, 75, 0, .5, 1, "particles/ui/ui_exp_streak_t7.vpcf"],
        ];
        if (!tier)
            tier = 0;
        else if (tier < 0)
            tier = 0;
        else if (tier >= rarityColors.length)
            tier = rarityColors.length - 1;
        let R = rarityColors[tier][1];
        let G = rarityColors[tier][2];
        let B = rarityColors[tier][3];
        let H = rarityColors[tier][4];
        let S = rarityColors[tier][5];
        let V = rarityColors[tier][6];
        let ParticleEffect = rarityColors[tier][7];
        return { R, G, B, H, S, V, ParticleEffect };
    }
    HonorIcon.ColorConvert = ColorConvert;
    function SetOptionsEventHandler(elPanel, do_fx, xptrail_value, prime_value) {
        const options = {
            honor_icon_frame_panel: elPanel,
            do_fx: do_fx,
            xptrail_value: xptrail_value,
            prime_value: prime_value,
        };
        SetOptions(options);
    }
    //$.RegisterEventHandler("HonorIcon_SetOptions", $.GetContextPanel(), SetOptionsEventHandler);
    function SetOptions(options) {
        const honor_icon_frame_panel = options.honor_icon_frame_panel;
        if (!honor_icon_frame_panel || !honor_icon_frame_panel.IsValid())
            return;
        _SetHonorImage(options);
    }
    HonorIcon.SetOptions = SetOptions;
    function _SetHonorImage(options) {
        const honor_icon_frame_panel = options.honor_icon_frame_panel;
        const do_fx = options.hasOwnProperty('do_fx') ? options.do_fx : false;
        const force_icon = options.hasOwnProperty('force_icon') ? options.force_icon : '';
        const fallback_to_prime = options.hasOwnProperty('prime_value');
        const debug_xuid = options.hasOwnProperty('debug_xuid') ? options.debug_xuid : '';
        const xptrail_value = options.xptrail_value;
        const prime_value = options.hasOwnProperty('prime_value') ? options.prime_value : false;
        const bForcePrime = (force_icon === 'prime');
        const bForceXpTrail = (force_icon === 'xptrail');
        const bShowXpTrail = !bForcePrime && ((xptrail_value > 0) || bForceXpTrail);
        const bShowPrime = bForcePrime || (fallback_to_prime && prime_value);
        if (bShowXpTrail) {
            honor_icon_frame_panel.SwitchClass('icon-to-show', 'show-honor');
            honor_icon_frame_panel.SetDialogVariableInt('xptrail-streak', xptrail_value);
        }
        else if (bShowPrime) {
            honor_icon_frame_panel.SwitchClass('icon-to-show', 'show-prime');
        }
        else {
            honor_icon_frame_panel.SwitchClass('icon-to-show', 'show-none');
        }
        const elPFXRing = honor_icon_frame_panel.FindChildTraverse('JsHonorParticlesRing');
        const elPFX = honor_icon_frame_panel.FindChildTraverse('JsHonorParticles');
        if (bShowXpTrail) {
            let tierXpColor = ColorConvert(xptrail_value);
            if (!do_fx) {
                if (xptrail_value > 0) {
                    elPFX.SetParticleNameAndRefresh("particles/ui/ui_exp_streak.vpcf");
                    elPFX.SetControlPoint(16, tierXpColor.R, tierXpColor.G, tierXpColor.B);
                    elPFX.SetControlPoint(17, tierXpColor.H, tierXpColor.S, tierXpColor.V);
                }
                else {
                    elPFX.StopParticlesImmediately(true);
                    elPFXRing.StopParticlesImmediately(true);
                }
            }
            else {
                elPFX.SetParticleNameAndRefresh(tierXpColor.ParticleEffect);
                elPFX.SetControlPoint(16, tierXpColor.R, tierXpColor.G, tierXpColor.B);
                elPFX.SetControlPoint(17, tierXpColor.H, tierXpColor.S, tierXpColor.V);
                elPFXRing.StartParticles();
                elPFXRing.SetControlPoint(16, tierXpColor.R, tierXpColor.G, tierXpColor.B);
                elPFXRing.SetControlPoint(17, tierXpColor.H, tierXpColor.S, tierXpColor.V);
            }
        }
    }
})(HonorIcon || (HonorIcon = {}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaG9ub3JfaWNvbi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL2NvbnRlbnQvY3Nnby9wYW5vcmFtYS9zY3JpcHRzL2hvbm9yX2ljb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLGtDQUFrQztBQWVsQyxJQUFVLFNBQVMsQ0FpSmxCO0FBakpELFdBQVUsU0FBUztJQUVsQixTQUFnQixZQUFZLENBQUcsSUFBWTtRQUUxQyxJQUFJLFlBQVksR0FBOEU7WUFDN0YsQ0FBRSxTQUFTLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxvQ0FBb0MsQ0FBRTtZQUM3RSxDQUFFLFFBQVEsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLG9DQUFvQyxDQUFFO1lBQzVFLENBQUUsVUFBVSxFQUFFLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLEVBQUUsb0NBQW9DLENBQUU7WUFDOUUsQ0FBRSxNQUFNLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxvQ0FBb0MsQ0FBRTtZQUMzRSxDQUFFLFVBQVUsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxvQ0FBb0MsQ0FBRTtZQUM3RSxDQUFFLFdBQVcsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEdBQUcsRUFBRSxDQUFDLEVBQUUsR0FBRyxFQUFFLEVBQUUsRUFBRSxvQ0FBb0MsQ0FBRTtZQUMvRSxDQUFFLFNBQVMsRUFBRSxHQUFHLEVBQUUsRUFBRSxFQUFFLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxFQUFFLEVBQUUs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