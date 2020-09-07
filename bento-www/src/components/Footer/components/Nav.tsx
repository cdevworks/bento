import React from 'react'
import styled from 'styled-components'

const Nav: React.FC = () => {
  return (
    <StyledNav>
      <StyledLink href="https://github.com/Sumo-Finance/bento">Github</StyledLink>
      <StyledLink href="https://twitter.com/SumoFinance">Twitter</StyledLink>
      <StyledLink href="https://app.uniswap.org/#/add/0x8a727D058761F021Ea100a1c7b92536aC27b762A/0x9Ca884A5dF7ABe4619035596D39D912A1A02340D">Add Liquidity</StyledLink>
      <StyledLink href="https://www.bitmex.com">Get Liquidated</StyledLink>    
    </StyledNav>
  )
}

const StyledNav = styled.nav`
  align-items: center;
  display: flex;
`

const StyledLink = styled.a`
  color: ${props => props.theme.color.grey[400]};
  padding-left: ${props => props.theme.spacing[3]}px;
  padding-right: ${props => props.theme.spacing[3]}px;
  text-decoration: none;
  &:hover {
    color: ${props => props.theme.color.grey[500]};
  }
`

export default Nav
