/*Device File*/
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

    document.getElementById("uploadSequence").addEventListener('submit', (e) => {
        console.log('CUSTOM METHOD')
        // Store reference to form to make later code easier to read
        const form = e.target;

        // Post data using the Fetch API
        fetch(form.action, {
            method: form.method,
            body: new FormData(form),
        }).then(response => {
            if (!response.ok) {
                throw new Error('Network response was not OK');
            }
            toastr.success('Successfully uploaded sequence', 'Success!');
        }).catch(error => {
            toastr.error('There has been a problem with your fetch operation: ' + error, 'Error submitting sequence');
            console.error('There has been a problem with your fetch operation:', error);
        });

        // Prevent the default form submit
        e.preventDefault();
    });

}, false);

window.addEventListener('eg-config-load', e => {

    const config = e.detail;
    console.log('Device: Config Load', config);

    $('#checkInputMotionBlack').prop('checked', config.device.inputs.motionBlack);
    $('#checkInputBeam').prop('checked', config.device.inputs.beam);
    $('#checkInputHTTPRequests').prop('checked', config.device.inputs.http);
    $('#checkInputTally').prop('checked', config.device.inputs.tally.enabled);
    $('#checkInputAlwaysOn').prop('checked', config.device.inputs.alwaysOn);

    $('#radioInputTallyDisableSensor').prop('checked', config.device.inputs.tally.disableSensor);
    $('#radioInputTallyTandomSensor').prop('checked', config.device.inputs.tally.tandomSensor);

    $('#checkOutputRelay').prop('checked', config.device.outputs.relay);
    $('#checkOutputTriggerOtherBoard').prop('checked', config.device.outputs.triggerOtherBoard.enabled);
    $('#outputTCBServerIP').val(config.device.outputs.triggerOtherBoard.ip);

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


    //set audio jazz
    if (config.device.outputs.triggerAudio.enabled) {
        $('#deviceConfigFieldsetAudio').show();
    }
    $('#checkOutputPlayAudio').prop('checked', config.device.outputs.triggerAudio.enabled);
    $('#outputAudioAmbient').val(config.device.outputs.triggerAudio.ambient);
    $('#outputAudioTrigger').val(config.device.outputs.triggerAudio.trigger);
    $('#outputAudioVolumeAmbient').val(config.device.outputs.triggerAudio.volume.ambient);
    $('#outputAudioVolumeAmbientDisplay').val(config.device.outputs.triggerAudio.volume.ambient); //need to set the display number
    $('#outputAudioVolumeTrigger').val(config.device.outputs.triggerAudio.volume.trigger);
    $('#outputAudioVolumeTriggerDisplay').val(config.device.outputs.triggerAudio.volume.trigger); //need to set the display number
    $('#outputAudioEQ').val(config.device.outputs.triggerAudio.eq);

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
                trigger: parseIntOrDefault($('#outputAudioTrigger').val(), -1),
                volume: {
                    ambient: parseIntOrDefault($('#outputAudioVolumeAmbient').val(), 15),
                    trigger: parseIntOrDefault($('#outputAudioVolumeTrigger').val(), 15)
                },
                eq: parseIntOrDefault($('#outputAudioEQ').val(), 0)
            }
        },

        timings: {
            startupMS: parseIntOrDefault($('#inputStartupMS').val(), 0),
            timeOnMS: parseIntOrDefault($('#inputTimeOnMS').val(), 0),
            cooldownMS: parseIntOrDefault($('#inputCooldownMS').val(), 0),
            loopCount: parseIntOrDefault($('#inputLoopCount').val(), 0)
        }
    };

    e.detail.device = config;

    console.log('Device: Config save Post', e.detail.device);

}, false);
/*End Device JS File*/