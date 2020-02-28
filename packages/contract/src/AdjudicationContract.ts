import { Address, Bytes, BigNumber, List } from '@cryptoeconomicslab/primitives'
import { IAdjudicationContract } from '@cryptoeconomicslab/contract'
import { KeyValueStore } from '@cryptoeconomicslab/db'
import { ChallengeGame, Property } from '@cryptoeconomicslab/ovm'
import {
  ContractManager,
  TzWallet,
  TezosBlockInfoProvider
} from '@cryptoeconomicslab/tezos-wallet'
import EventWatcher from './events'

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

  getGame(gameId: Bytes): Promise<ChallengeGame> {
    throw new Error('Method not implemented.')
  }
  isDecided(gameId: Bytes): Promise<boolean> {
    throw new Error('Method not implemented.')
  }
  claimProperty(property: Property): Promise<void> {
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
    challengeInputs: List<Bytes>,
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
      property: Property,
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
}
