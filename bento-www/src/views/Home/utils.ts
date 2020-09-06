import { Bento } from '../../bento'

import {
  getCurrentPrice as gCP,
  getTargetPrice as gTP,
  getCirculatingSupply as gCS,
  getNextRebaseTimestamp as gNRT,
  getTotalSupply as gTS,
} from '../../bentoUtils'

const getCurrentPrice = async (bento: typeof Bento): Promise<number> => {
  // FORBROCK: get current BENTO price
  return gCP(bento)
}

const getTargetPrice = async (bento: typeof Bento): Promise<number> => {
  // FORBROCK: get target BENTO price
  return gTP(bento)
}

const getCirculatingSupply = async (bento: typeof Bento): Promise<string> => {
  // FORBROCK: get circulating supply
  return gCS(bento)
}

const getNextRebaseTimestamp = async (bento: typeof Bento): Promise<number> => {
  // FORBROCK: get next rebase timestamp
  const nextRebase = await gNRT(bento) as number
  return nextRebase * 1000
}

const getTotalSupply = async (bento: typeof Bento): Promise<string> => {
  // FORBROCK: get total supply
  return gTS(bento)
}

export const getStats = async (bento: typeof Bento) => {
  const curPrice = await getCurrentPrice(bento)
  const circSupply = await getCirculatingSupply(bento)
  const nextRebase = await getNextRebaseTimestamp(bento)
  const targetPrice = await getTargetPrice(bento)
  const totalSupply = await getTotalSupply(bento)
  return {
    circSupply,
    curPrice,
    nextRebase,
    targetPrice,
    totalSupply
  }
}
