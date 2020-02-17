/**
 * Created by koc on 28/04/2017.
 */

'use strict';
require('./slot_machine');
require('./setting');
const configuration = require('./configuration');


$(document).ready(() => {
    $(function () {
        $('[data-toggle="tooltip"]').tooltip();
    });

    $("#settings-page").css({position: 'absolute', visibility: 'hidden'});

    $("#settings-button").click(() => {
        $("#settings-page").css({position: 'static', visibility: 'visible'});
        $("#slot-machine-page").css({position: 'absolute', visibility: 'hidden'});
        $(".follow-prizes-container").hide();
    });


    $("#index-button").click(() => {
        $("#settings-page").css({position: 'absolute', visibility: 'hidden'});
        $("#slot-machine-page").css({position: 'static', visibility: 'visible'});
        $(".follow-prizes-container").show();
    });

});
