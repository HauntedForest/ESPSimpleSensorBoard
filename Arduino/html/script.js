var mode = 'null';
var wsQueue = [];
var wsBusy = false;
var wsTimerId;

// Default modal properties
$.fn.modal.Constructor.DEFAULTS.backdrop = 'static';
$.fn.modal.Constructor.DEFAULTS.keyboard = false;

toastr.options = {
	closeButton: true,
	debug: false,
	newestOnTop: false,
	progressBar: true,
	positionClass: 'toast-top-right',
	preventDuplicates: false,
	onclick: null,
	showDuration: '300',
	hideDuration: '1000',
	timeOut: '5000',
	extendedTimeOut: '1000',
	showEasing: 'swing',
	hideEasing: 'linear',
	showMethod: 'fadeIn',
	hideMethod: 'fadeOut'
};

// jQuery doc ready
$(function() {
	// Menu navigation for single page layout
	$('ul.navbar-nav li a').click(function() {
		// Highlight proper navbar item
		$('.nav li').removeClass('active');
		$(this).parent().addClass('active');

		// Show the proper menu div
		$('.mdiv').addClass('hidden');
		$($(this).attr('href')).removeClass('hidden');

		// Collapse the menu on smaller screens
		$('#navbar').removeClass('in').attr('aria-expanded', 'false');
		$('.navbar-toggle').attr('aria-expanded', 'false');

		// Firmware selection and upload
		$('#efu').change(function() {
			$('#updatefw').submit();
			$('#update').modal();
		});

		// Set page event feeds
		feed();
	});

	// Wifi field toggles.
	$('#useWifi').click(function() {
		if ($(this).is(':checked')) {
			$('.useWifi').removeClass('hidden');
		} else {
			$('.useWifi').addClass('hidden');
		}
	});

	// DHCP field toggles
	$('#dhcp').click(function() {
		if ($(this).is(':checked')) {
			$('.dhcp').addClass('hidden');
		} else {
			$('.dhcp').removeClass('hidden');
		}
	});

	// Hostname, SSID, and Password validation
	$('#useWifi').change(function() {
		wifiValidation();
	});
	$('#hostname').keyup(function() {
		wifiValidation();
	});
	$('#staTimeout').keyup(function() {
		wifiValidation();
	});
	$('#ssid').keyup(function() {
		wifiValidation();
	});
	$('#password').keyup(function() {
		wifiValidation();
	});
	$('#ap').change(function() {
		wifiValidation();
	});
	$('#dhcp').change(function() {
		wifiValidation();
	});
	$('#gateway').keyup(function() {
		wifiValidation();
	});
	$('#ip').keyup(function() {
		wifiValidation();
	});
	$('#netmask').keyup(function() {
		wifiValidation();
	});

	// autoload tab based on URL hash
	var hash = window.location.hash;
	hash && $('ul.navbar-nav li a[href="' + hash + '"]').click();

	//device setup
	$('#checkInputTally').on('change', (evt) => {
		var checked = $(evt.target).prop('checked');
		if (checked) {
			$('#deviceConfigFieldsetTally').show();
			$('#checkInputHTTPRequests').prop('checked', true);
		} else {
			$('#deviceConfigFieldsetTally').hide();
		}
	});

	$('#checkInputMotionWhite').on('change', (evt) => {
		var checked = $('#checkInputMotionBlack').prop('checked');
		if (checked) {
			$('#checkInputMotionBlack').prop('checked', false);
		}
	});

	$('#checkInputMotionBlack').on('change', (evt) => {
		var checked = $('#checkInputMotionWhite').prop('checked');
		if (checked) {
			$('#checkInputMotionWhite').prop('checked', false);
		}
	});

	$('#checkOutputTriggerOtherBoard').on('change', (evt) => {
		var checked = $(evt.target).prop('checked');
		console.log(checked);
		if (checked) {
			$('#inputOutputIPAddressOfOtherBoardToTrigger').show();
			$('#inputOutputIPAddressOfOtherBoardToTriggerLabel').show();
		} else {
			$('#inputOutputIPAddressOfOtherBoardToTrigger').hide();
			$('#inputOutputIPAddressOfOtherBoardToTriggerLabel').hide();
		}
	});
});

function wifiValidation() {
	var WifiSaveDisabled = false;
	if ($('#useWifi').prop('checked') === true) {
		var re = /^([a-zA-Z0-9][a-zA-Z0-9][a-zA-Z0-9\-.]*[a-zA-Z0-9.])$/;
		if (re.test($('#hostname').val()) && $('#hostname').val().length <= 255) {
			$('#fg_hostname').removeClass('has-error');
			$('#fg_hostname').addClass('has-success');
		} else {
			$('#fg_hostname').removeClass('has-success');
			$('#fg_hostname').addClass('has-error');
			WifiSaveDisabled = true;
		}
		if ($('#staTimeout').val() >= 5) {
			$('#fg_staTimeout').removeClass('has-error');
			$('#fg_staTimeout').addClass('has-success');
		} else {
			$('#fg_staTimeout').removeClass('has-success');
			$('#fg_staTimeout').addClass('has-error');
			WifiSaveDisabled = true;
		}
		if ($('#ssid').val().length <= 32) {
			$('#fg_ssid').removeClass('has-error');
			$('#fg_ssid').addClass('has-success');
		} else {
			$('#fg_ssid').removeClass('has-success');
			$('#fg_ssid').addClass('has-error');
			WifiSaveDisabled = true;
		}
		if ($('#password').val().length <= 64) {
			$('#fg_password').removeClass('has-error');
			$('#fg_password').addClass('has-success');
		} else {
			$('#fg_password').removeClass('has-success');
			$('#fg_password').addClass('has-error');
			WifiSaveDisabled = true;
		}
		if ($('#dhcp').prop('checked') === false) {
			var iptest = new RegExp(
				'' +
					/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\./.source +
					/(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\./.source +
					/(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\./.source +
					/(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.source
			);

			if (iptest.test($('#ip').val())) {
				$('#fg_ip').removeClass('has-error');
				$('#fg_ip').addClass('has-success');
			} else {
				$('#fg_ip').removeClass('has-success');
				$('#fg_ip').addClass('has-error');
				WifiSaveDisabled = true;
			}
			if (iptest.test($('#netmask').val())) {
				$('#fg_netmask').removeClass('has-error');
				$('#fg_netmask').addClass('has-success');
			} else {
				$('#fg_netmask').removeClass('has-success');
				$('#fg_netmask').addClass('has-error');
				WifiSaveDisabled = true;
			}
			if (iptest.test($('#gateway').val())) {
				$('#fg_gateway').removeClass('has-error');
				$('#fg_gateway').addClass('has-success');
			} else {
				$('#fg_gateway').removeClass('has-success');
				$('#fg_gateway').addClass('has-error');
				WifiSaveDisabled = true;
			}
		}
	}

	$('#btn_wifi').prop('disabled', WifiSaveDisabled);
}

// Page event feeds
function feed() {
	if ($('#home').is(':visible')) {
		wsEnqueue('XJ');

		setTimeout(function() {
			feed();
		}, 1000);
	}
}

function param(name) {
	return (location.search.split(name + '=')[1] || '').split('&')[0];
}

// WebSockets
function wsConnect() {
	if ('WebSocket' in window) {
		// accept ?target=10.0.0.123 to make a WS connection to another device
		if ((target = param('target'))) {
			//
		} else {
			target = document.location.host;
		}

		// Open a new web socket and set the binary type
		ws = new WebSocket('ws://' + target + '/ws');
		ws.binaryType = 'arraybuffer';

		ws.onopen = function() {
			$('#wserror').modal('hide');
			wsEnqueue('E1'); // Get html elements
			wsEnqueue('G1'); // Get Config
			wsEnqueue('G2'); // Get Net Status

			feed();
		};

		ws.onmessage = function(event) {
			if (typeof event.data === 'string') {
				var cmd = event.data.substr(0, 2);
				var data = event.data.substr(2);
				switch (cmd) {
					case 'G1':
						getConfig(data);
						break;
					case 'G2':
						getConfigStatus(data);
						break;
					case 'S1':
						setConfig(data);
						reboot();
						break;
					case 'S2':
						setConfig(data);
						break;
					case 'XJ':
						getJsonStatus(data);
						break;
					case 'X6':
						showReboot();
						break;
					default:
						console.log('Unknown Command: ' + event.data);
						break;
				}
			} else {
				streamData = new Uint8Array(event.data);
				drawStream(streamData);
				if ($('#diag').is(':visible')) wsEnqueue('V1');
			}
			wsReadyToSend();
		};

		ws.onclose = function() {
			$('#wserror').modal();
			wsConnect();
		};
	} else {
		alert('WebSockets is NOT supported by your Browser! You will need to upgrade your browser.');
	}
}

function wsEnqueue(message) {
	//only add a message to the queue if there isn't already one of the same type already queued, otherwise update the message with the latest request.
	wsQueueIndex = wsQueue.findIndex(wsCheckQueue, message);
	if (wsQueueIndex == -1) {
		//add message
		wsQueue.push(message);
	} else {
		//update message
		wsQueue[wsQueueIndex] = message;
	}
	wsProcessQueue();
}

function wsCheckQueue(value) {
	//messages are of the same type if the first two characters match
	return value.substr(0, 2) == this.substr(0, 2);
}

function wsProcessQueue() {
	//check if currently waiting for a response
	if (wsBusy) {
		//console.log('WS queue busy : ' + wsQueue);
	} else {
		//set wsBusy flag that we are waiting for a response
		wsBusy = true;
		//get next message from queue.
		message = wsQueue.shift();
		//set timeout to clear flag and try next message if response isn't recieved. Short timeout for message types that don't generate a response.
		if ([ 'X6' ].indexOf(message.substr(0, 2))) {
			timeout = 40;
		} else {
			timeout = 2000;
		}
		wsTimerId = setTimeout(wsReadyToSend, timeout);
		//send it.
		//console.log('WS sending ' + message);
		ws.send(message);
	}
}

function wsReadyToSend() {
	clearTimeout(wsTimerId);
	wsBusy = false;
	if (wsQueue.length > 0) {
		//send next message
		wsProcessQueue();
	} else {
		//console.log('WS queue empty');
	}
}

function getConfig(data) {
	var config = JSON.parse(data);
	// devices
	$('#title').text('ESP - ' + config.device.id);
	$('#name').text(config.device.id);
	$('#devid').val(config.device.id);

	$('#checkInputMotionWhite').prop('checked', config.device.inputs.motionWhite);
	$('#checkInputMotionBlack').prop('checked', config.device.inputs.motionBlack);
	$('#checkInputBeam').prop('checked', config.device.inputs.beam);
	$('#checkInputHTTPRequests').prop('checked', config.device.inputs.http);
	$('#checkInputTally').prop('checked', config.device.inputs.tally.enabled);

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

	if (config.device.outputs.triggerOtherBoard.enabled) {
		$('inputOutputIPAddressOfOtherBoardToTrigger').show();
		$('inputOutputIPAddressOfOtherBoardToTriggerLabel').show();
	}

	//network
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
}

function getConfigStatus(data) {
	var status = JSON.parse(data);

	$('#x_ssid').text(status.ssid);
	$('#x_hostname').text(status.hostname);
	$('#x_ip').text(status.ip);
	$('#x_mac').text(status.mac);
	$('#x_version').text(status.version);
	$('#x_built').text(status.built);
	$('#x_flashchipid').text(status.flashchipid);
	$('#x_usedflashsize').text(status.usedflashsize);
	$('#x_realflashsize').text(status.realflashsize);
	$('#x_freeheap').text(status.freeheap);
}

function getJsonStatus(data) {
	var status = JSON.parse(data);

	var rssi = +status.system.rssi;
	var quality = 2 * (rssi + 100);

	if (rssi <= -100) quality = 0;
	else if (rssi >= -50) quality = 100;

	$('#x_rssi').text(rssi);
	$('#x_quality').text(quality);

	// getHeap(data)
	$('#x_freeheap').text(status.system.freeheap);

	// getUptime
	var date = new Date(+status.system.uptime);
	var str = '';

	str += Math.floor(date.getTime() / 86400000) + ' days, ';
	str += ('0' + date.getUTCHours()).slice(-2) + ':';
	str += ('0' + date.getUTCMinutes()).slice(-2) + ':';
	str += ('0' + date.getUTCSeconds()).slice(-2);
	$('#x_uptime').text(str);
}

function setConfig() {
	// Get config to refresh UI and show result
	wsEnqueue('G1');
}

function submitWiFi() {
	var ip = $('#ip').val().split('.');
	var netmask = $('#netmask').val().split('.');
	var gateway = $('#gateway').val().split('.');

	var json = {
		network: {
			useWifi: $('#useWifi').prop('checked'),
			ssid: $('#ssid').val(),
			passphrase: $('#password').val(),
			hostname: $('#hostname').val(),
			sta_timeout: parseInt($('#staTimeout').val()),
			ip: [ parseInt(ip[0]), parseInt(ip[1]), parseInt(ip[2]), parseInt(ip[3]) ],
			netmask: [ parseInt(netmask[0]), parseInt(netmask[1]), parseInt(netmask[2]), parseInt(netmask[3]) ],
			gateway: [ parseInt(gateway[0]), parseInt(gateway[1]), parseInt(gateway[2]), parseInt(gateway[3]) ],
			dhcp: $('#dhcp').prop('checked'),
			ap_fallback: $('#ap').prop('checked')
		}
	};
	wsEnqueue('S1' + JSON.stringify(json));
	toastr.success('Config saved!');
}

function submitConfig() {
	var json = {
		device: {
			inputs: {
				motionWhite: $('#checkInputMotionWhite').prop('checked'),
				motionBlack: $('#checkInputMotionBlack').prop('checked'),
				beam: $('#checkInputBeam').prop('checked'),
				http: $('#checkInputHTTPRequests').prop('checked'),
				tally: {
					enabled: $('#checkInputTally').prop('checked'),
					disableSensor: $('#radioInputTallyDisableSensor').prop('checked'),
					tandomSensor: $('#radioInputTallyTandomSensor').prop('checked')
				}
			},

			outputs: {
				relay: $('#checkOutputRelay').prop('checked'), //not sure why you want to turn this off. Do we een add a option?
				triggerOtherBoard: {
					enabled: $('#checkOutputTriggerOtherBoard').prop('checked'),
					ip: $('#inputOutputIPAddressOfOtherBoardToTrigger').val()
				}
			},

			timings: {
				startupMS: parseInt($('#inputStartupMS').val()),
				timeOnMS: parseInt($('#inputTimeOnMS').val()),
				cooldownMS: parseInt($('#inputCooldownMS').val()),
				loopCount: parseInt($('#inputLoopCount').val())
			},

			id: $('#devid').val()
		}
	};

	wsEnqueue('S2' + JSON.stringify(json));
	console.log(json);
	toastr.success('Config saved!');
}

function showReboot() {
	$('#update').modal('hide');
	$('#reboot').modal();
	setTimeout(function() {
		if ($('#dhcp').prop('checked')) {
			window.location.assign('/');
		} else {
			window.location.assign('http://' + $('#ip').val());
		}
	}, 5000);
}

function reboot() {
	showReboot();
	wsEnqueue('X6');
}

function getKeyByValue(obj, value) {
	return Object.keys(obj)[Object.values(obj).indexOf(value)];
}

function inputOnlyNumbersCheck(element) {
	element.value = element.value.replace(/[^0-9]/g, '').replace(/(\..*?)\..*/g, '$1');
}
