// Chakra imports
import { Box, Flex, Text, useColorModeValue } from "@chakra-ui/react";
// Custom components
import Card from "components/card/Card.js";
import PieChart from "components/charts/PieChart";
import { pieChartData, pieChartOptions } from "variables/charts";
import { VSeparator } from "components/separator/Separator";
import React from "react";

export default function Conversion(props) {
  const { ...rest } = props;

  // Chakra Color Mode
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const cardColor = useColorModeValue("white", "navy.700");
  const cardShadow = useColorModeValue(
    "0px 18px 40px rgba(112, 144, 176, 0.12)",
    "unset"
  );
  return (
    <Card p='8px' align='center' direction='column' w='100%' {...rest}>
      <Flex
        px={{ base: "0px", "2xl": "8px" }}
        justifyContent='space-between'
        alignItems='center'
        w='100%'
        mb='6px'>
        <Text color={textColor} fontSize='md' fontWeight='700' mt='1px'>
          Quiz completion rate
        </Text>
      </Flex>

      <PieChart
        h='200px'
        w='100%'
        chartData={pieChartData}
        chartOptions={pieChartOptions}
      />
      <Card
        bg='#6E47FF'
        borderRadius='8px'
        flexDirection='row'
        boxShadow={cardShadow}
        w={{ base: '100%', md: '80%' }}
        p='6px'
        px='8px'
        mt='8px'
        mb={{ base: '10px', md: '20px' }}
        mx='auto'
        alignItems='center'
        justifyContent='space-between'
        flexWrap='wrap'>
        <Flex direction='column' py='1px' alignItems='center' flex='1' minW={{ base: '80px', md: 'auto' }} mb={{ base: '6px', md: '0' }}>
          <Flex align='center'>
            <Box h='6px' w='6px' bg='white' borderRadius='50%' me='4px' />
            <Text
              fontSize={{ base: '9px', md: '10px' }}
              color='rgba(255,255,255,0.85)'
              fontWeight='600'
              mb='2px'>
              Not started
            </Text>
          </Flex>
          <Text fontSize={{ base: '12px', md: '14px' }} color='black' fontWeight='700'>
            23%
          </Text>
        </Flex>

        <VSeparator display={{ base: 'none', md: 'block' }} mx={{ base: '0', md: '8px' }} />

        <Flex direction='column' py='1px' alignItems='center' flex='1' minW={{ base: '80px', md: 'auto' }} mb={{ base: '6px', md: '0' }}>
          <Flex align='center'>
            <Box h='6px' w='6px' bg='#4318FF' borderRadius='50%' me='4px' />
            <Text
              fontSize={{ base: '9px', md: '10px' }}
              color='rgba(255,255,255,0.9)'
              fontWeight='600'
              mb='2px'>
              In progress
            </Text>
          </Flex>
          <Text fontSize={{ base: '12px', md: '14px' }} color='black' fontWeight='700'>
            65%
          </Text>
        </Flex>

        <VSeparator display={{ base: 'none', md: 'block' }} mx={{ base: '0', md: '8px' }} />

        <Flex direction='column' py='1px' alignItems='center' flex='1' minW={{ base: '80px', md: 'auto' }}>
          <Flex align='center'>
            <Box h='6px' w='6px' bg='#6AD2FF' borderRadius='50%' me='4px' />
            <Text
              fontSize={{ base: '9px', md: '10px' }}
              color='rgba(255,255,255,0.9)'
              fontWeight='600'
              mb='2px'>
              Completed
            </Text>
          </Flex>
          <Text fontSize={{ base: '12px', md: '14px' }} color='black' fontWeight='700'>
            12%
          </Text>
        </Flex>
      </Card>
    </Card>
  );
}
