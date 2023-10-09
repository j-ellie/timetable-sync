import React from 'react'
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    useDisclosure,
    Button,
    useToast,
  } from '@chakra-ui/react'

export default function DeleteAccount({ processing, setProcessing, setSignIn, formData, apiEndpoint }) {
    const { isOpen, onOpen, onClose } = useDisclosure()
    const toast = useToast()

    const delAccount = () => {
        setProcessing(true)
        toast({
            title: 'Starting deletion of your account.',
            description: "Please wait a moment!",
            status: 'info',
            duration: 5000,
            isClosable: true,
        })
        fetch(apiEndpoint + "/delete", { method: "DELETE", body: JSON.stringify(formData), headers: { "Authorization": formData.access_token }})
        .then(response => response.json())
        .then(data => {
          setProcessing(false)
          if (!data.success) {
            console.error(data.message);
            toast({
              title: 'Deletion Failed.',
              description: "Error: " + data.message,
              status: 'error',
              duration: 5000,
              isClosable: true,
            })
          } else {
            setSignIn(false)
            toast({
              title: 'Account deleted.',
              description: "Come back soon!",
              status: 'success',
              duration: 5000,
              isClosable: true,
            })
          }
        })
        .catch(error => {
          setProcessing(false)
          console.error(error);
          toast({
            title: 'Saving Failed.',
            description: "Unkown Error. (Check Console)",
            status: 'error',
            duration: 5000,
            isClosable: true,
          })
        })

        
    }
    return (
      <>
        <Button colorScheme='red' w="100%" mt={4} onClick={onOpen} isDisabled={processing}>Stop Syncing</Button>
        {/* <Button onClick={onOpen}>Open Modal</Button> */}
  
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Are you sure you want to stop syncing?</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              This will delete all of your data from Timetable Sync immediately.
            </ModalBody>
  
            <ModalFooter>
              <Button colorScheme='blue' mr={3} onClick={onClose}>
                Close
              </Button>
              <Button variant='ghost' onClick={delAccount}>Confirm</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </>
    )
}
