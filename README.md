# Tripity powered by React Native

## Installing and running Tripity

### Installation instructions

Run `npm install` from the root folder

### Running in development environment

#### Android
Run `npx react-native run-android` with an Android phone connected to the computer or an Android emulator configured.  

#### iOS
Either one of:
* Run it within Xcode using the "Play" button on the toolbar (more convenient)
* Run `npx react-native run-ios` with an iOS phone connected to the computer or an iOS emulator configured (Required MacOS)

### Instructions on how to install the Android emulator

https://flutter.dev/docs/get-started/install/windows#android-setup

### Instructions on how to install the iOS emulator

https://flutter.dev/docs/get-started/install/macos#ios-setup

### Upgrading project's Expo SDK

Upgrading can be done using `expo upgrade`. Please note that sometimes it may cause the project to break which requires a [fresh installation](./FRESH_INSTALLATION.md).

### Build and test a compiled .apk file on your device in production environment

In the root folder, run `cd android && gradlew assembleRelease && cd..`. For Linux users, replace `gradlew` with `./gradlew`.

The APK file can be found in this directory within the project folder: `android/app/build/outputs/apk/release`

# Server connection

### Connecting to a local version of the Tripity server

The `SERVER_ENV` variable in the `.env` file supports two options:
* `dev` - Client will connect to a local version of the server (`localhost`)
* `prod` - Client will connnect to a remote version of the server. To change the remote address, open the file [aws.js](./lib/aws.js) and change the IP address on line 6 to match with the remote IP address of your AWS server.
