import { Contract } from "web3-eth-contract"

export interface Box {
  contract: Contract,
  name: string,
  depositToken: string,
  depositTokenAddress: string,
  earnToken: string,
  earnTokenAddress: string,
  icon: React.ReactNode,
  id: string,
}

export interface BoxesContext {
  boxes: Box[]
}