import React from 'react'
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
} from '@chakra-ui/react'

import { FaLocationDot, FaClock } from "react-icons/fa6";
import { LuText } from "react-icons/lu";
import { BsPeopleFill } from "react-icons/bs";

export default function EventPopover({ event, isOpen, onOpen, onClose, calApi }) {
    if (!event) return;
    const hideEvent = () => {
        event.remove();
        onClose();
    }

    let diff = new Date(event.end - event.start);
    // fix diff being off by an hour
    diff.setHours(diff.getHours() - 1);

    return (
        <>
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent>
            <ModalHeader>{event.title}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
                <div>
                    <Icon as={FaClock} mr={2} />
                    {diff.getHours() === 0 ? "" : `${diff.getHours()} hour${diff.getHours() === 1 ? "" : "s"}`}
                    {diff.getMinutes() === 0 ? "" : `${diff.getMinutes()} minutes.`}
                </div>
                <div>
                    <Icon as={LuText} mr={2} />
                    {event.extendedProps.description}
                </div>
                <div>
                    <Icon as={FaLocationDot} mr={2} />
                    {event.extendedProps.location}
                </div>
                <div>
                    <Icon as={BsPeopleFill} mr={2} />
                    {event.extendedProps.staff}
                </div>
            </ModalBody>

            <ModalFooter>
                <Button onClick={hideEvent}>Hide Event</Button>
                <Button colorScheme='red' ml={3} onClick={onClose}>
                Close
                </Button>
            </ModalFooter>
            </ModalContent>
        </Modal>
        </>
    )
}
