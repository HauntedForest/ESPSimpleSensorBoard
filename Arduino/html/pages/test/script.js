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
/*End Test JS File*/