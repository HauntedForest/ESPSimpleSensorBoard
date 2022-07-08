/*Admin JS File*/
window.addEventListener('eg-setup', () => {



}, false);

window.addEventListener('eg-config-load', e => {

    const config = e.detail;

    $('#title').text('ESP - ' + config.admin.id);
    $('#name').text(config.admin.id);
    $('#devid').val(config.admin.id);

}, false);


window.addEventListener('eg-config-save', e => {

    const config = {
        id: $('#devid').val()
    };

    e.detail.admin = config;

}, false);
/*End Admin JS File*/ 