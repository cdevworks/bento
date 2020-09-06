import React, { useCallback, useEffect, useState } from 'react'

import { Contract } from "web3-eth-contract"

import { bento as bentoAddress } from '../../constants/tokenAddresses'
import useBento from '../../hooks/useBento'
import { getPoolContracts } from '../../bentoUtils'

import Context from './context'
import { Farm } from './types'

const NAME_FOR_POOL: { [key: string]: string } = {
  eth_pool: 'Weth Homestead',
  yam_pool: 'YAM',
  crv_pool: 'Curvy Fields',
  yfi_pool: 'YFI Farm',
  yfii_pool: 'YFII Farm',
  comp_pool: 'Compounding Hills',
  link_pool: 'Marine Gardens',
  lend_pool: 'Aave Agriculture',
  snx_pool: 'Spartan Grounds',
  mkr_pool: 'Maker Range',
  ycrvUNIV_pool: 'Eternal Lands',
}

const ICON_FOR_POOL: { [key: string]: string } = {
  yfi_pool: '🐋',
  yfii_pool: '🦈',
  yam_pool: '🍠',
  eth_pool: '🌎',
  crv_pool: '🚜',
  comp_pool: '💸',
  link_pool: '🔗',
  lend_pool: '🏕️',
  snx_pool: '⚔️',
  mkr_pool: '🐮',
  ycrvUNIV_pool: '🌈',
}

const Farms: React.FC = ({ children }) => {

  const [farms, setFarms] = useState<Farm[]>([])
  const bento = useBento()

  const fetchPools = useCallback(async () => {
    const pools: { [key: string]: Contract} = await getPoolContracts(bento)

    const farmsArr: Farm[] = []
    const poolKeys = Object.keys(pools)

    for (let i = 0; i < poolKeys.length; i++) {
      const poolKey = poolKeys[i]
      const pool = pools[poolKey]
      let tokenKey = poolKey.replace('_pool', '')
      if (tokenKey === 'eth') {
        tokenKey = 'weth'
      } else if (tokenKey === 'ycrvUNIV') {
        tokenKey = 'uni_lp'
      }

      const method = pool.methods[tokenKey]
      if (method) {
        try {
          let tokenAddress = ''
          if (tokenKey === 'uni_lp') {
            tokenAddress = '0x4eFdFe92F7528Bd16b95083d7Ba1b247De32F549'
          } else {
            tokenAddress = await method().call()
          }
          farmsArr.push({
            contract: pool,
            name: NAME_FOR_POOL[poolKey],
            depositToken: tokenKey,
            depositTokenAddress: tokenAddress,
            earnToken: 'bento',
            earnTokenAddress: bentoAddress,
            icon: ICON_FOR_POOL[poolKey],
            id: tokenKey
          })
        } catch (e) {
          console.log(e)
        }
      }
    }
    setFarms(farmsArr)
  }, [bento, setFarms])

  useEffect(() => {
    if (bento) {
      fetchPools()
    }
  }, [bento, fetchPools])

  return (
    <Context.Provider value={{ farms }}>
      {children}
    </Context.Provider>
  )
}

export default Farms
