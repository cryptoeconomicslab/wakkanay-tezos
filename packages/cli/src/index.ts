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
  DepositContract,
  CommitmentContract
} from '@cryptoeconomicslab/tezos-contract'

async function instantiate(privateKey) {
  const kvs = new InMemoryKeyValueStore(Bytes.fromString('plasma_aggregator'))
  const eventDb = await kvs.bucket(Bytes.fromString('event'))

  // TODO: fix light client interface
  const network = process.env.TEZOS_NETWORK || 'babylonnet'
  const apiKey = process.env.TEZOS_APIKEY || 'hooman'
  const wallet = new TzWallet(
    await TezosWalletUtil.restoreIdentityWithSecretKey(process.env
      .AGGREGATOR_PRIVATE_KEY as string),
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

  const commitmentContract = new CommitmentContract(
    Address.from(process.env.COMMITMENT_CONTRACT_ADDRESS || ''),
    wallet
  )

  const mainChainEnv = process.env.MAIN_CHAIN_ENV || 'local'
  const config = await import(`../config.${mainChainEnv}`)

  return new LightClient(
    wallet,
    kvs,
    depositContractFactory,
    tokenContractFactory,
    commitmentContract,
    stateManager,
    syncManager,
    checkpointManager,
    config
  )
}

export default async function initialize(privateKey) {
  const lightClient = await instantiate(privateKey)
  await lightClient.start()

  return lightClient
}
