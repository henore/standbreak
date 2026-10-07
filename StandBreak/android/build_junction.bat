@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=C:\Users\henor\AppData\Local\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"
cd /d "C:\dev\SB\android"
call gradlew.bat clean assembleDebug
if %ERRORLEVEL% EQU 0 (
    echo.
    echo === BUILD SUCCESS ===
    echo APK: C:\dev\SB\android\app\build\outputs\apk\debug\app-debug.apk
    echo.
    echo Installing to device...
    "%ANDROID_HOME%\platform-tools\adb.exe" install -r app\build\outputs\apk\debug\app-debug.apk
) else (
    echo.
    echo === BUILD FAILED ===
)
