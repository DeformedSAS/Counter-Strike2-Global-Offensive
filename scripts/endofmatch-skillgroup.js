'use strict';

var EOM_Skillgroup = (function () {

    var _m_pauseBeforeEnd = 1.0;
    var _m_cP = $.GetContextPanel();

    const DEBUG_SKILLGROUP = false; // rankup debug
    const DEBUG_PREMIER = false;     // premier debug
    const DEBUG_RANKDOWN = false;  // rankdown debug, both premier and regular skillgroup.

    _m_cP.Data().m_retries = 0;

    var _DisplayMe = function()
    {
        if ( !DEBUG_SKILLGROUP && !DEBUG_PREMIER )
        {
            if ( !_m_cP.bSkillgroupDataReady && !MockAdapter.GetMockData() )
            {
                return false;
            }

            if( MyPersonaAPI.GetElevatedState() !== 'elevated' )
            {
                return false;
            }
        }

        var oSkillgroupData = MockAdapter.SkillgroupDataJSO( _m_cP );

        function _r ( min = 0, max = 1000 )
        {
            return Math.ceil( Math.random() * ( ( max - min ) + min ) );
        };

        if ( DEBUG_SKILLGROUP )
        {
            const oldrank = _r( 2, 17 );

            oSkillgroupData = {
                "old_rank": oldrank,
                "new_rank": DEBUG_RANKDOWN ? (oldrank - 1) : (oldrank + 1),                                
                "num_wins": _r( 10, 1000 )
            };
        }
        else if ( DEBUG_PREMIER )
        {
            var oldrating = _r( 4000, 40000 );
            var ratingchange = _r( 200, 700 );

            oSkillgroupData = {
                "old_rank": oldrating,
                "new_rank": DEBUG_RANKDOWN ? (oldrating - ratingchange) : (oldrating + ratingchange),
                "num_wins": _r( 10, 1000 ),
                "rank_change": DEBUG_RANKDOWN ? -ratingchange : ratingchange,
                "rank_type": "Premier"
            };
        }

        var compWins = oSkillgroupData[ "num_wins" ];
        var oldRank = oSkillgroupData[ "old_rank" ];
        var newRank = oSkillgroupData[ "new_rank" ];
        var mode = GameStateAPI.GetGameModeInternalName( true );
        
        if ( oSkillgroupData && oSkillgroupData["rank_type"] ) {
            mode = oSkillgroupData["rank_type"];
        }

        var rating_change = oSkillgroupData["rank_change"] || 0;
        var rating_mismatch = (newRank - oldRank != rating_change) && oldRank != 0;
        
        if (rating_mismatch) {
            oldRank = 0;
        }

        var currentRank = oldRank < newRank ? newRank : oldRank;

        var oData = {
            currentRank: newRank,
            compWins: compWins,
            oldRank: oldRank,
            oldRanklInfo: '',
            oldRankDesc: '',
            oldImage: '',
            newRank: newRank,
            newRanklInfo: '',
            newRankDesc: '',
            newImage: '',           
            mode: mode,
            rating_change: rating_change,
            rating_mismatch: rating_mismatch,
            model: ''
        };

        var winsNeededForRank = SessionUtil.GetNumWinsNeededForRank( oData.mode );

        if ( DEBUG_SKILLGROUP )
        {
            winsNeededForRank = 0;
            mode = 'competitive';

        }
		
        else if ( DEBUG_PREMIER )
        {
            winsNeededForRank = 0;
            oData.mode = 'Premier';
        }

        _m_cP.SetDialogVariable( 'eom_mode', MockAdapter.GetGameModeName( true ) );

        if ( oData.mode === 'survival' && currentRank < 1 )
        {                                                                   
            oData.oldRanklInfo = $.Localize( '#eom-skillgroup-needed-dzgames', _m_cP );
            oData.oldImage = 'file://{images}/icons/skillgroups/dangerzone0.svg';
        }
        else if ( currentRank < 1 && compWins >= winsNeededForRank )
        {   
            if (oData.mode === 'Premier') {
                oData.oldRanklInfo = $.Localize( '#eom-skillgroup-expired', _m_cP );
            } else {
                var modePrefix = ( oData.mode === 'scrimcomp2v2' ) ? 'wingman' : ( ( oData.mode === 'survival' ) ? 'dangerzone' : 'skillgroup' );
                oData.oldRanklInfo = $.Localize( '#eom-skillgroup-expired', _m_cP );
                oData.oldImage = 'file://{images}/icons/skillgroups/'+modePrefix+'_expired.svg';
            }
        }
        else if ( currentRank < 1 )
        {
            var matchesNeeded = winsNeededForRank - compWins;
            _m_cP.SetDialogVariableInt( 'num_matches', matchesNeeded );
            var winNeededString = ( matchesNeeded === 1 ) ? '#eom-skillgroup-needed-win' : '#eom-skillgroup-needed-wins';
            
            if (oData.mode !== 'Premier') {
                var modePrefix = ( oData.mode === 'scrimcomp2v2' ) ? 'wingman' : ( ( oData.mode === 'survival' ) ? 'dangerzone' : 'skillgroup' );
                oData.oldRanklInfo = $.Localize( winNeededString, _m_cP );
                oData.oldImage = 'file://{images}/icons/skillgroups/'+modePrefix+'0.svg';
            }
        }
        else if ( currentRank >= 1 )
        {
            if ( oData.mode === 'Premier' )
            {
                if ( oldRank !== newRank )
                {
                    _m_pauseBeforeEnd = 5.0;
                    _LoadAndShowRankReveal( oData, (oldRank > newRank) );
                }
            } 
            else 
            {
                var modePrefix = ( oData.mode === 'scrimcomp2v2' ) ? 'wingman' : ( ( oData.mode === 'survival' ) ? 'dangerzone' : 'skillgroup' );
                
                oData.oldImage = 'file://{images}/icons/skillgroups/'+modePrefix + oldRank + '.svg';
                oData.oldRanklInfo = $.Localize( ( oData.mode === 'survival' ) ? '#skillgroup_' + oldRank + 'dangerzone' : '#RankName_' + oldRank );
                oData.oldRankDesc = $.Localize( '#eom-skillgroup-name', _m_cP );

                oData.newImage = 'file://{images}/icons/skillgroups/' + modePrefix + newRank + '.svg';
                oData.newRanklInfo = $.Localize( ( oData.mode === 'survival' ) ? '#skillgroup_' + newRank + 'dangerzone' : '#RankName_' + newRank );

                if ( oldRank !== newRank )                               
                {
                    _m_pauseBeforeEnd = 4.5;
                    _LoadAndShowRankReveal( oData, (oldRank > newRank) );
                }
            }
        }

        if ( oData.mode === 'Premier' ) {
            _FilloutPremierRankData( oData );
            var elPremierBg = _m_cP.FindChildInLayoutFile('id-eom-skillgroup-premier-bg');
            var elEmblem = _m_cP.FindChildInLayoutFile('jsRatingEmblem');
            if (elPremierBg && elEmblem && typeof RatingEmblem !== 'undefined') {
                elPremierBg.SwitchClass('tier', RatingEmblem.GetTierColorClass(elEmblem));
            }
        } else {
            _FilloutRankData( oData );
        }

        var elStandardBg = _m_cP.FindChildInLayoutFile('id-eom-skillgroup-bg');
        if (elStandardBg) elStandardBg.SetHasClass('hide', oData.mode === 'Premier');

        var elPremierBg = _m_cP.FindChildInLayoutFile('id-eom-skillgroup-premier-bg');
        if (elPremierBg) elPremierBg.SetHasClass('hide', oData.mode !== 'Premier');


        var elStandardEmblem = _m_cP.FindChildInLayoutFile('id-eom-skillgroup-emblem');
        if (elStandardEmblem) elStandardEmblem.SetHasClass('hide', oData.mode === 'Premier');
        
        var elPremierRating = _m_cP.FindChildInLayoutFile('jsRatingEmblem');
        if (elPremierRating) elPremierRating.SetHasClass('hide', oData.mode !== 'Premier');

        _m_cP.AddClass( 'eom-skillgroup-show');
    
        return true;
    };


    function _LoadAndShowRankReveal ( oData, bIsRankDown )
    {
        $.Schedule( 1.0, _RevealNewIcon.bind( undefined, oData, bIsRankDown ) );
    }
    
    function _PlayParticles ()
    {
        var elModel = _m_cP.FindChildTraverse( 'SkillGroupParticles' );
        if ( !elModel || !elModel.IsValid() )
            return;

        elModel.RemoveClass( 'hidden' );
        elModel.SetCameraPosition( -15.10, 0.00, 0.00 );
        elModel.SetCameraAngles( 0.00,  0.00,  0.00 );
        elModel.AddParticleSystem( 'nuke_sparks1_glow', '', false );
        elModel.AddParticleSystem( 'nuke_sparks1_core', '', false );
    }

    function _RevealNewIcon ( oData, bIsRankDown )
    {
        if ( !_m_cP || !_m_cP.IsValid() )
            return;

        if ( oData.mode === 'Premier' ) {
            var options = {
                root_panel: _m_cP.FindChildInLayoutFile('jsRatingEmblem'),
                leaderboard_details: { score: oData.newRank, matchesWon: oData.compWins },
                do_fx: false,
                presentation: 'digital',
                eom_digipanel_class_override: GetEmblemStyleOverride(oData.newRank),
                full_details: true,
                rating_type: "Premier",
                local_player: true
            };
            var winLossStyle = GetWinLossStyle(oData);
            var elEmblem = _m_cP.FindChildInLayoutFile('jsRatingEmblem');
            if (elEmblem) elEmblem.SwitchClass('winloss', winLossStyle + '-anim');
            PremierRankText(oData);
            SpeedLinesAnim(winLossStyle);
            RatingEmblemAnim(oData, options, winLossStyle);
        } else {
            _m_cP.FindChildInLayoutFile( 'id-eom-skillgroup-emblem--new__image' ).SetImage( oData.newImage );
            
            var elEmblem = _m_cP.FindChildInLayoutFile( 'id-eom-skillgroup-emblem' );
            elEmblem.RemoveClass( "uprank-anim" );
            elEmblem.AddClass( "uprank-anim" );
            
            _m_cP.FindChildInLayoutFile( "id-eom-skillgroup__current__label" ).text = oData.newRanklInfo;

            if ( bIsRankDown ) 
            {
                $.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.XP.RankDown', 'MOUSE' );
            }
            else 
            {
                _PlayParticles();
                $.DispatchEvent( 'PlaySoundEffect', 'UIPanorama.XP.NewSkillGroup', 'MOUSE' );
            }
        }
    }

    function _FilloutRankData ( oData )
    {
        var winString = ( oData.compWins === 1 ) ? '#eom-skillgroup-win' : '#eom-skillgroup-wins';
        var elDesc = _m_cP.FindChildInLayoutFile( "id-eom-skillgroup__current_wins_desc" );
        elDesc.text = $.Localize( winString, _m_cP );

        _m_cP.FindChildInLayoutFile( "id-eom-skillgroup__current_wins" ).text = oData.compWins;
        _m_cP.FindChildInLayoutFile( "id-eom-skillgroup__current__label" ).text = oData.oldRanklInfo;

        var elRankDesc = _m_cP.FindChildInLayoutFile( "id-eom-skillgroup__current__title" );
        
        if ( oData.oldRankDesc )
        {
            elRankDesc.RemoveClass( 'hidden' );
            elRankDesc.text = oData.oldRankDesc;
        }

        var elImage = _m_cP.FindChildInLayoutFile( "id-eom-skillgroup-emblem--current__image" );
        elImage.RemoveClass( 'hidden' );
        elImage.SetImage( oData.oldImage );
    }

    function GetEmblemStyleOverride(new_rating) {
        return new_rating < 1000 ? 'digitpanel-container-3-digit-offset' : new_rating < 10000 ? 'digitpanel-container-4-digit-offset' : '';
    }

    function _FilloutPremierRankData(oData) {
        var options = {
            root_panel: _m_cP.FindChildInLayoutFile('jsRatingEmblem'),
            leaderboard_details: { score: oData.oldRank, matchesWon: oData.compWins },
            do_fx: false,
            rating_type: oData.mode,
            presentation: 'digital',
            eom_digipanel_class_override: GetEmblemStyleOverride(oData.oldRank),
            full_details: true,
            local_player: true
        };
        if (oData.rating_change === 0) {
            if (typeof RatingEmblem !== 'undefined') RatingEmblem.SetXuid(options);
            var winLossStyle = GetWinLossStyle(oData);
            var elEmblem = _m_cP.FindChildInLayoutFile('jsRatingEmblem');
            if (elEmblem) elEmblem.SwitchClass('winloss', winLossStyle + '-anim');
            PremierRankText(oData);
            SpeedLinesAnim(winLossStyle);
            RatingEmblemAnim(oData, options, winLossStyle);
            return;
        }
        if (typeof RatingEmblem !== 'undefined') RatingEmblem.SetXuid(options);
    }

    function PremierRankText(oData) {
        SetWinDescString(oData, _m_cP.FindChildInLayoutFile("id-eom-skillgroup-premier-wins-desc"));
        _m_cP.SetDialogVariable('total-wins', oData.compWins.toString());
        var desc;
        var nPoints;
        if (oData.newRank > 0 && oData.oldRank < 1) {
            desc = $.Localize('#cs_rating_rating_established');
            nPoints = 0;
        }
        else {
            var elEmblem = _m_cP.FindChildInLayoutFile('jsRatingEmblem');
            desc = (elEmblem && typeof RatingEmblem !== 'undefined') ? RatingEmblem.GetEomDescText(elEmblem) : '';
            nPoints = Math.abs(oData.rating_change || 0);
        }

        if (oData.rating_mismatch) {
            _m_cP.SetDialogVariable('premier-desc', $.Localize('#cs_rating_mismatch'));
        }
        else if (desc && desc !== '') {
            _m_cP.SetDialogVariable('premier-desc', desc);
        }

        var elDescPanel = _m_cP.FindChildInLayoutFile('id-eom-skillgroup-premier-desc');
        if (elDescPanel) elDescPanel.SetHasClass('hide', desc === '' || !desc);

        var sPointsString = oData.newRank >= oData.oldRank ? "#eom-premier-points-gained" : "#eom-premier-points-lost";
        _m_cP.SetDialogVariableInt('premier_points', nPoints);
        var elPts = _m_cP.FindChildInLayoutFile('id-eom-skillgroup-premier-points');
        if (elPts) elPts.text = $.Localize(sPointsString, _m_cP);
    }

    function GetWinLossStyle(oData) {
        var winLossStyle = ((oData.newRank === 0) || (oData.newRank > 0 && oData.oldRank < 1) || !oData.rating_change) ?
            'no-points' : (oData.rating_change < 0 ?
            'lost-points' : (oData.rating_change > 0 ?
            'gain-points' : ''));
        return winLossStyle;
    }

    function SpeedLinesAnim(winLossStyle) {
        $.DispatchEvent('PlaySoundEffect', 'UI.Premier.EOM.SlideIn', 'MOUSE');
        $.Schedule(.25, function() {
            if (!_m_cP || !_m_cP.IsValid())
                return;
            var speedLines = _m_cP.FindChildInLayoutFile('id-eom-premier-speed-lines');
            if (speedLines && speedLines.IsValid()) {
                speedLines.SetMovie("file://{resources}/videos/speed_lines.webm");
                speedLines.SwitchClass('winloss', winLossStyle);
                speedLines.SetControls('none');
                speedLines.Play();
            }
        });
    }

    function RatingEmblemAnim(oData, options, winLossStyle) {
        PlayPremierRankSound(winLossStyle);
        $.Schedule(.75, function() {
            var elPanel = _m_cP.FindChildInLayoutFile('id-eom-skillgroup-premier-bg');
            if (!elPanel || !elPanel.IsValid() || !options.root_panel || !options.root_panel.IsValid())
                return;
            if (typeof RatingEmblem !== 'undefined') RatingEmblem.SetXuid(options);
            PremierRankText(oData);
            var elEmblem = _m_cP.FindChildInLayoutFile('jsRatingEmblem');
            if (elEmblem && typeof RatingEmblem !== 'undefined') {
                elPanel.SwitchClass('tier', RatingEmblem.GetTierColorClass(elEmblem));
            }
        });
        var elPanel = _m_cP.FindChildInLayoutFile('id-eom-skillgroup-premier-bg');
        if (elPanel) elPanel.SwitchClass('winloss', winLossStyle);
    }

    function PlayPremierRankSound(winLossStyle) {
        if (winLossStyle === 'no-points') {
            $.DispatchEvent('PlaySoundEffect', 'UI.Premier.EOM.RankNeutral', 'MOUSE');
        }
        else if (winLossStyle === 'lost-points') {
            $.DispatchEvent('PlaySoundEffect', 'UI.Premier.EOM.RankDown', 'MOUSE');
        }
        else {
            $.DispatchEvent('PlaySoundEffect', 'UI.Premier.EOM.RankUp', 'MOUSE');
        }
    }

    function SetWinDescString(oData, elLabel) {
        if (!elLabel) return;
        elLabel.SetDialogVariableInt("matcheswon", oData.compWins);
        switch (oData.mode) {
            case 'Competitive':
                elLabel.text = $.Localize('#eom-skillgroup-map-win:f', elLabel);
                break;
            case 'Wingman':
            case 'Premier':
                elLabel.text = $.Localize('#eom-skillgroup-win:f', elLabel);
                break;
        }
    }

    function _Start() 
    {
        if ( !DEBUG_SKILLGROUP && !DEBUG_PREMIER ) 
        {
            if ( MockAdapter.GetMockData() && !MockAdapter.GetMockData().includes( 'SKILLGROUP' ) )
            {
                _End();
                return;
            }
        }
        
        if ( _DisplayMe() )
        {
            EndOfMatch.SwitchToPanel( 'eom-skillgroup' );
            EndOfMatch.StartDisplayTimer( _m_pauseBeforeEnd );
            $.Schedule( _m_pauseBeforeEnd, _End );
        }
        else
        {
            _End();
            return;
        }
    }

    function _End() 
    {
        EndOfMatch.ShowNextPanel();
    }

    function _Shutdown() {}

    return {
        name: 'eom-skillgroup',
        Start: _Start,
        Shutdown: _Shutdown,
    };
})();

(function () {
    EndOfMatch.RegisterPanelObject( EOM_Skillgroup );
})();