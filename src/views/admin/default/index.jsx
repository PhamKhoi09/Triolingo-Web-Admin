/*
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
  Image,
  Select,
  SimpleGrid,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";
// Assets
import Usa from "assets/img/dashboards/usa.png";
// Custom components
import MiniStatistics from "components/card/MiniStatistics";
import IconBox from "components/icons/IconBox";
import React from "react";
import {
  MdAddTask,
  MdAttachMoney,
  MdBarChart,
  MdFileCopy,
  MdPerson,
  MdStar,
  MdStarHalf,
  MdStarBorder,
} from "react-icons/md";
// Icons from assets (use PNGs provided)
import AppVersionPng from "assets/img/icons/app version.png";
import RatingPng from "assets/img/icons/rating.png";
// Other components
import DailyTraffic from "views/admin/default/components/DailyTraffic";
import PieCard from "views/admin/default/components/PieCard";
import Card from "components/card/Card.js";
import TopDiligentTable from "views/admin/marketplace/components/TopDiligentTable";
import TopQuizTable from "views/admin/marketplace/components/TopQuizTable";
import tableDataTopDiligent from "views/admin/marketplace/variables/tableDataTopDiligent.json";
import tableDataTopQuiz from "views/admin/marketplace/variables/tableDataTopQuiz.json";
// Backend base URL: can be overridden by setting REACT_APP_API_BASE
// In development leave empty so `fetch('/admin/...')` is proxied by CRA dev server.
const BACKEND_BASE = process.env.REACT_APP_API_BASE || "";
// Fallback absolute backend URL to use when the dev proxy is not active.
const BACKEND_FALLBACK = process.env.REACT_APP_API_BASE || "http://192.168.1.5:5001";

async function fetchWithFallback(path, options = {}) {
  const primary = BACKEND_BASE ? `${BACKEND_BASE}${path}` : path;
  const fallback = `${BACKEND_FALLBACK}${path}`;
  try {
    let res = await fetch(primary, options);
    if (res.status === 404 && fallback && fallback !== primary) {
      // try fallback absolute backend URL
      try {
        const res2 = await fetch(fallback, options);
        return res2;
      } catch (e) {
        return res; // return original 404
      }
    }
    return res;
  } catch (e) {
    // network error on primary, try fallback
    try {
      const res2 = await fetch(fallback, options);
      return res2;
    } catch (e2) {
      throw e; // rethrow original
    }
  }
}

function mapTopQuizResponse(arr = []) {
  return arr.map((u) => ({
    name: [u.username || u.email || "Unknown", u.avatarUrl || null],
    level: Number(u.passedCount) || 0,
  }));
}

export default function UserReports() {
  // Chakra Color Mode
  const brandColor = useColorModeValue("brand.500", "white");
  const boxBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");
  const [topQuizData, setTopQuizData] = React.useState(() => [...tableDataTopQuiz]);

  // Completion rate for pie chart
  const [completionRates, setCompletionRates] = React.useState(null); // [notStarted, inProgress, completed]
  const [completionDetail, setCompletionDetail] = React.useState(null);
  // Daily traffic values for bar chart (last 7 days)
  const [trafficValues, setTrafficValues] = React.useState(null);

  // (debug states removed)

  // General stats for the top cards (fallbacks match current hardcoded values)
  const [totalUsersValue, setTotalUsersValue] = React.useState(() => '1,234');
  const [ratingValue, setRatingValue] = React.useState(() => '4.5');
  const [ratingCount, setRatingCount] = React.useState(() => '0');
  const [appVersionValue, setAppVersionValue] = React.useState(() => '1.0.3');

  function mapGeneralResponse(obj = {}) {
    const totalUsers = obj.totalUsers ?? obj.total ?? obj.userCount ?? obj.total_user ?? obj.total_users ?? obj.count ?? null;
    // rating may be an object { average, count } or a primitive (legacy)
    let ratingAverage = null;
    let ratingCnt = null;
    if (obj && typeof obj.rating === 'object' && obj.rating !== null) {
      ratingAverage = obj.rating.average ?? obj.rating.avg ?? null;
      ratingCnt = obj.rating.count ?? obj.rating.total ?? null;
    } else {
      ratingAverage = obj.rating ?? obj.averageRating ?? obj.avgRating ?? obj.avg_rating ?? obj.average_rating ?? null;
    }
    const version = obj.version ?? obj.appVersion ?? obj.app_version ?? obj.appVersionString ?? obj.app_version_string ?? null;
    return { totalUsers, ratingAverage, ratingCnt, version };
  }

  React.useEffect(() => {
    let mounted = true;
    async function loadGeneralStats() {
        try {
          const token = localStorage.getItem('token');
          const headers = Object.assign({}, token ? { Authorization: `Bearer ${token}` } : {});
          const res = await fetchWithFallback('/api/admin/stats/general', { method: 'GET', headers });
          const rawText = await res.text();
          let parsed;
          try { parsed = rawText ? JSON.parse(rawText) : null; } catch (e) { parsed = rawText; }
          if (!mounted) return;
          if (!res.ok) throw new Error(rawText || res.statusText || 'Network response was not ok');
          const data = parsed;
          const mapped = mapGeneralResponse(data || {});
          if (mapped.totalUsers != null) {
          const formatted = typeof mapped.totalUsers === 'number' ? mapped.totalUsers.toLocaleString() : String(mapped.totalUsers);
          setTotalUsersValue(formatted);
        }
        if (mapped.ratingAverage != null) {
          setRatingValue(String(mapped.ratingAverage));
        }
        if (mapped.ratingCnt != null) {
          setRatingCount(String(mapped.ratingCnt));
        }
        if (mapped.version != null) {
          setAppVersionValue(String(mapped.version));
        }
      } catch (err) {
        console.error('[Dashboard] Failed to load general stats', err);
        // keep fallbacks
      }
    }
    loadGeneralStats();
    return () => { mounted = false; };
  }, []);

  function StarRating({ average = 0, size = '20px' }) {
    const avg = Number(average) || 0;
    // base id for clipPaths to avoid collisions
    const baseId = `starclip-${Math.random().toString(36).slice(2, 9)}`;

    function StarSVG({ fill = 0, idx = 0, sizePx = 18 }) {
      // clamp fill 0..1
      const f = Math.max(0, Math.min(1, fill));
      const clipId = `${baseId}-${idx}`;
      // star path (24x24 viewBox)
      const d = "M12 .587l3.668 7.431L24 9.748l-6 5.848L19.335 24 12 19.897 4.665 24 6 15.596 0 9.748l8.332-1.73L12 .587z";
      return (
        <Box as='span' key={idx} display='inline-block' lineHeight='0'>
          <svg viewBox='0 0 24 24' width={sizePx} height={sizePx} aria-hidden='true'>
            <defs>
              <clipPath id={clipId} clipPathUnits='objectBoundingBox'>
                <rect x='0' y='0' width={String(f)} height='1' />
              </clipPath>
            </defs>
            {/* empty star */}
            <path d={d} fill='#E6EDF3' />
            {/* filled portion */}
            <g clipPath={`url(#${clipId})`}>
              <path d={d} fill='#F6AD55' />
            </g>
          </svg>
        </Box>
      );
    }

    const stars = [];
    for (let i = 0; i < 5; i++) {
      const fill = Math.max(0, Math.min(1, avg - i));
      // convert size like '18px' to number
      const sizePx = typeof size === 'string' && size.endsWith('px') ? Number(size.replace('px', '')) : Number(size) || 18;
      stars.push(<StarSVG fill={fill} idx={i} sizePx={sizePx} />);
    }

    return (
      <Flex align='center'>
        {stars}
        <Box as='span' ms='8px' fontWeight='700'>{typeof avg === 'number' ? avg.toFixed(1) : String(avg)}</Box>
      </Flex>
    );
  }

  React.useEffect(() => {
    let mounted = true;
    async function loadTopQuizzes() {
      try {
        const token = localStorage.getItem('token');
        const headers = Object.assign({}, token ? { Authorization: `Bearer ${token}` } : {});
        const res = await fetchWithFallback('/api/admin/stats/top-quizzes', { method: "GET", headers });
        const rawText = await res.text();
        let parsed;
        try { parsed = rawText ? JSON.parse(rawText) : null; } catch (e) { parsed = rawText; }
        if (!mounted) return;
        if (!res.ok) throw new Error(rawText || res.statusText || "Network response was not ok");
        const data = parsed;
        setTopQuizData(mapTopQuizResponse(data || []));
      } catch (err) {
        console.error('[Dashboard] Failed to load top quizzes', err);
        // leave fallback data in place
      }
    }
    loadTopQuizzes();
    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    async function loadCompletionRate() {
      try {
        const token = localStorage.getItem('token');
        const headers = Object.assign({}, token ? { Authorization: `Bearer ${token}` } : {});
        const res = await fetchWithFallback('/api/admin/stats/completion-rate', { method: 'GET', headers });
        const rawText = await res.text();
        let parsed;
        try { parsed = rawText ? JSON.parse(rawText) : null; } catch (e) { parsed = rawText; }
        if (!mounted) return;
        if (!res.ok) throw new Error(rawText || res.statusText || 'Network response was not ok');
        const data = parsed;
        // Map to array order expected by PieCard: [Not started, In progress, Completed]
        const rates = [
          data.notStarted != null ? Number(data.notStarted) : 0,
          data.inProgress != null ? Number(data.inProgress) : 0,
          data.completed != null ? Number(data.completed) : 0,
        ];
        setCompletionRates(rates);
        setCompletionDetail(data.detail || null);
      } catch (err) {
        console.error('[Dashboard] Failed to load completion rate', err);
      }
    }
    loadCompletionRate();
    return () => { mounted = false; };
  }, []);

  React.useEffect(() => {
    let mounted = true;
    async function loadTraffic() {
      try {
        const token = localStorage.getItem('token');
        const headers = Object.assign({}, token ? { Authorization: `Bearer ${token}` } : {});
        const res = await fetchWithFallback('/api/admin/stats/traffic', { method: 'GET', headers });
        const rawText = await res.text();
        let parsed;
        try { parsed = rawText ? JSON.parse(rawText) : null; } catch (e) { parsed = rawText; }
        if (!mounted) return;
        if (!res.ok) throw new Error(rawText || res.statusText || 'Network response was not ok');
        const data = parsed || [];
        // The API may return up to 7 items. We don't align by calendar dates here;
        // instead we take the counts in the order received and place them into
        // Monday..Sunday slots respectively. If the API returns fewer than 7
        // items, pad the remaining days with 0.
        const values = new Array(7).fill(0);
        for (let i = 0; i < Math.min(7, data.length); i++) {
          const item = data[i];
          values[i] = Number(item && (item.count ?? item.value ?? item._count) ? (item.count ?? item.value ?? item._count) : 0);
        }
        setTrafficValues(values);
      } catch (err) {
        console.error('[Dashboard] Failed to load traffic', err);
      }
    }
    loadTraffic();
    return () => { mounted = false; };
  }, []);

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
          value={totalUsersValue}
          growth={'+4.2%'}
          reverse
        />
          <MiniStatistics
            startContent={
              <IconBox
                w='64px'
                h='64px'
                bg={boxBg}
                icon={<Image src={encodeURI(RatingPng)} boxSize='36px' objectFit='contain' alt='rating' />}
              />
            }
            name='Rating'
            value={<StarRating average={Number(ratingValue)} size='18px' />}
            growth={Number(ratingCount) > 0 ? `${ratingCount} reviews` : undefined}
            hideSuffix
            reverse
          />
          <MiniStatistics
            startContent={
              <IconBox
                w='64px'
                h='64px'
                bg={boxBg}
                icon={<Image src={encodeURI(AppVersionPng)} boxSize='36px' objectFit='contain' alt='app version' />}
              />
            }
            name='Version app'
            value={appVersionValue}
            reverse
          />
      </SimpleGrid>

      

      {/* Dashboard main sections */}
      <SimpleGrid columns={{ base: 1, md: 3 }} gap='20px' mb='20px'>
        <Card px='0px' mb='20px'>
          <TopDiligentTable tableData={tableDataTopDiligent} />
        </Card>

          <Card px='0px' mb='20px'>
          <TopQuizTable tableData={topQuizData} />
        </Card>

        <SimpleGrid columns={{ base: 1 }} gap='20px'>
          <PieCard completionRates={completionRates || undefined} completionDetail={completionDetail} />
          <Card px='0px' mb='20px'>
            <DailyTraffic trafficData={trafficValues || undefined} />
          </Card>
        </SimpleGrid>
      </SimpleGrid>
    </Box>
  );
}
