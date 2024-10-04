import React, { useState } from 'react'
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalFooter,
    ModalBody,
    ModalCloseButton,
    Button,
    Icon,
    Text,
    InputGroup,
    Input,
    InputRightElement
} from '@chakra-ui/react'
import { FaCheck, FaCopy } from 'react-icons/fa6';


export default function EmbedModal({ isOpen, onOpen, onClose }) {
    const [copied, setCopied] = useState(false);

    const curr = new URL(window.location.href)
    curr.searchParams.append("embed", true);

    const copyUrl = () => {
        navigator.clipboard.writeText(curr.toString());
        setCopied(true);
        setTimeout(() => {
            setCopied(false);
        }, 3000)
    }

    return (
        <>
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
            <ModalHeader>Embed Timetable</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
                <Text>Paste the link below into a platform such as Notion to embed your timetable!</Text>
                <InputGroup size='md'>
                    <Input
                        pr='4.5rem'
                        type="text"
                        value={curr.toString()}
                        readOnly
                    />
                    <InputRightElement width='4.5rem'>
                        <Button h='1.75rem' size='sm' onClick={copyUrl} colorScheme={copied ? "green" : "gray"}>
                            {
                                copied ? (
                                    <Icon as={FaCheck} />
                                ) : (
                                    <Icon as={FaCopy} />
                                )
                            }
                        </Button>
                    </InputRightElement>
                </InputGroup>
            </ModalBody>

            <ModalFooter>
                <Button colorScheme='linkedin' ml={3} onClick={onClose}>
                Done
                </Button>
            </ModalFooter>
            </ModalContent>
        </Modal>
        </>
    )
}
