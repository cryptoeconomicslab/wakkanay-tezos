import { Wallet, WalletFactory } from '@cryptoeconomicslab/wallet'
import { TzWallet } from './TzWallet'
import { ConseilServerInfo, TezosWalletUtil } from 'conseiljs'

export class TzWalletFactory implements WalletFactory {
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
    return new TzWallet(
      await TezosWalletUtil.restoreIdentityWithSecretKey(privateKey),
      this.tezosNodeEndpoint,
      this.conseilServerInfo
    )
  }
}
