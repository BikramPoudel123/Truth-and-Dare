# Android Emulator Setup Script for Windows
# Run this script in PowerShell as Administrator

Write-Host "Starting Android Emulator Setup..." -ForegroundColor Green

# Set Android home directory
$ANDROID_HOME = "C:\Android"
$cmdlineToolsPath = "$ANDROID_HOME\cmdline-tools"
$downloadPath = "$env:TEMP\android-tools.zip"

# Create directories
Write-Host "Creating directories..." -ForegroundColor Yellow
if (!(Test-Path $ANDROID_HOME)) {
    New-Item -ItemType Directory -Path $ANDROID_HOME -Force | Out-Null
}

# Download Android Command Line Tools
Write-Host "Downloading Android SDK Command Line Tools..." -ForegroundColor Yellow
$url = "https://dl.google.com/android/repository/commandlinetools-win-9477386_latest.zip"

try {
    Invoke-WebRequest -Uri $url -OutFile $downloadPath -UseBasicParsing
    Write-Host "Download complete!" -ForegroundColor Green
} catch {
    Write-Host "Download failed. Please download manually from:" -ForegroundColor Red
    Write-Host $url
    exit
}

# Extract
Write-Host "Extracting files..." -ForegroundColor Yellow
Expand-Archive -Path $downloadPath -DestinationPath $ANDROID_HOME -Force

# Rename cmdline-tools folder
if (Test-Path "$ANDROID_HOME\cmdline-tools") {
    Rename-Item -Path "$ANDROID_HOME\cmdline-tools" -NewName "cmdline-tools-old" -Force
}
Move-Item -Path "$ANDROID_HOME\cmdline-tools" -Destination "$ANDROID_HOME\cmdline-tools\latest" -Force

# Set environment variables
Write-Host "Setting environment variables..." -ForegroundColor Yellow
[Environment]::SetEnvironmentVariable("ANDROID_HOME", $ANDROID_HOME, "User")
$env:ANDROID_HOME = $ANDROID_HOME

# Add to PATH
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
if ($currentPath -notlike "*$ANDROID_HOME*") {
    $newPath = "$currentPath;$ANDROID_HOME\cmdline-tools\latest\bin;$ANDROID_HOME\emulator"
    [Environment]::SetEnvironmentVariable("PATH", $newPath, "User")
}

# Install SDK packages
Write-Host "Installing Android SDK packages..." -ForegroundColor Yellow
$sdkmanager = "$ANDROID_HOME\cmdline-tools\latest\bin\sdkmanager.bat"

# Accept licenses
Write-Host "Accepting licenses..." -ForegroundColor Yellow
echo "y" | & $sdkmanager --licenses

# Install required packages
Write-Host "Installing system image and emulator..." -ForegroundColor Yellow
& $sdkmanager "platforms;android-34" "system-images;android-34;google_apis;x86_64" "emulator"

# Create AVD
Write-Host "Creating Android Virtual Device..." -ForegroundColor Yellow
$avdmanager = "$ANDROID_HOME\cmdline-tools\latest\bin\avdmanager.bat"
& $avdmanager create avd -n "my_emulator" -k "system-images;android-34;google_apis;x86_64" -f

Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "You can now run: $env:ANDROID_HOME\emulator\emulator.exe -avd my_emulator" -ForegroundColor Cyan
