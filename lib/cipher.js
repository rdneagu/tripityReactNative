// Expo packages
import * as SecureStore from 'expo-secure-store';

// Community packages
import CryptoJS from 'react-native-crypto-js';
import { v4 as uuid_v4 } from 'uuid';

import logger from './log';

const secureStoreOptions = {
  keychainService: 'kTripityReactNative',
  keychainAccessible: SecureStore.ALWAYS_THIS_DEVICE_ONLY,
}

class TptyCipher {

  async generateKey() {
    try {
      if (await this.getEncryptionKey()) {
        throw 'Encryption key already exists!';
      }
      const key = uuid_v4();
      await SecureStore.setItemAsync('deviceEncryption', key, secureStoreOptions);
    } catch(e) {
      logger.debug('cipher.generateKey() ->', e);
    }
  }

  async getEncryptionKey() {
    const encryptionKey = await SecureStore.getItemAsync('deviceEncryption', secureStoreOptions);
    return encryptionKey;
  }

  encrypt(msg) {
    const cipher = CryptoJS.AES.encrypt(JSON.stringify(msg), 'keysecret').toString();
    return cipher;
  }

  decrypt(encryptedText) {
    const text = CryptoJS.AES.decrypt(encryptedText, 'keysecret').toString(CryptoJS.enc.Utf8);
    return text;
  }
}

export default new TptyCipher();