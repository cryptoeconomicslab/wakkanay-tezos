import { Wallet, Balance } from '@cryptoeconomicslab/wallet'
import { Address, Bytes, BigNumber } from '@cryptoeconomicslab/primitives'
import { ed25519Verifier } from '@cryptoeconomicslab/signature'
import {
  ConseilServerInfo,
  KeyStore,
  TezosConseilClient,
  TezosMessageUtils
} from 'conseiljs'
import tweetnacl from 'tweetnacl'
import { ContractManager } from './helpers'

export class TzWallet implements Wallet {
  constructor(
    readonly keyStore: KeyStore,
    readonly tezosNodeEndpoint: string,
    readonly conseilServerInfo: ConseilServerInfo
  ) {}

  public getAddress(): Address {
    return Address.from(
      '0x' + TezosMessageUtils.writeAddress(this.keyStore.publicKeyHash)
    )
  }

  public async getL1Balance(): Promise<Balance> {
    // can't get an account if it has not participated in a transaction yet
    const account = await TezosConseilClient.getAccount(
      this.conseilServerInfo,
      this.conseilServerInfo.network,
      this.getAddress().raw
    )
    const balance = account[0] ? account[0].balance : 0
    return new Balance(new BigNumber(balance), 6, 'tz')
  }

  /**
   * signMessage signed a hex string message
   * @param message is hex string
   */
  public async signMessage(message: Bytes): Promise<Bytes> {
    const messageBuffer = Buffer.from(message.toHexString())
    const privateKeyBuffer = TezosMessageUtils.writeKeyWithHint(
      this.keyStore.privateKey,
      'edsk'
    )
    const signature = tweetnacl.sign.detached(messageBuffer, privateKeyBuffer)
    return Bytes.fromHexString(Buffer.from(signature).toString('hex'))
  }

  /**
   * verify signature
   * only support Ed25519 key (tz1)
   */
  public async verifyMySignature(
    message: Bytes,
    signature: Bytes
  ): Promise<boolean> {
    const publicKey = Bytes.fromString(this.keyStore.publicKey)
    return ed25519Verifier.verify(message, signature, publicKey)
  }

  /**
   * Get contract helper instance which connecting by this wallet
   */
  public getConnection(contractAddress: Address): ContractManager {
    const contractManager = new ContractManager(this, contractAddress)
    return contractManager
  }
}
