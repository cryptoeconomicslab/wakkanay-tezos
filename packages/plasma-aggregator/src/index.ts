import { TezosWalletUtil } from 'conseiljs'
import { Address, Bytes } from '@cryptoeconomicslab/primitives'
import { RangeDb } from '@cryptoeconomicslab/db'
import leveldown from 'leveldown'
import { LevelKeyValueStore } from '@cryptoeconomicslab/level-kvs'
import {
  DepositContract,
  CommitmentContract
} from '@cryptoeconomicslab/tezos-contract'
import { TzWallet } from '@cryptoeconomicslab/tezos-wallet'
import { TzCoder } from '@cryptoeconomicslab/tezos-coder'
import { setupContext } from '@cryptoeconomicslab/context'
setupContext({
  coder: TzCoder
})
import fs from 'fs'
import { config } from 'dotenv'
config()

import Aggregator, {
  BlockManager,
  StateManager
} from '@cryptoeconomicslab/plasma-aggregator'

const instantiate = async (): Promise<Aggregator> => {
  const kvs = new LevelKeyValueStore(
    Bytes.fromString('aaaaa'),
    leveldown('.db')
  )
  await kvs.open()
  const tezosNodeEndpoint = process.env.TEZOS_NODE_ENDPOINT
  const url = process.env.CONCEIL_ENDPOINT
  const network = process.env.TEZOS_NETWORK || 'babylonnet'
  const apiKey = process.env.TEZOS_APIKEY || 'hooman'
  if (!tezosNodeEndpoint) {
    throw new Error('must require TEZOS_NODE_ENDPOINT')
  }
  if (!url) {
    throw new Error('must require CONCEIL_ENDPOINT')
  }
  const wallet = new TzWallet(
    await TezosWalletUtil.restoreIdentityWithSecretKey(process.env
      .AGGREGATOR_PRIVATE_KEY as string),
    tezosNodeEndpoint,
    {
      url: url,
      apiKey: apiKey,
      network: network
    }
  )

  const stateBucket = await kvs.bucket(Bytes.fromString('state_update'))
  const stateDb = new RangeDb(stateBucket)
  const blockDb = await kvs.bucket(Bytes.fromString('block'))
  const stateManager = new StateManager(stateDb)
  const blockManager = new BlockManager(blockDb)
  const witnessDb = await kvs.bucket(Bytes.fromString('witness'))
  const eventDb = await kvs.bucket(Bytes.fromString('event'))
  function depositContractFactory(address: Address) {
    console.log('depositContractFactory', address)
    return new DepositContract(address, eventDb, wallet)
  }
  function commitmentContractFactory(address: Address) {
    return new CommitmentContract(address, eventDb, wallet)
  }

  return new Aggregator(
    wallet,
    stateManager,
    blockManager,
    witnessDb,
    depositContractFactory,
    commitmentContractFactory,
    loadConfigFile(process.env.CONFIG_FILE || 'config.local.json')
  )
}

async function main() {
  const aggregator = await instantiate()
  aggregator.registerToken(
    Address.from(process.env.DEPOSIT_CONTRACT_ADDRESS as string)
  )
  aggregator.run()
  console.log('aggregator is running on port ', process.env.PORT)
}

function loadConfigFile(filePath: string): any {
  return JSON.parse(fs.readFileSync(filePath).toString())
}

main()
