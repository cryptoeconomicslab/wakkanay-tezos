import { TezosMessageUtils, TezosWalletUtil } from 'conseiljs'
import { config } from 'dotenv'
config()
import LightClient, {
  StateManager,
  SyncManager,
  CheckpointManager
} from '@cryptoeconomicslab/plasma-light-client'
import { TzWallet } from '@cryptoeconomicslab/tezos-wallet'
import { Balance } from '@cryptoeconomicslab/wallet'
import { Address, Bytes } from '@cryptoeconomicslab/primitives'
import leveldown from 'leveldown'
import { LevelKeyValueStore } from '@cryptoeconomicslab/level-kvs'
import {
  AdjudicationContract,
  DepositContract,
  CommitmentContract,
  ERC20Contract,
  OwnershipPayoutContract
} from '@cryptoeconomicslab/tezos-contract'
import Cli from 'cac'
const cli = Cli()
import { TzCoder } from '@cryptoeconomicslab/tezos-coder'
import { setupContext } from '@cryptoeconomicslab/context'
setupContext({
  coder: TzCoder
})

async function instantiate() {
  const kvs = new LevelKeyValueStore(
    Bytes.fromString('tezos-liteclient-cli'),
    leveldown('.db')
  )
  const eventDb = await kvs.bucket(Bytes.fromString('event'))

  // TODO: fix light client interface
  const network = process.env.TEZOS_NETWORK || 'babylonnet'
  const apiKey = process.env.TEZOS_APIKEY || 'hooman'
  const url = process.env.CONCEIL_ENDPOINT
  const tezosNodeEndpoint = process.env.TEZOS_NODE_ENDPOINT
  if (!url) {
    throw new Error('must require CONCEIL_ENDPOINT')
  }
  if (!tezosNodeEndpoint) {
    throw new Error('must require MAIN_CHAIN_HOST')
  }
  const wallet = new TzWallet(
    await TezosWalletUtil.restoreIdentityWithSecretKey(process.env
      .PRIVATE_KEY as string),
    tezosNodeEndpoint,
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

const depositContractAddress = process.env.DEPOSIT_CONTRACT_ADDRESS || ''
const tokenAddress = process.env.TOKEN_ADDRESS || ''

export default async function initialize() {
  const lightClient = await instantiate()
  lightClient.registerToken(tokenAddress, depositContractAddress)
  await lightClient.start()

  return lightClient
}

/*
token address is 000053c1edca8bd5c21c61d6f1fd091fa51d562aff1d
console.log(
  TezosMessageUtils.writeAddress('tz1TGu6TN5GSez2ndXXeDX6LgUDvLzPLqgYV')
)
*/
console.log(
  TezosMessageUtils.writeAddress('KT1LBdoNuEUQyBjN85rQzHqJFXjWZqmN8HeP')
)

cli.command('deposit <amount>', 'Deposit').action(async (amount, options) => {
  const lightClient = await initialize()
  console.log('deposit', amount)
  await lightClient.deposit(
    Number(amount),
    tokenAddress
    // TezosMessageUtils.writeAddress('KT1UxjVKVMsKRkwvG9XPqXBRNP8t3rqnmq3J')
  )
  console.log('deposited')
})
cli.command('balance', 'getBalance').action(async options => {
  const lightClient = await initialize()
  const balances = await lightClient.getBalance()
  const l1balance: Balance = await lightClient['wallet'].getL1Balance()
  console.log('Balance L1:', Number(l1balance.value.raw) / 1000000, 'tz')
  console.log('Balance L2:', balances[0].amount / 1000000, 'tz')
})
cli
  .command('transfer <amount> <to>', 'transfer')
  .action(async (amount, to, options) => {
    const lightClient = await initialize()
    await lightClient.transfer(
      amount,
      tokenAddress,
      '0x' + TezosMessageUtils.writeAddress(to)
    )
  })
cli
  .command('unlock <mnemonic> <email> <password> <address>', 'Import')
  .action(async (mnemonic, email, password, address, options) => {
    const a = await TezosWalletUtil.unlockFundraiserIdentity(
      mnemonic,
      email,
      password,
      address
    )
    console.log(a.privateKey, a.publicKeyHash)
  })
cli.help()
cli.parse()
