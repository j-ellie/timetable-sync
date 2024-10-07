import { Button, useColorMode } from '@chakra-ui/react'
import { MdSunny } from "react-icons/md";
import { FaMoon } from 'react-icons/fa6';

import React from 'react'

export default function ColorModeSwitch() {
    const { colorMode, toggleColorMode } = useColorMode()
    return (
        <Button onClick={toggleColorMode} position="fixed" top={2} right={2}>
            {colorMode === 'dark' ? <FaMoon/> : <MdSunny />}
        </Button>
    )
}
