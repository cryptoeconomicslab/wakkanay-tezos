import {
  ConseilServerInfo,
  CryptoUtils,
  TezosConseilClient,
  TezosLanguageUtil
} from 'conseiljs'
import { Bytes } from '@cryptoeconomicslab/primitives'
import { KeyValueStore } from '@cryptoeconomicslab/db'
import {
  EventDb,
  EventHandler,
  ErrorHandler,
  IEventWatcher,
  CompletedHandler
} from '@cryptoeconomicslab/contract'
import {
  MichelinePrim,
  MichelinePrimItem,
  MichelineString
} from '@cryptoeconomicslab/tezos-coder'
import {
  BlockInfoProvider,
  TezosBlockInfoProvider
} from '@cryptoeconomicslab/tezos-wallet'

export interface EventWatcherOptions {
  interval?: number
  initialBlock?: number
}

export enum EventType {
  BLOCK_SUBMITED = 'BlockSubmitted',
  CHECKPOINT_FINALIZED = 'CheckpointFinalized',
  EXIT_FINALIZED = 'ExitFinalized'
}

export type TzEventWatcherArgType = {
  tezosNodeEndpoint: string
  conseilServerInfo: ConseilServerInfo
  kvs: KeyValueStore
  contractAddress: string
  options?: EventWatcherOptions
  blockInfoProvider?: BlockInfoProvider
}

const DEFAULT_INTERVAL = 5000

export default class EventWatcher implements IEventWatcher {
  public blockInfoProvider: BlockInfoProvider
  public eventDb: EventDb
  public checkingEvents: Map<string, EventHandler>
  public options: EventWatcherOptions
  public timer?: NodeJS.Timer
  public contractAddress: string

  constructor({
    tezosNodeEndpoint,
    conseilServerInfo,
    kvs,
    contractAddress,
    options,
    blockInfoProvider = new TezosBlockInfoProvider(
      tezosNodeEndpoint,
      conseilServerInfo
    )
  }: TzEventWatcherArgType) {
    this.blockInfoProvider = blockInfoProvider
    this.eventDb = new EventDb(kvs)
    this.checkingEvents = new Map<string, EventHandler>()
    this.options = {
      interval: DEFAULT_INTERVAL,
      ...options
    }
    this.contractAddress = contractAddress
  }

  public subscribe(event: string, handler: EventHandler) {
    // FIXME: add multiple handlers to one event
    this.checkingEvents.set(event, handler)
  }

  public unsubscribe(event: string, handler: EventHandler) {
    this.checkingEvents.delete(event)
  }

  public async start(handler: CompletedHandler, errorHandler?: ErrorHandler) {
    try {
      const block = await TezosConseilClient.getBlockHead(
        this.blockInfoProvider.conseilServerInfo,
        this.blockInfoProvider.conseilServerInfo.network
      )
      // TODO: enter the topic
      // ethereum topic is the contract address
      let latestBlock = await this.eventDb.getLastLoggedBlock(
        Bytes.fromString(this.contractAddress.toString())
      )
      if (latestBlock == 0) {
        // initial block
        latestBlock = this.options.initialBlock || block.level
        // latestBlock = this.options.initialBlock || 331380
      }
      console.log(latestBlock)
      await this.poll(latestBlock + 1, block.level, handler)
    } catch (e) {
      console.log(e)
      if (errorHandler) {
        errorHandler(e)
      }
    }
    this.timer = setTimeout(async () => {
      await this.start(handler, errorHandler)
    }, this.options.interval || DEFAULT_INTERVAL)
  }

  public cancel() {
    if (this.timer) {
      clearTimeout(this.timer)
    }
  }

  public async poll(
    fromBlockNumber: number,
    blockNumber: number,
    completedHandler: CompletedHandler
  ) {
    console.log('from to:', fromBlockNumber, blockNumber)
    for (let i = fromBlockNumber; i <= blockNumber; i++) {
      let events: MichelinePrim[]
      try {
        const storage = await this.blockInfoProvider.getContractStorage(
          i,
          this.contractAddress
        )
        events = this.parseStorage(storage)
      } catch (e) {
        events = []
      }
      const filtered = await filter(events, async e => {
        const seen = await this.eventDb.getSeen(this.getHash(e))
        return !seen
      })
      // console.log('filtered:', JSON.stringify(filtered))
      filtered.map(async (e: MichelinePrim | symbol) => {
        e = e as MichelinePrim
        const eventName = (e.args[0] as MichelineString).string
        const handler = this.checkingEvents.get(eventName)
        if (handler) {
          const args = e.args[1] as MichelinePrim[]
          args.forEach(arg => {
            const values = ((arg as MichelinePrim).args[1] as any[]).map(
              b => b.bytes
            )
            handler({
              name: eventName,
              values: values
            })
          })
        }
        await this.eventDb.addSeen(this.getHash(e))
        return
      })
      await this.eventDb.setLastLoggedBlock(
        Bytes.fromString(this.contractAddress.toString()),
        i
      )
    }
    completedHandler()
  }

  /**
   * get contract event storage
   * @param eventType
   */
  public async getEventStorage(eventType: EventType): Promise<MichelinePrim[]> {
    const block = await TezosConseilClient.getBlockHead(
      this.blockInfoProvider.conseilServerInfo,
      this.blockInfoProvider.conseilServerInfo.network
    )
    const storage = await this.blockInfoProvider.getContractStorage(
      block.level,
      this.contractAddress
    )
    const eventStorage = this.parseStorage(storage).filter(
      (e: MichelinePrim) => {
        return (e.args[0] as MichelineString).string === eventType.toString()
      }
    )
    if (eventStorage.length == 0) {
      throw new Error('no events')
    }
    return eventStorage[0].args[1] as MichelinePrim[]
  }

  /**
   * parse storage to get events_storage scope
   * @param storage
   */
  private parseStorage(storage: MichelinePrim): MichelinePrim[] {
    const events = ((storage.args[1] as MichelinePrim).args[1] as MichelinePrim)
      .args[0]
    return events as MichelinePrim[]
  }

  private getHash(e: MichelinePrim): Bytes {
    return Bytes.from(
      Uint8Array.from(
        CryptoUtils.simpleHash(Buffer.from(JSON.stringify(e), 'utf8'), 16)
      )
    )
  }
}

async function filter<T>(arr: T[], callback: (item: T) => Promise<boolean>) {
  const fail = Symbol()
  return (await Promise.all(
    arr.map(async item => ((await callback(item)) ? item : fail))
  )).filter(i => i !== fail)
}
