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
  } from '@chakra-ui/react'

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
        }).catch(err => {
            alert("Fetch Error");
            console.log(err);
        })

    }, [])

    useEffect(() => {
        setFilter(modules.slice((page * 100), (page * 100) + 100))

    }, [modules, page])

    useEffect(() => {
        setPage(0);
        const query = search.toLowerCase();

        console.log(query)

        const filtered = modules.filter(mod => {
            mod.some(field => field.toLowerCase().includes(query))
        })

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


    return (
        <div>
            <Button onClick={handlePrev} isDisabled={page === 0}>Prev</Button>
            <Button onClick={handleNext} isDisabled={filteredMods.length === 0}>Next</Button>

            <Input placeholder='Search for Module' onChange={handleSearchChange} />

            <TableContainer>
            <Table variant='simple'>
                <Thead>
                <Tr>
                    <Th>Code</Th>
                    <Th>Old Code</Th>
                    <Th>Name</Th>
                </Tr>
                </Thead>
                <Tbody>
                    {filteredMods.map(mod => (
                        <Tr key={mod[0]}>
                            <Td>{mod[0]}</Td>
                            <Td>{mod[1]}</Td>
                            <Td>{mod[2]}</Td>
                        </Tr>
                    ))}
                </Tbody>
                <TableCaption>
                    {filteredMods.length === 0 ? (<p>No modules found.</p>) : null}
                </TableCaption>
            </Table>
            </TableContainer>
        </div>
    )
}
