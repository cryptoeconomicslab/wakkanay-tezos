import { TezosLanguageUtil } from 'conseiljs'
import { Address, Bytes, BigNumber } from '@cryptoeconomicslab/primitives'
import { ICommitmentContract, EventLog } from '@cryptoeconomicslab/contract'
import { KeyValueStore } from '@cryptoeconomicslab/db'
import {
  ContractManager,
  TzWallet,
  TezosBlockInfoProvider
} from '@cryptoeconomicslab/tezos-wallet'
import {
  MichelineNumber,
  removeBytesPrefix,
  TzCoder
} from '@cryptoeconomicslab/tezos-coder'
import EventWatcher, { EventType } from './events'
import JSBI from 'jsbi'

export class CommitmentContract implements ICommitmentContract {
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

  async submit(blockNumber: BigNumber, root: Bytes) {
    const param = {
      prim: 'Right',
      args: [
        {
          prim: 'Pair',
          args: [
            { int: blockNumber.data.toString() },
            { bytes: removeBytesPrefix(root) }
          ]
        }
      ]
    }
    await this.connection.invokeContract(0, 'main', JSON.stringify(param))
  }

  async getCurrentBlock(): Promise<BigNumber> {
    const events = await this.eventWatcher.getEventStorage(
      EventType.BLOCK_SUBMITED
    )
    let latestBlockNo = BigNumber.default()
    events.map(e => {
      const blockNo = TzCoder.decode(
        BigNumber.default(),
        Bytes.fromHexString(e.args[1][0].bytes)
      )
      if (JSBI.lessThan(latestBlockNo.data, blockNo.data)) {
        latestBlockNo = blockNo
      }
    })
    return latestBlockNo
  }

  async getRoot(blockNumber: BigNumber): Promise<Bytes> {
    const events = await this.eventWatcher.getEventStorage(
      EventType.BLOCK_SUBMITED
    )
    events.filter(e => {
      const blockNo = TzCoder.decode(
        BigNumber.default(),
        Bytes.fromHexString(e.args[1][0].bytes)
      )
      return blockNo.toString() === blockNumber.toString()
    })
    return Bytes.fromHexString(events[0].args[1][1].bytes)
  }

  subscribeBlockSubmitted(
    handler: (blockNumber: BigNumber, root: Bytes) => void
  ) {
    this.eventWatcher.subscribe(EventType.BLOCK_SUBMITED, (log: EventLog) => {
      const blockNumber = log.values[0].int
      const root = log.values[1].bytes
      handler(
        BigNumber.fromString(blockNumber.toString()),
        // remove 05
        Bytes.fromHexString(root.slice(2))
      )
    })
    this.eventWatcher.cancel()
    this.eventWatcher.start(() => {
      console.log('event polled')
    })
  }

  private getBlockNoFromHex(hex: string): number {
    return Number(
      (JSON.parse(
        TezosLanguageUtil.hexToMicheline(hex).code
      ) as MichelineNumber).int
    )
  }
}
