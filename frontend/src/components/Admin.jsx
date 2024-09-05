import React, { useState, useEffect } from 'react'
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  Box,
  Table,
  Thead,
  Tbody,
  Tfoot,
  Tr,
  Th,
  Td,
  TableCaption,
  TableContainer,
} from "@chakra-ui/react"

export default function Admin({ isOpen, onClose, apiEndpoint, userToken, userEmail, userId }) {
  const [adminInfo, setAdminInfo] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch(apiEndpoint + "/admin", { method: "GET", headers: { "Authorization": userToken, "userEmail": userEmail, "userId": userId }})
    .then(response => response.json())
    .then(data => {
      // console.log(data);
      if (data.success) {
        setAdminInfo(data);
      } else {
        console.log("something went wrong.")
        console.log(data);
      }
      return;
    })
    .catch(error => {
      console.error(error);
    })
  }, [isOpen])

  return (
    <Modal onClose={onClose} size="full" isOpen={isOpen}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Admin Menu</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Heading as="h3" textAlign="center" hidden={adminInfo}>Getting admin information from the server...</Heading>

          <Box hidden={!adminInfo} display="flex" flexDir="column">
          <Box display="flex" justifyContent="space-between" mb={10}>
            <Box backgroundColor="gray.300" w="fit-content" p={5} pl={8} pr={8} borderRadius="1em">
              <Stat>
                <StatLabel>Total Users</StatLabel>
                <StatNumber>{adminInfo?.users?.length}</StatNumber>
              </Stat>
            </Box>
            <Box backgroundColor="gray.300" w="fit-content" p={5} pl={8} pr={8} borderRadius="1em">
              <Stat>
                <StatLabel>Connected Server</StatLabel>
                <StatNumber>{apiEndpoint}</StatNumber>
              </Stat>
            </Box>
            <Box backgroundColor="gray.300" w="fit-content" p={5} pl={8} pr={8} borderRadius="1em">
              <Stat>
                <StatLabel>Global Sync Enabled</StatLabel>
                <StatNumber>{adminInfo?.daily_sync ? "endabled" : "disabled"}</StatNumber>
              </Stat>
            </Box>
          </Box>

          <TableContainer>
            <Table variant='striped'>
              <Thead>
                <Tr>
                  <Th>ID</Th>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Course Code</Th>
                  <Th>Sync Mode</Th>
                  <Th>E-Alerts</Th>
                  <Th>Last Sync</Th>
                  <Th>Ignored</Th>
                </Tr>
              </Thead>
              <Tbody>
                {adminInfo?.users.map(user => (
                  <Tr key={user._id}>
                    <Td>{user._id}</Td>
                    <Td>{user.name}</Td>
                    <Td>{user.email}</Td>
                    <Td>{!user.course_code ? "--" : user.course_code}</Td>
                    <Td>{!user.sync_time ? "--" : user.sync_time}</Td>
                    <Td>{user.email_notif ? "enabled" : "disabled"}</Td>
                    <Td>{user.last_sync.startsWith("0") ? "Never" : new Date(user.last_sync).toString().split("+")[0]}</Td>
                   </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose}>Close</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
