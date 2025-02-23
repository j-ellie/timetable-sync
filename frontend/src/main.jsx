import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ChakraProvider, extendTheme, ColorModeScript, } from '@chakra-ui/react'
import { GoogleOAuthProvider } from '@react-oauth/google';
import { MultiSelectTheme } from 'chakra-multiselect'
import { Analytics } from "@vercel/analytics/react"
import ConnectionChecker from './components/ConnectionChecker.jsx'

const theme = extendTheme({
  initialColorMode: "light",
  useSystemColorMode: true,
  components: {
    MultiSelect: MultiSelectTheme
  }
})

ReactDOM.createRoot(document.getElementById('root')).render(
  // <React.StrictMode>
    <ChakraProvider theme={theme} portalZIndex={100}>
      <GoogleOAuthProvider clientId="603064467469-2u4rh86o1c9t3np5avphpalgv4ia71ql.apps.googleusercontent.com">
        <ConnectionChecker />
        <ColorModeScript initialColorMode={theme.config.initialColorMode} />
        <App />
        <Analytics />
      </GoogleOAuthProvider>
    </ChakraProvider>
  // </React.StrictMode>,
)
