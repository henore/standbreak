@echo off
set "JAVA_HOME=C:\Program Files\Android\Android Studio\jbr"
set "ANDROID_HOME=C:\Users\henor\AppData\Local\Android\Sdk"
set "PATH=%JAVA_HOME%\bin;%ANDROID_HOME%\platform-tools;%PATH%"

set "DST=C:\dev_fast"

rem Resolve source path without trailing backslash
pushd "%~dp0.."
set "SRC=%CD%"
popd

rem Remove old junction or directory
2>nul rmdir "%DST%"
if exist "%DST%" rmdir /s /q "%DST%"

echo Copying %SRC% to %DST% (excluding build caches)...
robocopy "%SRC%" "%DST%" /mir /xd .gradle .cxx build /njh /njs /ndl /nc /ns

cd /d "%DST%\android"
echo Building from: %CD%
call gradlew.bat bundleRelease

echo.
echo AAB: %DST%\android\app\build\outputs\bundle\release\app-release.aab
pause
