import React, { useCallback, useEffect, useState } from 'react'

import useBento from '../../hooks/useBento'
import { getProposals } from '../../bentoUtils'

import Context from './context'
import { Proposal } from './types'


const Proposals: React.FC = ({ children }) => {

  const [proposals, setProposals] = useState<Proposal[]>([])
  const bento = useBento()
  
  const fetchProposals = useCallback(async () => {
    const propsArr: Proposal[] = await getProposals(bento)

    setProposals(propsArr)
  }, [bento, setProposals])

  useEffect(() => {
    if (bento) {
      fetchProposals()
    }
  }, [bento, fetchProposals])

  return (
    <Context.Provider value={{ proposals }}>
      {children}
    </Context.Provider>
  )
}

export default Proposals
