import { useCallback } from 'react'

import { useWallet } from 'use-wallet'
import { Bento } from '../bento'
import { rebase } from '../bentoUtils'

import useBento from '../hooks/useBento'

const useRebase = () => {
  const { account } = useWallet()
  const bento = useBento()

  const handleRebase = useCallback(async () => {
    const txHash = await rebase(bento, account)
    console.log(txHash)
  }, [account, bento])

  return { onRebase: handleRebase }
}

export default useRebase