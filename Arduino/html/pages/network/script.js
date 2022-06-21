/*Home JS File*/
window.addEventListener('eg-setup', () => {



}, false);

window.addEventListener('eg-config-load', e => {

    const config = e.detail;

    $('#useWifi').prop('checked', config.network.useWifi);
    if (config.network.useWifi) {
        $('.useWifi').removeClass('hidden');
    } else {
        $('.useWifi').addClass('hidden');
    }
    $('#ssid').val(config.network.ssid);
    $('#password').val(config.network.passphrase);
    $('#hostname').val(config.network.hostname);
    $('#staTimeout').val(config.network.sta_timeout);
    $('#dhcp').prop('checked', config.network.dhcp);
    if (config.network.dhcp) {
        $('.dhcp').addClass('hidden');
    } else {
        $('.dhcp').removeClass('hidden');
    }
    $('#ap').prop('checked', config.network.ap_fallback);
    $('#ip').val(
        config.network.ip[0] + '.' + config.network.ip[1] + '.' + config.network.ip[2] + '.' + config.network.ip[3]
    );
    $('#netmask').val(
        config.network.netmask[0] +
        '.' +
        config.network.netmask[1] +
        '.' +
        config.network.netmask[2] +
        '.' +
        config.network.netmask[3]
    );
    $('#gateway').val(
        config.network.gateway[0] +
        '.' +
        config.network.gateway[1] +
        '.' +
        config.network.gateway[2] +
        '.' +
        config.network.gateway[3]
    );

}, false);


window.addEventListener('eg-config-save', e => {

    const config = {};

    e.detail.network = config;

}, false);
/*End Home JS File*/