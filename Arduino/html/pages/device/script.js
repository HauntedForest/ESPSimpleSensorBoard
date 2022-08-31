/*Device File*/
window.addEventListener('eg-setup', () => {


    $('#checkOutputArtnet').on('change', (evt) => {
        var checked = $(evt.target).prop('checked');
        if (checked) {
            $('#deviceConfigFieldsetArtnet').show();
        }
        else {
            $('#deviceConfigFieldsetArtnet').hide();
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
    $('#checkInputAlwaysOn').prop('checked', config.device.inputs.alwaysOn);

    $('#inputStartupMS').val(config.device.timings.startupMS);
    $('#inputTimeOnMS').val(config.device.timings.timeOnMS);
    $('#inputCooldownMS').val(config.device.timings.cooldownMS);
    $('#inputLoopCount').val(config.device.timings.loopCount);

    //artnet jazz
    if (config.device.outputs.artnet.enabled) {
        $('#deviceConfigFieldsetArtnet').show();
    }
    $('#checkOutputArtnet').prop('checked', config.device.outputs.artnet.enabled);
    $('#inputArtnetUniverse').val(config.device.outputs.artnet.universe);
    $('#inputArtnetPhysical').val(config.device.outputs.artnet.physical);
    $('#inputArtnetIP').val(config.device.outputs.artnet.ip);

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
            alwaysOn: $('#checkInputAlwaysOn').prop('checked')
        },

        outputs: {
            artnet: {
                enabled: $('#checkOutputArtnet').prop('checked'),
                universe: parseIntOrDefault($('#inputArtnetUniverse').val(), 0),
                physical: parseIntOrDefault($('#inputArtnetPhysical').val(), 0),
                ip: $('#inputArtnetIP').val()
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