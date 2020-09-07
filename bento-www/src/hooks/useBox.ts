import { useContext } from 'react'
import { Context as BoxesContext, Box } from '../contexts/Boxes'

const useBox = (id: string): Box => {
  const { boxes } = useContext(BoxesContext)
  const box = boxes.find(box => box.id === id)
  return box
}

export default useBox