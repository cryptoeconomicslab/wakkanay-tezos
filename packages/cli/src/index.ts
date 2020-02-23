import { TezosMessageUtils, TezosWalletUtil } from 'conseiljs'
import { config } from 'dotenv'
config()
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
import { TzCoder } from '@cryptoeconomicslab/tezos-coder'
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
  const url = process.env.MAIN_CHAIN_HOST
  if (!url) {
    throw new Error('must require MAIN_CHAIN_HOST')
  }
  const wallet = new TzWallet(
    await TezosWalletUtil.restoreIdentityWithSecretKey(process.env
      .PRIVATE_KEY as string),
    {
      url,
      apiKey,
      network
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
  lightClient.registerToken(
    '0x01df89eeeeebf54451fac43136cb115607773acf4700',
    '0x01df89eeeeebf54451fac43136cb115607773acf4700'
  )
  console.log('start')
  await lightClient.start()
  console.log('started')

  return lightClient
}

initialize().then(async lightClient => {
  console.log('deposit')
  await lightClient.deposit(
    1,
    '0x01df89eeeeebf54451fac43136cb115607773acf4700'
    //    TezosMessageUtils.writeAddress('KT1UxjVKVMsKRkwvG9XPqXBRNP8t3rqnmq3J')
    // TezosMessageUtils.writeAddress('tz1XuAz2HmWNMXKSV9GTx9zvo6w9Ngr8LWkW')
  )
  console.log('deposited')
})
