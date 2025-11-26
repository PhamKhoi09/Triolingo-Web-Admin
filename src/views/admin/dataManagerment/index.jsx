import React, { useState } from 'react';
import {
  Box,
  Button,
  Text,
  HStack,
  Stack,
  SimpleGrid,
  IconButton,
  useColorModeValue,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  Center,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import Card from 'components/card/Card.js';
import { MdRefresh, MdDelete, MdAdd } from 'react-icons/md';

const tags = [
  'Antonyms',
  'Example',
  'Words',
  'POS',
  'Definition',
  'Topics',
  'Pronunciation',
  'Word_Families',
  'Synonyms_Groups',
  'Word_Family_Mapping',
  'Word_Synonym_Mapping',
  'Word_Topic_Mapping',
];

const initialPairs = [
  [1, 6],
  [2, 7],
  [3, 8],
  [4, 9],
  [5, 10],
  [6, 11],
];

export default function DataManagerment() {
  const [pairs, setPairs] = useState(initialPairs);
  const [selectedTag, setSelectedTag] = useState(tags[0]);
  const updateModal = useDisclosure();
  const newModal = useDisclosure();
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [word1, setWord1] = useState('');
  const [word2, setWord2] = useState('');

  const openUpdate = (index) => {
    setSelectedIndex(index);
    setWord1(String(pairs[index][0]));
    setWord2(String(pairs[index][1]));
    updateModal.onOpen();
  };

  const openNew = () => {
    setSelectedIndex(null);
    setWord1('');
    setWord2('');
    newModal.onOpen();
  };

  const handleUpdate = () => {
    const updated = [...pairs];
    updated[selectedIndex] = [Number(word1), Number(word2)];
    setPairs(updated);
    updateModal.onClose();
  };

  const handleDelete = (index) => {
    const updated = pairs.filter((_, i) => i !== index);
    setPairs(updated);
  };

  const textColor = useColorModeValue('secondaryGray.900', 'white');
  return (
    <>
      <Box pt={{ base: '130px', md: '80px', xl: '80px' }} pb='40px'>
        <Box px={{ base: '16px', md: '30px' }}>
          <Stack spacing={6}>
            <HStack spacing={4} wrap='wrap'>
              {tags.map((t, i) => (
                <Button
                  key={i}
                  size='sm'
                  variant={selectedTag === t ? 'solid' : 'ghost'}
                  colorScheme='purple'
                  onClick={() => setSelectedTag(t)}
                >
                  {t}
                </Button>
              ))}
            </HStack>

            <Box>
              <Card mx='auto' maxW='760px' p='24px' borderRadius='16px'>
                <HStack justify='space-between' mb='16px'>
                  <Text fontSize='2xl' fontWeight='700' color={textColor}>
                    {selectedTag} {selectedTag === 'Antonyms' ? `(${pairs.length} x 2)` : ''}
                  </Text>
                  <Button leftIcon={<MdAdd />} size='sm' variant='outline' onClick={openNew}>
                    New
                  </Button>
                </HStack>

                <Box borderTopWidth='1px' borderTopColor='gray.100' pt='18px'>
                  {selectedTag === 'Antonyms' ? (
                    <SimpleGrid columns={3} spacing={0} align='center'>
                      <Box px='12px'>
                        <Text fontSize='sm' color='gray.400' mb='8px'>
                          word1_id
                        </Text>
                        <Stack spacing={6}>
                          {pairs.map((p, idx) => (
                            <Text key={idx} fontWeight='600' color={textColor}>
                              {p[0]}
                            </Text>
                          ))}
                        </Stack>
                      </Box>

                      <Box px='12px' borderLeftWidth='1px' borderRightWidth='1px' borderColor='gray.100'>
                        <Text fontSize='sm' color='gray.400' mb='8px'>
                          word2_id
                        </Text>
                        <Stack spacing={6}>
                          {pairs.map((p, idx) => (
                            <Text key={idx} fontWeight='600' color={textColor}>
                              {p[1]}
                            </Text>
                          ))}
                        </Stack>
                      </Box>

                      <Box px='12px'>
                        <Text fontSize='sm' color='gray.400' mb='8px'>
                          Actions
                        </Text>
                        <Stack spacing={4} align='center'>
                          {pairs.map((_, idx) => (
                            <HStack key={idx} spacing={2}>
                              <IconButton aria-label='update' icon={<MdRefresh />} size='sm' onClick={() => openUpdate(idx)} />
                              <IconButton aria-label='delete' icon={<MdDelete />} colorScheme='red' size='sm' onClick={() => handleDelete(idx)} />
                            </HStack>
                          ))}
                        </Stack>
                      </Box>
                    </SimpleGrid>
                  ) : (
                    <Center py={10}>
                      <Text color={textColor} fontWeight='600'>Content for {selectedTag} not implemented yet.</Text>
                    </Center>
                  )}
                </Box>
              </Card>
            </Box>
          </Stack>
        </Box>
      </Box>
      {/* Update Modal */}
      <Modal isOpen={updateModal.isOpen} onClose={updateModal.onClose} isCentered>
        <ModalOverlay bg='rgba(0,0,0,0.6)' />
        <ModalContent
          mx='20px'
          bg='purple.300'
          borderRadius='28px'
          py='20px'
          maxW='760px'
        >
          <ModalCloseButton color='gray.700' />
          <ModalHeader pt='8' pb='2' textAlign='center'>
            <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight='800' color='black'>Updating</Text>
          </ModalHeader>
          <ModalBody>
            <Center>
              <Box bg='white' p='20px' w='100%' maxW='640px' borderRadius='6px'>
                <SimpleGrid columns={[1,3]} spacing={0} align='center' templateColumns='1fr 48px 1fr'>
                  <Box px='20px' textAlign='center'>
                    <FormControl>
                      <FormLabel fontSize='sm' color='gray.500' mb='6px'>word1_id</FormLabel>
                      <Input value={word1} onChange={(e) => setWord1(e.target.value)} size='lg' textAlign='center' />
                    </FormControl>
                  </Box>
                  <Box display='flex' alignItems='center' justifyContent='center'>
                    <Box h='48px' borderLeftWidth='1px' borderColor='gray.200' />
                  </Box>
                  <Box px='20px' textAlign='center'>
                    <FormControl>
                      <FormLabel fontSize='sm' color='gray.500' mb='6px'>word2_id</FormLabel>
                      <Input value={word2} onChange={(e) => setWord2(e.target.value)} size='lg' textAlign='center' />
                    </FormControl>
                  </Box>
                </SimpleGrid>
              </Box>
            </Center>
          </ModalBody>
          <ModalFooter px='8' pt='6' pb='8' justifyContent='space-between'>
            <Button
              onClick={updateModal.onClose}
              bgGradient='linear(to-b, #0b84ff, #0077e6)'
              color='white'
              _hover={{ opacity: 0.9 }}
              boxShadow='lg'
              borderRadius='999px'
              px='10'
              py='6'
              fontSize='xl'
              fontWeight='700'
            >
              Cancel
            </Button>
            <Button
              onClick={() => { handleUpdate(); }}
              bgGradient='linear(to-b, #0b84ff, #0077e6)'
              color='white'
              _hover={{ opacity: 0.9 }}
              boxShadow='lg'
              borderRadius='999px'
              px='10'
              py='6'
              fontSize='xl'
              fontWeight='700'
            >
              Update
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* New Modal */}
      <Modal isOpen={newModal.isOpen} onClose={newModal.onClose} isCentered>
        <ModalOverlay bg='rgba(0,0,0,0.6)' />
        <ModalContent
          mx='20px'
          bg='purple.300'
          borderRadius='28px'
          py='20px'
          maxW='760px'
        >
          <ModalCloseButton color='gray.700' />
          <ModalHeader pt='8' pb='2' textAlign='center'>
            <Text fontSize={{ base: '2xl', md: '3xl' }} fontWeight='800' color='black'>Create Pair</Text>
          </ModalHeader>
          <ModalBody>
            <Center>
              <Box bg='white' p='20px' w='100%' maxW='640px' borderRadius='6px'>
                <SimpleGrid columns={[1,3]} spacing={0} align='center' templateColumns='1fr 48px 1fr'>
                  <Box px='20px' textAlign='center'>
                    <FormControl>
                      <FormLabel fontSize='sm' color='gray.500' mb='6px'>word1_id</FormLabel>
                      <Input value={word1} onChange={(e) => setWord1(e.target.value)} size='lg' textAlign='center' />
                    </FormControl>
                  </Box>
                  <Box display='flex' alignItems='center' justifyContent='center'>
                    <Box h='48px' borderLeftWidth='1px' borderColor='gray.200' />
                  </Box>
                  <Box px='20px' textAlign='center'>
                    <FormControl>
                      <FormLabel fontSize='sm' color='gray.500' mb='6px'>word2_id</FormLabel>
                      <Input value={word2} onChange={(e) => setWord2(e.target.value)} size='lg' textAlign='center' />
                    </FormControl>
                  </Box>
                </SimpleGrid>
              </Box>
            </Center>
          </ModalBody>
          <ModalFooter px='8' pt='6' pb='8' justifyContent='space-between'>
            <Button
              onClick={newModal.onClose}
              bgGradient='linear(to-b, #0b84ff, #0077e6)'
              color='white'
              _hover={{ opacity: 0.9 }}
              boxShadow='lg'
              borderRadius='999px'
              px='10'
              py='6'
              fontSize='xl'
              fontWeight='700'
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                const n1 = Number(word1);
                const n2 = Number(word2);
                setPairs((prev) => [...prev, [n1, n2]]);
                newModal.onClose();
              }}
              bgGradient='linear(to-b, #0b84ff, #0077e6)'
              color='white'
              _hover={{ opacity: 0.9 }}
              boxShadow='lg'
              borderRadius='999px'
              px='10'
              py='6'
              fontSize='xl'
              fontWeight='700'
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
