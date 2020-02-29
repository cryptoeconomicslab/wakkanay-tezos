import { Wallet, WalletFactory } from '@cryptoeconomicslab/wallet'
import { TzWallet } from './TzWallet'
import {
  ConseilServerInfo,
  TezosMessageUtils,
  StoreType,
  KeyStore
} from 'conseiljs'
import tweetnacl from 'tweetnacl'

export class TzWalletFactory implements WalletFactory {
  static PRIVATE_KEY_LENGTH = 32

  // Default ServerInfo won't connect to network
  conseilServerInfo: ConseilServerInfo = {
    url: '',
    apiKey: '',
    network: ''
  }

  constructor(
    readonly tezosNodeEndpoint: string,
    conseilServerInfo?: ConseilServerInfo
  ) {
    if (conseilServerInfo) {
      this.conseilServerInfo = conseilServerInfo
    }
  }

  async fromPrivateKey(privateKey: string): Promise<Wallet> {
    const secretKey = TezosMessageUtils.writeKeyWithHint(privateKey, 'edsk')
    const keys = tweetnacl.sign.keyPair.fromSeed(
      secretKey.slice(0, TzWalletFactory.PRIVATE_KEY_LENGTH)
    )
    const publicKey = TezosMessageUtils.readKeyWithHint(keys.publicKey, 'edpk')
    const publicKeyHash = TezosMessageUtils.computeKeyHash(
      Buffer.from(keys.publicKey),
      'tz1'
    )
    const keyStore: KeyStore = {
      publicKey: publicKey,
      privateKey: privateKey,
      publicKeyHash: publicKeyHash,
      seed: '',
      storeType: StoreType.Mnemonic
    }
    return new TzWallet(
      keyStore,
      this.tezosNodeEndpoint,
      this.conseilServerInfo
    )
  }
}
