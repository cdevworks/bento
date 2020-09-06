import { useContext } from 'react'
import { Context as BoxesContext } from '../contexts/Boxes'

const useBoxes = () => {
  const { boxes } = useContext(BoxesContext)
  return [boxes]
}

export default useBoxes