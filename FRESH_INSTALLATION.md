# How to perform a fresh installation of the project

This project requires Expo CLI and can be installed using `npm install -g expo-cli`

1. Create a fresh React Native using `expo init <project-name>` with the **Bare Workflow** option.
2. Copy all the source files from the previous project folder into the new project folder making sure to exclude the next files/folders:
   * `package.json`
   * `ios/`
   * `android/`
3. Install all packages used by the project and make the required permission configuration for iOS and Android.

`npm install --saveDev @babel/plugin-proposal-class-properties @babel/plugin-proposal-decorators @babel/plugin-transform-flow-strip-types`  
**This command will install all the development packages**

`expo install @react-native-community/async-storage @react-native-community/datetimepicker @react-native-community/masked-view @react-native-mapbox-gl/maps @react-navigation/bottom-tabs @react-navigation/native @react-navigation/stack aws-sdk axios react-native-crypto-js expo-asset expo-constants expo-document-picker expo-font expo-linear-gradient expo-permissions expo-secure-store expo-task-manager lodash mobx mobx-react react-native-modal react-native-safe-area-context react-native-text-ticker realm uuid@^3.4.0 mobx@^5.15.5 mobx-react@^6.2.5 react-native-indicators`  
**This command will install the majority of the runtime packages that do not required any special configuration for neither iOS nor Android**

## Install and configure `expo-location`
`expo install expo-location`

#### Configure for iOS
Add `NSLocationAlwaysAndWhenInUseUsageDescription`, `NSLocationAlwaysUsageDescription` and `NSLocationWhenInUseUsageDescription` keys to your Info.plist:

```
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to use your location</string>
<key>NSLocationAlwaysUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to use your location</string>
<key>NSLocationWhenInUseUsageDescription</key>
<string>Allow $(PRODUCT_NAME) to use your location</string>
Run npx pod-install after installing the npm package.
```

#### Configure for Android
This module requires the permissions for approximate and exact device location. It also needs the foreground service permission to subscribe to location updates, while the app is in use. These permissions are automatically added.

```
<!-- Added permissions -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
```

## Install and configure ` expo-media-library`
`expo install expo-media-library`

#### Configure for iOS
Add `NSPhotoLibraryUsageDescription` key to your Info.plist:

```
<key>NSPhotoLibraryUsageDescription</key>
<string>Give $(PRODUCT_NAME) permission to save photos</string>
Run npx pod-install after installing the npm package.
```

#### Configure for Android
This package automatically adds the `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE` permissions. They are used when accessing the user's images or videos.

```
<!-- Added permissions -->
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
```
