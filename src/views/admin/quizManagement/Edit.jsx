import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Flex,
  Text,
  SimpleGrid,
  Badge,
  Image,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Icon,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  useColorModeValue,
  Modal,
  ModalOverlay,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  IconButton,
  VStack,
  Center,
  Circle,
  Textarea,
} from "@chakra-ui/react";
import { MdSearch } from 'react-icons/md';
import Card from "components/card/Card";
import Menu from "components/menu/MainMenu";
import { fetchTopics as apiFetchTopics } from "../../../api/quizzes";
import { Radio, RadioGroup, Stack, Spinner, useToast } from "@chakra-ui/react";
import { MdArrowBack, MdEdit, MdDelete, MdImage, MdCheckCircle } from "react-icons/md";

import mcqIcon from "assets/img/icons/Multiple choice.png";
import fillIcon from "assets/img/icons/Fill in the blank.png";
import matchIcon from "assets/img/icons/Matching headings.png";
import listenIcon from "assets/img/icons/Listen.png";

import animalsImg from "assets/img/topic/animals.png";
import colorsImg from "assets/img/topic/colors.png";
import fruitsImg from "assets/img/topic/fruits.png";
import foodImg from "assets/img/topic/food.png";
import emotionImg from "assets/img/topic/emotion.png";
import educationImg from "assets/img/topic/education.png";

export default function EditQuiz() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const quiz = state && state.quiz ? state.quiz : null;

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const rowOddBg = useColorModeValue("rgba(99,102,241,0.06)", "rgba(99,102,241,0.06)");
  const pageBg = useColorModeValue("purple.200", "purple.800");
  const cardBg = useColorModeValue("white", "gray.800");
  const { isOpen, onOpen, onClose } = useDisclosure();
  // Delete confirmation dialog state
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [questionToDelete, setQuestionToDelete] = React.useState(null);
  const cancelDeleteRef = React.useRef();
  const [selectedQuestion, setSelectedQuestion] = React.useState(null);
  // New question type selector
  const { isOpen: isNewOpen, onOpen: onNewOpen, onClose: onNewClose } = useDisclosure();
  const [newQuestionType, setNewQuestionType] = React.useState("mcq");
  // Topic selection modal state
  const { isOpen: isTopicOpen, onOpen: onTopicOpen, onClose: onTopicClose } = useDisclosure();
  const [topicOptions, setTopicOptions] = React.useState([]);
  const [loadingTopics, setLoadingTopics] = React.useState(false);
  const [selectedTopicName, setSelectedTopicName] = React.useState(null);
  const [topicSearch, setTopicSearch] = React.useState("");
  const filteredTopicOptions = React.useMemo(() => {
    if (!topicSearch) return topicOptions;
    return topicOptions.filter((t) => (t.name || String(t)).toLowerCase().includes(topicSearch.toLowerCase()));
  }, [topicOptions, topicSearch]);

  async function handleOpenTopics() {
    onTopicOpen();
    setLoadingTopics(true);
    try {
      const data = await apiFetchTopics();
      // normalize to { id, name }
      const normalized = Array.isArray(data)
        ? data.map((t, i) => (typeof t === "string" ? { id: String(i), name: t } : { id: t.id ?? String(i), name: t.name ?? t.title ?? String(t) }))
        : [];
      if (normalized.length === 0) throw new Error("No topics");
      setTopicOptions(normalized);
    } catch (err) {
      // fallback sample topics
      setTopicOptions([
        { id: "fruits", name: "Fruits" },
        { id: "education", name: "Education" },
        { id: "appearances", name: "Appearances" },
        { id: "animals", name: "Animals" },
      ]);
      toast({ title: "Could not load topics from API.", description: "Using local list.", status: "info", duration: 4000, isClosable: true });
    } finally {
      setLoadingTopics(false);
    }
  }

  function handleAddSelectedTopic() {
    if (!selectedTopicName) return;
    if (topicsState.includes(selectedTopicName)) {
      toast({ title: "Topic already added", status: "warning", duration: 3000, isClosable: true });
      return;
    }
    setTopicsState((p) => [selectedTopicName, ...p]);
    setSelectedTopicName(null);
    onTopicClose();
    toast({ title: "Topic added", description: selectedTopicName, status: "success", duration: 3000, isClosable: true });
  }

  // Create a new empty question and open the edit modal for it
  function handleCreateNewQuestion() {
    const nextId = `new-${Date.now()}`;
    const q = { id: nextId, content: "", type: newQuestionType };
    setSelectedQuestion(q);
    // Reset common buffers
    setEditedContent("");
    setEditedQuestionImage(null);
    setOptionsLocal([]);
    setPromptsLocal([]);
    setResponsesLocal([]);
    setFillAnswerLocal("");
    setFillHiddenLocal([]);

    if (newQuestionType === 'mcq') {
      setOptionsLocal([
        { id: 'opt-0', text: '', image: null, isCorrect: true },
        { id: 'opt-1', text: '', image: null, isCorrect: false },
        { id: 'opt-2', text: '', image: null, isCorrect: false },
        { id: 'opt-3', text: '', image: null, isCorrect: false },
      ]);
    } else if (newQuestionType === 'fill') {
      // nothing else required; fill uses fillAnswerLocal
    } else if (newQuestionType === 'match') {
      setPromptsLocal([
        { id: 'p-0', text: '', image: null },
        { id: 'p-1', text: '', image: null },
        { id: 'p-2', text: '', image: null },
        { id: 'p-3', text: '', image: null },
      ]);
      setResponsesLocal([
        { id: 'r-0', text: '', image: null },
        { id: 'r-1', text: '', image: null },
        { id: 'r-2', text: '', image: null },
        { id: 'r-3', text: '', image: null },
      ]);
    } else if (newQuestionType === 'listening') {
      setOptionsLocal([
        { id: 'opt-0', text: '', image: null, isCorrect: true },
        { id: 'opt-1', text: '', image: null, isCorrect: false },
        { id: 'opt-2', text: '', image: null, isCorrect: false },
        { id: 'opt-3', text: '', image: null, isCorrect: false },
      ]);
    }
    onNewClose();
    onOpen();
  }

  // Dummy topics/questions for demo when state not provided
  const [topicsState, setTopicsState] = React.useState((quiz && quiz.topics) || ["Fruits", "Education", "Appearances"]);
  const topics = topicsState;
  const toast = useToast();
  const [questionsState, setQuestionsState] = React.useState([
    { id: 1, content: "Which picture describe 'pencil case'?", type: "mcq", options: [
      { id: '1a', text: 'Pencil case', image: null, isCorrect: true },
      { id: '1b', text: 'Pencil', image: null, isCorrect: false },
      { id: '1c', text: 'Eraser', image: null, isCorrect: false },
      { id: '1d', text: 'Ruler', image: null, isCorrect: false },
    ] },
    { id: 2, content: "............................................................", type: "mcq", options: [] },
    { id: 3, content: "............................................................", type: "fill" },
    { id: 4, content: "............................................................", type: "fill" },
    { id: 5, content: "Match the heading to the paragraph.", type: "match" },
    { id: 6, content: "Match the heading to the paragraph.", type: "match" },
    { id: 7, content: "............................................................", type: "mcq", options: [] },
    { id: 8, content: "............................................................", type: "match" },
  ]);
  // Local editing state for MCQ modal
  const [optionsLocal, setOptionsLocal] = React.useState([]);
  const [editedContent, setEditedContent] = React.useState("");
  const [fillAnswerLocal, setFillAnswerLocal] = React.useState("");
  const [fillHiddenLocal, setFillHiddenLocal] = React.useState([]);
  const fileInputRef = React.useRef(null);
  const [imagePickIndex, setImagePickIndex] = React.useState(null);
  const questionFileRef = React.useRef(null);
  const [editedQuestionImage, setEditedQuestionImage] = React.useState(null);
  // Matching question local state
  const [promptsLocal, setPromptsLocal] = React.useState([]);
  const [responsesLocal, setResponsesLocal] = React.useState([]);
  const matchFileRef = React.useRef(null);
  const [matchFileMode, setMatchFileMode] = React.useState(null); // 'prompt' | 'response'
  const [matchFileIndex, setMatchFileIndex] = React.useState(null);

  // Matching headings handlers
  function handleDeletePrompt(index) {
    if (promptsLocal.length <= 1) {
      toast({ title: 'At least one prompt required', status: 'warning', duration: 3000, isClosable: true });
      return;
    }
    setPromptsLocal((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDeleteResponse(index) {
    if (responsesLocal.length <= 1) {
      toast({ title: 'At least one response required', status: 'warning', duration: 3000, isClosable: true });
      return;
    }
    setResponsesLocal((prev) => prev.filter((_, i) => i !== index));
  }

  function handleMatchImageClick(mode, index) {
    setMatchFileMode(mode);
    setMatchFileIndex(index);
    if (matchFileRef.current) matchFileRef.current.click();
  }

  function handleMatchFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (matchFileMode === 'prompt') {
        setPromptsLocal((prev) => {
          const copy = [...prev];
          copy[matchFileIndex] = { ...copy[matchFileIndex], image: reader.result };
          return copy;
        });
      } else if (matchFileMode === 'response') {
        setResponsesLocal((prev) => {
          const copy = [...prev];
          copy[matchFileIndex] = { ...copy[matchFileIndex], image: reader.result };
          return copy;
        });
      }
      setMatchFileMode(null);
      setMatchFileIndex(null);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveMatchImage(mode, index) {
    if (mode === 'prompt') {
      setPromptsLocal((prev) => prev.map((p, i) => (i === index ? { ...p, image: null } : p)));
    } else if (mode === 'response') {
      setResponsesLocal((prev) => prev.map((r, i) => (i === index ? { ...r, image: null } : r)));
    }
  }

  function handleEditQuestion(q) {
    setSelectedQuestion(q);
    // Initialize local editable fields
    setEditedContent(q.content || "");
    setEditedQuestionImage(q.image || null);
    if (q.type === 'mcq') {
      const opts = Array.isArray(q.options) && q.options.length > 0
        ? q.options.map((o, i) => ({ id: o.id || `opt-${i}`, text: o.text || '', image: o.image || null, isCorrect: !!o.isCorrect }))
        : [
            { id: 'opt-0', text: '', image: null, isCorrect: false },
            { id: 'opt-1', text: '', image: null, isCorrect: false },
            { id: 'opt-2', text: '', image: null, isCorrect: false },
            { id: 'opt-3', text: '', image: null, isCorrect: false },
          ];
      // ensure at least one correct answer
      if (!opts.some((o) => o.isCorrect)) opts[0].isCorrect = true;
      setOptionsLocal(opts);
    } else {
      setOptionsLocal([]);
    }
    if (q.type === 'listening') {
      const opts = Array.isArray(q.options) && q.options.length > 0
        ? q.options.map((o, i) => ({ id: o.id || `opt-${i}`, text: '', image: o.image || o.src || null, isCorrect: !!o.isCorrect }))
        : [
            { id: 'opt-0', text: '', image: null, isCorrect: true },
            { id: 'opt-1', text: '', image: null, isCorrect: false },
            { id: 'opt-2', text: '', image: null, isCorrect: false },
            { id: 'opt-3', text: '', image: null, isCorrect: false },
          ];
      // ensure at least one correct
      if (!opts.some((o) => o.isCorrect)) opts[0].isCorrect = true;
      setOptionsLocal(opts);
    }
    if (q.type === 'match') {
      const p = Array.isArray(q.prompts) && q.prompts.length > 0
        ? q.prompts.map((t, i) => ({ id: t.id || `p-${i}`, text: t.text || '', image: t.image || null }))
        : [
            { id: 'p-0', text: '', image: null },
            { id: 'p-1', text: '', image: null },
            { id: 'p-2', text: '', image: null },
            { id: 'p-3', text: '', image: null },
          ];
      const r = Array.isArray(q.responses) && q.responses.length > 0
        ? q.responses.map((t, i) => ({ id: t.id || `r-${i}`, text: t.text || '', image: t.image || null }))
        : [
            { id: 'r-0', text: '', image: null },
            { id: 'r-1', text: '', image: null },
            { id: 'r-2', text: '', image: null },
            { id: 'r-3', text: '', image: null },
          ];
      setPromptsLocal(p);
      setResponsesLocal(r);
    } else {
      setPromptsLocal([]);
      setResponsesLocal([]);
    }
    if (q.type === 'fill') {
      const ans = q.answer || "";
      setFillAnswerLocal(ans);
      // Support different possible shapes for hidden data on the question object
      if (Array.isArray(q.hiddenPositions)) {
        // boolean array
        const h = q.hiddenPositions.slice(0, ans.length);
        setFillHiddenLocal(h.concat(Array.from({ length: Math.max(0, ans.length - h.length) }, () => false)));
      } else if (Array.isArray(q.hiddenIndices)) {
        // indices array -> convert to booleans
        setFillHiddenLocal(Array.from({ length: ans.length }, (_, i) => q.hiddenIndices.includes(i)));
      } else if (Array.isArray(q.hidden)) {
        setFillHiddenLocal(q.hidden.map(Boolean).slice(0, ans.length).concat(Array.from({ length: Math.max(0, ans.length - q.hidden.length) }, () => false)));
      } else {
        setFillHiddenLocal(Array.from({ length: ans.length }, () => false));
      }
    } else {
      setFillAnswerLocal("");
      setFillHiddenLocal([]);
    }
    onOpen();
  }

  function handleDeleteQuestion(q) {
    // Open in-app confirm dialog
    setQuestionToDelete(q);
    onDeleteOpen();
  }

  function handleConfirmDelete() {
    if (!questionToDelete) return;
    try {
      const id = questionToDelete.id;
      setQuestionsState((prev) => prev.filter((qq) => qq.id !== id));
      if (selectedQuestion && selectedQuestion.id === id) {
        setSelectedQuestion(null);
        setOptionsLocal([]);
        setEditedContent("");
        onClose();
      }
      setQuestionToDelete(null);
      onDeleteClose();
      toast({ title: 'Question deleted', status: 'success', duration: 2500, isClosable: true });
    } catch (err) {
      console.error(err);
      toast({ title: 'Could not delete question', status: 'error', duration: 3000, isClosable: true });
    }
  }

  function handleImageClick(index) {
    setImagePickIndex(index);
    if (fileInputRef.current) fileInputRef.current.click();
  }

  function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setOptionsLocal((prev) => {
        const copy = [...prev];
        copy[imagePickIndex] = { ...copy[imagePickIndex], image: reader.result };
        return copy;
      });
      setImagePickIndex(null);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  }

  function handleQuestionImageClick() {
    if (questionFileRef.current) questionFileRef.current.click();
  }

  function handleQuestionFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setEditedQuestionImage(reader.result);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveQuestionImage() {
    setEditedQuestionImage(null);
  }

  function handleDeleteOption(index) {
    if (optionsLocal.length <= 2) {
      toast({ title: 'At least two options required', status: 'warning', duration: 3000, isClosable: true });
      return;
    }
    setOptionsLocal((prev) => prev.filter((_, i) => i !== index));
  }

  function handleToggleCorrect(index) {
    setOptionsLocal((prev) => prev.map((o, i) => ({ ...o, isCorrect: i === index })));
  }

  function handleSaveQuestion() {
    if (!selectedQuestion) return;
    const updated = { ...selectedQuestion, content: editedContent, options: optionsLocal, image: editedQuestionImage };
    // include matching headings data when applicable
    if (selectedQuestion.type === 'match') {
      updated.prompts = promptsLocal.map((p, i) => ({ id: p.id || `p-${i}`, text: p.text || '', image: p.image || null }));
      updated.responses = responsesLocal.map((r, i) => ({ id: r.id || `r-${i}`, text: r.text || '', image: r.image || null }));
    }
    // include fill answer and hidden positions when applicable
    if (selectedQuestion.type === 'fill') {
      updated.answer = fillAnswerLocal || "";
      updated.hiddenPositions = Array.isArray(fillHiddenLocal) ? fillHiddenLocal : Array.from({ length: (fillAnswerLocal || "").length }, () => false);
    }
    setQuestionsState((prev) => {
      const exists = prev.some((q) => q.id === selectedQuestion.id);
      if (exists) return prev.map((q) => (q.id === selectedQuestion.id ? updated : q));
      // append new questions to the end so numbering continues
      return [...prev, updated];
    });
    setSelectedQuestion(null);
    setOptionsLocal([]);
    setEditedContent("");
    setFillAnswerLocal("");
    setFillHiddenLocal([]);
    onClose();
    toast({ title: 'Question saved', status: 'success', duration: 2500, isClosable: true });
  }

  function getTopicImage(name) {
    if (!name) return animalsImg;
    const key = name.toLowerCase();
    if (key.includes("fruit") || key.includes("fruits")) return fruitsImg;
    if (key.includes("education") || key.includes("information") || key.includes("technology")) return educationImg;
    if (key.includes("appear") || key.includes("face") || key.includes("appearance")) return animalsImg;
    if (key.includes("personality") || key.includes("personalit") || key.includes("person")) return emotionImg;
    if (key.includes("food")) return foodImg;
    if (key.includes("color") || key.includes("colour")) return colorsImg;
    if (key.includes("animal") || key.includes("animals")) return animalsImg;
    return animalsImg;
  }

  const getTypeLabel = (t) =>
    t === "mcq"
      ? "Multiple choice"
      : t === "fill"
      ? "Fill in the gap"
      : t === "listening"
      ? "Listening"
      : "Matching headings";

  const modalTypeLabel = selectedQuestion ? getTypeLabel(selectedQuestion.type) : getTypeLabel(newQuestionType);

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }} position="relative">
      {/* Full-viewport purple background layer (behind cards) */}
      <Box position="fixed" top="0" left="0" w="100%" h="100vh" bg={pageBg} zIndex={-1} />

      {/* Topic included section (separated from the main card) */}
      <Box px="25px" pb="20px" mb={{ base: 6, md: 8 }}>
        <Flex align="center" justifyContent="space-between" mb="8px" pb={4} borderBottom="1px solid" borderColor="whiteAlpha.300">
          <Flex align="center" gap="12px">
            <Box
              bg="white"
              px={{ base: 2, md: 3 }}
              py={{ base: 1, md: 2 }}
              borderRadius="999px"
              display="inline-flex"
              alignItems="center"
              boxShadow="sm"
              border="1px solid"
              borderColor="gray.200"
            >
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                leftIcon={<MdArrowBack />}
                color="gray.800"
                _hover={{ bg: "gray.100" }}
                size="sm"
              >
                Back
              </Button>
            </Box>

            <Text color="gray.800" fontSize={{ base: "18px", md: "20px" }} fontWeight="800" lineHeight="100%">
              {quiz ? `Quiz #${quiz.name}` : "Quiz"}
            </Text>
          </Flex>
        </Flex>

        <Text fontSize={{ base: "20px", md: "22px" }} fontWeight="800" mb="12px" color="white">Topic included</Text>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={{ base: 6, md: 10 }} mb="24px">
          {topics.map((t, i) => (
            <Box
              key={t + i}
              bg="white"
              boxShadow="0 6px 12px rgba(0,0,0,0.18)"
              borderRadius="16px"
              p={{ base: 4, md: 6 }}
              position="relative"
            >
              <Badge
                position="absolute"
                top="10px"
                left="12px"
                colorScheme={i % 3 === 0 ? "green" : i % 3 === 1 ? "orange" : "red"}
                variant="subtle"
                fontSize="10px"
                px="2"
              >
                {i % 3 === 0 ? "Easy" : i % 3 === 1 ? "Medium" : "Hard"}
              </Badge>

              <Flex align="center" gap="12px">
                <Image src={getTopicImage(t)} boxSize={{ base: "56px", md: "64px" }} borderRadius="8px" objectFit="cover" />
                <Box ml={{ base: 0, md: 2 }}>
                  <Text fontWeight={700} mt="6px">{t}</Text>
                  <Text color="blue.500" mt="6px">{(i + 1) * 10} words</Text>
                </Box>
              </Flex>
            </Box>
          ))}

          <Flex align="center" justify="center">
            <Button
              borderRadius="full"
              boxSize={{ base: "44px", md: "56px" }}
              bg="white"
              color="purple.600"
              boxShadow="0 6px 12px rgba(0,0,0,0.18)"
              onClick={() => handleOpenTopics()}
            >
              +
            </Button>
          </Flex>
        </SimpleGrid>
      </Box>

      {/* Questions header (styled like Topic included) */}
      <Box px="25px" pb="10px" mb={{ base: 2, md: 4 }}>
        <Text fontSize={{ base: "20px", md: "22px" }} fontWeight="800" color="white">Questions: {questionsState.length}</Text>
      </Box>

      <Card flexDirection="column" w="100%" px="0px" overflowX={{ sm: "scroll", lg: "hidden" }}>
        <Flex px="25px" mb="8px" justifyContent="flex-end" align="center">
          <Menu />
        </Flex>
        <Box px="25px" pb="20px">
          <Table variant="simple" color="gray.700" mb="24px">
            <Thead>
              <Tr>
                <Th>No</Th>
                <Th>Content</Th>
                <Th>Question types</Th>
                <Th textAlign="right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {questionsState.map((q, idx) => {
                const getTypeIcon = (t) =>
                  t === "mcq"
                    ? mcqIcon
                    : t === "fill"
                    ? fillIcon
                    : t === "listening"
                    ? listenIcon
                    : matchIcon;
                const typeLabel =
                  q.type === "mcq"
                    ? "Multiple choice"
                    : q.type === "fill"
                    ? "Fill in the gap"
                    : q.type === "listening"
                    ? "Listening"
                    : "Matching headings";
                return (
                  <Tr key={q.id} bg={idx % 2 === 0 ? rowOddBg : "transparent"}>
                    <Td w="60px">{idx + 1}</Td>
                    <Td>{q.content}</Td>
                    <Td>
                      <Flex align="center" gap="10px">
                        <Image src={getTypeIcon(q.type)} boxSize="18px" alt={q.type} />
                        <Text fontWeight={600}>{typeLabel}</Text>
                      </Flex>
                    </Td>
                        <Td textAlign="right">
                          <Flex gap="12px" justify="flex-end" align="center">
                            <IconButton
                              aria-label={`Edit question ${q.id}`}
                              icon={<MdEdit />}
                              variant="ghost"
                              color="blue.400"
                              fontSize="20px"
                              onClick={() => handleEditQuestion(q)}
                            />
                            <IconButton
                              aria-label={`Delete question ${q.id}`}
                              icon={<MdDelete />}
                              variant="ghost"
                              color="red.400"
                              fontSize="20px"
                              onClick={() => handleDeleteQuestion(q)}
                            />
                          </Flex>
                        </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>

          <Flex justify="center" mb="20px">
            <Button
              borderRadius="12px"
              px="28px"
              py="12px"
              bg="white"
              color="purple.600"
              boxShadow="lg"
              onClick={() => onNewOpen()}
            >
              + New
            </Button>
          </Flex>

          {/* Edit MCQ Modal */}
          <Modal isOpen={isOpen} onClose={() => { onClose(); setSelectedQuestion(null); }} size="6xl" isCentered>
            <ModalOverlay />
            <ModalContent maxW="92vw" minH="80vh" borderRadius="16px">
              <ModalHeader px={6} pt={6}>
                <Text fontWeight={700} color="purple.700">{selectedQuestion ? `Question ${selectedQuestion.id} – ${modalTypeLabel}` : `Question – ${modalTypeLabel}`}</Text>
              </ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                {selectedQuestion && selectedQuestion.type === "match" ? (
                  <VStack spacing={6} align="stretch">
                    <SimpleGrid columns={{ base: 1, md: 4 }} gap={6}>
                      {promptsLocal.map((p, i) => {
                        const colors = ["blue.600", "teal.500", "yellow.400", "pink.500"];
                        const color = colors[i % colors.length];
                        return (
                          <Box key={p.id || `prompt-${i}`} bg={color} color="white" borderRadius="12px" p={6} position="relative" boxShadow="sm" minH={{ base: "160px", md: "200px" }}>
                            <Flex justify="space-between" position="absolute" top="10px" left="10px" right="10px">
                              <Flex gap="8px">
                                <IconButton aria-label="Delete prompt" icon={<MdDelete size={20} />} size="md" variant="ghost" color="white" onClick={() => handleDeletePrompt(i)} />
                                <IconButton aria-label="Add image to prompt" icon={<MdImage size={20} />} size="md" variant="ghost" color="white" onClick={() => handleMatchImageClick('prompt', i)} />
                                {p.image ? (
                                  <IconButton aria-label="Remove prompt image" icon={<MdDelete size={18} />} size="md" variant="ghost" color="white" onClick={() => handleRemoveMatchImage('prompt', i)} />
                                ) : null}
                              </Flex>
                            </Flex>
                            <Center h="100%" flexDirection="column">
                              <Textarea
                                value={p.text}
                                onChange={(e) => setPromptsLocal((prev) => {
                                  const copy = [...prev];
                                  copy[i] = { ...copy[i], text: e.target.value };
                                  return copy;
                                })}
                                placeholder="Type prompt here"
                                resize="none"
                                minH="100px"
                                bg="transparent"
                                border="none"
                                color="white"
                                textAlign="center"
                                fontSize={{ base: '16px', md: '18px' }}
                              />
                              {p.image ? (
                                <Image src={p.image} mt={2} borderRadius="8px" maxH="120px" objectFit="cover" />
                              ) : null}
                            </Center>
                          </Box>
                        );
                      })}
                    </SimpleGrid>

                    <SimpleGrid columns={{ base: 1, md: 4 }} gap={6}>
                      {responsesLocal.map((r, i) => {
                        const colors = ["blue.300", "teal.200", "yellow.200", "pink.200"];
                        const color = colors[i % colors.length];
                        return (
                          <Box key={r.id || `response-${i}`} bg={color} color="white" borderRadius="12px" p={6} position="relative" boxShadow="sm" minH={{ base: "160px", md: "200px" }}>
                            <Flex justify="space-between" position="absolute" top="10px" left="10px" right="10px">
                              <Flex gap="8px">
                                <IconButton aria-label="Delete response" icon={<MdDelete size={20} />} size="md" variant="ghost" color="white" onClick={() => handleDeleteResponse(i)} />
                                <IconButton aria-label="Add image to response" icon={<MdImage size={20} />} size="md" variant="ghost" color="white" onClick={() => handleMatchImageClick('response', i)} />
                                {r.image ? (
                                  <IconButton aria-label="Remove response image" icon={<MdDelete size={18} />} size="md" variant="ghost" color="white" onClick={() => handleRemoveMatchImage('response', i)} />
                                ) : null}
                              </Flex>
                            </Flex>
                            <Center h="100%" flexDirection="column">
                              <Textarea
                                value={r.text}
                                onChange={(e) => setResponsesLocal((prev) => {
                                  const copy = [...prev];
                                  copy[i] = { ...copy[i], text: e.target.value };
                                  return copy;
                                })}
                                placeholder="Type response here"
                                resize="none"
                                minH="100px"
                                bg="transparent"
                                border="none"
                                color="white"
                                textAlign="center"
                                fontSize={{ base: '16px', md: '18px' }}
                              />
                              {r.image ? (
                                <Image src={r.image} mt={2} borderRadius="8px" maxH="120px" objectFit="cover" />
                              ) : null}
                            </Center>
                          </Box>
                        );
                      })}
                    </SimpleGrid>
                    <input type="file" accept="image/*" ref={matchFileRef} style={{ display: 'none' }} onChange={handleMatchFileChange} />
                  </VStack>
                ) : (
                  <VStack spacing={6} align="stretch">
                    <Box
                      bg="purple.100"
                      borderRadius="12px"
                      p={6}
                      boxShadow="sm"
                      minH={{ base: "140px", md: "180px" }}
                      position="relative"
                    >
                          <Flex position="absolute" top="12px" right="14px" gap={2} zIndex={2}>
                        {editedQuestionImage ? (
                          <IconButton aria-label="Remove question image" icon={<MdDelete size={20} />} size="md" variant="ghost" color="purple.700" onClick={handleRemoveQuestionImage} />
                        ) : null}
                        <IconButton aria-label="Add question image" icon={<MdImage size={20} />} size="md" variant="ghost" color="purple.700" onClick={handleQuestionImageClick} />
                      </Flex>

                      <Center h="100%">
                        {selectedQuestion && selectedQuestion.type === 'listening' ? (
                          <Box textAlign="center">
                            <Text fontSize={{ base: '14px', md: '16px' }} color="purple.700" fontWeight={600} mb={2}>Keyword</Text>
                            <Textarea
                              value={editedContent}
                              onChange={(e) => setEditedContent(e.target.value)}
                              placeholder="Enter the keyword to test (e.g. 'apple')"
                              resize="none"
                              minH="100px"
                              bg="transparent"
                              border="none"
                              color="purple.700"
                              textAlign="center"
                              fontSize={{ base: '20px', md: '28px' }}
                            />
                          </Box>
                        ) : (
                          <Textarea
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            placeholder="Type your question here..."
                            resize="none"
                            minH="100px"
                            bg="transparent"
                            border="none"
                            color="purple.700"
                            textAlign="center"
                            fontSize={{ base: '20px', md: '28px' }}
                          />
                        )}
                      </Center>

                      {editedQuestionImage ? (
                        <Image src={editedQuestionImage} mt={2} borderRadius="8px" maxH="140px" objectFit="cover" />
                      ) : null}
                      {selectedQuestion && selectedQuestion.type === 'fill' ? (
                        <Box bg="white" p={4} borderRadius="12px" mt={4}>
                          <Text fontWeight={600} mb={2} color="purple.700">Correct answer</Text>
                          <Input
                            value={fillAnswerLocal}
                            onChange={(e) => {
                              const val = e.target.value || "";
                              setFillAnswerLocal(val);
                              setFillHiddenLocal((prev) => {
                                const prevLen = prev.length;
                                const newLen = val.length;
                                if (newLen === prevLen) return prev;
                                if (newLen > prevLen) return [...prev, ...Array.from({ length: newLen - prevLen }, () => false)];
                                return prev.slice(0, newLen);
                              });
                            }}
                            placeholder="Enter the correct answer"
                            mb={3}
                          />
                          <Text fontSize="sm" color="gray.600" mb={2}>Student's view</Text>
                          <Flex gap={2} flexWrap="wrap">
                            {(fillAnswerLocal || "").split("").map((ch, i) => {
                              const hidden = !!fillHiddenLocal[i];
                              return (
                                <Box
                                  as="button"
                                  key={i}
                                  onClick={() => setFillHiddenLocal((prev) => {
                                    const copy = [...prev];
                                    const len = Math.max(copy.length, (fillAnswerLocal || "").length);
                                    if (copy.length < len) copy.push(...Array.from({ length: len - copy.length }, () => false));
                                    copy[i] = !copy[i];
                                    return copy;
                                  })}
                                  bg={hidden ? "gray.200" : "purple.50"}
                                  borderRadius="6px"
                                  px={3}
                                  py={2}
                                  minW="28px"
                                  textAlign="center"
                                  fontWeight={700}
                                  _focus={{ outline: "none" }}
                                >
                                  {hidden ? '_' : (ch === ' ' ? '\u00A0' : ch)}
                                </Box>
                              );
                            })}
                          </Flex>
                        </Box>
                      ) : null}
                      <input type="file" accept="image/*" ref={questionFileRef} style={{ display: 'none' }} onChange={handleQuestionFileChange} />
                    </Box>

                    <SimpleGrid columns={{ base: 1, md: 4 }} gap={6}>
                      {(() => {
                        const colors = ["blue.600", "teal.500", "yellow.400", "pink.500"];
                        return optionsLocal.map((opt, i) => {
                          const color = colors[i % colors.length];
                          return (
                            <Box
                              key={opt.id}
                              bg={color}
                              color="white"
                              borderRadius="12px"
                              p={6}
                              position="relative"
                              boxShadow={opt.isCorrect ? '0 8px 18px rgba(0,0,0,0.18)' : '0 6px 12px rgba(0,0,0,0.06)'}
                              minH={{ base: '160px', md: '200px' }}
                            >
                              <Flex justify="space-between" position="absolute" top="10px" left="10px" right="10px">
                                <Flex gap="8px">
                                  <IconButton aria-label="Delete option" icon={<MdDelete size={20} />} size="md" variant="ghost" color="white" onClick={() => handleDeleteOption(i)} />
                                  <IconButton aria-label="Add image" icon={<MdImage size={20} />} size="md" variant="ghost" color="white" onClick={() => handleImageClick(i)} />
                                </Flex>
                                <Box as="button" onClick={() => handleToggleCorrect(i)} aria-label={`Mark option ${i + 1} correct`} _focus={{ outline: 'none' }}>
                                  <Circle
                                    size={opt.isCorrect ? '44px' : '34px'}
                                    bg={opt.isCorrect ? 'green.400' : 'rgba(255,255,255,0.14)'}
                                    color="white"
                                    boxShadow={opt.isCorrect ? '0 10px 26px rgba(72,187,120,0.22)' : 'none'}
                                    transform={opt.isCorrect ? 'scale(1.05)' : 'none'}
                                    transition="all 0.15s ease"
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="center"
                                  >
                                    <Icon as={MdCheckCircle} boxSize={opt.isCorrect ? 6 : 5} color="white" />
                                  </Circle>
                                </Box>
                              </Flex>

                              <Center h="100%">
                                {selectedQuestion && selectedQuestion.type === 'listening' ? (
                                  <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" color="white">
                                    {opt.image ? (
                                      <Image src={opt.image} maxH="120px" borderRadius="8px" objectFit="cover" />
                                    ) : (
                                      <Flex direction="column" align="center" gap={2}>
                                        <Icon as={MdImage} boxSize={8} />
                                        <Text>Upload image</Text>
                                      </Flex>
                                    )}
                                  </Box>
                                ) : selectedQuestion && selectedQuestion.type === 'mcq' ? (
                                  // MCQ: prefer image in center if provided, otherwise show text area
                                  opt.image ? (
                                    <Image src={opt.image} maxH="120px" borderRadius="8px" objectFit="cover" />
                                  ) : (
                                    <Textarea
                                      value={opt.text}
                                      onChange={(e) => setOptionsLocal((prev) => {
                                        const copy = [...prev];
                                        copy[i] = { ...copy[i], text: e.target.value };
                                        return copy;
                                      })}
                                      placeholder="Type answer option here"
                                      resize="none"
                                      minH="100px"
                                      bg="transparent"
                                      border="none"
                                      color="white"
                                      textAlign="center"
                                      fontSize={{ base: '16px', md: '18px' }}
                                    />
                                  )
                                ) : (
                                  <Textarea
                                    value={opt.text}
                                    onChange={(e) => setOptionsLocal((prev) => {
                                      const copy = [...prev];
                                      copy[i] = { ...copy[i], text: e.target.value };
                                      return copy;
                                    })}
                                    placeholder="Type answer option here"
                                    resize="none"
                                    minH="100px"
                                    bg="transparent"
                                    border="none"
                                    color="white"
                                    textAlign="center"
                                    fontSize={{ base: '16px', md: '18px' }}
                                  />
                                )}
                              </Center>

                              {opt.image && !(selectedQuestion && (selectedQuestion.type === 'listening' || selectedQuestion.type === 'mcq' || selectedQuestion.type === 'match')) ? (
                                <Image src={opt.image} mt={2} borderRadius="8px" maxH="80px" objectFit="cover" />
                              ) : null}
                            </Box>
                          );
                        });
                      })()}
                    </SimpleGrid>
                    <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileChange} />
                  </VStack>
                )}
              </ModalBody>

              <ModalFooter justifyContent="flex-end" px={6} pb={6}>
                <Button colorScheme="purple" bg="purple.600" color="white" _hover={{ bg: "purple.700" }} px={8} py={4} borderRadius="12px" onClick={handleSaveQuestion}>
                  <Text fontWeight={700}>SAVE</Text>
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
            {/* Delete confirmation dialog */}
            <AlertDialog
              isOpen={isDeleteOpen}
              leastDestructiveRef={cancelDeleteRef}
              onClose={() => {
                setQuestionToDelete(null);
                onDeleteClose();
              }}
            >
              <AlertDialogOverlay alignItems="center" justifyContent="center">
                <AlertDialogContent w={{ base: "92%", md: "720px" }} mx="auto">
                  <AlertDialogHeader fontSize="xl" fontWeight="bold">Delete question</AlertDialogHeader>

                  <AlertDialogBody fontSize="md">
                    {questionToDelete ? `Are you sure you want to delete question ${questionToDelete.id}? This action cannot be undone.` : 'Are you sure you want to delete this question?'}
                  </AlertDialogBody>

                  <AlertDialogFooter>
                    <Button ref={cancelDeleteRef} onClick={() => { setQuestionToDelete(null); onDeleteClose(); }} variant="ghost" size="md">Cancel</Button>
                    <Button colorScheme="red" onClick={handleConfirmDelete} ml={3} size="md">Delete</Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialogOverlay>
            </AlertDialog>
          {/* Topic selection modal */}
          <Modal isOpen={isTopicOpen} onClose={() => { setSelectedTopicName(null); setTopicSearch(""); onTopicClose(); }} size="xl">
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Select a topic</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                {loadingTopics ? (
                  <Flex justify="center" py={8}><Spinner /></Flex>
                ) : (
                  <>
                    <InputGroup mb={4}>
                      <InputLeftElement pointerEvents="none">
                        <Icon as={MdSearch} color="gray.400" />
                      </InputLeftElement>
                      <Input placeholder="Search topics..." value={topicSearch} onChange={(e) => setTopicSearch(e.target.value)} />
                    </InputGroup>

                    <SimpleGrid columns={[1, 2, 3]} spacing={4}>
                      {filteredTopicOptions.map((t) => (
                        <Box
                          key={t.id}
                          borderRadius="md"
                          overflow="hidden"
                          bg={cardBg}
                          boxShadow={selectedTopicName === (t.name || t.id) ? '0 8px 20px rgba(99,102,241,0.18)' : '0 6px 12px rgba(0,0,0,0.06)'}
                          borderWidth={selectedTopicName === (t.name || t.id) ? '2px' : '1px'}
                          borderColor={selectedTopicName === (t.name || t.id) ? 'purple.400' : 'transparent'}
                          p={3}
                          cursor="pointer"
                          onClick={() => setSelectedTopicName(t.name || t.id)}
                        >
                          <Image src={t.thumbnail || getTopicImage(t.name)} alt={t.name} mb={2} borderRadius="sm" />
                          <Text fontWeight="bold">{t.name}</Text>
                          {t.description ? <Text fontSize="sm" color="gray.500">{t.description}</Text> : null}
                        </Box>
                      ))}
                    </SimpleGrid>
                  </>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={() => { setSelectedTopicName(null); setTopicSearch(""); onTopicClose(); }}>Cancel</Button>
                <Button colorScheme="purple" onClick={handleAddSelectedTopic} isDisabled={!selectedTopicName}>Add</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
          {/* New Question Type selector modal */}
          <Modal isOpen={isNewOpen} onClose={() => { setNewQuestionType("mcq"); onNewClose(); }} isCentered>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Choose question type</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                {/* Rich selection grid for question types */}
                <SimpleGrid columns={{ base: 1, sm: 2 }} gap={4}>
                  {[
                    { key: "mcq", title: "Multiple choice", desc: "Create single/multiple choice questions.", icon: mcqIcon },
                    { key: "fill", title: "Fill in the gap", desc: "Short-answer or cloze-style items.", icon: fillIcon },
                    { key: "match", title: "Matching headings", desc: "Matching or pairing type questions.", icon: matchIcon },
                    { key: "listening", title: "Listening", desc: "Audio-based listening comprehension.", icon: listenIcon },
                  ].map((opt) => {
                    const selected = newQuestionType === opt.key;
                    return (
                      <Box
                        key={opt.key}
                        bg={selected ? "purple.50" : "white"}
                        borderRadius="12px"
                        p={4}
                        cursor="pointer"
                        borderWidth={selected ? "2px" : "1px"}
                        borderColor={selected ? "purple.600" : "gray.200"}
                        boxShadow={selected ? "0 6px 14px rgba(99,102,241,0.18)" : "0 6px 12px rgba(0,0,0,0.06)"}
                        onClick={() => setNewQuestionType(opt.key)}
                        role="button"
                        aria-pressed={selected}
                        transition="all 0.15s ease"
                        _hover={{ transform: "translateY(-3px)", boxShadow: "0 8px 18px rgba(0,0,0,0.12)" }}
                      >
                        <Flex align="center" gap={3}>
                          <Image src={opt.icon} boxSize="36px" alt={opt.title} />
                          <Box>
                            <Text fontWeight={700}>{opt.title}</Text>
                            <Text fontSize="sm" color="gray.600">{opt.desc}</Text>
                          </Box>
                        </Flex>
                      </Box>
                    );
                  })}
                </SimpleGrid>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={() => { setNewQuestionType("mcq"); onNewClose(); }}>Cancel</Button>
                <Button colorScheme="purple" onClick={handleCreateNewQuestion}>Create</Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Box>
      </Card>
    </Box>
  );
}
