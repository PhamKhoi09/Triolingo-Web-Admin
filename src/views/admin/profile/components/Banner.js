// Chakra imports
import {
  Avatar,
  Box,
  Flex,
  Text,
  useColorModeValue,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  HStack,
  VStack,
} from "@chakra-ui/react";
import Card from "components/card/Card.js";
import React, { useState } from "react";
import { MdEdit } from 'react-icons/md';

export default function Banner(props) {
  const { banner, avatar, name, job, role, status, onRoleChange } = props;
  // Chakra Color Mode
  const textColorPrimary = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = "gray.400";
  const borderColor = useColorModeValue(
    "white !important",
    "#111C44 !important"
  );
  return (
    <Card mb={{ base: "0px", lg: "20px" }} align='center'>
      <Box
        bg={`url(${banner})`}
        bgSize='cover'
        borderRadius='16px'
        h='131px'
        w='100%'
      />
      <Avatar
        mx='auto'
        src={avatar}
        h='87px'
        w='87px'
        mt='-43px'
        border='4px solid'
        borderColor={borderColor}
      />
      <Text color={textColorPrimary} fontWeight='bold' fontSize='xl' mt='10px'>
        {name}
      </Text>
      <Text color={textColorSecondary} fontSize='sm'>
        {job}
      </Text>

      <Flex w='max-content' mx='auto' mt='18px' align='center' gap='24px'>
        <Flex align='center' direction='column'>
          <Text color={textColorPrimary} fontSize='md' fontWeight='700'>
            Role
          </Text>
          <HStack>
            <Text color={textColorSecondary} fontSize='sm'>
              {role}
            </Text>
            <EditRoleButton currentRole={role} onRoleChange={onRoleChange} textColorPrimary={textColorPrimary} textColorSecondary={textColorSecondary} />
          </HStack>
        </Flex>

        <Flex align='center' direction='column'>
          <Text color={textColorPrimary} fontSize='md' fontWeight='700'>
            Status
          </Text>
          <Text
            color={status === 'Online' ? 'green.500' : status === 'Suspended' ? 'red.500' : textColorSecondary}
            fontSize='sm'
            fontWeight='600'
          >
            {status}
          </Text>
        </Flex>
      </Flex>
    </Card>
  );
}

function EditRoleButton({ currentRole, onRoleChange, textColorPrimary, textColorSecondary }) {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selected, setSelected] = useState(currentRole || 'Learner');

  const apply = () => {
    if (onRoleChange) onRoleChange(selected);
    onClose();
  };

  return (
    <>
      <IconButton aria-label='Edit role' size='sm' icon={<MdEdit />} onClick={onOpen} variant='ghost' />
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent borderRadius='16px' maxW='420px'>
          <ModalHeader pt='24px' pb='6px'>Adjust Role</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align='stretch' textAlign='center'>
              <VStack>
                <Avatar size='xl' src={null} />
                <Text fontWeight='700'>maddison_c21</Text>
                <HStack spacing={4}>
                  <Text color={textColorSecondary}>Current Role:</Text>
                  <Text color='purple.500' fontWeight='700'>{currentRole}</Text>
                  <Text color={textColorSecondary}>Status:</Text>
                  <Text color='green.500' fontWeight='700'>Online</Text>
                </HStack>
              </VStack>

              <VStack spacing={3} mt={2}>
                <HStack spacing={3} justify='center'>
                  <Button variant={selected === 'Learner' ? 'solid' : 'outline'} colorScheme='purple' onClick={() => setSelected('Learner')}>Learner</Button>
                  <Button variant={selected === 'Contributor' ? 'solid' : 'outline'} colorScheme='yellow' onClick={() => setSelected('Contributor')}>Contributor</Button>
                  <Button variant={selected === 'Admin' ? 'solid' : 'outline'} colorScheme='red' onClick={() => setSelected('Admin')}>Admin</Button>
                </HStack>
              </VStack>
            </VStack>
          </ModalBody>
          <ModalFooter pb='24px'>
            <Button colorScheme='red' onClick={apply} w='full'>Apply</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
