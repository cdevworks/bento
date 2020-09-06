import { createContext } from 'react'
import { BoxesContext } from './types'

const context = createContext<BoxesContext>({
  boxes: []
})

export default context