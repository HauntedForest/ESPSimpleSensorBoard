#include <Arduino.h>
#include "Framework.h"
#include "Adafruit_GFX.h"
#include "Adafruit_SSD1306.h"
#include "AsyncHttpClient.h"
#include "DYPlayerArduino.h"
#include "AsyncJson.h"
#include "ArtnetWifi.h"

// OLED display width, in pixels
#define SCREEN_WIDTH 128
// OLED display height, in pixels
#define SCREEN_HEIGHT 32
// define SSD1306 OLED (-1 means none)
#define OLED_RESET -1

Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

const int forceAccessPointPin = D5; // Connect to ground to force access point.
#define RELAY_PIN_1 D1
#define RELAY_PIN_2 D6
#define RELAY_PIN_3 D7
#define RELAY_PIN_4 D8

// beam sensor
#define BEAM_TRIGGER_PIN D4
// 3 pin PIR with board modification
#define PIR_BLACK_TRIGGER_PIN D0

String deviceName = "Default";

bool deviceInputsMotionBlack = false;
bool deviceInputsBeam = false;
bool deviceInputsHTTP = true;

bool deviceInputsAlwaysOn = false;

int deviceTimingsStartupMS = 0;
int deviceTimingsCooldownMS = 0;
int deviceTimingsLoopCount = 1;

bool deviceOutputsPlayAudio_enabled = false;
uint16_t deviceOutputsPlayAudio_ambient = -1;
uint16_t deviceOutputsPlayAudio_trigger = -1;
uint16_t deviceOutputsPlayAudio_volumeAmbient = 15; // 0-30. 15 = 50%
uint16_t deviceOutputsPlayAudio_volumeTrigger = 15; // 0-30. 15 = 50%
uint16_t deviceOutputsPlayAudio_eq = (int)DY::Eq::Normal;

// Was AP request at start.
bool startupRequestAP = false;

bool activate = false;

// send async http requests to other devices as a option output
AsyncHttpClient asyncHTTPClient;

// Audio
#define SOUND_FINISH_BOOTING 1

DY::Player mp3player(&Serial);

// Upload Sequence Jazz
byte *sequenceArray = NULL;
byte *sequenceFileName = NULL;
int sequenceEventMS = 0;
int sequenceVersionNumber = 0;
short sequenceNumberOfRows = 0;
short sequenceNumberOfColums = 0;
const char *SEQUENCE_FILE_NAME_SPIFFS = "sequence.bin";

// artnet
ArtnetWifi artnet;
bool deviceOutputsArtnet_enabled = false;
int deviceOutputsArtnet_universe = 0;
int deviceOutputsArtnet_physical = 0;
String deviceOutputsArtnet_ip = "192.168.1.255";

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

	// mp3.play(soundId);
	mp3player.setVolume(deviceOutputsPlayAudio_volumeTrigger);
	mp3player.setCycleMode(DY::PlayMode::OneOff);
	mp3player.playSpecified(soundId);

	request->send(200, "text/html", "Success");

	// go back to ambient if needed
	if (deviceOutputsPlayAudio_enabled && deviceOutputsPlayAudio_ambient > 0)
	{
		delay(1000);
		// mp3.playSL(deviceOutputsPlayAudio_ambient);
		mp3player.setCycleMode(DY::PlayMode::RepeatOne); // repeat current song over and over
		mp3player.playSpecified(deviceOutputsPlayAudio_ambient);
	}
}

void printHex(uint8_t number)
{
	Serial.print("0x");
	Serial.print(number < 16 ? "0" : "");
	Serial.print(number, HEX);
	Serial.print(" ");
}

void parseAndStoreInRamSequenceBinaryFile(uint8_t *data, size_t len)
{
	sequenceVersionNumber = data[0];

	// Old unused version
	/*
	if (sequenceVersionNumber == 1)
	{

		byte nameArrLength = data[1];
		sequenceFileName = (byte *)malloc(nameArrLength + 1); // 0 byte ending because C
		memcpy(sequenceFileName, data + 2, nameArrLength);
		sequenceFileName[nameArrLength] = 0;

		sequenceEventMS = data[2 + nameArrLength];

		short colLen = (short)(((data[3 + nameArrLength] & 0xff) << 8) | ((data[4 + nameArrLength] & 0xff)));
		byte rowLen = data[5 + nameArrLength];

		if (sequenceArray != NULL)
		{
			free(sequenceArray);
			sequenceArray = NULL;
		}

		sequenceArray = (byte *)malloc(colLen * rowLen);
		memcpy(sequenceArray, data + (6 + nameArrLength), colLen * rowLen);

		Serial.print("\nVersion Number: ");
		printHex(sequenceVersionNumber);

		Serial.print("\nFile Name: ");
		Serial.print(String((const char *)sequenceFileName));

		Serial.print("\nEvent MS: ");
		printHex(sequenceEventMS);

		Serial.print("\nCol Length: ");
		printHex(colLen);

		Serial.print("\nRow Length: ");
		printHex(rowLen);

		Serial.print("\nSequence:\n");
		for (uint8_t col = 0; col < colLen; col++)
		{
			for (uint8_t row = 0; row < rowLen; row++)
			{
				printHex(sequenceArray[row * colLen + col]);
			}

			Serial.println();
		}
		Serial.println();
	}
	else*/

	// Relay version that we don't support
	/*
	if (sequenceVersionNumber == 2)
	{

		byte nameArrLength = data[1];
		sequenceFileName = (byte *)malloc(nameArrLength + 1); // 0 byte ending because C
		memcpy(sequenceFileName, data + 2, nameArrLength);
		sequenceFileName[nameArrLength] = 0;

		sequenceEventMS = data[2 + nameArrLength];

		sequenceNumberOfColums = (short)(((data[3 + nameArrLength] & 0xff) << 8) | ((data[4 + nameArrLength] & 0xff)));

		if (sequenceArray != NULL)
		{
			free(sequenceArray);
			sequenceArray = NULL;
		}

		sequenceArray = (byte *)malloc(sequenceNumberOfColums);
		memcpy(sequenceArray, data + (5 + nameArrLength), sequenceNumberOfColums);

		Serial.print("\nVersion Number: ");
		printHex(sequenceVersionNumber);

		Serial.print("\nFile Name: ");
		Serial.print(String((const char *)sequenceFileName));

		Serial.print("\nEvent MS: ");
		printHex(sequenceEventMS);

		Serial.print("\nCol Length: ");
		printHex(sequenceNumberOfColums);

		// Serial.print("\nSequence:\n");
		// for (uint8_t col = 0; col < sequenceNumberOfColums; col++)
		// {
		// 	for (uint8_t row = 0; row < rowLen; row++)
		// 	{
		// 		printHex(sequenceArray[row * sequenceNumberOfColums + col]);
		// 	}

		// 	Serial.println();
		// }
		Serial.println();
	}

	*/
	if (sequenceVersionNumber == 3)
	{
		byte nameArrLength = data[1];
		sequenceFileName = (byte *)malloc(nameArrLength + 1); // 0 byte ending because C
		memcpy(sequenceFileName, data + 2, nameArrLength);
		sequenceFileName[nameArrLength] = 0;

		sequenceEventMS = data[2 + nameArrLength];

		sequenceNumberOfColums = (short)(((data[3 + nameArrLength] & 0xff) << 8) | ((data[4 + nameArrLength] & 0xff)));
		sequenceNumberOfRows = (short)(((data[5 + nameArrLength] & 0xff) << 8) | ((data[6 + nameArrLength] & 0xff)));

		if (sequenceArray != NULL)
		{
			free(sequenceArray);
			sequenceArray = NULL;
		}

		const int numOfBytes = sequenceNumberOfColums * sequenceNumberOfRows;
		sequenceArray = (byte *)malloc(numOfBytes);
		memcpy(sequenceArray, data + (7 + nameArrLength), numOfBytes);

		Serial.print("\nVersion Number: ");
		printHex(sequenceVersionNumber);

		Serial.print("\nFile Name: ");
		Serial.print(String((const char *)sequenceFileName));

		Serial.print("\nEvent MS: ");
		printHex(sequenceEventMS);

		Serial.print("\nRow Length: ");
		printHex(sequenceNumberOfRows);

		Serial.print("\nCol Length: ");
		printHex(sequenceNumberOfColums);

		// Serial.print("\nSequence:\n");
		// for (uint8_t col = 0; col < sequenceNumberOfColums; col++)
		// {
		// 	for (uint8_t row = 0; row < sequenceNumberOfRows; row++)
		// 	{
		// 		printHex(sequenceArray[row * sequenceNumberOfColums + col]);
		// 	}

		// 	Serial.println();
		// }
		Serial.println();
	}

	else
	{
		Serial.print("Unknown sequence version number: ");
		Serial.println(sequenceVersionNumber);
	}
}

void readSequenceFromSpiffs()
{
	// read the sequence file to the file system
	File file = SPIFFS.open(SEQUENCE_FILE_NAME_SPIFFS, "r");

	if (file)
	{
		size_t fileSize = file.size();
		byte *tempData = (byte *)malloc(fileSize);
		file.read(tempData, fileSize);
		parseAndStoreInRamSequenceBinaryFile(tempData, fileSize);
		free(tempData);
		file.close();
	}
}

void requestSequenceUpload(AsyncWebServerRequest *request, String filename, size_t index, uint8_t *data, size_t len, bool final)
{
	if (!index)
	{
		Serial.printf("Sequence Upload Start: %s\n", filename.c_str());
		request->_tempFile = SPIFFS.open(SEQUENCE_FILE_NAME_SPIFFS, "w");
	}

	if (len)
	{
		request->_tempFile.write(data, len);
	}

	if (final)
	{
		request->_tempFile.close();

		Serial.printf("\nSequence Upload End: %s, %u B\n", filename.c_str(), index + len);

		request->send(200, "text/html", "File upload success");

		readSequenceFromSpiffs();
	}
}

void setup()
{

	pinMode(forceAccessPointPin, INPUT_PULLUP);

	pinMode(RELAY_PIN_1, OUTPUT);
	digitalWrite(RELAY_PIN_1, LOW);

	pinMode(RELAY_PIN_2, OUTPUT);
	digitalWrite(RELAY_PIN_2, LOW);

	pinMode(RELAY_PIN_3, OUTPUT);
	digitalWrite(RELAY_PIN_3, LOW);

	pinMode(RELAY_PIN_4, OUTPUT);
	digitalWrite(RELAY_PIN_4, LOW);

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
		webServer->on("/trigger", HTTP_POST, requestTrigger);
		webServer->on("/trigger", HTTP_GET, requestTrigger);

		webServer->on("/test/trigger", HTTP_POST, requestTrigger);

		// webServer->on("/uploadSequence", HTTP_POST, requestSequenceUpload);
		webServer->on(
			"/uploadSequence", HTTP_POST, [](AsyncWebServerRequest *request) { /*request->send(200);*/ },
			requestSequenceUpload);

		// webServer->on("/test/sound", HTTP_POST, requestTestSound);
		AsyncCallbackJsonWebHandler *handler = new AsyncCallbackJsonWebHandler("/test/sound", requestTestSound);
		webServer->addHandler(handler);
	}

	readSequenceFromSpiffs();

	if (deviceOutputsArtnet_enabled)
	{
		artnet.begin(deviceOutputsArtnet_ip);
		artnet.setUniverse(deviceOutputsArtnet_universe);
		artnet.setPhysical(deviceOutputsArtnet_physical);
		artnet.setLength(512);
	}

	// Uses normal Serial
	// mp3.begin(9600);
	Serial.end();
	delay(300);
	mp3player.begin();
	delay(800);

	// Serial.begin(9600);

	//  mp3.sendCommand(CMD_SEL_DEV, 0, 2); // select sd-card
	delay(800); // wait for chip to select the SD card

	// mp3.play(SOUND_FINISH_BOOTING);
	mp3player.setEq(static_cast<DY::Eq>(deviceOutputsPlayAudio_eq));
	mp3player.setCycleMode(DY::PlayMode::OneOff);
	// set volume for boot sound to 50%
	mp3player.setVolume(15);
	mp3player.playSpecified(SOUND_FINISH_BOOTING);

	if (deviceOutputsPlayAudio_enabled && deviceOutputsPlayAudio_ambient > 0)
	{
		delay(1000);
		// mp3.playSL(deviceOutputsPlayAudio_ambient);
		mp3player.setVolume(deviceOutputsPlayAudio_volumeAmbient);
		mp3player.setCycleMode(DY::PlayMode::RepeatOne); // repeat current song over and over
		mp3player.playSpecified(deviceOutputsPlayAudio_ambient);
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

	// display.print("Seq: ");
	// display.println(sequenceFileName);

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
	device["inputs"]["motionBlack"] = deviceInputsMotionBlack;
	device["inputs"]["beam"] = deviceInputsBeam;
	device["inputs"]["http"] = deviceInputsHTTP;
	device["inputs"]["alwaysOn"] = deviceInputsAlwaysOn;

	device["timings"]["startupMS"] = deviceTimingsStartupMS;
	device["timings"]["cooldownMS"] = deviceTimingsCooldownMS;
	device["timings"]["loopCount"] = deviceTimingsLoopCount;

	device["outputs"]["artnet"]["enabled"] = deviceOutputsArtnet_enabled;
	device["outputs"]["artnet"]["universe"] = deviceOutputsArtnet_universe;
	device["outputs"]["artnet"]["physical"] = deviceOutputsArtnet_physical;
	device["outputs"]["artnet"]["ip"] = deviceOutputsArtnet_ip;

	device["outputs"]["triggerAudio"]["enabled"] = deviceOutputsPlayAudio_enabled;
	device["outputs"]["triggerAudio"]["ambient"] = deviceOutputsPlayAudio_ambient;
	device["outputs"]["triggerAudio"]["trigger"] = deviceOutputsPlayAudio_trigger;
	device["outputs"]["triggerAudio"]["volume"]["ambient"] = deviceOutputsPlayAudio_volumeAmbient;
	device["outputs"]["triggerAudio"]["volume"]["trigger"] = deviceOutputsPlayAudio_volumeTrigger;
	device["outputs"]["triggerAudio"]["eq"] = deviceOutputsPlayAudio_eq;

	JsonObject admin = json.createNestedObject("admin");
	admin["id"] = deviceName.c_str();
}

void loadState(const JsonObject &json)
{

	if (json.containsKey("admin"))
	{
		deviceName = json["admin"]["id"].as<String>();
	}

	if (json.containsKey("device"))
	{
		// const JsonObject device = json["device"].as<JsonObject>();

		if (json["device"].containsKey("inputs"))
		{
			deviceInputsMotionBlack = json["device"]["inputs"]["motionBlack"].as<bool>();
			deviceInputsBeam = json["device"]["inputs"]["beam"].as<bool>();
			deviceInputsHTTP = json["device"]["inputs"]["http"].as<bool>();
			deviceInputsAlwaysOn = json["device"]["inputs"]["alwaysOn"].as<bool>();
		}

		if (json["device"].containsKey("outputs"))
		{

			deviceOutputsArtnet_enabled = json["device"]["outputs"]["artnet"]["enabled"].as<bool>();
			deviceOutputsArtnet_universe = json["device"]["outputs"]["artnet"]["universe"].as<int>();
			deviceOutputsArtnet_physical = json["device"]["outputs"]["artnet"]["physical"].as<int>();
			deviceOutputsArtnet_ip = json["device"]["outputs"]["artnet"]["ip"].as<String>();

			deviceOutputsPlayAudio_enabled = json["device"]["outputs"]["triggerAudio"]["enabled"].as<bool>();
			deviceOutputsPlayAudio_ambient = json["device"]["outputs"]["triggerAudio"]["ambient"].as<uint16_t>();
			deviceOutputsPlayAudio_trigger = json["device"]["outputs"]["triggerAudio"]["trigger"].as<uint16_t>();
			deviceOutputsPlayAudio_volumeAmbient = json["device"]["outputs"]["triggerAudio"]["volume"]["ambient"].as<uint16_t>();
			deviceOutputsPlayAudio_volumeTrigger = json["device"]["outputs"]["triggerAudio"]["volume"]["trigger"].as<uint16_t>();
			deviceOutputsPlayAudio_eq = json["device"]["outputs"]["triggerAudio"]["eq"].as<uint16_t>();

			// Set the EQ
			mp3player.setEq(static_cast<DY::Eq>(deviceOutputsPlayAudio_eq));

			// Update the sound in real time IF we are playing a Ambient sound
			mp3player.setVolume(deviceOutputsPlayAudio_volumeAmbient);

			// IF we are playing a Ambient sound, restart playing that when we load. This way its in real time.
			if (!deviceInputsAlwaysOn && deviceOutputsPlayAudio_enabled && deviceOutputsPlayAudio_ambient > 0)
			{
				mp3player.setVolume(deviceOutputsPlayAudio_volumeAmbient);
				mp3player.setCycleMode(DY::PlayMode::RepeatOne); // repeat current song over and over
				mp3player.playSpecified(deviceOutputsPlayAudio_ambient);
			}

			// Kill the Ambient sound if its set to 0, but audio is enabled.
			else if (deviceOutputsPlayAudio_enabled && deviceOutputsPlayAudio_ambient == 0)
			{
				mp3player.stop();
			}
		}

		if (json["device"].containsKey("timings"))
		{
			deviceTimingsStartupMS = json["device"]["timings"]["startupMS"].as<int>();
			deviceTimingsCooldownMS = json["device"]["timings"]["cooldownMS"].as<int>();
			deviceTimingsLoopCount = json["device"]["timings"]["loopCount"].as<int>();
		}
	}
}

void checkForTrigger()
{

	if (deviceInputsBeam && digitalRead(BEAM_TRIGGER_PIN) == LOW)
	{
		activate = true;
	}

	if (deviceInputsMotionBlack && digitalRead(PIR_BLACK_TRIGGER_PIN) == HIGH)
	{
		activate = true;
	}

	if (deviceInputsAlwaysOn)
	{
		activate = true;
	}

	if (activate)
	{
		activate = false;

		delay(deviceTimingsStartupMS);

		if (deviceOutputsPlayAudio_enabled && deviceOutputsPlayAudio_trigger > 0)
		{
			// mp3.play(deviceOutputsPlayAudio_trigger);
			mp3player.setVolume(deviceOutputsPlayAudio_volumeTrigger);
			mp3player.setCycleMode(DY::PlayMode::OneOff); // play sound once
			mp3player.playSpecified(deviceOutputsPlayAudio_trigger);
		}

		for (int i = 0; i < deviceTimingsLoopCount; i++)
		{
			for (short col = 0; col < sequenceNumberOfColums; col++)
			{
				for (short row = 0; row < sequenceNumberOfRows; row++)
				{
					byte value = sequenceArray[col * sequenceNumberOfRows + row];

					if (deviceOutputsArtnet_enabled)
					{
						artnet.setByte(row, value);
					}
				}
				artnet.write();
				delay(sequenceEventMS);
			}
		}

		delay(deviceTimingsCooldownMS);

		if (!deviceInputsAlwaysOn && deviceOutputsPlayAudio_enabled && deviceOutputsPlayAudio_ambient > 0)
		{
			delay(1020);
			// mp3.playSL(deviceOutputsPlayAudio_ambient);
			mp3player.setVolume(deviceOutputsPlayAudio_volumeAmbient);
			mp3player.setCycleMode(DY::PlayMode::RepeatOne); // repeat current song over and over
			mp3player.playSpecified(deviceOutputsPlayAudio_ambient);
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