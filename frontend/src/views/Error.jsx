import { Box, Text, Heading, Link, Code, Flex } from '@chakra-ui/react'
import React from 'react'
import { WarningIcon } from "@chakra-ui/icons"

export default function Error({ error }) {

  return (
    <Box bgColor="gray.200" borderRadius="2em" width="30em" height="20em" p={3}>
        <Flex justifyContent="center" mt={5}>
          <WarningIcon color="red" fontSize="6em" />
        </Flex>

        <Heading mt={5} textAlign="center">An Error has Occured.</Heading>
        <Heading mt={3} textAlign="center" fontSize="lg">Please <Link href="/" color="blue.400">try again</Link> or contact <Link href="mailto:ts+james@jamesz.dev" color="blue.400">james@jamesz.dev</Link></Heading>
        <Text textAlign="center" mt={3}><b>Error:</b> <Code>{error}</Code></Text>
    </Box>
  )
}
