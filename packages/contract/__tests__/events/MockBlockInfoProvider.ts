import { BlockInfoProvider } from '@cryptoeconomicslab/tezos-wallet'
import { ConseilServerInfo } from 'conseiljs'
import { MichelinePrim } from '@cryptoeconomicslab/tezos-coder'
import { testEventStorage } from './testInitialStorage'

export class MockBlockInfoProvider implements BlockInfoProvider {
  constructor(
    readonly tezosNodeEndpoint: string,
    readonly conseilServerInfo: ConseilServerInfo,
    readonly failingMode: boolean
  ) {}

  async getContractStorage(
    level: number,
    contractAddress: string
  ): Promise<MichelinePrim> {
    if (this.failingMode) {
      throw new Error('')
    }
    return testEventStorage
  }
}
