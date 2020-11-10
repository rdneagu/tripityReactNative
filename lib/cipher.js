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
      const key = await this.getEncryptionKey()
      if (!key) {
        const key = uuid_v4();
        await SecureStore.setItemAsync('deviceEncryption', key, secureStoreOptions);
        logger.success('TptyCipher.generateKey > Encryption key generated successfully!');
      }
      logger.success('TptyCipher.generateKey > Using existing encryption key!');
    } catch(err) {
      logger.debug('TptyCipher.generateKey >', err?.message || err);
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