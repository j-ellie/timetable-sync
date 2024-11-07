import React from 'react'
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
    PopoverHeader,
    PopoverBody,
    PopoverArrow,
    PopoverCloseButton,
    Button,
  } from '@chakra-ui/react'
import { CalendarIcon } from '@chakra-ui/icons'

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function DateSelect({ selected, setSelected, cal }) {
    const onSelectDate = (e) => {
        cal.current.getApi().gotoDate(e)
    }

    const DateInput = React.forwardRef(
        ({ value, onClick, className }, ref) => (
          <Button className={className} onClick={onClick} ref={ref}>
            {value}
          </Button>
        ),
      );

    return (
        <>
        <Popover>
            <PopoverTrigger>
                <Button><CalendarIcon mr={1} /> Choose Date</Button>
            </PopoverTrigger>
            <PopoverContent w="fit-content">
                <PopoverArrow />
                <PopoverCloseButton />
                <PopoverHeader><b>Choose Date</b></PopoverHeader>
                <PopoverBody p={4}>
                    <DatePicker 
                        dateFormat="dd/MM/yyyy" 
                        selected={selected} 
                        onSelect={onSelectDate} 
                        onChange={(date) => setSelected(date)} 
                        customInput={<DateInput className="custom-input" />}
                    /> 
                </PopoverBody>
            </PopoverContent>
        </Popover>
        </>
    )
}
