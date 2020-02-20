import { TezosWalletUtil } from 'conseiljs'
import LightClient, {
  StateManager,
  SyncManager,
  CheckpointManager
} from '@cryptoeconomicslab/plasma-light-client'
import { TzWallet } from '@cryptoeconomicslab/tezos-wallet'
import { Address, Bytes } from '@cryptoeconomicslab/primitives'
import { InMemoryKeyValueStore } from '@cryptoeconomicslab/level-kvs'
import {
  AdjudicationContract,
  DepositContract,
  CommitmentContract,
  ERC20Contract,
  OwnershipPayoutContract
} from '@cryptoeconomicslab/tezos-contract'
import * as TzCoder from '@cryptoeconomicslab/tezos-coder'
import { setupContext } from '@cryptoeconomicslab/context'

setupContext({
  coder: TzCoder
})

async function instantiate() {
  const kvs = new InMemoryKeyValueStore(Bytes.fromString('plasma_aggregator'))
  const eventDb = await kvs.bucket(Bytes.fromString('event'))

  // TODO: fix light client interface
  const network = process.env.TEZOS_NETWORK || 'babylonnet'
  const apiKey = process.env.TEZOS_APIKEY || 'hooman'
  const wallet = new TzWallet(
    await TezosWalletUtil.restoreIdentityWithSecretKey(
      process.env.AGGREGATOR_PRIVATE_KEY ||
        'edskRpVqFG2FHo11aB9pzbnHBiPBWhNWdwtNyQSfEEhDf5jhFbAtNS41vg9as7LSYZv6rEbtJTwyyEg9cNDdcAkSr9Z7hfvquB'
    ),
    {
      url: process.env.MAIN_CHAIN_HOST as string,
      apiKey: apiKey,
      network: network
    }
  )

  function depositContractFactory(address) {
    return new DepositContract(address, eventDb, wallet)
  }

  const stateDb = await kvs.bucket(Bytes.fromString('state'))
  const stateManager = new StateManager(stateDb)

  const syncDb = await kvs.bucket(Bytes.fromString('sync'))
  const syncManager = new SyncManager(syncDb)

  const checkpointDb = await kvs.bucket(Bytes.fromString('checkpoint'))
  const checkpointManager = new CheckpointManager(checkpointDb)

  const adjudicationContract = new AdjudicationContract(
    Address.from(process.env.ADJUDICATION_CONTRACT_ADDRESS || ''),
    eventDb,
    wallet
  )
  const commitmentContract = new CommitmentContract(
    Address.from(process.env.COMMITMENT_CONTRACT_ADDRESS || ''),
    eventDb,
    wallet
  )
  const erc20Contract = new ERC20Contract(
    Address.from(process.env.COMMITMENT_CONTRACT_ADDRESS || ''),
    eventDb,
    wallet
  )
  const ownershipPayoutContract = new OwnershipPayoutContract(
    Address.from(process.env.COMMITMENT_CONTRACT_ADDRESS || ''),
    eventDb,
    wallet
  )
  function tokenContractFactory(address: Address) {
    return new ERC20Contract(address, eventDb, wallet)
  }

  const mainChainEnv = process.env.MAIN_CHAIN_ENV || 'local'
  const config = await import(`../config.${mainChainEnv}`)

  return new LightClient(
    wallet,
    kvs,
    adjudicationContract,
    depositContractFactory,
    tokenContractFactory,
    commitmentContract,
    ownershipPayoutContract,
    stateManager,
    syncManager,
    checkpointManager,
    config
  )
}

export default async function initialize() {
  const lightClient = await instantiate()
  await lightClient.start()

  return lightClient
}

initialize().then()
