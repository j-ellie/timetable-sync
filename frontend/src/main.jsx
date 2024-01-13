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
        <Alert status='success'>
          <AlertIcon />
          <AlertTitle>Happy New Year!</AlertTitle>
          <AlertDescription>Welcome back! We are ready to sync your Semester 2 timetable! Just log in below. ALSO! Check out our new <a href="/room-checker" style={{ textDecoration: "underline", fontWeight: "bold"}}>Room Availability Checker</a></AlertDescription>
        </Alert>
        <App />
      </GoogleOAuthProvider>
    </ChakraProvider>
  </React.StrictMode>,
)
