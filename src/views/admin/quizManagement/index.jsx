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
  Select,
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
  Input,
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
import { fetchQuizzes as apiFetchQuizzes, fetchQuiz as apiFetchQuiz, createQuiz as apiCreateQuiz, fetchTopics as apiFetchTopics, deleteQuiz as apiDeleteQuiz } from "../../../api/quizzes";
import { useToast } from "@chakra-ui/react";

import Card from "components/card/Card";
// import Menu from "components/menu/MainMenu";
import { MdEdit, MdDelete, MdClose } from "react-icons/md";
import MCQIcon from "assets/img/icons/Multiple choice.png";
import FillIcon from "assets/img/icons/Fill in the blank.png";
import MatchIcon from "assets/img/icons/Matching headings.png";
import ListenIcon from "assets/img/icons/Listen.png";



export default function QuizManagement() {
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const rowHoverBg = useColorModeValue("gray.50", "whiteAlpha.50");
  const grayTextColor = useColorModeValue("gray.600", "white");
  const tableTextColor = useColorModeValue("gray.500", "whiteAlpha.800");
  const isDarkMode = useColorModeValue(false, true);
  const [expandedRows, setExpandedRows] = useState({});
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState("desc");
  const navigate = useNavigate();
  // quizzes state (will be loaded from API)
  const [quizzes, setQuizzes] = useState([]);
  const { isOpen, onOpen, onClose } = useDisclosure();
  // Create-quiz config modal
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  // Delete quiz dialog state
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [quizToDelete, setQuizToDelete] = useState(null);
  const cancelDeleteRef = React.useRef();
  const [createdQuizName, setCreatedQuizName] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  // Create form state
  const [createName, setCreateName] = useState("");
  const [createTopicId, setCreateTopicId] = useState("");
  const [createTopicName, setCreateTopicName] = useState("");
  const [createPassingScore, setCreatePassingScore] = useState(100);
  const [createDurationMinutes, setCreateDurationMinutes] = useState(1);
  const [createTopicOptions, setCreateTopicOptions] = useState([]);
  const [loadingCreateTopics, setLoadingCreateTopics] = useState(false);
  const toast = useToast();

  // create a new empty quiz (next id)
  // Fetch quizzes from API on mount; fall back to sampleData on error
  useEffect(() => {
    let mounted = true;
    (async () => {
      setIsLoading(true);
      try {
        const data = await apiFetchQuizzes();
        // Accept either an array or an object with a `data` array
        const items = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : null);
        if (mounted && Array.isArray(items)) {
          // Normalize items to only the fields the table needs
          const normalized = items.map((item) => {
            const id = item.id || item.quiz_id || item._id || "";
            const name = item.name || item.title || String(id);
            const topics = Array.isArray(item.topics) && item.topics.length ? item.topics : (item.topic_name ? [item.topic_name] : []);
            const questions = Number(item.questions || item.questionCount || item.question_count || 0) || 0;
            let avg = 0;
            if (typeof item.avg === 'number') avg = item.avg;
            else if (typeof item.avgGrade === 'string') avg = parseFloat(item.avgGrade.replace(/%/g, '')) || 0;
            else if (typeof item.avgGrade === 'number') avg = item.avgGrade;
            const users = Number(item.users || item.userJoined || item.user_joined || 0) || 0;
            // Normalize any possible types field: `types`, `questionTypes`, `QuestionTypes`, `question_types`
            const possibleTypes = item.types || item.questionTypes || item.QuestionTypes || item.question_types || item.Question_Types || [];
            const normalizeType = (raw) => {
              const s = String(raw || '').toLowerCase();
              if (s.includes('listen')) return 'listening';
              if (s.includes('fill') || s.includes('gap') || s.includes('cloze') || s.includes('blank')) return 'write';
              if (s.includes('img') && s.includes('choose')) return 'mcq';
              if (s.includes('choose') && s.includes('text')) return 'mcq';
              if (s.includes('match') || s.includes('pair')) return 'match';
              if (s.includes('mcq') || s.includes('multiple')) return 'mcq';
              if (s.includes('write')) return 'write';
              return s || '';
            };
            const types = Array.isArray(possibleTypes) && possibleTypes.length ? possibleTypes.map((t) => normalizeType(t)).filter(Boolean) : [];
            return {
              id,
              name,
              topics,
              questions,
              types,
              avg,
              users,
            };
          });
          setQuizzes(normalized);

          // For quizzes that don't include `types` info, fetch details in background
          // and derive types from their questions so icons reflect actual question types.
          (async () => {
            for (const it of normalized) {
              if ((!it.types || it.types.length === 0) && it.id) {
                try {
                  const detailed = await apiFetchQuiz(String(it.id));
                  if (detailed && Array.isArray(detailed.questions)) {
                    const derived = new Set();
                    const mapType = (raw) => {
                      const s = (raw || '').toString().toLowerCase();
                      if (s.includes('listen')) return 'listening';
                      if (s.includes('img') && s.includes('choose')) return 'mcq';
                      if (s.includes('choose') && s.includes('text')) return 'mcq';
                      if (s.includes('fill') || s.includes('blank') || s.includes('cloze')) return 'write';
                      if (s.includes('match') || s.includes('pair')) return 'match';
                      if (s.includes('mcq') || s.includes('multiple')) return 'mcq';
                      if (s.includes('write')) return 'write';
                      return 'mcq';
                    };
                    for (const q of detailed.questions) {
                      const qt = mapType(q.type || q.question_type || q.questionType || q.kind || '');
                      derived.add(qt);
                    }
                    const typesArr = Array.from(derived);
                    // Update the quiz row with derived types and optionally questions count
                    setQuizzes((prev) => prev.map((q) => (String(q.id) === String(it.id) ? { ...q, types: typesArr, questions: q.questions || detailed.questions.length } : q)));
                  }
                } catch (e) {
                  // ignore per-row failures
                }
              }
            }
          })();
        } else if (mounted) {
          // Non-array response -> no quizzes available from API
          setQuizzes([]);
        }
      } catch (err) {
        // Fallback to sample data and show non-fatal toast
        if (mounted) {
          setQuizzes([]);
          toast({ title: "Could not load quizzes from API.", description: "Quizzes are unavailable in development mode.", status: "warning", duration: 5000, isClosable: true });
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Create a new quiz with optimistic UI and API call
  async function createNewQuiz() {
    setLoadingCreateTopics(true);
    try {
      // Fetch topics directly from /api/topics
      const topicsApi = await apiFetchTopics();
      const normalized = Array.isArray(topicsApi)
        ? topicsApi.map((t, i) => (typeof t === 'string' ? { id: String(i + 1), name: t } : { id: String(t.topic_id || t.id || i + 1), name: t.topic_name || t.name || String(t) }))
        : [];
      setCreateTopicOptions(normalized);
      if (normalized.length) {
        setCreateTopicId(normalized[0].id);
      }
    } catch (e) {
      // If topics can't be fetched, leave the options empty and allow manual entry
      setCreateTopicOptions([]);
    } finally {
      setLoadingCreateTopics(false);
      // Open the modal after attempting to load topics so the Select is populated when shown
      onCreateOpen();
    }
  }

  // Submit handler for the create-quiz modal
  async function handleCreateSubmit() {
    const nextId = Math.max(0, ...quizzes.map((q) => Number(q.id) || 0)) + 1;
    // determine selected topic name if available
    const selectedTopic = (createTopicOptions && createTopicOptions.find((t) => String(t.id) === String(createTopicId))) || null;
    const selectedTopicName = selectedTopic ? selectedTopic.name : (createTopicName || null);

    const payload = {
      quiz_id: Number(nextId),
      title: createName && createName.trim() ? createName.trim() : `Quiz: ${selectedTopicName || String(nextId)}`,
      topic_id: createTopicId ? (isNaN(Number(createTopicId)) ? createTopicId : Number(createTopicId)) : undefined,
      passing_score: Number(createPassingScore) || 0,
      duration_minutes: Number(createDurationMinutes) || 0,
    };

    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, name: payload.title, topics: selectedTopicName ? [selectedTopicName] : [], questions: 0, types: [], avg: 0, users: 0 };
    setQuizzes((prev) => [optimistic, ...prev]);
    onCreateClose();
    try {
      const created = await apiCreateQuiz(payload);
      // If backend returns created quiz object, try to map it into list row shape, otherwise fallback to payload
      const toInsert = created && (created.id || created.quiz_id || created._id) ? ({ id: created.id || created.quiz_id || created._id, name: created.title || created.name || payload.title, topics: created.topics || (selectedTopicName ? [selectedTopicName] : []) }) : { id: String(payload.quiz_id), name: payload.title, topics: selectedTopicName ? [selectedTopicName] : [] };
      setQuizzes((prev) => prev.map((q) => (q.id === tempId ? toInsert : q)));
      setCreatedQuizName(toInsert.name);
      onOpen();
      // clear create form
      setCreateName("");
      setCreateTopicId("");
      setCreateTopicName("");
      setCreatePassingScore(100);
      setCreateDurationMinutes(1);
    } catch (err) {
      const msg = (err && err.message) || "Could not create quiz.";
      if (msg.includes("Unexpected token <") || msg.includes("<")) {
        const simulated = { id: String(nextId), name: payload.title, topics: selectedTopicName ? [selectedTopicName] : [] };
        setQuizzes((prev) => prev.map((q) => (q.id === tempId ? simulated : q)));
        setCreatedQuizName(simulated.name);
        toast({ title: "Backend not available", description: "Created quiz locally (development mode).", status: "info", duration: 5000, isClosable: true });
        onOpen();
      } else {
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
    const id = quizToDelete.id;
    // Optimistically remove from UI and call API; rollback if delete fails
    const prev = quizzes;
    try {
      setQuizzes((prevQ) => prevQ.filter((qq) => String(qq.id) !== String(id)));
      setQuizToDelete(null);
      onDeleteClose();
      // Call API
      apiDeleteQuiz(id).then(() => {
        toast({ title: 'Quiz deleted', status: 'success', duration: 2500, isClosable: true });
      }).catch((err) => {
        // rollback
        setQuizzes(prev);
        const msg = (err && err.message) || 'Could not delete quiz';
        toast({ title: 'Delete failed', description: msg, status: 'error', duration: 4000, isClosable: true });
      });
    } catch (err) {
      console.error(err);
      setQuizzes(prev);
      toast({ title: 'Could not delete quiz', status: 'error', duration: 3000, isClosable: true });
    }
  }

  function toggleRow(id) {
    setExpandedRows((p) => ({ ...p, [id]: !p[id] }));
  }

  async function handleEditQuiz(row) {
    try {
      setIsLoading(true);
      const detailed = await apiFetchQuiz(row.id);
      // Debug: log what we received and will pass to the editor
      try {
        // eslint-disable-next-line no-console
        console.log('[QuizManagement] edit requested, row:', row);
        // eslint-disable-next-line no-console
        console.log('[QuizManagement] detailed fetch result:', detailed);
      } catch (e) {}
      // If API returns an object with questions, navigate with full quiz, otherwise use row
      // Also pass the original row's topics as a fallback under `sourceRowTopics` so the editor can use them
      const payload = detailed && detailed.questions ? { ...detailed, sourceRowTopics: row.topics || [] } : { ...row, sourceRowTopics: row.topics || [] };
      navigate('/admin/quiz-management/edit', { state: { quiz: payload } });
    } catch (err) {
      toast({ title: 'Could not load quiz details', description: (err && err.message) || 'Opening editor with basic data', status: 'warning', duration: 4000, isClosable: true });
      navigate('/admin/quiz-management/edit', { state: { quiz: row } });
    } finally {
      setIsLoading(false);
    }
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

  // Compute a display name for each quiz:
  // - if quiz has exactly 1 topic -> use that topic name
  // - if quiz has >1 topics -> name as "Test 1", "Test 2" (sequential among multi-topic quizzes)
  // - otherwise fallback to existing `name` or '-'
  const dataWithDisplayName = React.useMemo(() => {
    let multiCounter = 0;
    return quizzes.map((q) => {
      const topics = Array.isArray(q.topics) ? q.topics : [];
      let displayName = q.name || "-";
      if (topics.length === 1) displayName = topics[0];
      else if (topics.length > 1) {
        multiCounter += 1;
        displayName = `Test ${multiCounter}`;
      }
      return { ...q, displayName };
    });
  }, [quizzes]);

  const sortedData = React.useMemo(() => {
    if (!sortBy) return dataWithDisplayName;
    const copy = [...dataWithDisplayName];
    copy.sort((a, b) => {
      const res = compareRows(a, b, sortBy);
      return sortDir === "asc" ? res : -res;
    });
    return copy;
  }, [sortBy, sortDir, dataWithDisplayName]);

  return (
    <>
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Card
        flexDirection="column"
        w={{ base: "100%", md: "100%", lg: "100%" }}
        maxW="1800px"
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
            <Table variant="simple" color={tableTextColor} mb="24px" mt="12px" tableLayout="auto" size="sm" w="100%">
            <Thead>
              <Tr>
                <Th borderColor={borderColor} onClick={() => handleSort("id")} cursor="pointer" w={{ base: "56px", md: "72px" }} textAlign="center" px={{ base: 2, md: 4 }} whiteSpace="nowrap">
                  <Flex align="center" gap="6px" justifyContent="center">
                    <Text color={grayTextColor} fontSize="11px" fontWeight="600">Quiz ID</Text>
                    <Image src={ArrowIcon} alt="sort" boxSize="18px" transform={sortBy === "id" && sortDir === "asc" ? "rotate(180deg)" : "none"} opacity={0.7} />
                  </Flex>
                </Th>
                <Th borderColor={borderColor} onClick={() => handleSort("displayName")} cursor="pointer" w={{ base: "120px", md: "180px" }} textAlign="center" px={{ base: 2, md: 4 }} whiteSpace="nowrap">
                  <Flex align="center" gap="6px" justifyContent="center">
                    <Text color={grayTextColor} fontSize="11px" fontWeight="600">Quiz name</Text>
                    <Image src={ArrowIcon} alt="sort" boxSize="18px" transform={sortBy === "displayName" && sortDir === "asc" ? "rotate(180deg)" : "none"} opacity={0.7} />
                  </Flex>
                </Th>
                <Th borderColor={borderColor} onClick={() => handleSort("questions")} cursor="pointer" w={{ base: "70px", md: "90px" }} textAlign="center" px={{ base: 2, md: 4 }} whiteSpace="nowrap">
                  <Flex align="center" gap="6px" justifyContent="center">
                    <Text color={grayTextColor} fontSize="11px" fontWeight="600"># Questions</Text>
                    <Image src={ArrowIcon} alt="sort" boxSize="18px" transform={sortBy === "questions" && sortDir === "asc" ? "rotate(180deg)" : "none"} opacity={0.7} />
                  </Flex>
                </Th>
                <Th borderColor={borderColor} onClick={() => handleSort("topics")} cursor="pointer" w={{ base: "140px", md: "220px" }} px={{ base: 2, md: 4 }} whiteSpace="nowrap" textAlign="center">
                  <Flex align="center" justifyContent="center" gap="6px">
                    <Text color={grayTextColor} fontSize="11px" fontWeight="600">Topics</Text>
                    <Image src={ArrowIcon} alt="sort" boxSize="18px" transform={sortBy === "topics" && sortDir === "asc" ? "rotate(180deg)" : "none"} opacity={0.7} />
                  </Flex>
                </Th>
                <Th borderColor={borderColor} onClick={() => handleSort("types")} cursor="pointer" w={{ base: "80px", md: "80px" }} px={{ base: 2, md: 4 }} whiteSpace="nowrap">
                  <Flex align="center" gap="6px">
                    <Text color={grayTextColor} fontSize="11px" fontWeight="600">Types</Text>
                    <Image src={ArrowIcon} alt="sort" boxSize="18px" transform={sortBy === "types" && sortDir === "asc" ? "rotate(180deg)" : "none"} opacity={0.7} />
                  </Flex>
                </Th>
                <Th borderColor={borderColor} w={{ base: "8px", md: "90px" }} px={0} />
                <Th borderColor={borderColor} onClick={() => handleSort("avg")} cursor="pointer" w={{ base: "100px", md: "100px" }} px={{ base: 2, md: 2 }} whiteSpace="nowrap">
                  <Flex align="center" gap="6px">
                    <Text color={grayTextColor} fontSize="11px" fontWeight="600">Avg</Text>
                    <Image src={ArrowIcon} alt="sort" boxSize="18px" transform={sortBy === "avg" && sortDir === "asc" ? "rotate(180deg)" : "none"} opacity={0.7} />
                  </Flex>
                </Th>
                <Th borderColor={borderColor} onClick={() => handleSort("users")} cursor="pointer" w={{ base: "90px", md: "90px" }} textAlign="center" px={{ base: 2, md: 4 }} whiteSpace="nowrap">
                  <Flex align="center" gap="6px">
                    <Text color={grayTextColor} fontSize="11px" fontWeight="600">Users</Text>
                    <Image src={ArrowIcon} alt="sort" boxSize="18px" transform={sortBy === "users" && sortDir === "asc" ? "rotate(180deg)" : "none"} opacity={0.7} />
                  </Flex>
                </Th>
                <Th borderColor={borderColor} w={{ base: "90px", md: "110px" }} px={{ base: 2, md: 4 }}><Text color={grayTextColor} fontSize="11px" fontWeight="600">Actions</Text></Th>
              </Tr>
            </Thead>
            <Tbody>
              
              {sortedData.map((row) => (
                <Tr key={row.id} _hover={{ bg: rowHoverBg }} transition="background 0.12s ease">
                  <Td fontSize={{ sm: "13px" }} borderColor="transparent" w={{ base: "56px", md: "72px" }} textAlign="center" px={{ base: 2, md: 4 }}>{row.id}</Td>
                  <Td fontSize={{ sm: "13px" }} borderColor="transparent" w={{ base: "120px", md: "180px" }} textAlign="center" px={{ base: 2, md: 4 }}>{row.displayName}</Td>
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
                        <Text color={grayTextColor}>-</Text>
                      )}
                    </Flex>
                  </Td>
                    <Td fontSize={{ sm: "13px" }} borderColor="transparent" w={{ base: "80px", md: "80px" }} px={{ base: 2, md: 4 }}>
                      <Flex align="center" ms="-25px">
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
                                filter={on ? "none" : isDarkMode ? "grayscale(100%) brightness(1.5)" : "grayscale(100%)"}
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
                        <Box cursor="pointer" onClick={() => handleEditQuiz(row)}>
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

    {/* Create quiz modal */}
    <Modal isOpen={isCreateOpen} onClose={() => onCreateClose()} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create new quiz</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box mb={3}>
            <Text mb={2} fontWeight={600}>Quiz title</Text>
            <Input value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Optional display title (e.g. Quiz: School)" />
          </Box>
          <Box mb={3}>
            <Text mb={2} fontWeight={600}>Topic</Text>
            {loadingCreateTopics ? (
              <Text>Loading topics...</Text>
            ) : (
              <Select
                value={createTopicId}
                onChange={(e) => {
                  const v = e.target.value;
                  setCreateTopicId(v);
                }}
                placeholder="Select a topic"
              >
                {createTopicOptions.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </Select>
            )}
            <Text fontSize="sm" color={grayTextColor} mt={2}>If no topics available, you can still create and add topics later.</Text>
          </Box>
          <Box mb={3}>
            <Text mb={2} fontWeight={600}>Passing score (%)</Text>
            <Input type="number" min={0} max={100} value={createPassingScore} onChange={(e) => setCreatePassingScore(Number(e.target.value))} />
          </Box>
          <Box mb={1}>
            <Text mb={2} fontWeight={600}>Duration (minutes)</Text>
            <Input type="number" min={0} value={createDurationMinutes} onChange={(e) => setCreateDurationMinutes(Number(e.target.value))} />
          </Box>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={() => onCreateClose()}>Cancel</Button>
          <Button colorScheme="purple" onClick={handleCreateSubmit}>Create</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>

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
                {quizToDelete ? `Are you sure you want to delete quiz ${quizToDelete.displayName || quizToDelete.name || quizToDelete.id}? This action cannot be undone.` : 'Are you sure you want to delete this quiz?'}
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
