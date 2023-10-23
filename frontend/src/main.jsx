import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { ChakraProvider, Alert, AlertIcon, AlertTitle, AlertDescription } from '@chakra-ui/react'
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChakraProvider>
      <GoogleOAuthProvider clientId="603064467469-2u4rh86o1c9t3np5avphpalgv4ia71ql.apps.googleusercontent.com">
        {/* <Alert status='error'>
          <AlertIcon />
          <AlertTitle>Timetable Sync is unavailable at this time.</AlertTitle>
          <AlertDescription>Due to an ISP issue, Timetable Sync is down until further notice. Sorry :(</AlertDescription>
        </Alert> */}
        <App />
      </GoogleOAuthProvider>
    </ChakraProvider>
  </React.StrictMode>,
)
