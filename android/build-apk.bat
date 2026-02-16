@echo off
set "JAVA_HOME=C:\Program Files\Microsoft\jdk-17.0.18.8-hotspot"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "ANDROID_HOME=C:\Users\ECORA\AppData\Local\Android\Sdk"
call "C:\Users\ECORA\Documents\GitHub\EcoraDocumentos\android\gradlew.bat" -p "C:\Users\ECORA\Documents\GitHub\EcoraDocumentos\android" clean assembleRelease --no-daemon
