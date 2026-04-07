"use strict";

var MoneyPanel;
(function (MoneyPanel) {
    const _elContainer = $('#jsRotaryMoney');
    let _lastMoneyValue = -1; // all this does is check the last money value, if it's unchanged.. don't change it!

    function _Init() {
        if (_elContainer) {
            const maxLen = "$16000"; 
            DigitPanelFactory.MakeDigitPanel(_elContainer, maxLen.length, '', 0.6, "#buymenu_money_digitpanel_digits");
            
            _WatchMoney(); // observer loop for the mula.
        }
    }

    function _WatchMoney() { 
        const currentMoney = GameStateAPI.GetPlayerMoney(GameStateAPI.GetLocalPlayerXuid());

        if (currentMoney !== _lastMoneyValue) {
            _UpdateMoney(currentMoney, _lastMoneyValue === -1); 
            _lastMoneyValue = currentMoney;
        }
        $.Schedule(0.1, _WatchMoney);
    }

    function _UpdateMoney(amt, bInstant = false) {
        if (!_elContainer) return;

        $.GetContextPanel().SetDialogVariableInt("money", amt);
        const digitString = $.Localize("#buymenu_money", $.GetContextPanel());
        
        DigitPanelFactory.SetDigitPanelString(_elContainer, digitString, bInstant);
    }

    _Init();

})(MoneyPanel || (MoneyPanel = {}));