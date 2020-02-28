import { Address, Integer } from '@cryptoeconomicslab/primitives'
import { IERC20Contract } from '@cryptoeconomicslab/contract'
import { KeyValueStore } from '@cryptoeconomicslab/db'
import {
  ContractManager,
  TzWallet,
  TezosBlockInfoProvider
} from '@cryptoeconomicslab/tezos-wallet'
import EventWatcher from './events'

export class ERC20Contract implements IERC20Contract {
  private connection: ContractManager
  private blockInfoProvider: TezosBlockInfoProvider
  private eventWatcher: EventWatcher

  constructor(
    readonly address: Address,
    eventDb: KeyValueStore,
    wallet: TzWallet
  ) {
    this.connection = new ContractManager(wallet, address)
    this.blockInfoProvider = new TezosBlockInfoProvider(
      wallet.tezosNodeEndpoint,
      wallet.conseilServerInfo
    )
    this.eventWatcher = new EventWatcher({
      tezosNodeEndpoint: wallet.tezosNodeEndpoint,
      conseilServerInfo: wallet.conseilServerInfo,
      kvs: eventDb,
      contractAddress: address.data,
      blockInfoProvider: this.blockInfoProvider
    })
  }

  async approve(spender: Address, amount: Integer): Promise<void> {
    return
  }
}
