import React, { useEffect, useState } from 'react'

import { Alert, AlertIcon, AlertDescription, AlertTitle } from "@chakra-ui/react"

export default function ConnectionChecker() {
  const apiEndpoint = import.meta.env.VITE_API_URL;
  

  const [errorCode, setErrorCode] = useState("?");
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
        console.log("Checking connection to server...")
        try {
            const response = await fetch(apiEndpoint + "/", {
                method: "HEAD", // Use HEAD to reduce data transfer
                mode: "no-cors", // Allow network request without expecting a response
              });

            console.log("Connection OK");


        } catch (error) {
            console.log("Connection NOT OK");
            setConnectionError(true);
            console.error(error);
            setErrorCode(error.toString().slice(0, 30) + "...")
        }
    }

    checkConnection()

  }, [])

  return (
    <div>
        <Alert status='error' hidden={!connectionError}>
          <AlertIcon />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Can't connect to the server. Try again later. (Error: {errorCode})</AlertDescription>
        </Alert>
    </div>
  )
}
