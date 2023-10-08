import { Box, Text, Heading, Select, FormLabel, Switch, FormControl, Tooltip, Button, Link, Spinner, Center, Flex } from '@chakra-ui/react'
import React from 'react'
import { googleLogout } from '@react-oauth/google'

export default function SignedIn({ setSignIn }) {

  return (
    <Box bgColor="gray.200" borderRadius="2em" width="30em" height="15em" p={3}>
        <Heading mt={5} textAlign="center">Hang on...</Heading>
        <Heading mt={3} textAlign="center" fontSize="lg">Logging you in...</Heading>

        <Flex justifyContent="center" mt={5}>
          <Spinner size="xl" />
        </Flex>
    </Box>
  )
}
