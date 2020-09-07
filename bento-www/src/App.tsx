import React, { useCallback, useEffect, useState } from 'react'
import {
  HashRouter as Router,
  Route,
  Switch,
} from 'react-router-dom'
import { ThemeProvider } from 'styled-components'
import { UseWalletProvider } from 'use-wallet'

import MobileMenu from './components/MobileMenu'
import TopBar from './components/TopBar'

import ProposalsProvider from './contexts/Proposals'
import BoxesProvider from './contexts/Boxes'
import ModalsProvider from './contexts/Modals'
import BentoProvider from './contexts/BentoProvider'
import TransactionProvider from './contexts/Transactions'

import Boxes from './views/Boxes'
import Vote from './views/Vote'
import Home from './views/Home'
import Statics from './views/Statics'
import theme from './theme'

const App: React.FC = () => {
  const [mobileMenu, setMobileMenu] = useState(false)

  const handleDismissMobileMenu = useCallback(() => {
    setMobileMenu(false)
  }, [setMobileMenu])

  const handlePresentMobileMenu = useCallback(() => {
    setMobileMenu(true)
  }, [setMobileMenu])
  return (
    <Providers>
      <Router>
        <TopBar onPresentMobileMenu={handlePresentMobileMenu} />
        <MobileMenu onDismiss={handleDismissMobileMenu} visible={mobileMenu} />
        <Switch>
          <Route path="/" exact>
            <Home />
          </Route>
          <Route path="/boxes">
            <Boxes />
          </Route>
          <Route path="/vote">
            <Vote />
          </Route>
          <Route path="/stats">
            <Statics />
          </Route>
        </Switch>
      </Router>
    </Providers>
  )
}

const Providers: React.FC = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      <UseWalletProvider chainId={1}>
        <BentoProvider>
          <TransactionProvider>
            <ModalsProvider>
              <BoxesProvider>
                <ProposalsProvider>
                  {children}
                </ProposalsProvider>
              </BoxesProvider>
            </ModalsProvider>
          </TransactionProvider>
        </BentoProvider>
      </UseWalletProvider>
    </ThemeProvider>
  )
}

export default App
