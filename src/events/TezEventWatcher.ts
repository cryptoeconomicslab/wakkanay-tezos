import * as ethers from 'ethers'
import { db, events, types } from 'wakkanay'
import EventDb = events.EventDb
import KeyValueStore = db.KeyValueStore
import IEventWatcher = events.IEventWatcher
import EventHandler = events.EventHandler
import ErrorHandler = events.ErrorHandler
import CompletedHandler = events.CompletedHandler
import Bytes = types.Bytes
type JsonRpcProvider = ethers.providers.JsonRpcProvider

import {
  ConseilServerInfo,
  CryptoUtils,
  KeyStore,
  TezosConseilClient,
  TezosMessageUtils
} from 'conseiljs'

export interface EventWatcherOptions {
  interval: number
}

export type TezEventWatcherArgType = {
  endpoint: string
  kvs: KeyValueStore
  contractAddress: string
  contractInterface: ethers.utils.Interface
  options: EventWatcherOptions
}

export default class EventWatcher implements IEventWatcher {
  public httpProvider: JsonRpcProvider
  public eventDb: EventDb
  public checkingEvents: Map<string, EventHandler>
  public options: EventWatcherOptions
  public timer?: number
  public contractAddress: string
  public contractInterface: ethers.utils.Interface

  constructor({
    endpoint,
    kvs,
    contractAddress,
    contractInterface,
    options
  }: TezEventWatcherArgType) {
    this.httpProvider = new ethers.providers.JsonRpcProvider(endpoint)
    this.eventDb = new EventDb(kvs)
    this.checkingEvents = new Map<string, EventHandler>()
    this.options = {
      interval: 1000,
      ...options
    }
    this.contractAddress = contractAddress
    this.contractInterface = contractInterface
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
      //TODO
      // getBlockHead https://github.com/Cryptonomic/ConseilJS/blob/f189bc1d8aafa33db2d5beb587711faadfb51e50/src/reporting/tezos/TezosConseilClient.ts#L31-L42
      const block = await this.httpProvider.getBlock('latest')

      const loaded = await this.eventDb.getLastLoggedBlock(
        Bytes.fromString(this.contractAddress)
      )
      await this.poll(loaded, block.number, handler)
    } catch (e) {
      console.log(e)
      if (errorHandler) {
        errorHandler(e)
      }
    }
    this.timer = setTimeout(async () => {
      await this.start(handler, errorHandler)
    }, this.options.interval)
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
    // TODO
    // TezosNodeReader.getLogs()
    // performGetRequest(server, `chains/${chainid}/blocks/${blockHash}/${blockHash}>/context/contracts/${accountHash}/storage`).logs
    // ref1 https://github.com/Cryptonomic/ConseilJS/blob/f189bc1d8aafa33db2d5beb587711faadfb51e50/src/chain/tezos/TezosNodeReader.ts#L46-L48
    // ref2 https://tezos.gitlab.io/tezos/api/rpc.html#get-block-id-context-contracts-contract-id-storage
    const events = await this.httpProvider.getLogs({//TODO
      address: this.contractAddress,
      fromBlock: fromBlockNumber,
      toBlock: blockNumber
    })

    const filtered = events
      .filter(async e => {
        if (e.transactionHash) {
          const seen = await this.eventDb.getSeen(
            Bytes.fromHexString(e.transactionHash)
          )
          return !seen
        } else {
          return false
        }
      })
      .map(e => {
        const logDesc = this.contractInterface.parseLog(e)
        const handler = this.checkingEvents.get(logDesc.name)
        if (handler) {
          handler(logDesc)
        }
        if (e.transactionHash) {
          this.eventDb.addSeen(Bytes.fromHexString(e.transactionHash))
        }
        return true
      })
    await this.eventDb.setLastLoggedBlock(
      Bytes.fromString(this.contractAddress),
      blockNumber
    )
    if (filtered.length > 0) {
      completedHandler()
    }
  }
}
