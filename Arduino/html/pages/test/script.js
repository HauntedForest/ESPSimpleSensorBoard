/*Test JS File*/
window.addEventListener('eg-setup', () => {



}, false);

window.addEventListener('eg-config-load', e => {

    const config = e.detail;

    $('#checkOutputPlayAudio').prop('checked', config.device.outputs.triggerAudio.enabled);
    $('#outputAudioAmbient').val(config.device.outputs.triggerAudio.ambient == -1 ? "" : config.device.outputs.triggerAudio.ambient);
    $('#outputAudioTrigger').val(config.device.outputs.triggerAudio.trigger == -1 ? "" : config.device.outputs.triggerAudio.trigger);

    if (config.device.outputs.triggerAudio.enabled) {
        $('#deviceConfigFieldsetAudio').show();
    }

}, false);


window.addEventListener('eg-config-save', e => {

    const config = {};

    e.detail.test = config;

}, false);


function test_playTestSound() {
    const sound = parseInt($("#soundId").val());
    if (isNaN(sound) || sound > 255 || sound < 1) {
        toastr.warning('Please enter a valid sound ID between 1-255', 'Error');
        return;
    }

    sendPostRequest('/test/sound',
        //data
        { soundId: sound },
        //success
        (responseText) => {
            toastr.success('Successfully sent a sound test request.', 'Success');
        },
        //fail
        (statusCode, statusMessage, responseText) => {
            toastr.error('Failed to send a sound test request: ' + responseText + ' Error code: ' + statusCode + ' - ' + statusMessage, 'Error');
        });

    console.log("SoundId", sound)
}

function test_sendTestTriggerRequest() {
    sendPostRequest('/test/trigger',
        null,
        //success
        (responseText) => {
            toastr.success('Successfully triggered the board', 'Success');
        },
        //fail
        (statusCode, statusMessage, responseText) => {
            toastr.error('Failed to trigger the board: ' + responseText + ' Error code: ' + statusCode + ' - ' + statusMessage, 'Error');
        });
}


/*End Test JS File*/