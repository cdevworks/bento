import React, { createContext, useEffect, useState } from 'react'

import { useWallet } from 'use-wallet'

import { Bento } from '../../bento'

export interface BentoContext {
  bento?: typeof Bento
}

export const Context = createContext<BentoContext>({
  bento: undefined,
})

declare global {
  interface Window {
    bentosauce: any
  }
}

const BentoProvider: React.FC = ({ children }) => {
  const { ethereum } = useWallet()
  const [bento, setBento] = useState<any>()

  useEffect(() => {
    if (ethereum) {
      const bentoLib = new Bento(
        ethereum,
        "1",
        false, {
          defaultAccount: "",
          defaultConfirmations: 1,
          autoGasMultiplier: 1.5,
          testing: false,
          defaultGas: "6000000",
          defaultGasPrice: "1000000000000",
          accounts: [],
          ethereumNodeTimeout: 10000
        }
      )
      setBento(bentoLib)
      window.bentosauce = bentoLib
    }
  }, [ethereum])

  return (
    <Context.Provider value={{ bento }}>
      {children}
    </Context.Provider>
  )
}

export default BentoProvider
