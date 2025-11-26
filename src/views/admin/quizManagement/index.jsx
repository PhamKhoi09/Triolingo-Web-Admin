/*
  Quiz Management view
  - Adds a new admin page that displays a table of quizzes
  - Header matches other tables (title + menu area)
  - Uses placeholder data and icons; update resources later as needed
*/
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Progress,
  Icon,
  useColorModeValue,
  Image,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from "@chakra-ui/react";
import { ChevronDownIcon } from '@chakra-ui/icons';
import ArrowIcon from "assets/img/icons/arrow_down.png";
import { fetchQuizzes as apiFetchQuizzes, createQuiz as apiCreateQuiz } from "../../../api/quizzes";
import { useToast } from "@chakra-ui/react";

import Card from "components/card/Card";
// import Menu from "components/menu/MainMenu";
import { MdEdit, MdDelete, MdClose } from "react-icons/md";
import MCQIcon from "assets/img/icons/Multiple choice.png";
import FillIcon from "assets/img/icons/Fill in the blank.png";
import MatchIcon from "assets/img/icons/Matching headings.png";
import ListenIcon from "assets/img/icons/Listen.png";

const sampleData = [
  { id: 1, name: "1", questions: 5, topics: ["Animals"], types: ["mcq"], avg: 75.5, users: 1500 },
  { id: 2, name: "2", questions: 10, topics: ["Animals"], types: ["mcq"], avg: 35.4, users: 1456 },
  { id: 3, name: "3", questions: 10, topics: ["Animals","Food"], types: ["mcq","write"], avg: 25, users: 1300 },
  { id: 4, name: "4", questions: 10, topics: ["Animals","Food","Travel"], types: ["mcq","write"], avg: 100, users: 1249 },
  { id: 5, name: "5", questions: 10, topics: ["Animals"], types: ["match"], avg: 12.2, users: 980 },
  { id: 6, name: "6", questions: 15, topics: ["Animals","Nature"], types: ["match"], avg: 12.2, users: 710 },
  { id: 7, name: "7", questions: 15, topics: ["Animals"], types: ["match"], avg: 12.2, users: 150 },
  { id: 8, name: "8", questions: 16, topics: ["Animals","Food"], types: ["match","write"], avg: 12.2, users: 80 },
  { id: 9, name: "9", questions: 17, topics: ["Animals","Food"], types: ["match","write"], avg: 12.2, users: 31 },
  { id: 10, name: "10", questions: 20, topics: ["Animals","Food","Sports"], types: ["match","write"], avg: 12.2, users: 10 },
  { id: 11, name: "11", questions: 9999, topics: ["Animals","Food","Sports","Nature"], types: ["match","write"], avg: 12.2, users: 2 },
];

export default function QuizManagement() {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const [expandedRows, setExpandedRows] = useState({});
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("desc");
  const navigate = useNavigate();
  // quizzes state (will be loaded from API)
  const [quizzes, setQuizzes] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  // Delete quiz dialog state
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [quizToDelete, setQuizToDelete] = useState(null);
  const cancelDeleteRef = React.useRef();
  const [createdQuizName, setCreatedQuizName] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const toast = useToast();

  // create a new empty quiz (next id)
  // Fetch quizzes from API on mount; fall back to sampleData on error
  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const data = await apiFetchQuizzes();
        if (mounted && Array.isArray(data)) {
          setQuizzes(data);
        } else if (mounted) {
          // Non-array response -> fallback
          setQuizzes(sampleData);
        }
      } catch (err) {
        // Fallback to sample data and show non-fatal toast
        if (mounted) {
          setQuizzes(sampleData);
          toast({ title: "Could not load quizzes from API.", description: "Using local sample data.", status: "warning", duration: 5000, isClosable: true });
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Create a new quiz with optimistic UI and API call
  async function createNewQuiz() {
    const nextId = Math.max(0, ...quizzes.map((q) => Number(q.id) || 0)) + 1;
    const payload = {
      name: String(nextId),
      questions: 0,
      topics: [],
      types: [],
      avg: 0,
      users: 0,
    };

    // optimistic item (temporary id)
    const tempId = `temp-${Date.now()}`;
    const optimistic = { ...payload, id: tempId };
    setQuizzes((prev) => [optimistic, ...prev]);

    try {
      const created = await apiCreateQuiz(payload);
      // Replace optimistic item with created item (if API returned object)
      setQuizzes((prev) => prev.map((q) => (q.id === tempId ? (created || payload) : q)));
      const nameToShow = (created && created.name) || payload.name;
      setCreatedQuizName(nameToShow);
      onOpen();
    } catch (err) {
      // If backend returns HTML (e.g. dev server 404) we'll get a JSON parse error
      // that contains '<' in the message. In that case assume backend isn't
      // implemented yet and keep a local-created quiz (simulate success).
      const msg = (err && err.message) || "Could not create quiz.";
      if (msg.includes("Unexpected token <") || msg.includes("<")) {
        // Replace optimistic item with a local-created item using numeric id
        const simulated = { ...payload, id: String(nextId) };
        setQuizzes((prev) => prev.map((q) => (q.id === tempId ? simulated : q)));
        setCreatedQuizName(simulated.name);
        toast({ title: "Backend not available", description: "Created quiz locally (development mode).", status: "info", duration: 5000, isClosable: true });
        onOpen();
      } else {
        // Rollback optimistic update
        setQuizzes((prev) => prev.filter((q) => q.id !== tempId));
        toast({ title: "Create failed", description: msg, status: "error", duration: 6000, isClosable: true });
      }
    }
  }

  function handleDeleteQuiz(q) {
    setQuizToDelete(q);
    onDeleteOpen();
  }

  function handleConfirmDeleteQuiz() {
    if (!quizToDelete) return;
    try {
      const id = quizToDelete.id;
      setQuizzes((prev) => prev.filter((qq) => qq.id !== id));
      setQuizToDelete(null);
      onDeleteClose();
      toast({ title: 'Quiz deleted', status: 'success', duration: 2500, isClosable: true });
    } catch (err) {
      console.error(err);
      toast({ title: 'Could not delete quiz', status: 'error', duration: 3000, isClosable: true });
    }
  }

  function toggleRow(id) {
    setExpandedRows((p) => ({ ...p, [id]: !p[id] }));
  }

  function handleSort(key) {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
  }

  function compareRows(a, b, key) {
    if (key === "topics") {
      const la = (a.topics || []).length;
      const lb = (b.topics || []).length;
      if (la !== lb) return la - lb;
      return String((a.topics && a.topics[0]) || "").localeCompare((b.topics && b.topics[0]) || "");
    }
    if (key === "types") {
      const la = (a.types || []).length;
      const lb = (b.types || []).length;
      return la - lb;
    }
    const va = a[key];
    const vb = b[key];
    // If both values are numbers, compare numerically
    if (typeof va === "number" && typeof vb === "number") return va - vb;
    // If both are numeric strings, compare numerically (handles ids like "1", "10", etc.)
    const numA = Number(va);
    const numB = Number(vb);
    if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB;
    return String(va || "").localeCompare(String(vb || ""));
  }

  const sortedData = React.useMemo(() => {
    if (!sortBy) return quizzes;
    const copy = [...quizzes];
    copy.sort((a, b) => {
      const res = compareRows(a, b, sortBy);
      return sortDir === "asc" ? res : -res;
    });
    return copy;
  }, [sortBy, sortDir, quizzes]);

  return (
    <>
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Card flexDirection="column" w="100%" px="0px" overflowX={{ sm: "scroll", lg: "hidden" }}>
        <Flex px="25px" mb="8px" justifyContent="space-between" align="center">
          <Text color={textColor} fontSize="22px" mb="4px" fontWeight="700" lineHeight="100%">
            All Quizzes
          </Text>
          <Button leftIcon={<Icon as={MdEdit} />} size='sm' onClick={createNewQuiz} variant='solid' colorScheme='purple'>New Quiz</Button>
        </Flex>

        <Box>
              <Table variant="simple" color="gray.500" mb="24px" mt="12px">
            <Thead>
              <Tr>
                <Th borderColor={borderColor} onClick={() => handleSort("name")} cursor="pointer">
                  <Flex align="center" gap="8px">
                    <Text color="gray.400" fontSize="12px">Quiz name</Text>
                    <Image src={ArrowIcon} alt="sort" boxSize="25px" transform={sortBy === "name" && sortDir === "asc" ? "rotate(180deg)" : "none"} opacity={0.7} />
                  </Flex>
                </Th>
                <Th borderColor={borderColor} onClick={() => handleSort("questions")} cursor="pointer">
                  <Flex align="center" gap="8px">
                    <Text color="gray.400" fontSize="12px">Number of question</Text>
                    <Image src={ArrowIcon} alt="sort" boxSize="25px" transform={sortBy === "questions" && sortDir === "asc" ? "rotate(180deg)" : "none"} opacity={0.7} />
                  </Flex>
                </Th>
                <Th borderColor={borderColor} onClick={() => handleSort("topics")} cursor="pointer">
                  <Flex align="center" gap="8px">
                    <Text color="gray.400" fontSize="12px">Topic included</Text>
                    <Image src={ArrowIcon} alt="sort" boxSize="25px" transform={sortBy === "topics" && sortDir === "asc" ? "rotate(180deg)" : "none"} opacity={0.7} />
                  </Flex>
                </Th>
                <Th borderColor={borderColor} onClick={() => handleSort("types")} cursor="pointer">
                  <Flex align="center" gap="8px">
                    <Text color="gray.400" fontSize="12px">Question types</Text>
                    <Image src={ArrowIcon} alt="sort" boxSize="25px" transform={sortBy === "types" && sortDir === "asc" ? "rotate(180deg)" : "none"} opacity={0.7} />
                  </Flex>
                </Th>
                <Th borderColor={borderColor} onClick={() => handleSort("avg")} cursor="pointer">
                  <Flex align="center" gap="8px">
                    <Text color="gray.400" fontSize="12px">Average grade</Text>
                    <Image src={ArrowIcon} alt="sort" boxSize="25px" transform={sortBy === "avg" && sortDir === "asc" ? "rotate(180deg)" : "none"} opacity={0.7} />
                  </Flex>
                </Th>
                <Th borderColor={borderColor} onClick={() => handleSort("users")} cursor="pointer">
                  <Flex align="center" gap="8px">
                    <Text color="gray.400" fontSize="12px">User joined</Text>
                    <Image src={ArrowIcon} alt="sort" boxSize="25px" transform={sortBy === "users" && sortDir === "asc" ? "rotate(180deg)" : "none"} opacity={0.7} />
                  </Flex>
                </Th>
                <Th borderColor={borderColor}><Text color="gray.400" fontSize="12px">Actions</Text></Th>
              </Tr>
            </Thead>
            <Tbody>
              
              {sortedData.map((row) => (
                <Tr key={row.id}>
                  <Td fontSize={{ sm: "14px" }} borderColor="transparent">{row.name}</Td>
                  <Td fontSize={{ sm: "14px" }} borderColor="transparent">{row.questions}</Td>
                  <Td fontSize={{ sm: "14px" }} borderColor="transparent">
                    <Flex align="center">
                      {row.topics && row.topics.length > 0 ? (
                        <>
                          {!expandedRows[row.id] ? (
                            <>
                              <Menu>
                                <MenuButton as={Badge}
                                  colorScheme="purple"
                                  px="3"
                                  py="1"
                                  borderRadius="full"
                                  fontSize="12px"
                                  cursor="pointer"
                                  ms="0"
                                  display="inline-flex"
                                  alignItems="center"
                                >
                                  <Text as='span' mr='2'>{row.topics[0]}</Text>
                                  <ChevronDownIcon w={4} h={4} />
                                </MenuButton>
                                <MenuList>
                                  {row.topics.map((t, i) => (
                                    <MenuItem key={t + i} onClick={() => { /* no-op for now */ }}>
                                      {t}
                                    </MenuItem>
                                  ))}
                                </MenuList>
                              </Menu>

                              {row.topics.length > 1 && (
                                <Badge
                                  colorScheme="gray"
                                  px="2"
                                  py="1"
                                  borderRadius="full"
                                  fontSize="12px"
                                  ms="8px"
                                >
                                  {row.topics.length}
                                </Badge>
                              )}
                            </>
                          ) : (
                            <Box>
                              <Flex align="center">
                                <Menu>
                                  <MenuButton as={Badge}
                                    colorScheme="purple"
                                    px="3"
                                    py="1"
                                    borderRadius="full"
                                    fontSize="12px"
                                    display="inline-flex"
                                    alignItems="center"
                                  >
                                    <Text as='span' mr='2'>{row.topics[0]}</Text>
                                    <ChevronDownIcon w={4} h={4} />
                                  </MenuButton>
                                  <MenuList>
                                    {row.topics.map((t, i) => (
                                      <MenuItem key={t + i}>{t}</MenuItem>
                                    ))}
                                  </MenuList>
                                </Menu>
                                <Box cursor="pointer" ms="6px" onClick={() => toggleRow(row.id)}>
                                  <Icon as={MdClose} w={4} h={4} color="gray.500" />
                                </Box>
                              </Flex>
                              <Box mt="8px">
                                {row.topics.slice(1).map((t, i) => (
                                  <Badge
                                    key={t + i}
                                    colorScheme="purple"
                                    px="3"
                                    py="1"
                                    borderRadius="full"
                                    fontSize="12px"
                                    display="inline-block"
                                    mb="6px"
                                  >
                                    {t}
                                  </Badge>
                                ))}
                              </Box>
                            </Box>
                          )}
                        </>
                      ) : (
                        <Text color="gray.400">-</Text>
                      )}
                    </Flex>
                  </Td>
                  <Td fontSize={{ sm: "14px" }} borderColor="transparent">
                    <Flex align="center">
                      {(() => {
                        const icons = [
                          { key: "mcq", src: MCQIcon, alt: "Multiple choice" },
                          { key: "match", src: MatchIcon, alt: "Matching" },
                          { key: "write", src: FillIcon, alt: "Fill in the blank" },
                          { key: "listening", src: ListenIcon, alt: "Listening" },
                        ];

                        return icons.map((it) => (
                          <Image
                            key={it.key}
                            src={it.src}
                            alt={it.alt}
                            boxSize="20px"
                            objectFit="contain"
                            mr="10px"
                            opacity={row.types.includes(it.key) ? 1 : 0.18}
                            filter={row.types.includes(it.key) ? "none" : "grayscale(100%)"}
                          />
                        ));
                      })()}
                    </Flex>
                  </Td>
                  <Td fontSize={{ sm: "14px" }} borderColor="transparent">
                    <Flex align="center">
                      <Text me="12px" fontWeight="700">{row.avg}%</Text>
                      <Box w="120px">
                        <Progress value={row.avg} size="sm" colorScheme={row.avg > 60 ? "green" : row.avg > 30 ? "yellow" : "red"} />
                      </Box>
                    </Flex>
                  </Td>
                  <Td fontSize={{ sm: "14px" }} borderColor="transparent">{row.users}</Td>
                  <Td fontSize={{ sm: "14px" }} borderColor="transparent">
                      <Flex gap="8px">
                        <Box cursor="pointer" onClick={() => navigate('/admin/quiz-management/edit', { state: { quiz: row } })}>
                          <Icon as={MdEdit} color="blue.400" w={6} h={6} />
                        </Box>
                        <Box cursor="pointer" onClick={() => handleDeleteQuiz(row)}><Icon as={MdDelete} color="red.400" w={6} h={6} /></Box>
                      </Flex>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Card>
    </Box>

        {/* Success modal shown after creating a new quiz */}
        <Modal isOpen={isOpen} onClose={() => { setCreatedQuizName(null); onClose(); }} isCentered>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Quiz created</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text>Successfully created quiz <Text as="span" fontWeight="700">{createdQuizName}</Text>.</Text>
            </ModalBody>

            <ModalFooter>
              <Button colorScheme="purple" mr={3} onClick={() => { setCreatedQuizName(null); onClose(); }}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
        {/* Delete quiz confirmation dialog */}
        <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelDeleteRef} onClose={() => { setQuizToDelete(null); onDeleteClose(); }}>
          <AlertDialogOverlay alignItems="center" justifyContent="center">
            <AlertDialogContent w={{ base: '92%', md: '720px' }} mx="auto">
              <AlertDialogHeader fontSize="xl" fontWeight="bold">Delete quiz</AlertDialogHeader>
              <AlertDialogBody>
                {quizToDelete ? `Are you sure you want to delete quiz ${quizToDelete.name || quizToDelete.id}? This action cannot be undone.` : 'Are you sure you want to delete this quiz?'}
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={cancelDeleteRef} onClick={() => { setQuizToDelete(null); onDeleteClose(); }} variant="ghost" size="md">Cancel</Button>
                <Button colorScheme="red" onClick={handleConfirmDeleteQuiz} ml={3} size="md">Delete</Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
        </>
  );
}
