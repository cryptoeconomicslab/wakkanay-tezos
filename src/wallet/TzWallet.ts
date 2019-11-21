import { contract } from 'wakkanay'
import { IWallet } from 'wakkanay/dist/wallet/interfaces/IWallet'
import IDepositContract = contract.IDepositContract
import { DepositContract } from '../contract/DepositContract'
import { Address, Bytes } from 'wakkanay/dist/types/Codables'
import { Balance } from 'wakkanay/dist/types'
import { ed25519Verifier } from 'wakkanay/dist/verifiers'
import BigNumber from 'bignumber.js'
import {
  ConseilServerInfo,
  CryptoUtils,
  KeyStore,
  TezosConseilClient,
  TezosMessageUtils
} from 'conseiljs'
import { ContractHelper } from '../helpers'

export class TzWallet implements IWallet {
  constructor(
    readonly keyStore: KeyStore,
    readonly conseilServerInfo: ConseilServerInfo
  ) {}

  public getAddress(): Address {
    return Address.from(this.keyStore.publicKeyHash)
  }

  /**
   * TODO: support ERC20
   */
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
    const signatureBuffer = await CryptoUtils.signDetached(
      messageBuffer,
      privateKeyBuffer
    )
    return Bytes.fromHexString(signatureBuffer.toString('hex'))
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
   * TODO: add implementation
   */
  public getDepositContract(address: Address): IDepositContract {
    return new DepositContract()
  }

  /**
   * Get contract helper instance which connecting by this wallet
   */
  public getConnection(
    contractAddress: Address,
    storageLimit: number,
    gasLimit: number
  ): ContractHelper {
    const contractHelper = new ContractHelper(
      this,
      contractAddress,
      storageLimit,
      gasLimit
    )
    return contractHelper
  }
}