import {
  TezosMessageUtils,
  TezosWalletUtil,
  StoreType,
  TezosNodeWriter,
  TezosNodeReader
} from 'conseiljs'
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
import faucetAccount from './faucetAccount'
setupContext({ coder: TzCoder })

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
  const adjudicationContractAddress = TezosMessageUtils.writeAddress(process.env
    .ADJUDICATION_CONTRACT_ADDRESS as string)
  const commitmentContractAddress = TezosMessageUtils.writeAddress(process.env
    .COMMITMENT_CONTRACT_ADDRESS as string)
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
    { url, apiKey, network }
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
    Address.from(adjudicationContractAddress),
    eventDb,
    wallet
  )
  const commitmentContract = new CommitmentContract(
    Address.from(commitmentContractAddress),
    eventDb,
    wallet
  )
  const erc20Contract = new ERC20Contract(
    Address.from(commitmentContractAddress),
    eventDb,
    wallet
  )
  const ownershipPayoutContract = new OwnershipPayoutContract(
    Address.from(commitmentContractAddress),
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

const depositContractAddress = TezosMessageUtils.writeAddress(process.env
  .DEPOSIT_CONTRACT_ADDRESS as string)
const tokenAddress = TezosMessageUtils.writeAddress(process.env
  .TOKEN_ADDRESS as string)

export default async function initialize() {
  const lightClient = await instantiate()
  lightClient.registerToken(tokenAddress, depositContractAddress)
  try {
    await lightClient.start()
  }catch(e){
    console.error('catched')
    process.exit(1)
  }


  return lightClient
}


async function getMempool(){
  const mempool = await TezosNodeReader.getMempoolOperationsForAccount(process.env.TEZOS_NODE_ENDPOINT as string, faucetAccount.pkh, 'NetXjD3HPJJjmcd');
  return mempool;
}
cli.command('mempool').action(async (amount, options) => {
  console.log(await getMempool())
  process.exit()
})

cli.command('deposit <amount>', 'Deposit').action(async (amount, options) => {
  const lightClient = await initialize()
  console.log('deposit', amount)
  await lightClient.deposit(
    Number(amount),
    tokenAddress
  )

  console.log('deposited')
  console.log(await getMempool())
  process.exit()
})
cli.command('balance', 'getBalance').action(async options => {
  const lightClient = await initialize()
  console.log('getBalance start')
  try {
    const balances = await lightClient.getBalance()
    console.log('Balance L2:', balances[0].amount / 1000000, 'tz')
  } catch (e) {
    console.error(`getBalance (L2) failed - ${e.message}`)
  }
  try {
    const l1balance: Balance = await lightClient['wallet'].getL1Balance()
    console.log('Balance L1:', Number(l1balance.value.raw) / 1000000, 'tz')
  } catch (e) {
    console.error(`getL1Balance failed - ${e.message}`, e)
  }
  console.log('getBalance end')
  process.exit()
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
    process.exit()
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
    process.exit()
  })

cli.command('activate', 'Activate').action(async () => {
  const tezosNodeEndpoint = process.env.TEZOS_NODE_ENDPOINT as string
  const faucetKeys = await TezosWalletUtil.unlockFundraiserIdentity(
    faucetAccount.mnemonic.join(' '),
    faucetAccount.email,
    faucetAccount.password,
    faucetAccount.pkh
  )
  console.log(faucetAccount)
  console.log(faucetKeys)
  const nodeResult1 = await TezosNodeWriter.sendIdentityActivationOperation(
    tezosNodeEndpoint,
    faucetKeys,
    faucetAccount.secret
  )
  if (JSON.parse(nodeResult1['operationGroupID'])[0].id === 'failure')
    throw new Error(
      `sendIdentityActivationOperation: ${
        JSON.parse(nodeResult1['operationGroupID'])[0].msg
      }`
    )
  const keys = await TezosWalletUtil.getKeysFromMnemonicAndPassphrase(
    faucetAccount.mnemonic.join(' '),
    faucetAccount.password,
    StoreType.Mnemonic
  )
  const nodeResult2 = await TezosNodeWriter.sendKeyRevealOperation(
    tezosNodeEndpoint,
    keys,
    50000
  )
  if (JSON.parse(nodeResult2['operationGroupID'])[0].id === 'failure')
    throw new Error(
      `sendKeyRevealOperation: ${
        JSON.parse(nodeResult2['operationGroupID'])[0].msg
      }`
    )
  console.log(nodeResult1)
  console.log(nodeResult2)
  process.exit()
})
cli.help()
cli.parse()
