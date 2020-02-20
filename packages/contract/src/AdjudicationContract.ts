import { TezosLanguageUtil } from 'conseiljs'
import { Address, Bytes, BigNumber } from '@cryptoeconomicslab/primitives'
import { IAdjudicationContract, EventLog } from '@cryptoeconomicslab/contract'
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

export class AdjudicationContract implements IAdjudicationContract {
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

  getGame(
    gameId: Bytes
  ): Promise<import('@cryptoeconomicslab/ovm').ChallengeGame> {
    throw new Error('Method not implemented.')
  }
  isDecided(gameId: Bytes): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  claimProperty(
    property: import('@cryptoeconomicslab/ovm').Property
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }
  decideClaimToTrue(gameId: Bytes): Promise<void> {
    throw new Error('Method not implemented.')
  }
  decideClaimToFalse(gameId: Bytes, challengingGameId: Bytes): Promise<void> {
    throw new Error('Method not implemented.')
  }
  removeChallenge(gameId: Bytes, challengingGameId: Bytes): Promise<void> {
    throw new Error('Method not implemented.')
  }
  setPredicateDecision(gameId: Bytes, decision: boolean): Promise<void> {
    throw new Error('Method not implemented.')
  }
  challenge(
    gameId: Bytes,
    challengeInputs: import('@cryptoeconomicslab/primitives').List<Bytes>,
    challengingGameId: Bytes
  ): Promise<void> {
    throw new Error('Method not implemented.')
  }
  subscribeAtomicPropositionDecided(
    handler: (gameId: Bytes, decision: boolean) => void
  ): void {
    throw new Error('Method not implemented.')
  }
  subscribeNewPropertyClaimed(
    handler: (
      gameId: Bytes,
      property: import('@cryptoeconomicslab/ovm').Property,
      createdBlock: BigNumber
    ) => void
  ): void {
    throw new Error('Method not implemented.')
  }
  subscribeClaimChallenged(
    handler: (gameId: Bytes, challengeGameId: Bytes) => void
  ): void {
    throw new Error('Method not implemented.')
  }
  subscribeClaimDecided(
    handler: (gameId: Bytes, decision: boolean) => void
  ): void {
    throw new Error('Method not implemented.')
  }
  subscribeChallengeRemoved(
    handler: (gameId: Bytes, challengeGameId: Bytes) => void
  ): void {
    throw new Error('Method not implemented.')
  }

  /*
  async submit(blockNumber: BigNumber, root: Bytes) {
    const param = {
      prim: 'Right',
      args: [
        {
          prim: 'Pair',
          args: [
            { int: `'${blockNumber}'` },
            { bytes: `'${removeBytesPrefix(root)}'` }
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
    let latestBlockNo = 0
    events.map(e => {
      // remove 05
      const blockNo = this.getBlockNoFromHex(e.args[1][0].slice(2))
      if (latestBlockNo < blockNo) latestBlockNo = blockNo
    })
    return BigNumber.fromString(latestBlockNo.toString())
  }

  async getRoot(blockNumber: BigNumber): Promise<Bytes> {
    const events = await this.eventWatcher.getEventStorage(
      EventType.BLOCK_SUBMITED
    )
    events.filter(e => {
      // remove 05
      const blockNo = this.getBlockNoFromHex(e.args[1][0].slice(2))
      return blockNo.toString() === blockNumber.toString()
    })
    return Bytes.fromHexString(events[0].args[1][1])
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
  */
}
