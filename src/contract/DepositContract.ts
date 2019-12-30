import { Address, Bytes, Integer } from 'wakkanay/dist/types/Codables'
import { Property } from 'wakkanay/dist/ovm/types'
import { contract } from 'wakkanay'
import IDepositContract = contract.IDepositContract

/**
 * TODO: add implementation
 */
export class DepositContract implements IDepositContract {
  constructor(readonly address: Address) {}

  async deposit(amount: Integer, initialState: Property): Promise<void> {
    throw new Error('Not implemented')
  }
  async finalizeCheckpoint(checkpoint: Property): Promise<void> {
    throw new Error('Not implemented')
  }
  async finalizeExit(exit: Property, depositedRangeId: Integer): Promise<void> {
    throw new Error('Not implemented')
  }
  subscribeCheckpointFinalized(
    handler: (checkpointId: Bytes, checkpoint: [Range, Property]) => void
  ) {
    throw new Error('Not implemented')
  }
  subscribeExitFinalized(handler: (exitId: Bytes) => void) {
    throw new Error('Not implemented')
  }
}
