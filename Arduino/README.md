# Temp instructions I need to redo at some point

## Building
```
C:\Users\eric\AppData\Local\Arduino15\packages\esp8266\tools\mkspiffs\2.5.0-4-b40a506\mkspiffs.exe -c data -p 256 -b 8192 -s 2076672 tmp/out.spiffs.bin
C:\Users\eric\AppData\Local\Arduino15\packages\esp8266\tools\python3\3.7.2-post1\python3.exe C:\Users\eric\AppData\Local\Arduino15\packages\esp8266\hardware\esp8266\2.6.3\tools\upload.py --chip esp8266 --port COM5 --baud 256000 write_flash 0x200000 tmp/out.spiffs.bin
```