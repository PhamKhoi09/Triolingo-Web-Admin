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
import { fetchTopics as apiFetchTopics, fetchQuiz as apiFetchQuiz } from "../../../api/quizzes";
import { createQuestion as apiCreateQuestion } from "../../../api/questions";
import { deleteQuestion as apiDeleteQuestion } from "../../../api/questions";
import { Radio, RadioGroup, Stack, Spinner, useToast } from "@chakra-ui/react";
import { MdArrowBack, MdEdit, MdDelete, MdImage, MdCheckCircle, MdAudiotrack, MdPlayArrow } from "react-icons/md";

import mcqIcon from "assets/img/icons/Multiple choice.png";
import fillIcon from "assets/img/icons/Fill in the blank.png";
import matchIcon from "assets/img/icons/Matching headings.png";
import listenIcon from "assets/img/icons/Listen.png";

import animalsImg from "assets/img/topic/animals.png";
import colorsImg from "assets/img/topic/basic colors.png";
import fruitsImg from "assets/img/topic/fruits.png";
import foodImg from "assets/img/topic/food & drink.png";
import emotionImg from "assets/img/topic/feelings & characteristic.png";
import educationImg from "assets/img/topic/school.png";
import jobsImg from "assets/img/topic/jobs & workplaces.png";

export default function EditQuiz() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const quiz = state && state.quiz ? state.quiz : null;

  const textColor = useColorModeValue("secondaryGray.900", "white");
  // Image to show next to the quiz name: prefer explicit thumbnail/image, otherwise infer from name
  const quizImage = (quiz && (quiz.thumbnail || quiz.image || quiz.image_url)) || (quiz && quiz.name ? getTopicImage(quiz.name) : null);
  // Compute a displayable quiz id (support multiple backend field names)
  const quizId = quiz && (quiz.id || quiz.quiz_id || quiz._id || quiz.quizId || quiz.id || quiz._id);
  const rowOddBg = useColorModeValue("rgba(99,102,241,0.06)", "rgba(99,102,241,0.06)");
  const pageBg = useColorModeValue("purple.200", "purple.800");
  const cardBg = useColorModeValue("white", "gray.800");
  const grayTextColor = useColorModeValue("gray.600", "white");
  const grayLightColor = useColorModeValue("gray.500", "whiteAlpha.800");
  const grayDarkColor = useColorModeValue("gray.400", "whiteAlpha.700");
  const isDarkMode = useColorModeValue(false, true);
  // Configuration: how many question IDs per quiz block by default.
  // For example, blockSize=20 means quiz 1 has IDs 1..20, quiz 2 has 21..40, etc.
  const QUESTION_BLOCK_SIZE = 20;

  /**
   * Compute the next numeric question id for a quiz, constrained within that quiz's numeric range.
   * Accepts either a numeric quizId or string; existingIds is an array of strings/numbers from current questions.
   * Optional `overrides` can map quizId -> [min, max] to support irregular ranges.
   */
  function computeNextQuestionId(quizIdRaw, existingIds = [], blockSize = QUESTION_BLOCK_SIZE, overrides = {}) {
    if (!quizIdRaw) throw new Error('quiz id required to compute question id');
    const qn = Number(quizIdRaw);
    if (!Number.isFinite(qn) || qn <= 0) throw new Error('quiz id must be a positive number');

    // If an explicit override range provided for this quiz id, use it
    if (overrides && overrides[String(qn)]) {
      const [min, max] = overrides[String(qn)];
      const taken = existingIds.map((id) => Number(id)).filter((n) => Number.isFinite(n) && n >= min && n <= max);
      const maxTaken = taken.length ? Math.max(...taken) : (min - 1);
      const candidate = maxTaken + 1;
      if (candidate > max) throw new Error(`No available question ids in range ${min}-${max} for quiz ${qn}`);
      return String(candidate);
    }

    // Default contiguous block calculation: quiz 1 -> 1..blockSize, quiz 2 -> (blockSize+1)..(2*blockSize), etc.
    const min = (qn - 1) * blockSize + 1;
    const max = qn * blockSize;
    const taken = existingIds.map((id) => Number(id)).filter((n) => Number.isFinite(n) && n >= min && n <= max);
    const maxTaken = taken.length ? Math.max(...taken) : (min - 1);
    const candidate = maxTaken + 1;
    if (candidate > max) throw new Error(`No available question ids in range ${min}-${max} for quiz ${qn}`);
    return String(candidate);
  }
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
        ? data.map((t, i) => {
            if (typeof t === "string") return { id: String(i), name: t, thumbnail: getTopicImage(t) };
            // Support API shape: { topic_id, topic_name, difficulty, status }
            const id = t.topic_id ?? t.id ?? String(i);
            const name = t.topic_name ?? t.name ?? t.title ?? String(t);
            // Attach thumbnail using local asset fallback when API doesn't provide one
            const thumbnail = t.thumbnail || getTopicImage(name);
            return { id: String(id), name, thumbnail };
          })
        : [];
      if (normalized.length === 0) throw new Error("No topics");
      setTopicOptions(normalized);
    } catch (err) {
      // Do not fall back to a local sample list for admin view — show real data only
      setTopicOptions([]);
      toast({ title: "Could not load topics from API.", description: (err && err.message) ? err.message : "Check your network or auth token.", status: "error", duration: 6000, isClosable: true });
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
      // Initialize fill creation state: admin will type the full keyword, then toggle letters
      setEditedContent("");
      setFillPromptLocal("");
      setFillAnswerLocal("");
      setFillHiddenLocal([]);
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

  // Helper to normalize various quiz.topic shapes into an array of topic objects or names
  const normalizeTopicsFromQuiz = (q) => {
    if (!q) return [];
    const makeTopicObj = (raw, idx) => {
      if (!raw) return null;
      if (typeof raw === 'string') return { id: `t-${idx}`, name: raw, thumbnail: getTopicImage(raw) };
      // support nested shapes: { topic_id, topic_name } or { id, name } or { topic: { id, name } }
      const nested = raw.topic || raw;
      const name = nested.topic_name || nested.name || nested.title || nested.topicName || nested.topic || String(nested).replace(/\[object Object\]/, '') || `Topic ${idx + 1}`;
      const id = nested.topic_id || nested.id || nested._id || nested.topicId || `t-${idx}`;
      const thumbnail = nested.thumbnail || nested.image || getTopicImage(name);
      return { id: String(id), name, thumbnail, difficulty: nested.difficulty };
    };

    // If explicit topics array present (objects or strings)
    if (Array.isArray(q.topics) && q.topics.length) {
      const mapped = q.topics.map((t, i) => makeTopicObj(t, i)).filter(Boolean);
      if (mapped.length) return mapped;
    }

    // Some APIs return a single topic as an object in `topic`
    if (q.topic && (typeof q.topic === 'object' || typeof q.topic === 'string')) {
      const single = makeTopicObj(q.topic, 0);
      if (single) return [single];
    }

    // Support older shape: { topic_name, topic_id }
    if (q.topic_name || q.topicName || q.topicTitle) {
      const name = q.topic_name || q.topicName || q.topicTitle || '';
      const id = q.topic_id || q.topicId || q.id || '';
      return [{ id: String(id || `t-0`), name, thumbnail: getTopicImage(name) }];
    }

    // Some admin list items include `topic` as a primitive string field
    if (typeof q.topic === 'string') return [{ id: `t-0`, name: q.topic, thumbnail: getTopicImage(q.topic) }];

    // Fallback: try to infer from quiz.title/name if it looks like a topic (best-effort)
    if (q.title && typeof q.title === 'string' && q.title.length < 60 && (!q.questions || q.questions === 0)) {
      return [{ id: `t-infer`, name: q.title, thumbnail: getTopicImage(q.title) }];
    }

    return [];
  };

  const [topicsState, setTopicsState] = React.useState(() => {
    const normalized = normalizeTopicsFromQuiz(quiz);
    return (normalized && normalized.length) ? normalized : [];
  });
  const topics = topicsState;
  const toast = useToast();
  const [topicsResolved, setTopicsResolved] = React.useState(false);

  // Debug: log incoming quiz and current topics to help troubleshoot missing topic cards
  React.useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.log('[EditQuiz] location.state.quiz:', quiz);
      // eslint-disable-next-line no-console
      console.log('[EditQuiz] initial topicsState:', topicsState);
    } catch (e) {}
  }, []);

  // Log whenever quiz or topicsState changes (helps verify normalization)
  React.useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.log('[EditQuiz] quiz changed:', quiz);
      // eslint-disable-next-line no-console
      console.log('[EditQuiz] topicsState now:', topicsState);
    } catch (e) {}
  }, [quiz, topicsState]);

  // If a quiz is present but topics are empty, show a lightweight toast so user sees the mismatch
  // Only show after we've attempted fallback+fetch (topicsResolved)
  React.useEffect(() => {
    if (quiz && topicsResolved && Array.isArray(topicsState) && topicsState.length === 0) {
      toast({ title: 'No topics found for this quiz', description: 'Quiz loaded but contains 0 topics.', status: 'warning', duration: 4000, isClosable: true });
    }
  }, [quiz, topicsState, topicsResolved]);
  const [questionsState, setQuestionsState] = React.useState(() => {
    // If a quiz was passed in via location state and contains questions, map them
    if (quiz && Array.isArray(quiz.questions) && quiz.questions.length) {
      return quiz.questions.map((q) => {
        // helper to map API question_type to local short type
        const mapType = (raw) => {
          const s = (raw || '').toString().toLowerCase();
          if (s.includes('listen')) return 'listening';
          if (s.includes('img') && s.includes('choose')) return 'mcq';
          if (s.includes('choose') && s.includes('text')) return 'mcq';
          if (s.includes('fill')) return 'fill';
          if (s.includes('match') || s.includes('pair')) return 'match';
          if (s.includes('mcq') || s.includes('multiple')) return 'mcq';
          return 'mcq';
        };

        const id = q.id || q.question_id || q.questionId || '';
        const type = mapType(q.type || q.question_type || q.questionType || '');
        const content = q.prompt || q.content || '';
        const options = (q.options || q.QuestionOptions || []).map((o) => ({
          id: o.id || o.option_id || '',
          text: o.text || o.option_text || '',
          image: o.image || o.option_image_url || null,
          isCorrect: !!Number(o.is_correct || o.isCorrect || 0),
        }));

        let prompts = [];
        let responses = [];
        const pairs = q.pairs || q.MatchingPairs || [];
        if (Array.isArray(pairs) && pairs.length) {
          prompts = pairs.map((p, i) => ({ id: p.pair_id || p.id || `p-${i}`, text: '', image: p.image_url || p.image || null }));
          responses = pairs.map((p, i) => ({ id: p.pair_id || p.id || `r-${i}`, text: p.word_text || p.text || '', image: null }));
        }

        const answer = q.correct_text_answer || q.correctText || q.answer || null;

        return {
          id,
          content,
          type,
          options,
          prompts,
          responses,
          answer,
          image: q.image || q.image_url || null,
          audio: q.audio || q.audio_url || null,
        };
      });
    }

    // No fallback/demo questions — show empty list when API doesn't provide questions
    return [];
  });

  // If this page was opened with a quiz object that lacks topics, try fetching full quiz details
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // If quiz exists but has no topics, try fallback from the row that opened the editor
        if (quiz && Array.isArray(quiz.sourceRowTopics) && quiz.sourceRowTopics.length && (!quiz.topics || (Array.isArray(quiz.topics) && quiz.topics.length === 0))) {
          const mapped = quiz.sourceRowTopics.map((t, i) => (typeof t === 'string' ? { id: `sr-${i}`, name: t, thumbnail: getTopicImage(t) } : (t && t.name ? { id: String(t.id || `sr-${i}`), name: t.name, thumbnail: t.thumbnail || getTopicImage(t.name) } : null))).filter(Boolean);
          if (mounted && mapped.length) {
            setTopicsState(mapped);
            // continue — do not return; allow fetch below to possibly replace if better data exists
          }
        }

        if (quiz && (!quiz.topics || (Array.isArray(quiz.topics) && quiz.topics.length === 0)) && (quiz.id || quiz.quiz_id)) {
          const id = quiz.id || quiz.quiz_id;
          const detailed = await apiFetchQuiz(id);
          if (!mounted) return;
          if (detailed && Array.isArray(detailed.topics) && detailed.topics.length) {
            // Normalize topics into simple objects { id, name, thumbnail, difficulty }
            const mapped = detailed.topics.map((t, i) => {
              if (typeof t === 'string') return { id: `${id}-t-${i}`, name: t, thumbnail: getTopicImage(t) };
              const name = t.topic_name || t.name || t.title || String(t);
              const tid = t.topic_id || t.id || `${id}-t-${i}`;
              const thumb = t.thumbnail || getTopicImage(name);
              return { id: String(tid), name, thumbnail: thumb, difficulty: t.difficulty };
            });
            setTopicsState(mapped);
          }
        }
      } catch (e) {
        // ignore — topics will remain as provided
      }
      // mark that we've attempted to resolve topics (fallback + fetch attempt finished)
      if (mounted) setTopicsResolved(true);
    })();
    return () => { mounted = false; };
  }, [quiz]);
  // Local editing state for MCQ modal
  const [optionsLocal, setOptionsLocal] = React.useState([]);
  const [editedContent, setEditedContent] = React.useState("");
  const [fillAnswerLocal, setFillAnswerLocal] = React.useState("");
  const [fillHiddenLocal, setFillHiddenLocal] = React.useState([]);
  const [fillPromptLocal, setFillPromptLocal] = React.useState("");
  const fileInputRef = React.useRef(null);
  const [imagePickIndex, setImagePickIndex] = React.useState(null);
  const questionFileRef = React.useRef(null);
  const [editedQuestionImage, setEditedQuestionImage] = React.useState(null);
  const audioFileRef = React.useRef(null);
  const [editedQuestionAudio, setEditedQuestionAudio] = React.useState(null);
  const audioRef = React.useRef(null);
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
    // For listening questions, prefer the correct keyword/answer if available
    const listeningKeyword = q.answer || q.correct_text_answer || q.correctText || q.answerText || null;
    setEditedContent(q.type === 'listening' ? (listeningKeyword || q.content || "") : (q.content || ""));
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
      const ans = q.correct_text_answer || q.correctText || q.answer || "";
      // original prompt may contain underscores (stored shape) or full word
      const promptRaw = (q.prompt || q.content || "") + "";
      // If stored prompt contains underscores, reconstruct a full-word prompt by inserting answer into first underscore group
      const m = promptRaw.match(/_+/);
      if (m) {
        const groupStart = m.index || 0;
        const groupLen = m[0].length;
        const ansLetters = String(ans || "");
        const padded = (ansLetters + Array(groupLen).fill(' ').join('')).slice(0, groupLen);
        const full = promptRaw.slice(0, groupStart) + padded + promptRaw.slice(groupStart + groupLen);
        setFillPromptLocal(full);
        setEditedContent(full);
        // init hidden mask from underscores positions in stored prompt
        const initHidden = Array.from(promptRaw).map((ch) => ch === '_');
        // prefer backend masks if provided
        if (Array.isArray(q.hiddenPositions) && q.hiddenPositions.length >= initHidden.length) {
          setFillHiddenLocal(q.hiddenPositions.slice(0, initHidden.length).map(Boolean));
        } else if (Array.isArray(q.hiddenIndices) && q.hiddenIndices.length > 0) {
          setFillHiddenLocal(Array.from({ length: initHidden.length }, (_, i) => q.hiddenIndices.includes(i)));
        } else if (Array.isArray(q.hidden) && q.hidden.length >= initHidden.length) {
          setFillHiddenLocal(q.hidden.map(Boolean).slice(0, initHidden.length));
        } else {
          setFillHiddenLocal(initHidden);
        }
        setFillAnswerLocal(ans);
      } else {
        // prompt already full-word
        setFillPromptLocal(promptRaw);
        setEditedContent(promptRaw.replace(/_+/, ans));
        setFillHiddenLocal(Array.from(promptRaw).map(() => false));
        setFillAnswerLocal(ans || "");
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
    const id = questionToDelete.id;
    const wasNew = String(id || '').startsWith('new-');
    const prevQuestions = (questionsState || []).slice();

    // Optimistically remove locally
    setQuestionsState((prev) => prev.filter((qq) => qq.id !== id));
    if (selectedQuestion && selectedQuestion.id === id) {
      setSelectedQuestion(null);
      setOptionsLocal([]);
      setEditedContent("");
      onClose();
    }
    setQuestionToDelete(null);
    onDeleteClose();

    // If the question existed only in the UI (new-...), no server call required
    if (wasNew) {
      toast({ title: 'Question removed', status: 'success', duration: 2500, isClosable: true });
      return;
    }

    // Otherwise, attempt to delete on server; rollback on failure
    (async () => {
      try {
        await apiDeleteQuestion(id);
        toast({ title: 'Question deleted', status: 'success', duration: 2500, isClosable: true });
      } catch (err) {
        console.error('Failed to delete question on server', err);
        // rollback local deletion
        setQuestionsState(prevQuestions);
        toast({ title: 'Could not delete question on server', description: err && err.message ? err.message : String(err), status: 'error', duration: 5000, isClosable: true });
      }
    })();
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

  function handleQuestionAudioClick() {
    if (audioFileRef.current) audioFileRef.current.click();
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

  function handleQuestionAudioChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    // Use object URL for audio playback
    const url = URL.createObjectURL(file);
    setEditedQuestionAudio(url);
    e.target.value = '';
  }

  function handleRemoveQuestionImage() {
    setEditedQuestionImage(null);
  }

  function handleRemoveQuestionAudio() {
    if (editedQuestionAudio && typeof editedQuestionAudio === 'string' && editedQuestionAudio.startsWith('blob:')) {
      try { URL.revokeObjectURL(editedQuestionAudio); } catch (e) {}
    }
    setEditedQuestionAudio(null);
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

  async function handleSaveQuestion() {
    if (!selectedQuestion) return;
    const wasNew = String(selectedQuestion.id || '').startsWith('new-');
    const selType = selectedQuestion.type;
    const updated = { ...selectedQuestion, content: editedContent, options: optionsLocal, image: editedQuestionImage };
    // include matching headings data when applicable
    if (selectedQuestion.type === 'match') {
      updated.prompts = promptsLocal.map((p, i) => ({ id: p.id || `p-${i}`, text: p.text || '', image: p.image || null }));
      updated.responses = responsesLocal.map((r, i) => ({ id: r.id || `r-${i}`, text: r.text || '', image: r.image || null }));
    }
    // include fill answer and hidden positions when applicable
    if (selectedQuestion.type === 'fill') {
      // Save the prompt (with blanks) as the stored content/prompt so backend keeps blanks
      updated.content = fillPromptLocal || editedContent;
      updated.prompt = fillPromptLocal || editedContent;
      // Store the correct answer under common backend fields
      updated.correct_text_answer = fillAnswerLocal || "";
      updated.correctText = fillAnswerLocal || "";
      updated.answer = fillAnswerLocal || "";
      // store hidden mask if available
      updated.hiddenPositions = Array.isArray(fillHiddenLocal) ? fillHiddenLocal.map(Boolean) : Array.from({ length: (fillPromptLocal || editedContent || "").length }, () => false);
    }
    // Determine local insertion/replacement and compute next question_id for API
    let nextQuestionId = null;
    // compute quiz id for later use
    const qid = quizId || (quiz && (quiz.id || quiz.quiz_id || quiz._id || quiz.quizId));
    if (!qid) {
      // If no quiz id, just update local state as before (cannot persist to server)
      setQuestionsState((prev) => {
        const exists = prev.some((q) => q.id === selectedQuestion.id);
        if (exists) return prev.map((q) => (q.id === selectedQuestion.id ? updated : q));
        return [...prev, updated];
      });
    } else {
      // Build list of existing numeric ids for this quiz from local state
      const existingIds = (questionsState || []).map((q) => {
        // q.id may be numeric string, number, or 'new-...'
        const n = Number(q.id);
        return Number.isFinite(n) ? n : null;
      }).filter(Boolean);

      if (String(selectedQuestion.id || '').startsWith('new-')) {
        try {
          nextQuestionId = computeNextQuestionId(qid, existingIds);
          // assign the computed id locally so UI reflects final numbering
          updated.id = nextQuestionId;
        } catch (err) {
          // fallback: append using length+1 (best-effort)
          nextQuestionId = String((existingIds.length || 0) + 1);
          updated.id = nextQuestionId;
        }
      }

      setQuestionsState((prev) => {
        const exists = prev.some((q) => q.id === selectedQuestion.id || q.id === updated.id);
        if (exists) return prev.map((q) => (q.id === selectedQuestion.id || q.id === updated.id ? updated : q));
        return [...prev, updated];
      });
    }
    setSelectedQuestion(null);
    setOptionsLocal([]);
    setEditedContent("");
    setFillAnswerLocal("");
    setFillHiddenLocal([]);
    onClose();
    toast({ title: 'Question saved', status: 'success', duration: 2500, isClosable: true });

    // If we have a quiz id available and this is a newly-created question, try to persist to API
    try {
      const qid = quizId || (quiz && (quiz.id || quiz.quiz_id || quiz._id || quiz.quizId));
      if (qid && wasNew) {
        // Build API payload according to admin POST example
        const payload = {
          question_id: nextQuestionId || String((questionsState && questionsState.length) ? questionsState.length + 1 : 1),
          quiz_id: String(qid),
          question_type: (selType === 'fill') ? 'FILL_BLANK' : (selType || '').toUpperCase(),
          prompt: updated.prompt || updated.content || '',
          image_url: updated.image || null,
          audio_url: updated.audio || null,
          correct_text_answer: updated.correct_text_answer || updated.correctText || updated.answer || null,
          QuestionOptions: Array.isArray(updated.options) ? updated.options.map((o) => ({ option_id: o.id || '', option_text: o.text || '', option_image_url: o.image || null, is_correct: o.isCorrect ? 1 : 0 })) : [],
          MatchingPairs: Array.isArray(updated.prompts) && Array.isArray(updated.responses) ? updated.prompts.map((p, i) => ({ pair_id: p.id || `p-${i}`, image: p.image || null, word_text: updated.responses[i] ? (updated.responses[i].text || '') : '' })) : [],
        };

        await apiCreateQuestion(payload);
        toast({ title: 'Question persisted to server', status: 'success', duration: 3000, isClosable: true });
      }
    } catch (err) {
      console.error('Failed to persist question to API', err);
      toast({ title: 'Could not save question to server', description: err && err.message ? err.message : String(err), status: 'warning', duration: 5000, isClosable: true });
    }
  }

  function getTopicImage(name) {
    if (!name) return animalsImg;
    const key = name.toLowerCase();
    if (key.includes("fruit") || key.includes("fruits")) return fruitsImg;
    if (key.includes("school") || key.includes("education") || key.includes("information") || key.includes("technology")) return educationImg;
    if (key.includes("feel") || key.includes("feeling") || key.includes("character") || key.includes("characteristic") || key.includes("personality") || key.includes("personalit") || key.includes("person")) return emotionImg;
    if (key.includes("job") || key.includes("work") || key.includes("workplace") || key.includes("career") || key.includes("occup")) return jobsImg;
    if (key.includes("appear") || key.includes("face") || key.includes("appearance")) return animalsImg;
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

              <Flex align="center" gap="12px">
                {quizImage ? (
                  <Image src={quizImage} boxSize={{ base: "40px", md: "48px" }} borderRadius="8px" objectFit="cover" />
                ) : null}
                <Text color="gray.800" fontSize={{ base: "18px", md: "20px" }} fontWeight="800" lineHeight="100%">
                  {quiz
                    ? `Quiz ${quizId ? `#${quizId}` : ''}${quiz && (quiz.name || quiz.title) ? ` - ${quiz.name || quiz.title}` : ''}`
                    : "Quiz"}
                </Text>
              </Flex>
            </Flex>
        </Flex>

        <Text fontSize={{ base: "20px", md: "22px" }} fontWeight="800" mb="12px" color="white">Topic included</Text>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={{ base: 6, md: 10 }} mb="24px">
          {topics.map((t, i) => {
            // Support either a string topic name or an object { id, name, thumbnail }
            const topicName = typeof t === 'string' ? t : (t.name || t.topic_name || t.topic || `Topic ${i + 1}`);
            const topicThumb = (typeof t === 'object' && t.thumbnail) ? t.thumbnail : getTopicImage(topicName);
            const key = (typeof t === 'object' && (t.id || t.topic_id)) ? (t.id || t.topic_id) : `${topicName}-${i}`;
            return (
              <Box
                key={key}
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
                  <Image src={topicThumb} boxSize={{ base: "56px", md: "64px" }} borderRadius="8px" objectFit="cover" />
                  <Box ml={{ base: 0, md: 2 }}>
                    <Text fontWeight={700} mt="6px" color="black">{topicName}</Text>
                    <Text color="blue.500" mt="6px">{(i + 1) * 10} words</Text>
                  </Box>
                </Flex>
              </Box>
            );
          })}

        </SimpleGrid>
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
          <Table variant="simple" color={grayLightColor} mb="24px">
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
                          <Box key={r.id || `response-${i}`} bg={color} color="black" borderRadius="12px" p={6} position="relative" boxShadow="sm" minH={{ base: "160px", md: "200px" }}>
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
                                color="black"
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
                            {selectedQuestion && selectedQuestion.type === 'listening' ? (
                              <>
                                {editedQuestionAudio ? (
                                  <IconButton aria-label="Remove question audio" icon={<MdDelete size={20} />} size="md" variant="ghost" color="purple.700" onClick={handleRemoveQuestionAudio} />
                                ) : null}
                                <IconButton aria-label="Add question audio" icon={<MdAudiotrack size={20} />} size="md" variant="ghost" color="purple.700" onClick={handleQuestionAudioClick} />
                              </>
                            ) : (
                              <>
                                {editedQuestionImage ? (
                                  <IconButton aria-label="Remove question image" icon={<MdDelete size={20} />} size="md" variant="ghost" color="purple.700" onClick={handleRemoveQuestionImage} />
                                ) : null}
                                <IconButton aria-label="Add question image" icon={<MdImage size={20} />} size="md" variant="ghost" color="purple.700" onClick={handleQuestionImageClick} />
                              </>
                            )}
                          </Flex>

                      <Center h="100%">
                        {selectedQuestion && selectedQuestion.type === 'listening' ? (
                          <Box textAlign="center">
                            <Text fontSize={{ base: '14px', md: '16px' }} color="purple.700" fontWeight={600} mb={2}>Choose the correct answer</Text>
                              <Flex justify="center" mt={3}>
                                <IconButton
                                  aria-label="Play question audio"
                                  icon={<MdPlayArrow />}
                                  colorScheme="purple"
                                  variant="ghost"
                                  size="xl"
                                  fontSize="40px"
                                  isDisabled={!((editedQuestionAudio) || (selectedQuestion && (selectedQuestion.audio || selectedQuestion.audio_url)))}
                                  onClick={() => {
                                    const src = editedQuestionAudio || (selectedQuestion && (selectedQuestion.audio || selectedQuestion.audio_url));
                                    if (!src) return;
                                    if (audioRef.current) {
                                      audioRef.current.src = src;
                                      audioRef.current.play().catch(() => {});
                                    } else {
                                      const a = new Audio(src);
                                      a.play().catch(() => {});
                                    }
                                  }}
                                />
                              </Flex>
                          </Box>
                        ) : (
                          <Textarea
                            value={editedContent}
                            onChange={(e) => {
                              const v = e.target.value || "";
                              setEditedContent(v);
                              // If creating/editing a fill question, treat the main textarea as the keyword input
                              if (selectedQuestion && selectedQuestion.type === 'fill') {
                                setFillPromptLocal(v);
                                setFillHiddenLocal(Array.from(v).map(() => false));
                                setFillAnswerLocal("");
                              }
                            }}
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
                      {editedQuestionAudio ? (
                        <Box mt={2}>
                          <Text fontSize="sm" color="purple.700" mb={1}>Attached audio</Text>
                        </Box>
                      ) : null}
                      {selectedQuestion && selectedQuestion.type === 'fill' ? (
                        <Box bg="white" p={4} borderRadius="12px" mt={4}>
                          <Text fontWeight={600} mb={2} color="purple.700">Correct answer</Text>
                          <Input
                            value={fillAnswerLocal}
                            readOnly
                            placeholder="(flip letters to build answer)"
                            mb={3}
                          />
                          <Text fontSize="sm" color={grayTextColor} mb={2}>Student's view</Text>
                          <Flex gap={2} flexWrap="wrap">
                            {((fillPromptLocal || "") || "").split("").map((_, i) => {
                              const prompt = (fillPromptLocal || "") || "";
                              const ch = prompt[i] || '\u00A0';
                              const hidden = !!fillHiddenLocal[i];
                              const displayChar = hidden ? '_' : ch;
                              return (
                                <Box
                                  as="button"
                                  key={i}
                                  onClick={() => {
                                    const p = (fillPromptLocal || "") || "";
                                    setFillHiddenLocal((prev) => {
                                      const copy = [...prev];
                                      const len = Math.max(copy.length, p.length);
                                      if (copy.length < len) copy.push(...Array.from({ length: len - copy.length }, () => false));
                                      copy[i] = !copy[i];
                                      // Recompute answer from new mask (left-to-right)
                                      const ans = p.split("").map((c, idx) => (copy[idx] ? c : null)).filter(Boolean).join("");
                                      setFillAnswerLocal(ans);
                                      return copy;
                                    });
                                  }}
                                  bg={hidden ? "gray.200" : "purple.50"}
                                  borderRadius="6px"
                                  px={3}
                                  py={2}
                                  minW="28px"
                                  textAlign="center"
                                  fontWeight={700}
                                  _focus={{ outline: "none" }}
                                >
                                  {displayChar === ' ' ? '\u00A0' : displayChar}
                                </Box>
                              );
                            })}
                          </Flex>
                        </Box>
                      ) : null}
                      <input type="file" accept="image/*" ref={questionFileRef} style={{ display: 'none' }} onChange={handleQuestionFileChange} />
                      <input type="file" accept="audio/*" ref={audioFileRef} style={{ display: 'none' }} onChange={handleQuestionAudioChange} />
                      <audio ref={audioRef} style={{ display: 'none' }} />
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
                        <Icon as={MdSearch} color={grayDarkColor} />
                      </InputLeftElement>
                      <Input placeholder="Search topics..." value={topicSearch} onChange={(e) => setTopicSearch(e.target.value)} />
                    </InputGroup>

                    {filteredTopicOptions.length === 0 ? (
                      <Box textAlign="center" py={12}>
                        <Text mb={3} color={grayTextColor}>No topics available from the API.</Text>
                        <Button onClick={handleOpenTopics} colorScheme="purple">Retry</Button>
                      </Box>
                    ) : (
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
                            {t.description ? <Text fontSize="sm" color={grayLightColor}>{t.description}</Text> : null}
                          </Box>
                        ))}
                      </SimpleGrid>
                    )}
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
                            <Text fontSize="sm" color={grayTextColor}>{opt.desc}</Text>
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
