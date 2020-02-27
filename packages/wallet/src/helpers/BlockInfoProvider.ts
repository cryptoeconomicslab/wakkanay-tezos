import { Address } from '@cryptoeconomicslab/primitives'
import {
  OperationKindType,
  TezosConseilClient,
  ConseilServerInfo,
  ConseilQueryBuilder,
  ConseilOperator,
  TezosMessageUtils,
  TezosNodeReader
} from 'conseiljs'
import { MichelinePrim } from '@cryptoeconomicslab/tezos-coder'

interface Script {
  code: any
  storage: MichelinePrim
}

export interface BlockInfoProvider {
  readonly tezosNodeEndpoint
  readonly conseilServerInfo: ConseilServerInfo
  getContractStorage(
    level: number,
    contractAddress: string
  ): Promise<MichelinePrim>
}

export class TezosBlockInfoProvider implements BlockInfoProvider {
  constructor(
    readonly tezosNodeEndpoint,
    readonly conseilServerInfo: ConseilServerInfo
  ) {}

  async estimateFee(
    operationKindType: OperationKindType = OperationKindType.Transaction
  ): Promise<number> {
    const result = await TezosConseilClient.getFeeStatistics(
      this.conseilServerInfo,
      this.conseilServerInfo.network,
      operationKindType
    )
    return result[0].medium
  }

  async getContractStorage(
    level: number,
    contractAddress: string
  ): Promise<MichelinePrim> {
    const contract = await TezosNodeReader.getAccountForBlock(
      this.tezosNodeEndpoint,
      level.toString(),
      'KT1UxjVKVMsKRkwvG9XPqXBRNP8t3rqnmq3J'
    )
    if (!contract.script) {
      throw new Error('script must not be undefined')
    }
    const script: Script = (contract.script as any) as Script
    return script.storage
    // curl https://tezos-dev.cryptonomic-infra.tech/chains/main/blocks/193552/context/contracts/KT1T2Zy4THwShihhqsaFWTubUVnFmjddHzew/storage
    // return {"prim":"Pair","args":[{"prim":"Pair","args":[{"string":"tz3bQSqnLF3SKXuddVTDj6z3N9zUqZp7BAnd"},{"prim":"Pair","args":[{"prim":"Pair","args":[{"int":"2899982"},{"int":"86400"}]},{"prim":"Pair","args":[[{"prim":"Pair","args":[{"string":"2019-12-18T02:22:45Z"},{"int":"3"}]}],[{"prim":"Pair","args":[{"string":"2019-12-18T02:26:45Z"},{"int":"100000"}]},{"prim":"Pair","args":[{"string":"2019-12-18T02:25:45Z"},{"int":"9"}]},{"prim":"Pair","args":[{"string":"2019-12-18T02:24:45Z"},{"int":"6"}]}]]}]}]},{"prim":"Pair","args":[{"string":"tz1XTGDcNE1LzSXxpFcpkFEWWcrtpjzYG7eX"},{"prim":"Pair","args":[{"int":"24"},{"int":"9"}]}]}]}
    // throw Error('Not implemented')
  }
}
// curl https://tezos-dev.cryptonomic-infra.tech/chains/main/blocks/314580/context/contracts/KT1UxjVKVMsKRkwvG9XPqXBRNP8t3rqnmq3J/storage
