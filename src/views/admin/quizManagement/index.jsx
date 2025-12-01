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
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
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
      <Card
        flexDirection="column"
        w={{ base: "100%", md: "95%", lg: "90%" }}
        maxW="1200px"
        mx="auto"
        px={{ base: "8px", md: "0px" }}
        overflowX={{ sm: "scroll", lg: "hidden" }}
      >
        <Flex px="25px" mb="8px" justifyContent="space-between" align="center">
          <Text color={textColor} fontSize="22px" mb="4px" fontWeight="700" lineHeight="100%">
            All Quizzes
          </Text>
          <Button leftIcon={<Icon as={MdEdit} />} size='sm' onClick={createNewQuiz} variant='solid' colorScheme='purple'>New Quiz</Button>
        </Flex>

          <Box px={{ base: 2, md: 6 }}>
            <Table variant="simple" color="gray.500" mb="24px" mt="12px" tableLayout="fixed" size="sm">
            <Thead>
              <Tr>
                <Th borderColor={borderColor} onClick={() => handleSort("name")} cursor="pointer" w={{ base: "56px", md: "72px" }} textAlign="center" px={{ base: 2, md: 4 }} whiteSpace="nowrap">
                  <Flex align="center" gap="6px" justifyContent="center">
                    <Text color="gray.600" fontSize="11px" fontWeight="600">Quiz name</Text>
                    <Image src={ArrowIcon} alt="sort" boxSize="18px" transform={sortBy === "name" && sortDir === "asc" ? "rotate(180deg)" : "none"} opacity={0.7} />
                  </Flex>
                </Th>
                <Th borderColor={borderColor} onClick={() => handleSort("questions")} cursor="pointer" w={{ base: "70px", md: "90px" }} textAlign="center" px={{ base: 2, md: 4 }} whiteSpace="nowrap">
                  <Flex align="center" gap="6px" justifyContent="center">
                    <Text color="gray.600" fontSize="11px" fontWeight="600"># Questions</Text>
                    <Image src={ArrowIcon} alt="sort" boxSize="18px" transform={sortBy === "questions" && sortDir === "asc" ? "rotate(180deg)" : "none"} opacity={0.7} />
                  </Flex>
                </Th>
                <Th borderColor={borderColor} onClick={() => handleSort("topics")} cursor="pointer" w={{ base: "140px", md: "220px" }} px={{ base: 2, md: 4 }} whiteSpace="nowrap" textAlign="center">
                  <Flex align="center" justifyContent="center" gap="6px">
                    <Text color="gray.600" fontSize="11px" fontWeight="600">Topics</Text>
                    <Image src={ArrowIcon} alt="sort" boxSize="18px" transform={sortBy === "topics" && sortDir === "asc" ? "rotate(180deg)" : "none"} opacity={0.7} />
                  </Flex>
                </Th>
                <Th borderColor={borderColor} onClick={() => handleSort("types")} cursor="pointer" w={{ base: "80px", md: "80px" }} px={{ base: 2, md: 4 }} whiteSpace="nowrap">
                  <Flex align="center" gap="6px">
                    <Text color="gray.600" fontSize="11px" fontWeight="600">Types</Text>
                    <Image src={ArrowIcon} alt="sort" boxSize="18px" transform={sortBy === "types" && sortDir === "asc" ? "rotate(180deg)" : "none"} opacity={0.7} />
                  </Flex>
                </Th>
                <Th borderColor={borderColor} w={{ base: "8px", md: "90px" }} px={0} />
                <Th borderColor={borderColor} onClick={() => handleSort("avg")} cursor="pointer" w={{ base: "100px", md: "100px" }} px={{ base: 2, md: 2 }} whiteSpace="nowrap">
                  <Flex align="center" gap="6px">
                    <Text color="gray.600" fontSize="11px" fontWeight="600">Avg</Text>
                    <Image src={ArrowIcon} alt="sort" boxSize="18px" transform={sortBy === "avg" && sortDir === "asc" ? "rotate(180deg)" : "none"} opacity={0.7} />
                  </Flex>
                </Th>
                <Th borderColor={borderColor} onClick={() => handleSort("users")} cursor="pointer" w={{ base: "90px", md: "90px" }} textAlign="center" px={{ base: 2, md: 4 }} whiteSpace="nowrap">
                  <Flex align="center" gap="6px">
                    <Text color="gray.600" fontSize="11px" fontWeight="600">Users</Text>
                    <Image src={ArrowIcon} alt="sort" boxSize="18px" transform={sortBy === "users" && sortDir === "asc" ? "rotate(180deg)" : "none"} opacity={0.7} />
                  </Flex>
                </Th>
                <Th borderColor={borderColor} w={{ base: "90px", md: "110px" }} px={{ base: 2, md: 4 }}><Text color="gray.600" fontSize="11px" fontWeight="600">Actions</Text></Th>
              </Tr>
            </Thead>
            <Tbody>
              
              {sortedData.map((row) => (
                <Tr key={row.id} _hover={{ bg: rowHoverBg }} transition="background 0.12s ease">
                  <Td fontSize={{ sm: "13px" }} borderColor="transparent" w={{ base: "56px", md: "72px" }} textAlign="center" px={{ base: 2, md: 4 }}>{row.name}</Td>
                  <Td fontSize={{ sm: "13px" }} borderColor="transparent" w={{ base: "70px", md: "90px" }} textAlign="center" px={{ base: 2, md: 4 }}>{row.questions}</Td>
                  <Td fontSize={{ sm: "14px" }} borderColor="transparent" w={{ base: "140px", md: "220px" }} px={{ base: 2, md: 4 }}>
                    <Flex align="center">
                      {row.topics && row.topics.length > 0 ? (
                        <>
                          {!expandedRows[row.id] ? (
                            <>
                              <Menu>
                                <MenuButton as={Badge}
                                  colorScheme="purple"
                                  px="2"
                                  py="0.5"
                                  borderRadius="full"
                                  fontSize="11px"
                                  cursor="pointer"
                                  ms="0"
                                  display="inline-flex"
                                  alignItems="center"
                                >
                                  <Text as='span' mr='2' fontSize="12px">{row.topics[0]}</Text>
                                  <ChevronDownIcon w={3} h={3} />
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
                                  py="0.5"
                                  borderRadius="full"
                                  fontSize="11px"
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
                                    px="2"
                                    py="0.5"
                                    borderRadius="full"
                                    fontSize="11px"
                                    display="inline-flex"
                                    alignItems="center"
                                  >
                                    <Text as='span' mr='2' fontSize="12px">{row.topics[0]}</Text>
                                    <ChevronDownIcon w={3} h={3} />
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
                                    px="2"
                                    py="0.5"
                                    borderRadius="full"
                                    fontSize="11px"
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
                  <Td fontSize={{ sm: "13px" }} borderColor="transparent" w={{ base: "80px", md: "80px" }} px={{ base: 2, md: 4 }}>
                      <Flex align="center">
                        {(() => {
                          const icons = [
                            { key: "mcq", src: MCQIcon, alt: "Multiple choice" },
                            { key: "match", src: MatchIcon, alt: "Matching" },
                            { key: "write", src: FillIcon, alt: "Fill in the blank" },
                            { key: "listening", src: ListenIcon, alt: "Listening" },
                          ];

                          const hasType = (key) => {
                            // Prefer explicit `row.types` when present
                            if (Array.isArray(row.types) && row.types.length) {
                              try {
                                return row.types.map((t) => String(t).toLowerCase()).includes(key);
                              } catch (e) {
                                // ignore and continue to questions fallback
                              }
                            }

                            // If `row.questions` is an array of objects, inspect their `type`/`kind` fields
                            if (Array.isArray(row.questions) && row.questions.length && typeof row.questions[0] === 'object') {
                              return row.questions.some((q) => {
                                if (!q) return false;
                                const t = (q.type || q.kind || q.questionType || "").toString().toLowerCase();
                                return t === key || t.includes(key);
                              });
                            }

                            return false;
                          };

                          return icons.map((it) => {
                            const on = hasType(it.key);
                            return (
                              <Image
                                key={it.key}
                                src={it.src}
                                alt={it.alt}
                                boxSize="18px"
                                objectFit="contain"
                                mr="8px"
                                opacity={on ? 1 : 0.18}
                                filter={on ? "none" : "grayscale(100%)"}
                              />
                            );
                          });
                        })()}
                      </Flex>
                  </Td>
                  {/* spacer cell (invisible) */}
                  <Td borderColor="transparent" w={{ base: "8px", md: "48px" }} px={0} />
                  <Td fontSize={{ sm: "13px" }} borderColor="transparent" w={{ base: "100px", md: "100px" }} px={{ base: 2, md: 2 }}>
                    <Flex align="center">
                      <Text me="8px" fontWeight="700">{row.avg}%</Text>
                      <Box w="60px">
                        <Progress value={row.avg} size="sm" colorScheme={row.avg > 60 ? "green" : row.avg > 30 ? "yellow" : "red"} />
                      </Box>
                    </Flex>
                  </Td>
                  <Td fontSize={{ sm: "13px" }} borderColor="transparent" w={{ base: "70px", md: "90px" }} textAlign="center" px={{ base: 2, md: 2 }}>{row.users}</Td>
                  <Td fontSize={{ sm: "13px" }} borderColor="transparent" w={{ base: "90px", md: "110px" }} px={{ base: 2, md: 4 }}>
                      <Flex gap="6px" justifyContent="center">
                        <Box cursor="pointer" onClick={() => navigate('/admin/quiz-management/edit', { state: { quiz: row } })}>
                          <Icon as={MdEdit} color="blue.400" w={5} h={5} />
                        </Box>
                        <Box cursor="pointer" onClick={() => handleDeleteQuiz(row)}><Icon as={MdDelete} color="red.400" w={5} h={5} /></Box>
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
