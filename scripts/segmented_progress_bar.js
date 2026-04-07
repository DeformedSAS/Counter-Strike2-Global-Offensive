"use strict";
/// <reference path="csgo.d.ts" />

var SegmentedProgressBar = (function () {

    function _msg(text) {
    }

    const WHOLE_BAR_WIDTH = 180;
    const PROGRESS_PIP_WIDTH = 24;
    const SEGMENT_MARGIN_LEFT = 1;
    const SEGMENT_MARGIN_RIGHT = 1;

    class CSegment {
        constructor(parent, name, min, max, totalMax, addPip, numSegments) {
            this.min = min;
            this.max = max;
            this.totalMax = totalMax;

            this.elRoot = $.CreatePanel('Panel', parent, name);
            this.elRoot.BLoadLayoutSnippet("snippet__progress-bar-segment");

            this.elProg = this.elRoot.FindChildTraverse('pbs-progressbar');
            this.elProg.max = this.max;
            this.elProg.min = this.min;
            this.elProg.value = 0;

            const totalWidth = WHOLE_BAR_WIDTH - (numSegments * PROGRESS_PIP_WIDTH);
            const fractionOfTotalProgress = (this.max - this.min) / totalMax;
            const segmentBarWidth = fractionOfTotalProgress * totalWidth;
            const segmentBarWidthWithPip = segmentBarWidth + PROGRESS_PIP_WIDTH;

            this.elRoot.style.width = segmentBarWidthWithPip + 'px';
            this.elProg.style.marginLeft = SEGMENT_MARGIN_LEFT + 'px';
            this.elProg.style.marginRight = SEGMENT_MARGIN_RIGHT + 'px';

            this.elPip = this.elRoot.FindChildTraverse('pbs-progresspip');
            this.elPip.style.visibility = addPip ? 'visible' : 'collapse';
            this.elPip.style.width = PROGRESS_PIP_WIDTH + 'px';
            this.elPip.style.height = PROGRESS_PIP_WIDTH + 'px';

            const goalLabel = this.elRoot.FindChildTraverse('pbs-progress-goal-label');
            if (goalLabel) {
                goalLabel.SetDialogVariableInt('goal-checkpoint', this.max);
            }
        }

        setValue(value) {
            this.elProg.value = value;
            if (value >= this.max) {
                this.elRoot.SwitchClass('state', 'complete');
            } else if (value < this.min) {
                this.elRoot.SwitchClass('state', 'future');
            } else {
                this.elRoot.SwitchClass('state', 'current');
            }
        }
    }

    class CWholeBar {
        constructor(elParent, barType, missionData) {
            this.segments = [];

            const arrGoals = missionData.goal_points || [10];
            const arrXpRewards = missionData.xp_reward || [50];

            for (let i = 0; i < arrGoals.length; i++) {
                let min = i > 0 ? arrGoals[i - 1] : 0;
                let max = arrGoals[i];

                const totalGoal = arrGoals[arrGoals.length - 1];
                const addPip = arrGoals.length > 1;

                const seg = new CSegment(elParent, barType + i, min, max, totalGoal, addPip, arrGoals.length);
                this.segments.push(seg);

                if (barType === "Base") {
                    seg.elRoot.SetDialogVariableInt('mission-points', max - min);
                    seg.elRoot.SetDialogVariableInt('xp-reward', arrXpRewards[i] || 0);

                    seg.elRoot.SetPanelEvent('onmouseover', function () {
                        const strTooltip = $.Localize("#mission_segment_tooltip", seg.elRoot);
                        if (UiToolkitAPI) UiToolkitAPI.ShowTextTooltipOnPanelStyled(seg.elRoot, strTooltip, 'mission-segment-tooltip');
                    });

                    seg.elRoot.SetPanelEvent('onmouseout', function () {
                        if (UiToolkitAPI) UiToolkitAPI.HideTextTooltip();
                    });
                }
            }
        }

        setBarValue(val) {
            for (let i = 0; i < this.segments.length; i++) {
                this.segments[i].setValue(val);
            }
        }
    }

    function CreateSegmentedProgressBar(elPanel, missionData) {
        if (!elPanel || !missionData) return;

        elPanel.BLoadLayout('file://{resources}/layout/segmented_progress_bar.xml', true, false);

        elPanel.Data().m_backgroundProgBar = new CWholeBar(elPanel.FindChildTraverse('spbBackground'), 'Background', missionData);
        elPanel.Data().m_liveProgBar = new CWholeBar(elPanel.FindChildTraverse('spbLive'), 'Live', missionData);
        elPanel.Data().m_baseProgBar = new CWholeBar(elPanel.FindChildTraverse('spbBase'), 'Base', missionData);


        elPanel.style.width = WHOLE_BAR_WIDTH + 'px';
    }

    function Init(elPanel, missionData) {
        if (!elPanel) return;
        elPanel.RemoveAndDeleteChildren();
        CreateSegmentedProgressBar(elPanel, missionData);
    }

    function SetValue(elPanel, val, bar) {
        if (!elPanel || !elPanel.IsValid() || !elPanel.Data().m_liveProgBar) return;

        switch (bar) {
            case 'Live':
                elPanel.Data().m_liveProgBar.setBarValue(val);
                break;
            case 'Base':
                elPanel.Data().m_baseProgBar.setBarValue(val);
                break;
        }

        elPanel.Data().m_backgroundProgBar.setBarValue(val);
    }

    return {
        CreateSegmentedProgressBar: CreateSegmentedProgressBar,
        Init: Init,
        SetValue: SetValue
    };
})();
