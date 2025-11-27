// Chakra imports
import { SimpleGrid, Text, useColorModeValue } from "@chakra-ui/react";
// Custom components
import Card from "components/card/Card.js";
import React, { useEffect, useState } from "react";
import Information from "views/admin/profile/components/Information";
import { useLocation } from 'react-router-dom';

// Assets
export default function GeneralInformation(props) {
  const { ...rest } = props;
  const location = useLocation();
  const user = location.state && location.state.user ? location.state.user : null;
  const username = user && user.username ? user.username : null;

  const [info, setInfo] = useState({
    email: 'Ademad22@gmail.com',
    dateCreated: '10/14/2025',
    password: '************',
    vocabulary: 'Careers',
    flashcard: 'Careers, 32/50 words',
    quiz: 'Quiz 3, Score 10',
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!username) return; // nothing to fetch for anonymous profile
      try {
        const res = await fetch(`/api/admin/user-general?username=${encodeURIComponent(username)}`);
        if (!mounted) return;
        if (res.ok) {
          const data = await res.json();
          // expected shape: { email, dateCreated, passwordMask, vocabulary, flashcard, quiz }
          setInfo((prev) => ({
            email: data.email || prev.email,
            dateCreated: data.dateCreated || prev.dateCreated,
            password: data.passwordMask || prev.password,
            vocabulary: data.vocabulary || prev.vocabulary,
            flashcard: data.flashcard || prev.flashcard,
            quiz: data.quiz || prev.quiz,
          }));
        }
      } catch (e) {
        // API not available yet — keep defaults
      }
    }
    load();
    return () => { mounted = false; };
  }, [username]);
  // Chakra Color Mode
  const textColorPrimary = useColorModeValue("secondaryGray.900", "white");
  const textColorSecondary = "gray.400";
  const cardShadow = useColorModeValue(
    "0px 18px 40px rgba(112, 144, 176, 0.12)",
    "unset"
  );
  return (
    <Card mb={{ base: "0px", "2xl": "20px" }} {...rest}>
      <Text
        color={textColorPrimary}
        fontWeight='bold'
        fontSize='2xl'
        mt='10px'
        mb='4px'>
        General Information
      </Text>
      <Text color={textColorSecondary} fontSize='md' me='26px' mb='20px'>
        Basic account details and progress overview for this user.
      </Text>
      <SimpleGrid columns='2' gap='20px'>
        <Information boxShadow={cardShadow} title='Email' value={info.email} />
        <Information boxShadow={cardShadow} title='Date Created' value={info.dateCreated} />
        <Information boxShadow={cardShadow} title='Password' value={info.password} />
        <Information boxShadow={cardShadow} title='Vocabulary Progress' value={info.vocabulary} />
        <Information boxShadow={cardShadow} title='Flashcard Progress' value={info.flashcard} />
        <Information boxShadow={cardShadow} title='Quiz Progress' value={info.quiz} />
      </SimpleGrid>
    </Card>
  );
}
