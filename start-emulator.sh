#!/bin/bash

# start-emulator.sh
# Starts the Android emulator (Quirkly_Emulator) with low-resource optimization flags.

# Path to the emulator binary (using the homebrew path as primary, fallback to 'emulator' on PATH)
EMULATOR_BIN="/opt/homebrew/share/android-commandlinetools/emulator/emulator"
if [ ! -f "$EMULATOR_BIN" ]; then
    EMULATOR_BIN="emulator"
fi

AVD_NAME="Quirkly_Emulator"

# Check if an emulator is already running
RUNNING_DEVICES=$(adb devices | grep emulator)
if [ ! -z "$RUNNING_DEVICES" ]; then
    echo "An emulator is already running under ADB. Skipping launch."
    exit 0
fi

echo "Launching AVD '$AVD_NAME' with stability flags..."
# Start emulator in the background with stability options:
# -no-snapshot & -no-snapshot-save: Prevents loading/saving corrupted snapshot files
# -gpu host: Forces GPU hardware acceleration (uses host graphics, avoids software rendering overhead)
# -memory 1536: Restricts RAM usage to 1.5GB
# -cores 2: Limits CPU cores to 2, preventing host CPU starvation
# -no-audio: Disables audio processing pipeline (saves CPU cycles)
# -no-boot-anim: Skips startup animation to reduce CPU load during boot
# -camera-back none -camera-front none: Disables camera sensors
"$EMULATOR_BIN" -avd "$AVD_NAME" \
    -no-snapshot \
    -no-snapshot-save \
    -gpu host \
    -memory 1536 \
    -cores 2 \
    -no-audio \
    -no-boot-anim \
    -camera-back none \
    -camera-front none > /dev/null 2>&1 &

echo "Waiting for emulator to boot..."
adb wait-for-device

# Wait until boot is completed
boot_completed=""
while [ "$boot_completed" != "1" ]; do
    boot_completed=$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')
    if [ "$boot_completed" != "1" ]; then
        sleep 2
    fi
done

echo "Emulator is fully booted and connected to ADB!"
