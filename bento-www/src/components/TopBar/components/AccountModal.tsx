import React, { useCallback, useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'

import { bento as bentoAddress } from '../../../constants/tokenAddresses'
import useTokenBalance from '../../../hooks/useTokenBalance'
import { getDisplayBalance } from '../../../utils/formatBalance'

import { getCurrentVotes, getProposalThreshold } from '../../../bentoUtils'
import useBento from '../../../hooks/useBento'
import useDelegate from '../../../hooks/useDelegate'
import { useWallet } from 'use-wallet'

import Button from '../../Button'
import CardIcon from '../../CardIcon'
import IconButton from '../../IconButton'
import { AddIcon, RemoveIcon } from '../../icons'
import Label from '../../Label'
import Modal, { ModalProps } from '../../Modal'
import ModalTitle from '../../ModalTitle'


const AccountModal: React.FC<ModalProps> = ({ onDismiss }) => {
  const { account } = useWallet()
  const bento = useBento()

  const [votes, setvotes] = useState("")
  const [devsVotes, setdevsVotes] = useState("")
  const [proposalThreshold, setProposalThreshold] = useState("")

  const handleSignOutClick = useCallback(() => {
    onDismiss!()
  }, [onDismiss])

  const onDelegateSelf = useDelegate().onDelegate
  const onDelegateDev = useDelegate("0x056E4fbF91a4292F747f99Ca910b668839b82A54").onDelegate

  const bentoBalance = useTokenBalance(bentoAddress)
  const displayBalance = useMemo(() => {
    return getDisplayBalance(bentoBalance)
  }, [bentoBalance])

  const fetchVotes = useCallback(async () => {
    const votes = await getCurrentVotes(bento, account)
    const devsVotes = await getCurrentVotes(bento, "0x056E4fbF91a4292F747f99Ca910b668839b82A54")
    const proposalThreshold = await getProposalThreshold(bento);
    setvotes(getDisplayBalance(votes))
    setdevsVotes(getDisplayBalance(devsVotes))
    setProposalThreshold(getDisplayBalance(proposalThreshold))
  }, [account, bento])

  useEffect(() => {
    if (bento) {
      fetchVotes()
    }
  }, [fetchVotes, bento])
  
  
  return (
    <Modal>
      <ModalTitle text="My Account" />

      <StyledBalanceWrapper>
        <CardIcon>🍱</CardIcon>
        <StyledBalance>
          <StyledValue>{displayBalance}</StyledValue>
          <Label text="BENTO Balance" />
        </StyledBalance>
        <StyledBalance>
          <StyledValue>{votes}</StyledValue>
          <Label text="Current Votes" />
        </StyledBalance>
        <StyledBalance>
          <StyledValue>{devsVotes}</StyledValue>
          <Label text="Devs Votes" />
        </StyledBalance>
        <StyledBalance>
          <Label text="Proposal threshold is" />
          <StyledValue>{proposalThreshold}</StyledValue>
        </StyledBalance>
      </StyledBalanceWrapper>

      <StyledSpacer />
      {votes != "" && votes == "0.000" &&
        <Label text="Not yet?" /> && 
        <Button
          onClick={onDelegateSelf}
          text="Setup Vote"
        />
      }
      <StyledSpacer />
      <Button
        onClick={onDelegateDev}
        text="Share votes to Devs"
      />
      <StyledSpacer />
      <Button
        onClick={handleSignOutClick}
        text="Sign out"
      />
      <StyledSpacer />
    </Modal>
  )
}

const StyledSpacer = styled.div`
  height: ${props => props.theme.spacing[4]}px;
  width: ${props => props.theme.spacing[4]}px;
`

const StyledValue = styled.div`
  color: ${props => props.theme.color.grey[600]};
  font-size: 36px;
  font-weight: 700;
`

const StyledBalance = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
`

const StyledBalanceWrapper = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  margin-bottom: ${props => props.theme.spacing[2]}px;
`

const StyledBalanceIcon = styled.div`
  font-size: 36px;
  margin-right: ${props => props.theme.spacing[3]}px;
`

const StyledBalanceActions = styled.div`
  align-items: center;
  display: flex;
  margin-top: ${props => props.theme.spacing[4]}px;
`

export default AccountModal
