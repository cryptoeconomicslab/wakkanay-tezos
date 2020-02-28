import { Address, BigNumber } from '@cryptoeconomicslab/primitives'
import { IOwnershipPayoutContract } from '@cryptoeconomicslab/contract'
import { KeyValueStore } from '@cryptoeconomicslab/db'
import {
  ContractManager,
  TzWallet,
  TezosBlockInfoProvider
} from '@cryptoeconomicslab/tezos-wallet'
import EventWatcher from './events'
import { Property } from '@cryptoeconomicslab/ovm'

export class OwnershipPayoutContract implements IOwnershipPayoutContract {
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

  finalizeExit(
    depositContractAddress: Address,
    exitProperty: Property,
    depositedRangeId: BigNumber,
    owner: Address
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
