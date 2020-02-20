import { TezosLanguageUtil } from 'conseiljs'
import { Address, Bytes, BigNumber } from '@cryptoeconomicslab/primitives'
import {
  IOwnershipPayoutContract,
  EventLog
} from '@cryptoeconomicslab/contract'
import { KeyValueStore } from '@cryptoeconomicslab/db'
import {
  ContractManager,
  TzWallet,
  TezosBlockInfoProvider
} from '@cryptoeconomicslab/tezos-wallet'
import {
  MichelineNumber,
  removeBytesPrefix
} from '@cryptoeconomicslab/tezos-coder'
import EventWatcher, { EventType } from './events'

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
      wallet.conseilServerInfo
    )
    this.eventWatcher = new EventWatcher({
      conseilServerInfo: wallet.conseilServerInfo,
      kvs: eventDb,
      contractAddress: address.data,
      blockInfoProvider: this.blockInfoProvider
    })
  }

  finalizeExit(
    depositContractAddress: Address,
    exitProperty: import('@cryptoeconomicslab/ovm').Property,
    depositedRangeId: BigNumber,
    owner: Address
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }
}
