# Mawared Android — Build & Deploy Commands

## Prerequisites
- JAVA_HOME must point to Android Studio's bundled JBR
- Device must be connected via USB with USB Debugging enabled
- Gradle wrapper (8.11.1) must be present

## Build Debug APK
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"; .\gradlew.bat assembleDebug 2>&1
```

## Install APK on Device
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r "c:\Users\mohammad\Desktop\Mawared\android\app\build\outputs\apk\debug\app-debug.apk"
```

## Launch App on Device
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell am start -n "com.mawared.dawliah/.MainActivity"
```

## Full Build → Install → Launch (one-liner)
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"; .\gradlew.bat assembleDebug 2>&1; if ($LASTEXITCODE -eq 0) { & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" install -r ".\app\build\outputs\apk\debug\app-debug.apk"; & "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell am start -n "com.mawared.dawliah/.MainActivity" }
```

## Check Device Connected
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" devices
```

## Check App Running (PID)
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell pidof com.mawared.dawliah
```

## Check for Crashes
```powershell
& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" logcat -d -t 50 --pid=$(& "$env:LOCALAPPDATA\Android\Sdk\platform-tools\adb.exe" shell pidof com.mawared.dawliah) 2>&1 | Select-String -Pattern "FATAL|AndroidRuntime|Exception"
```

## Clean Build
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"; .\gradlew.bat clean assembleDebug 2>&1
```

## Project Info
- **Package**: `com.mawared.dawliah`
- **Min SDK**: 26 (Android 8.0)
- **Target SDK**: 35
- **AGP**: 8.7.3
- **Kotlin**: 2.0.21
- **Gradle**: 8.11.1
- **Compose BOM**: 2024.11.00
