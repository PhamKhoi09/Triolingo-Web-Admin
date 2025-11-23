/*!
  _   _  ___  ____  ___ ________  _   _   _   _ ___   
 | | | |/ _ \|  _ \|_ _|__  / _ \| \ | | | | | |_ _| 
 | |_| | | | | |_) || |  / / | | |  \| | | | | || | 
 |  _  | |_| |  _ < | | / /| |_| | |\  | | |_| || |
 |_| |_|\___/|_| \_\___/____\___/|_| \_|  \___/|___|
                                                                                                                                                                                                                                                                                                                                       
=========================================================
* Horizon UI - v1.1.0
=========================================================

* Product Page: https://www.horizon-ui.com/
* Copyright 2023 Horizon UI (https://www.horizon-ui.com/)

* Designed and Coded by Simmmple

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/

// Chakra imports
import {
  Avatar,
  Box,
  Flex,
  FormLabel,
  Icon,
  Select,
  SimpleGrid,
  useColorModeValue,
} from "@chakra-ui/react";
// Assets
import Usa from "assets/img/dashboards/usa.png";
// Custom components
import MiniCalendar from "components/calendar/MiniCalendar";
import MiniStatistics from "components/card/MiniStatistics";
import IconBox from "components/icons/IconBox";
import React from "react";
import {
  MdAddTask,
  MdAttachMoney,
  MdBarChart,
  MdFileCopy,
  MdPerson,
} from "react-icons/md";
// Other components
import DailyTraffic from "views/admin/default/components/DailyTraffic";
import PieCard from "views/admin/default/components/PieCard";
import Card from "components/card/Card.js";
import TopDiligentTable from "views/admin/marketplace/components/TopDiligentTable";
import TopQuizTable from "views/admin/marketplace/components/TopQuizTable";
import tableDataTopDiligent from "views/admin/marketplace/variables/tableDataTopDiligent.json";
import tableDataTopQuiz from "views/admin/marketplace/variables/tableDataTopQuiz.json";

export default function UserReports() {
  // Chakra Color Mode
  const brandColor = useColorModeValue("brand.500", "white");
  const boxBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <SimpleGrid columns={{ base: 1, md: 3, lg: 3, "2xl": 3 }} gap='20px' mb='20px'>
        <MiniStatistics
          startContent={
            <IconBox
              w='64px'
              h='64px'
              bg={boxBg}
              icon={<Icon w='36px' h='36px' as={MdPerson} color={brandColor} />}
            />
          }
          name='Total Users'
          value={'1,234'}
          growth={'+4.2%'}
          reverse
        />
        <MiniStatistics
          startContent={
            <IconBox
              w='64px'
              h='64px'
              bg={boxBg}
              icon={<Icon w='36px' h='36px' as={MdAttachMoney} color={brandColor} />}
            />
          }
          name='Average usage time (h/day)'
          value='6.42'
          reverse
        />
        <MiniStatistics
          startContent={
            <IconBox
              w='64px'
              h='64px'
              bg={boxBg}
              icon={<Icon w='36px' h='36px' as={MdFileCopy} color={brandColor} />}
            />
          }
          name='Version app'
          value='1.0.3'
          reverse
        />
      </SimpleGrid>

      {/* Dashboard main sections */}
      <SimpleGrid columns={{ base: 1, md: 3 }} gap='20px' mb='20px'>
        <Card px='0px' mb='20px'>
          <TopDiligentTable tableData={tableDataTopDiligent} />
        </Card>

        <Card px='0px' mb='20px'>
          <TopQuizTable tableData={tableDataTopQuiz} />
        </Card>

        <SimpleGrid columns={{ base: 1 }} gap='20px'>
          <PieCard />
          <Card px='0px' mb='20px'>
            <DailyTraffic />
          </Card>
        </SimpleGrid>
      </SimpleGrid>
    </Box>
  );
}
