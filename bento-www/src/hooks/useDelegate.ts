import { useCallback } from 'react'

import { useWallet } from 'use-wallet'

import { delegate } from '../bentoUtils'
import useBento from './useBento'

const useDelegate = (address?: string) => {
  const { account } = useWallet()
  const bento = useBento()

  const handleDelegate = useCallback(async () => {
    const txHash = await delegate(bento ,address || account, account)
    console.log(txHash)
  }, [account, address])

  return { onDelegate: handleDelegate }
}

export default useDelegate