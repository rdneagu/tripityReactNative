# Tripity powered by React Native

## How to install

Run `npm install` from the root folder

## How to run the development environment

#### Android
Run `npx react-native run-android` with an Android phone connected to the computer or an Android emulator configured.  

#### iOS
Either one of:
* Run it within Xcode using the "Play" button on the toolbar (more convenient)
* Run `npx react-native run-ios` with an iOS phone connected to the computer or an iOS emulator configured (Required MacOS)

## How to install an Android emulator

https://flutter.dev/docs/get-started/install/windows#android-setup

## How to install an iOS emulator

https://flutter.dev/docs/get-started/install/macos#ios-setup

## How to upgrade Expo SDK:

Upgrading can be done using `expo upgrade`. Please note that sometimes it may cause the project to break which requires a fresh installation.

## How to build an APK file to run on an Android device in production environment

In the root folder, run `cd android && gradlew assembleRelease && cd..`. For Linux users, replace `gradlew` with `./gradlew`.

The APK file can be found in this directory within the project folder: `android/app/build/outputs/apk/release`
