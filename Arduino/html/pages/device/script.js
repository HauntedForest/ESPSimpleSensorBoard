/*Home Device File*/
window.addEventListener('eg-setup', () => {

    $('#checkInputTally').on('change', (evt) => {
        var checked = $(evt.target).prop('checked');
        if (checked) {
            $('#deviceConfigFieldsetTally').show();
            $('#checkInputHTTPRequests').prop('checked', true);
        } else {
            $('#deviceConfigFieldsetTally').hide();
        }
    });

    $('#checkOutputTriggerCameraRecord').on('change', (evt) => {
        var checked = $(evt.target).prop('checked');
        if (checked) {
            $('#deviceConfigFieldsetTriggerCameraRecord').show();
        }
        else {
            $('#deviceConfigFieldsetTriggerCameraRecord').hide();
        }
    });

    $('#checkOutputTriggerOtherBoard').on('change', (evt) => {
        var checked = $(evt.target).prop('checked');
        if (checked) {
            $('#deviceConfigFieldsetTriggerOtherBoard').show();
        }
        else {
            $('#deviceConfigFieldsetTriggerOtherBoard').hide();
        }
    });

    $('#checkOutputPlayAudio').on('change', (evt) => {
        var checked = $(evt.target).prop('checked');
        if (checked) {
            $('#deviceConfigFieldsetAudio').show();
        }
        else {
            $('#deviceConfigFieldsetAudio').hide();
        }
    });

}, false);

window.addEventListener('eg-config-load', e => {

    const config = e.detail;

    $('#checkInputMotionBlack').prop('checked', config.device.inputs.motionBlack);
    $('#checkInputBeam').prop('checked', config.device.inputs.beam);
    $('#checkInputHTTPRequests').prop('checked', config.device.inputs.http);
    $('#checkInputTally').prop('checked', config.device.inputs.tally.enabled);
    $('#checkInputAlwaysOn').prop('checked', config.device.inputs.alwaysOn);

    $('#radioInputTallyDisableSensor').prop('checked', config.device.inputs.tally.disableSensor);
    $('#radioInputTallyTandomSensor').prop('checked', config.device.inputs.tally.tandomSensor);

    $('#checkOutputRelay').prop('checked', config.device.outputs.relay);
    $('#checkOutputTriggerOtherBoard').prop('checked', config.device.outputs.triggerOtherBoard.enabled);
    $('#inputOutputIPAddressOfOtherBoardToTrigger').val(config.device.outputs.triggerOtherBoard.ip);

    $('#inputStartupMS').val(config.device.timings.startupMS);
    $('#inputTimeOnMS').val(config.device.timings.timeOnMS);
    $('#inputCooldownMS').val(config.device.timings.cooldownMS);
    $('#inputLoopCount').val(config.device.timings.loopCount);

    if (config.device.inputs.tally.enabled) {
        $('#deviceConfigFieldsetTally').show();
    }

    //set camera stuff
    $('#checkOutputTriggerCameraRecord').prop('checked', config.device.outputs.triggerCameraRecord.enabled);
    $('#outputTCRSeconds').val(config.device.outputs.triggerCameraRecord.seconds);
    $('#outputTCRMinutes').val(config.device.outputs.triggerCameraRecord.minutes);

    $('#outputTCRCamera').val(config.device.outputs.triggerCameraRecord.camera);
    $('#outputTCRServerIP').val(config.device.outputs.triggerCameraRecord.serverIP);

    if (config.device.outputs.triggerCameraRecord.enabled) {
        $('#deviceConfigFieldsetTriggerCameraRecord').show();
    }

    if (config.device.outputs.triggerOtherBoard.enabled) {
        $('#deviceConfigFieldsetTriggerOtherBoard').show();
    }

}, false);


window.addEventListener('eg-config-save', e => {

    var config = {
        inputs: {
            motionBlack: $('#checkInputMotionBlack').prop('checked'),
            beam: $('#checkInputBeam').prop('checked'),
            http: $('#checkInputHTTPRequests').prop('checked'),
            tally: {
                enabled: $('#checkInputTally').prop('checked'),
                disableSensor: $('#radioInputTallyDisableSensor').prop('checked'),
                tandomSensor: $('#radioInputTallyTandomSensor').prop('checked')
            },
            alwaysOn: $('#checkInputAlwaysOn').prop('checked')
        },

        outputs: {
            relay: $('#checkOutputRelay').prop('checked'), //not sure why you want to turn this off. Do we een add a option?
            triggerCameraRecord: {
                enabled: $('#checkOutputTriggerCameraRecord').prop('checked'),
                serverIP: $('#outputTCRServerIP').val(),
                camera: $('#outputTCRCamera').val(),
                seconds: parseIntOrDefault($('#outputTCRSeconds').val(), 0),
                minutes: parseIntOrDefault($('#outputTCRMinutes').val(), 0)
            },
            triggerOtherBoard: {
                enabled: $('#checkOutputTriggerOtherBoard').prop('checked'),
                ip: $('#outputTCBServerIP').val()
            },
            triggerAudio: {
                enabled: $('#checkOutputPlayAudio').prop('checked'),
                ambient: parseIntOrDefault($('#outputAudioAmbient').val(), -1),
                trigger: parseIntOrDefault($('#outputAudioTrigger').val(), -1)
            }
        },

        timings: {
            startupMS: parseIntOrDefault($('#inputStartupMS').val(), 0),
            timeOnMS: parseIntOrDefault($('#inputTimeOnMS').val(), 0),
            cooldownMS: parseIntOrDefault($('#inputCooldownMS').val(), 0),
            loopCount: parseIntOrDefault($('#inputLoopCount').val(), 0)
        },

        id: $('#devid').val()
    };

    e.detail.device = config;

}, false);
/*End Device JS File*/