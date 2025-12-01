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
    <Card p='20px' align='center' direction='column' w='100%' {...rest}>
      <Flex
        px={{ base: "8px", "2xl": "10px" }}
        justifyContent='space-between'
        alignItems='center'
        w='100%'
        mb='8px'>
        <Text color={textColor} fontSize='md' fontWeight='600' mt='4px'>
          Quiz completion rate
        </Text>
      </Flex>

      <PieChart
        h='100%'
        w='100%'
        chartData={pieChartData}
        chartOptions={pieChartOptions}
      />
      <Card
        bg='#6E47FF'
        borderRadius='16px'
        flexDirection={{ base: 'column', md: 'row' }}
        boxShadow={cardShadow}
        w='100%'
        p='15px'
        px='20px'
        mt='15px'
        mx='auto'
        alignItems={{ base: 'stretch', md: 'center' }}
        justifyContent='space-between'
        flexWrap='wrap'>
        <Flex direction='column' py='5px' alignItems='flex-start' w={{ base: '100%', md: 'auto' }} mb={{ base: '12px', md: '0' }}>
          <Flex align='center'>
            <Box h='10px' w='10px' bg='white' borderRadius='50%' me='8px' />
            <Text
              fontSize={{ base: 'sm', md: 'sm' }}
              color='rgba(255,255,255,0.8)'
              fontWeight='600'
              mb='5px'>
              Not started
            </Text>
          </Flex>
          <Text fontSize={{ base: 'xl', md: '2xl' }} color='white' fontWeight='800'>
            23%
          </Text>
        </Flex>

        <VSeparator display={{ base: 'none', md: 'block' }} mx={{ base: '0', md: '24px' }} />

        <Flex direction='column' py='5px' alignItems={{ base: 'flex-start', md: 'center' }} w={{ base: '100%', md: 'auto' }} mb={{ base: '12px', md: '0' }}>
          <Flex align='center'>
            <Box h='10px' w='10px' bg='#4318FF' borderRadius='50%' me='8px' />
            <Text
              fontSize={{ base: 'sm', md: 'sm' }}
              color='rgba(255,255,255,0.9)'
              fontWeight='600'
              mb='5px'>
              In progress
            </Text>
          </Flex>
          <Text fontSize={{ base: 'xl', md: '2xl' }} color='white' fontWeight='800'>
            65%
          </Text>
        </Flex>

        <VSeparator display={{ base: 'none', md: 'block' }} mx={{ base: '0', md: '24px' }} />

        <Flex direction='column' py='5px' alignItems={{ base: 'flex-start', md: 'flex-end' }} w={{ base: '100%', md: 'auto' }}>
          <Flex align='center'>
            <Box h='10px' w='10px' bg='#6AD2FF' borderRadius='50%' me='8px' />
            <Text
              fontSize={{ base: 'sm', md: 'sm' }}
              color='rgba(255,255,255,0.9)'
              fontWeight='600'
              mb='5px'>
              Completed
            </Text>
          </Flex>
          <Text fontSize={{ base: 'xl', md: '2xl' }} color='white' fontWeight='800'>
            12%
          </Text>
        </Flex>
      </Card>
    </Card>
  );
}
