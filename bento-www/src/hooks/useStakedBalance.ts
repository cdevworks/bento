import { useCallback, useEffect, useState } from 'react'

import BigNumber from 'bignumber.js'
import { useWallet } from 'use-wallet'
import { Contract } from "web3-eth-contract"

import { getStaked } from '../bentoUtils'
import useBento from './useBento'

const useStakedBalance = (pool: Contract) => {
  const [balance, setBalance] = useState(new BigNumber(0))
  const { account }: { account: string } = useWallet()
  const bento = useBento()

  const fetchBalance = useCallback(async () => {
    const balance = await getStaked(bento, pool, account)
    setBalance(new BigNumber(balance))
  }, [account, pool, bento])

  useEffect(() => {
    if (account && pool && bento) {
      fetchBalance()
    }
  }, [account, pool, setBalance, bento])

  return balance
}

export default useStakedBalance