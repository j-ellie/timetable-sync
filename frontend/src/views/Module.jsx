import React, { useEffect, useState } from 'react'

import {
    Table,
    Thead,
    Tbody,
    Tfoot,
    Tr,
    Th,
    Td,
    TableCaption,
    TableContainer,
    Button,
    Input,
    Heading,
    Center,
    Flex,
    Box,
    useColorMode,
  } from '@chakra-ui/react'
import { FaHome } from 'react-icons/fa';

export default function Module() {
    const [ modules, setModules ] = useState([]);

    const [ filteredMods, setFilter ] = useState([]);
    const [ search, setSearch ] = useState("");

    const [ page, setPage ] = useState(0);

    useEffect(() => {
        fetch("/mods.json")
        .then(response => response.json())
        .then(data => {
            console.log(data)
            setModules(data);
            setFilter(data)
        }).catch(err => {
            alert("Fetch Error");
            console.log(err);
        })

    }, [])

    useEffect(() => {
        setPage(0);
        const query = search.toLowerCase();

        if (query === "" || query === " ") {
            setFilter(modules)
            return;
        }

        const filtered = modules.filter(mod =>
            mod.some(field =>
                field.toString().toLowerCase().includes(query) // Ensuring field is a string
            )
        );

        setFilter(filtered)

    }, [search])

    const handlePrev = () => {
        setPage(page - 1);
    }

    const handleNext = () => {
        setPage(page + 1);
    }

    const handleSearchChange = (e) => {
        console.log(e.target.value)
        setSearch(e.target.value)
    }

    const { colorMode } = useColorMode();


    return (
        <Flex justifyContent="center" mt="2em">
            <Button colorScheme='cyan' onClick={() => {window.location.href = "/"}} position="fixed" top={1} left={1}>
                <FaHome />
            </Button>
            <Flex flexDir='column' gap="1em">
            
            <Heading textAlign="center">DCU Modules</Heading>

            <Flex width="100%" gap="1em">
                <Button width="50%" onClick={handlePrev} isDisabled={page === 0}>Prev</Button>
                <Button width="50%" onClick={handleNext} isDisabled={filteredMods.slice(page * 100, (page * 100) + 100).length === 0}>Next</Button>
            </Flex>

            <Input placeholder='Search for Module' onChange={handleSearchChange} />

            <Box>
            <TableContainer overflowY="scroll" maxHeight="60vh">
            <Table variant='simple' >
                <Thead position="sticky" top={0} zIndex="1" width="100%" bgColor={colorMode === "light" ? "white" : "#1A202C"}>
                <Tr>
                    <Th>Code</Th>
                    <Th>Old Code</Th>
                    <Th>Name</Th>
                </Tr>
                </Thead>
                <Tbody>
                    {filteredMods.map((mod, index) => {
                        if (index >= page * 100 && index < (page * 100) + 100) {
                            return (
                                <Tr key={mod[0]} width="100%" tableLayout="fixed">
                                    <Td>{mod[0]}</Td>
                                    <Td>{mod[1]}</Td>
                                    <Td>{mod[2]}</Td>
                                </Tr>
                            )
                        } else {
                            return null
                        }
                    })}
                </Tbody>
                <TableCaption>
                    {filteredMods.slice(page * 100, (page * 100) + 100).length === 0 ? (<p>No modules found.</p>) : null}
                </TableCaption>
            </Table>
            </TableContainer>
            </Box>
            </Flex>
        </Flex>
    )
}
