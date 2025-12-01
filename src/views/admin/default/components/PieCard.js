// Chakra imports
import { Box, Flex, Text, useColorModeValue } from "@chakra-ui/react";
// Custom components
import Card from "components/card/Card.js";
import PieChart from "components/charts/PieChart";
import { pieChartData, pieChartOptions } from "variables/charts";
import { VSeparator } from "components/separator/Separator";
import React from "react";

export default function Conversion(props) {
  const { completionRates = pieChartData, completionDetail = null, ...rest } = props;

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
        px={{ base: "8px", "2xl": "8px" }}
        justifyContent='space-between'
        alignItems='center'
        w='100%'
        mb='6px'>
        <Text color={textColor} fontSize='md' fontWeight='700' mt='1px'>
          Quiz completion rate
        </Text>
      </Flex>

      {
        (() => {
          // Create a copy of the default options and inject a tooltip formatter
          // that shows the raw counts from `completionDetail` instead of percentages.
          const localOptions = Object.assign({}, pieChartOptions);
          // Ensure tooltip object exists
          localOptions.tooltip = Object.assign({}, pieChartOptions.tooltip || {});
          // For pie charts, use y.formatter to control tooltip content
          localOptions.tooltip.y = Object.assign({}, pieChartOptions.tooltip && pieChartOptions.tooltip.y ? pieChartOptions.tooltip.y : {});
          localOptions.tooltip.y.formatter = (val, opts) => {
            try {
              const idx = opts && opts.seriesIndex != null ? opts.seriesIndex : 0;
              const keys = ["notStarted", "inProgress", "completed"];
              const key = keys[idx];
              if (completionDetail && completionDetail[key] != null) {
                return String(completionDetail[key]);
              }
            } catch (e) {
              // fallthrough
            }
            // fallback to showing the percentage value
            return String(val) + "%";
          };

          return (
            <PieChart
              h='200px'
              w='100%'
              chartData={completionRates}
              chartOptions={localOptions}
            />
          );
        })()
      }
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
          <Text fontSize={{ base: '12px', md: '14px' }} color='white' fontWeight='700'>
            {completionRates && completionRates[0] != null ? `${completionRates[0]}%` : '0%'}
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
          <Text fontSize={{ base: '12px', md: '14px' }} color='white' fontWeight='700'>
            {completionRates && completionRates[1] != null ? `${completionRates[1]}%` : '0%'}
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
          <Text fontSize={{ base: '12px', md: '14px' }} color='white' fontWeight='700'>
            {completionRates && completionRates[2] != null ? `${completionRates[2]}%` : '0%'}
          </Text>
        </Flex>
      </Card>
    </Card>
  );
}
