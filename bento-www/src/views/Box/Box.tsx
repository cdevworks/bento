import React, { useMemo, useEffect } from 'react'
import styled from 'styled-components'

import { useParams } from 'react-router-dom'
import { useWallet } from 'use-wallet'
import { provider } from 'web3-core'

import Countdown, { CountdownRenderProps} from 'react-countdown'


import Button from '../../components/Button'
import PageHeader from '../../components/PageHeader'
import Spacer from '../../components/Spacer'

import useBox from '../../hooks/useBox'
import useRedeem from '../../hooks/useRedeem'
import { getContract } from '../../utils/erc20'

import Harvest from './components/Harvest'
import Stake from './components/Stake'

const Box: React.FC = () => {
  const { boxId } = useParams()
  const {
    contract,
    depositToken,
    depositTokenAddress,
    earnToken,
    name,
    icon,
  } = useBox(boxId) || {
    depositToken: '',
    depositTokenAddress: '',
    earnToken: '',
    name: '',
    icon: ''
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, []);

  const { ethereum } = useWallet()

  const tokenContract = useMemo(() => {
    return getContract(ethereum as provider, depositTokenAddress)
  }, [ethereum, depositTokenAddress])

  const { onRedeem } = useRedeem(contract)

  const depositTokenName = useMemo(() => {
    return depositToken.toUpperCase()
  }, [depositToken])

  const earnTokenName = useMemo(() => {
    return earnToken.toUpperCase()
  }, [earnToken])

  const countdownBlock = () => {
    const date = Date.parse('Sun Aug 23 2020 00:20:00 GMT+0800')
    if (Date.now() >= date) return "";
    return (
      <CountdownView>
        <Countdown date={date} />
      </CountdownView>
    )
  }

  const YamNotify = (token: String)=> {
    if (token != "yam") return ""
    return (
      <YamNotifyView>
        <p></p>
        <p>
          <a href=''></a>
        </p>
        {countdownBlock()}
      </YamNotifyView>
    )
  }

  const lpPoolTips = (token: String)=> {
    if (token != 'uni_lp') return ""
    return (
      <YamNotifyView>
        <p>
          If you want Add liquidity to Uniswap, please use this <a href='https://app.uniswap.org/#/add/0x8a727D058761F021Ea100a1c7b92536aC27b762A/0x9Ca884A5dF7ABe4619035596D39D912A1A02340D'>Uniswap link</a>.
        </p>
      </YamNotifyView>
    )
  }


  return (
    <>
      <PageHeader
        icon={icon}
        subtitle={`Deposit ${depositTokenName} and earn ${earnTokenName}`}
        title={name}
      />
      {YamNotify(depositToken)}
      <StyledBox>
        {
          lpPoolTips(depositToken)
        }
        <StyledCardsWrapper>
          <StyledCardWrapper>
            <Harvest poolContract={contract} />
          </StyledCardWrapper>
          <Spacer />
          <StyledCardWrapper>
            <Stake
              poolContract={contract}
              tokenContract={tokenContract}
              tokenName={depositToken.toUpperCase()}
            />
          </StyledCardWrapper>
        </StyledCardsWrapper>
        <Spacer size="lg" />
        <div>
          <Button
            onClick={onRedeem}
            text="Harvest & Withdraw"
          />
        </div>
        <Spacer size="lg" />
      </StyledBox>
    </>
  )
}

const StyledBox = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  @media (max-width: 768px) {
    width: 100%;
  }
`

const StyledCardsWrapper = styled.div`
  display: flex;
  width: 600px;
  @media (max-width: 768px) {
    width: 100%;
    flex-flow: column nowrap;
    align-items: center;
  }
`

const StyledCardWrapper = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  @media (max-width: 768px) {
    width: 80%;
  }
`

const CountdownView =  styled.div`
  font-size: 30px;
  font-weight: bold;
  color: rgb(209, 0, 75);
  margin-bottom: 20px;
`

const YamNotifyView =  styled.div`
  text-align: center;
  color: #555;
`


export default Box
