import { Address } from '@cryptoeconomicslab/primitives'
import {
  OperationKindType,
  OperationResult,
  TezosConseilClient,
  TezosNodeWriter,
  TezosParameterFormat,
  TezosMessageUtils
} from 'conseiljs'
import { TzWallet } from '../'

// TODO: research default limits per operation
export const DefaultTransactionStorageLimit = 15000
export const DefaultTransactionGasLimit = 400000

export class ContractManager {
  constructor(readonly tzWallet: TzWallet, readonly contractAddress: Address) {}

  /**
   * get optimal fee
   */
  public async estimateFee(
    operationKindType: OperationKindType = OperationKindType.Transaction
  ): Promise<number> {
    const result = await TezosConseilClient.getFeeStatistics(
      this.tzWallet.conseilServerInfo,
      this.tzWallet.conseilServerInfo.network,
      operationKindType
    )

    return result[0].medium
  }

  /**
   * invoke contract
   */
  public async invokeContract(
    amount: number,
    entrypoint: string,
    params: string,
    storageLimit: number = DefaultTransactionStorageLimit,
    gasLimit: number = DefaultTransactionGasLimit,
    parameterFormat: TezosParameterFormat = TezosParameterFormat.Micheline
  ): Promise<OperationResult> {
    // BIP44 Derivation Path if signed with hardware, empty if signed with software
    const derivationPath = ''

    const fee: number = (await this.estimateFee()) + 2000
    console.log(
      'to:',
      TezosMessageUtils.readAddress(this.contractAddress.data.substr(2))
    )
    console.log('fee:', fee)
    console.log('params:', params)
    const result = await TezosNodeWriter.sendContractInvocationOperation(
      this.tzWallet.tezosNodeEndpoint,
      this.tzWallet.keyStore,
      TezosMessageUtils.readAddress(this.contractAddress.data.substr(2)),
      amount,
      fee,
      derivationPath,
      storageLimit,
      gasLimit,
      undefined,
      params,
      parameterFormat
    )

    return result
  }
}
