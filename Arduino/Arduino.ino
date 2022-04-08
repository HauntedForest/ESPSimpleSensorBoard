#include "Framework.h"
#include "Adafruit_GFX.h"
#include "Adafruit_SSD1306.h"
#include "AsyncHttpClient.h"
#include "SerialMP3Player.h"
#include "AsyncJson.h"

// OLED display width, in pixels
#define SCREEN_WIDTH 128
// OLED display height, in pixels
#define SCREEN_HEIGHT 32
// define SSD1306 OLED (-1 means none)
#define OLED_RESET -1

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

const int forceAccessPointPin = D5; // Connect to ground to force access point.
#define RELAY_PIN D6

// white 4 pin PIR sensor
#define PIR_WHITE_TRIGGER_PIN D1
#define BEAM_TRIGGER_PIN D7
// 3 pin PIR with board modification
#define PIR_BLACK_TRIGGER_PIN D0

String deviceName = "Default";

bool deviceInputsMotionWhite = false;
bool deviceInputsMotionBlack = false;
bool deviceInputsBeam = false;
bool deviceInputsHTTP = true;
bool deviceInputsTally = false;
bool deviceTallyDisableSensor = false;
bool deviceTallyTandomSensor = false;

bool deviceInputsAlwaysOn = false;

int deviceTimingsStartupMS = 0;
int deviceTimingsTimeOnMS = 100;
int deviceTimingsCooldownMS = 0;
int deviceTimingsLoopCount = 1;
bool deviceOutputsRelayEnabled = true;
bool deviceOutputsTriggerOtherBoardEnabled = false;
String deviceOutputsTriggerOtherBoardIP = "";

bool deviceOutputsTriggerCamera_enabled = false;
String deviceOutputsTriggerCamera_serverIP = "";
String deviceOutputsTriggerCamera_camera = "";
int deviceOutputsTriggerCamera_min = 0;
int deviceOutputsTriggerCamera_sec = 0;

bool deviceOutputsPlayAudio_enabled = false;
int deviceOutputsPlayAudio_ambient = -1;
int deviceOutputsPlayAudio_trigger = -1;

const String TALLY_PROGRAM = "program";
const String TALLY_PREVIEW = "preview";
const String TALLY_NONE = "none";
String currentTallyState = TALLY_NONE;

bool temp_tally_program = false;
bool temp_tally_preview = false;

// Was AP request at start.
bool startupRequestAP = false;

bool activate = false;

// send async http requests to other devices as a option output
AsyncHttpClient asyncHTTPClient;

// Audio
#define SOUND_FINISH_BOOTING 1
SerialMP3Player mp3;

void led_on_request(AsyncWebServerRequest *request)
{
	digitalWrite(RELAY_PIN, LOW);
	request->send(200, "text/plain", "Relay is ON!");
}

void led_off_request(AsyncWebServerRequest *request)
{
	digitalWrite(RELAY_PIN, HIGH);
	request->send(200, "text/plain", "Relay is OFF!");
}

void requestTally(AsyncWebServerRequest *request)
{
	// Serial.println("TALLY -> HIT!");
	if (!deviceInputsTally)
	{
		request->send(405, "text/plain", "Tally not Enabled");
		// Serial.println("TALLY -> Not enabled");
		return;
	}

	if (!request->hasParam("bus"))
	{
		request->send(400, "text/plain", "Missing 'state' paramater");
		// Serial.println("TALLY -> Missing state");
		return;
	}

	if (!request->hasParam("on"))
	{
		request->send(400, "text/plain", "Missing 'on' paramater");
		// Serial.println("TALLY -> Missing state");
		return;
	}

	AsyncWebParameter *bus = request->getParam("bus");
	AsyncWebParameter *onStr = request->getParam("on");
	bool on = false;

	if (onStr->value() == "true")
	{
		on = true;
	}
	else if (onStr->value() == "false")
	{
		on = false;
	}
	else
	{
		request->send(400, "text/plain", "Error: 'on' paramater must be 'true' or 'false'.");
	}

	if (bus->value() == TALLY_PROGRAM)
	{
		temp_tally_program = on;
	}
	else if (bus->value() == TALLY_PREVIEW)
	{
		temp_tally_preview = on;
	}
	else
	{
		request->send(400, "text/plain", "Error: 'state' paramater must be '" + TALLY_PREVIEW + "', '" + TALLY_PROGRAM + "'.");
		// Serial.println("TALLY -> Error: 'state' paramater must be");
		return;
	}

	// preview
	if (!temp_tally_program && temp_tally_preview)
	{
		currentTallyState = TALLY_PREVIEW;
	}
	// program
	else if (temp_tally_program && !temp_tally_preview)
	{
		currentTallyState = TALLY_PROGRAM;
	}
	// preview & program = program
	else if (temp_tally_preview && temp_tally_program)
	{
		currentTallyState = TALLY_PROGRAM;
	}
	// Not in a state
	else if (!temp_tally_preview && !temp_tally_program)
	{
		currentTallyState = TALLY_NONE;
	}

	// Serial.print("TALLY -> ");
	// Serial.println(currentTallyState);

	// Serial.println("TALLY -> Success");
	request->send(200, "text/plain", "Success");
}

void requestTrigger(AsyncWebServerRequest *request)
{

	// Serial.println("1");

	if (!deviceInputsHTTP)
	{
		// Serial.println("E 1");
		request->send(405, "text/plain", "HTTP requests not enabled");
		// Serial.println("E 2");
		return;
	}
	// Serial.println("2");
	if (deviceInputsTally && currentTallyState != TALLY_PROGRAM)
	{
		// Serial.println("E 3");
		request->send(405, "text/plain", "Tally is not live (change)");
		// Serial.println("E 4");
		return;
	}
	// Serial.println("3");
	activate = true;
	// Serial.println("4");
	AsyncWebServerResponse *response = request->beginResponse_P(200, "text/html", "Success");
	// Serial.println("5");
	response->addHeader("Connection", "Close");
	// Serial.println("6");
	request->send(response);
	// Serial.println("7");
}

void requestTestSound(AsyncWebServerRequest *request, JsonVariant &jsonRaw)
{
	// JsonObject &json = jsonRaw.as<JsonObject>();
	uint8_t soundId = jsonRaw["soundId"].as<uint8_t>();

	mp3.play(soundId);

	request->send(200, "application/json", "{success:true}");
}

void setup()
{
	pinMode(forceAccessPointPin, INPUT_PULLUP);
	pinMode(RELAY_PIN, OUTPUT);
	digitalWrite(RELAY_PIN, LOW);

	pinMode(PIR_WHITE_TRIGGER_PIN, INPUT_PULLUP);
	pinMode(PIR_BLACK_TRIGGER_PIN, INPUT);
	pinMode(BEAM_TRIGGER_PIN, INPUT_PULLUP);

	// Initialise OLED display.
	Wire.begin(4, 0);						   // set I2C pins [SDA = GPIO4 (D2), SCL = GPIO0 (D3)], default clock is 100kHz
	Wire.setClock(400000L);					   // set I2C clock to 400kHz
	display.begin(SSD1306_SWITCHCAPVCC, 0x3C); // initialize with the I2C addr 0x3C (for the 128x32)

	// disable screen wrapping
	display.setTextWrap(false);

	// Show initial message on the screen
	display.clearDisplay();
	display.setTextSize(2);				 // Big Text
	display.setTextColor(SSD1306_WHITE); // Draw white text
	display.setCursor(0, 0);			 // Start at top-left corner
	display.cp437(true);				 // Use full 256 char 'Code Page 437' font	display.display();
	display.println("Starting");
	display.display();

	// Check pin to force access point.
	startupRequestAP = (digitalRead(forceAccessPointPin) == LOW);
	AsyncWebServer *webServer = framework_setup(startupRequestAP);

	// Set up request handlers on the web interface.
	// See https://github.com/me-no-dev/ESPAsyncWebServer
	if (webServer)
	{
		webServer->on("/on", HTTP_GET, led_on_request);
		webServer->on("/off", HTTP_GET, led_off_request);
		webServer->on("/tally", HTTP_POST, requestTally);
		webServer->on("/trigger", HTTP_POST, requestTrigger);
		webServer->on("/trigger", HTTP_GET, requestTrigger);

		webServer->on("/test/trigger", HTTP_POST, requestTrigger);

		// webServer->on("/test/sound", HTTP_POST, requestTestSound);
		AsyncCallbackJsonWebHandler *handler = new AsyncCallbackJsonWebHandler("/test/sound", requestTestSound);
		webServer->addHandler(handler);
	}

	// Uses normal Serial
	mp3.begin(9600);
	delay(800); // wait for chip to turn on

	mp3.sendCommand(CMD_SEL_DEV, 0, 2); // select sd-card
	delay(800);							// wait for chip to select the SD card

	mp3.play(SOUND_FINISH_BOOTING);

	if (deviceOutputsPlayAudio_enabled && deviceOutputsPlayAudio_ambient > 0)
	{
		delay(1000);
		mp3.playSL(deviceOutputsPlayAudio_ambient);
	}
}

// Update the status on the OLED display.
// Called from the framework whenever the network status updates
// or every 2 seconds. Always called in a place it is safe.
void updateStatus(const connection_status_t &connectionStatus)
{
	display.clearDisplay();
	display.setTextSize(1);				 // Normal 1:1 pixel scale
	display.setTextColor(SSD1306_WHITE); // Draw white text
	display.setCursor(0, 0);			 // Start at top-left corner
	display.cp437(true);				 // Use full 256 char 'Code Page 437' font

	const char *statusText;
	switch (connectionStatus.status)
	{
	case CONNSTAT_NONE:
	default:
		statusText = "Disconnected";
		break;
	case CONNSTAT_CONNECTING:
		statusText = "Connecting";
		break;
	case CONNSTAT_CONNECTED:
		statusText = "Connected";
		break;
	case CONNSTAT_LOCALAP:
		statusText = "Local AP";
		break;
	}
	display.setTextColor(SSD1306_BLACK, SSD1306_WHITE); // Draw 'inverse' text
	display.print(deviceName);
	display.setTextColor(SSD1306_WHITE, SSD1306_BLACK); // Draw regular text
	display.print(" ");
	display.println(statusText);

	if (connectionStatus.status != CONNSTAT_NONE)
	{
		// display.print("SSID: ");
		display.println(connectionStatus.ssid);
	}

	if (connectionStatus.status == CONNSTAT_CONNECTED || connectionStatus.status == CONNSTAT_LOCALAP)
	{
		display.print("IP: ");
		display.println(connectionStatus.ourLocalIP);
	}

	if (deviceInputsTally)
	{
		display.print("Tally: ");
		display.println(currentTallyState);
	}

	if (connectionStatus.status == CONNSTAT_CONNECTED)
	{
		display.setCursor(114, 0);
		display.println(connectionStatus.signalStrength - 1); // 99 cap to not waste a character
	}

	display.display();
}

void saveState(const JsonObject &json)
{
	JsonObject device = json.createNestedObject("device");
	device["id"] = deviceName.c_str();
	device["inputs"]["motionWhite"] = deviceInputsMotionWhite;
	device["inputs"]["motionBlack"] = deviceInputsMotionBlack;
	device["inputs"]["beam"] = deviceInputsBeam;
	device["inputs"]["http"] = deviceInputsHTTP;
	device["inputs"]["tally"]["enabled"] = deviceInputsTally;
	device["inputs"]["tally"]["disableSensor"] = deviceTallyDisableSensor;
	device["inputs"]["tally"]["tandomSensor"] = deviceTallyTandomSensor;
	device["inputs"]["alwaysOn"] = deviceInputsAlwaysOn;

	device["timings"]["startupMS"] = deviceTimingsStartupMS;
	device["timings"]["timeOnMS"] = deviceTimingsTimeOnMS;
	device["timings"]["cooldownMS"] = deviceTimingsCooldownMS;
	device["timings"]["loopCount"] = deviceTimingsLoopCount;
	device["outputs"]["relay"] = deviceOutputsRelayEnabled;
	device["outputs"]["triggerOtherBoard"]["enabled"] = deviceOutputsTriggerOtherBoardEnabled;
	device["outputs"]["triggerOtherBoard"]["ip"] = deviceOutputsTriggerOtherBoardIP;

	device["outputs"]["triggerCameraRecord"]["enabled"] = deviceOutputsTriggerCamera_enabled;
	device["outputs"]["triggerCameraRecord"]["serverIP"] = deviceOutputsTriggerCamera_serverIP;
	device["outputs"]["triggerCameraRecord"]["camera"] = deviceOutputsTriggerCamera_camera;
	device["outputs"]["triggerCameraRecord"]["seconds"] = deviceOutputsTriggerCamera_sec;
	device["outputs"]["triggerCameraRecord"]["minutes"] = deviceOutputsTriggerCamera_min;

	device["outputs"]["triggerAudio"]["enabled"] = deviceOutputsPlayAudio_enabled;
	device["outputs"]["triggerAudio"]["ambient"] = deviceOutputsPlayAudio_ambient;
	device["outputs"]["triggerAudio"]["trigger"] = deviceOutputsPlayAudio_trigger;
}

void loadState(const JsonObject &json)
{
	if (json.containsKey("device"))
	{
		// const JsonObject device = json["device"].as<JsonObject>();
		deviceName = json["device"]["id"].as<String>();
		if (json["device"].containsKey("inputs"))
		{
			deviceInputsMotionWhite = json["device"]["inputs"]["motionWhite"].as<bool>();
			deviceInputsMotionBlack = json["device"]["inputs"]["motionBlack"].as<bool>();
			deviceInputsBeam = json["device"]["inputs"]["beam"].as<bool>();
			deviceInputsHTTP = json["device"]["inputs"]["http"].as<bool>();
			deviceInputsTally = json["device"]["inputs"]["tally"]["enabled"].as<bool>();
			deviceTallyDisableSensor = json["device"]["inputs"]["tally"]["disableSensor"].as<bool>();
			deviceTallyTandomSensor = json["device"]["inputs"]["tally"]["tandomSensor"].as<bool>();
			deviceInputsAlwaysOn = json["device"]["inputs"]["alwaysOn"].as<bool>();
		}

		if (json["device"].containsKey("outputs"))
		{
			deviceOutputsRelayEnabled = json["device"]["outputs"]["relay"].as<bool>();
			deviceOutputsTriggerOtherBoardEnabled = json["device"]["outputs"]["triggerOtherBoard"]["enabled"].as<bool>();
			deviceOutputsTriggerOtherBoardIP = json["device"]["outputs"]["triggerOtherBoard"]["ip"].as<String>();

			deviceOutputsTriggerCamera_enabled = json["device"]["outputs"]["triggerCameraRecord"]["enabled"].as<bool>();
			deviceOutputsTriggerCamera_serverIP = json["device"]["outputs"]["triggerCameraRecord"]["serverIP"].as<String>();
			deviceOutputsTriggerCamera_camera = json["device"]["outputs"]["triggerCameraRecord"]["camera"].as<String>();
			deviceOutputsTriggerCamera_sec = json["device"]["outputs"]["triggerCameraRecord"]["seconds"].as<int>();
			deviceOutputsTriggerCamera_min = json["device"]["outputs"]["triggerCameraRecord"]["minutes"].as<int>();

			deviceOutputsPlayAudio_enabled = json["device"]["outputs"]["triggerAudio"]["enabled"].as<bool>();
			deviceOutputsPlayAudio_ambient = json["device"]["outputs"]["triggerAudio"]["ambient"].as<int>();
			deviceOutputsPlayAudio_trigger = json["device"]["outputs"]["triggerAudio"]["trigger"].as<int>();
		}

		if (json["device"].containsKey("timings"))
		{
			deviceTimingsStartupMS = json["device"]["timings"]["startupMS"].as<int>();
			deviceTimingsTimeOnMS = json["device"]["timings"]["timeOnMS"].as<int>();
			deviceTimingsCooldownMS = json["device"]["timings"]["cooldownMS"].as<int>();
			deviceTimingsLoopCount = json["device"]["timings"]["loopCount"].as<int>();
		}
	}
}

void checkForTrigger()
{

	// if tally is disabled, or its enabled in tandom mode
	if (!deviceInputsTally || (deviceInputsTally && deviceTallyTandomSensor && currentTallyState == TALLY_PROGRAM))
	{
		if (deviceInputsBeam && digitalRead(BEAM_TRIGGER_PIN) == LOW)
		{
			activate = true;
		}

		if (deviceInputsMotionWhite && digitalRead(PIR_WHITE_TRIGGER_PIN) == LOW)
		{
			activate = true;
		}

		if (deviceInputsMotionBlack && digitalRead(PIR_BLACK_TRIGGER_PIN) == HIGH)
		{
			activate = true;
		}
	}

	if (deviceInputsAlwaysOn)
	{
		activate = true;
	}

	if (activate)
	{
		activate = false;

		// trigger camera record
		if (deviceOutputsTriggerCamera_enabled)
		{
			String temp = "http://";
			temp += deviceOutputsTriggerCamera_serverIP;
			temp += "/trigger";
			temp += "?location=" + deviceOutputsTriggerCamera_camera;
			temp += "&minutes=" + deviceOutputsTriggerCamera_min;
			temp += "&seconds=" + deviceOutputsTriggerCamera_sec;

			// POST http://IP:PORT/trigger?location=var1&minutes=var2&seconds=var3
			asyncHTTPClient.init("POST", temp.c_str());
			asyncHTTPClient.send(true);
		}

		delay(deviceTimingsStartupMS);

		if (deviceOutputsPlayAudio_enabled && deviceOutputsPlayAudio_trigger > 0)
		{
			mp3.play(deviceOutputsPlayAudio_trigger);
		}

		if (deviceOutputsTriggerOtherBoardEnabled)
		{
			// POST http://IP:80/trigger
			String temp = "http://";
			temp += deviceOutputsTriggerOtherBoardIP;
			temp += "/trigger";
			asyncHTTPClient.init("POST", temp.c_str());
			asyncHTTPClient.send(true);
		}

		for (int i = 0; i < deviceTimingsLoopCount; i++)
		{
			if (deviceOutputsRelayEnabled)
			{
				digitalWrite(RELAY_PIN, HIGH);
			}

			delay(deviceTimingsTimeOnMS);

			if (deviceOutputsRelayEnabled)
			{
				digitalWrite(RELAY_PIN, LOW);
				delay(deviceTimingsTimeOnMS);
			}
		}

		delay(deviceTimingsCooldownMS);

		if (!deviceInputsAlwaysOn && deviceOutputsPlayAudio_enabled && deviceOutputsPlayAudio_ambient > 0)
		{
			delay(1020);
			mp3.playSL(deviceOutputsPlayAudio_ambient);
		}
	}
}

void loop()
{
	// put your main code here, to run repeatedly:
	framework_loop();

	checkForTrigger();

	// If the AP switch is closed, but wasn't closed at startup, restart to
	// enter AP mode.
	if (!startupRequestAP && digitalRead(forceAccessPointPin) == LOW)
	{
		ESP.restart();
	}

	// If the AP switch is open, but was closed at startup, restart to exit
	// AP mode
	if (startupRequestAP && digitalRead(forceAccessPointPin) == HIGH)
	{
		ESP.restart();
	}
}