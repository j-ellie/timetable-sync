import React, { useEffect, useRef, useState } from 'react'

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

    const topRef = useRef();

    useEffect(() => {
        fetch("/mods.json")
        .then(response => response.json())
        .then(data => {
            // console.log(data)
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

        if (topRef.current) {
            topRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }

    const handleNext = () => {
        setPage(page + 1);
        
        if (topRef.current) {
            topRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }

    const handleSearchChange = (e) => {
        setSearch(e.target.value)
    }

    const { colorMode } = useColorMode();


    return (
        <Box >
        <Flex justifyContent="center" mt="2em" maxWidth="100%">
            <Button colorScheme='cyan' onClick={() => {window.location.href = "/"}} position="fixed" top={1} left={1}>
                <FaHome />
            </Button>
            <Flex flexDir='column' gap="1em">
            
            <Heading textAlign="center">DCU Modules</Heading>

            <Flex width="90vw" gap="1em" >
                <Button flex="1" onClick={handlePrev} isDisabled={page === 0}>Prev</Button>
                <Button flex="1" onClick={handleNext} isDisabled={filteredMods.slice(page * 100, (page * 100) + 100).length === 0}>Next</Button>
            </Flex>

            <Input placeholder='Search for Module' onChange={handleSearchChange} />

            <TableContainer overflowY="scroll" overflowX="auto" maxHeight="60vh" maxWidth="90vw">
            <Table variant='simple' >
                <Thead position="sticky" top={0} zIndex="1" bgColor={colorMode === "light" ? "white" : "#1A202C"}>
                <Tr>
                    <Th>Code</Th>
                    <Th>Old Code</Th>
                    <Th>Name</Th>
                </Tr>
                </Thead>
                <Tbody>
                    <p ref={topRef}></p>
                    {filteredMods.map((mod, index) => {
                        if (index >= page * 100 && index < (page * 100) + 100) {
                            return (
                                <Tr key={mod[0]} tableLayout="fixed">
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
            </Flex>
        </Flex>
        </Box>
    )
}
