import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Avatar,
	Box,
	Flex,
	Input,
	Table,
	Thead,
	Tbody,
	Tr,
	Th,
	Td,
	TableContainer,
	SimpleGrid,
	Stack,
	Text,
	Badge,
	useColorModeValue,
	Icon,
} from '@chakra-ui/react';
import { MdSearch, MdArrowUpward, MdArrowDownward, MdArrowForward } from 'react-icons/md';

import Card from 'components/card/Card.js';
import MiniStatistics from 'components/card/MiniStatistics';
import { getAvatarForUsernameConsistent } from 'utils/avatarMapper';

import avatar1 from 'assets/img/avatars/avatar1.png';
import avatar2 from 'assets/img/avatars/avatar2.png';
import avatar3 from 'assets/img/avatars/avatar3.png';
import avatar4 from 'assets/img/avatars/avatar4.png';
import avatar5 from 'assets/img/avatars/avatar5.png';

export default function UserManagement() {
	const searchBg = useColorModeValue('white', 'gray.700');
	const searchShadow = useColorModeValue('0px 6px 14px rgba(2,6,23,0.06)', '0px 6px 14px rgba(255,255,255,0.04)');
	const searchHover = useColorModeValue('0px 10px 20px rgba(2,6,23,0.08)', '0px 10px 20px rgba(255,255,255,0.06)');
	const statBoxBg = useColorModeValue('white', 'gray.800');
	const statBoxShadow = useColorModeValue('0px 10px 20px rgba(2,6,23,0.08)', 'none');

	const navigate = useNavigate();
	// Create user feature removed

	const numberFormatter = useMemo(() => new Intl.NumberFormat('en-US'), []);

	const formatPercent = (value) => {
		if (!isFinite(value)) return '0%';
		const rounded = Number(value.toFixed(1));
		const sign = rounded >= 0 ? '+' : '';
		return `${sign}${rounded}%`;
	};

	const statusFor = (value, positiveIsGood = true) => {
		if (positiveIsGood) {
			if (value >= 5) return 'good';
			if (value >= -2) return 'normal';
			return 'concerned';
		}
		if (value <= -5) return 'concerned';
		if (value <= 0) return 'normal';
		return 'good';
	};

	const computeStats = (userList, activity) => {
		const learners = (userList || []).filter((u) => (u.role || 'Learner') !== 'Admin');
		const totalLearners = learners.length;
		const newRegistrations = Number(activity?.newRegistrations || 0);
		const deletedAccounts = Number(activity?.deletedAccounts || 0);

		// Previous total approximates yesterday's pool before the last 24h flow.
		const previousTotal = Math.max(totalLearners - newRegistrations + deletedAccounts, 0);
		const netChange = newRegistrations - deletedAccounts;
		const totalGrowthValue = previousTotal > 0 ? (netChange / previousTotal) * 100 : netChange > 0 ? 100 : 0;
		const newGrowthValue = previousTotal > 0 ? (newRegistrations / previousTotal) * 100 : newRegistrations > 0 ? 100 : 0;
		const deletedGrowthValue = previousTotal > 0 ? -(deletedAccounts / previousTotal) * 100 : deletedAccounts > 0 ? -100 : 0;

		return [
			{
				name: 'Total Learner',
				value: numberFormatter.format(totalLearners),
				growth: formatPercent(totalGrowthValue),
				status: statusFor(totalGrowthValue, true),
			},
			{
				name: 'New Users',
				value: String(newRegistrations),
				growth: formatPercent(newGrowthValue),
				status: statusFor(newGrowthValue, true),
			},
			{
				name: 'Deleted Users',
				value: String(deletedAccounts),
				growth: formatPercent(deletedGrowthValue),
				status: statusFor(deletedGrowthValue, false),
			},
		];
	};

	// Local fallback users. The real API will only provide `username` and `status`.
	const initialUsers = [];

	const [users, setUsers] = useState(initialUsers);

	const [query, setQuery] = useState('');

	const filteredUsers = useMemo(() => {
		if (!query) return users;
		const q = query.toLowerCase();
		return users.filter(
			(u) =>
				(u.username && u.username.toLowerCase().includes(q)) ||
				(u.name && u.name.toLowerCase().includes(q)) ||
				(u.job && u.job.toLowerCase().includes(q))
		);
	}, [query, users]);

	// Users will be loaded from an API endpoint later. Keep defaults for now.
	useEffect(() => {
		let mounted = true;
		async function loadUsers() {
			try {
				const token = localStorage.getItem('token');
				const headers = Object.assign({}, token ? { Authorization: `Bearer ${token}` } : {});
				const res = await fetch('/api/admin/users', { method: 'GET', headers });
				if (!mounted) return;
				if (res.ok) {
					const data = await res.json();
					// Backend may return { data: [...], pagination: {...} } or an array directly
					const items = Array.isArray(data) ? data : Array.isArray(data && data.data) ? data.data : [];
					if (items.length) {
						// Remove soft-deleted users (isDeleted === true) from the list
						const visible = items.filter((u) => !u.isDeleted);
					const mapped = visible.map((u) => ({
						username: u.username || u.userName || u.email || (u._id ? String(u._id) : undefined),
						_id: u._id || u.id || (u._id ? String(u._id) : undefined),
						id: u._id || u.id || (u._id ? String(u._id) : undefined),
						avatar: getAvatarForUsernameConsistent(u.username || u.userName || u.email),
						status: u.status || (u.isOnline ? 'Online' : 'Offline') || 'Offline',
						name: u.name || u.fullName || u.displayName || undefined,
						job: u.job || u.title || undefined,
						role: u.role && String(u.role).toLowerCase() === 'admin' ? 'Admin' : 'Learner',
						email: u.email || u.emailAddress || undefined,
						currentTopic: u.currentTopic || undefined,
						createdAt: u.createdAt || u.created_at || u.dateCreated || undefined,
					}));
							setUsers(mapped);
					}
				}
			} catch (err) {
				// Backend not available yet — keep initialUsers
			}
		}

		loadUsers();
		return () => {
			mounted = false;
		};
	}, []);

	const [activity24h, setActivity24h] = useState({ newRegistrations: 0, deletedAccounts: 0 });

	const stats = useMemo(() => computeStats(users, activity24h), [users, activity24h]);

	useEffect(() => {
		let mounted = true;

		async function loadActivity24h() {
			try {
				const token = localStorage.getItem('token');
				const headers = Object.assign({}, token ? { Authorization: `Bearer ${token}` } : {});
				const resp = await fetch('/api/admin/users/activity-24h', { method: 'GET', headers });
				if (!mounted) return;
				if (resp.ok) {
					const body = await resp.json();
					if (body && body.last24h) {
						setActivity24h({
							newRegistrations: Number(body.last24h.newRegistrations || 0),
							deletedAccounts: Number(body.last24h.deletedAccounts || 0),
						});
					}
				}
			} catch (e) {
				// ignore
			}
		}

		loadActivity24h();

		// No longer fetching totalUsers from /stats/general.
		// Total Learner will be computed from the users list returned by /api/admin/users.
		return () => {
			mounted = false;
		};
	}, []);

	return (
		<Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
			<SimpleGrid columns={{ base: 1, md: 4 }} gap="20px" mb="20px">
				<Box gridColumn={{ base: '1', md: '1 / span 2' }}>
					<Card px="20px" py="20px">
						<Flex align="center" justify="space-between" mb="12px">
							<Text fontSize="xl" fontWeight="700">Users</Text>
						</Flex>

						<Flex
							align="center"
							gap={3}
							mb={6}
							bg={searchBg}
							px={3}
							py={2}
							borderRadius="12px"
							boxShadow={searchShadow}
							_hover={{ boxShadow: searchHover }}
							_focusWithin={{ boxShadow: '0px 12px 30px rgba(99,102,241,0.12)' }}
						>
							<Icon as={MdSearch} w="20px" h="20px" color="gray.400" />
							<Input
								placeholder="Search user"
								variant="unstyled"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								width="100%"
							/>
						</Flex>

						<TableContainer>
							<Table variant="simple" size="sm">
								<Thead>
									<Tr>
										<Th> User </Th>
										<Th> Role </Th>
										<Th textAlign="center"> Status </Th>
									</Tr>
								</Thead>
								<Tbody>
									{filteredUsers.length > 0 ? (
										filteredUsers.map((u) => (
											<Tr key={u.username} cursor="pointer" onClick={() => navigate('/admin/user-management/profile', { state: { user: { ...u, banner: null } } })}>
												<Td>
													<Flex align="center" gap={3}>
														<Avatar src={u.avatar} name={u.username} boxSize="48px" />
														<Box>
															<Text fontWeight={700}>{u.username}</Text>
															<Text fontSize="sm" color="gray.500">{u.email || ''}</Text>
														</Box>
													</Flex>
												</Td>
												<Td>{u.role || 'Learner'}</Td>
												<Td textAlign="center"><Badge colorScheme={u.status === 'Online' ? 'green' : 'gray'} variant="subtle">{u.status}</Badge></Td>
											</Tr>
										))
									) : (
											<Tr><Td colSpan={3}><Text color="gray.500" px="6px">No users found</Text></Td></Tr>
									)}
								</Tbody>
							</Table>
						</TableContainer>
					</Card>
				</Box>

                        

				<Box gridColumn={{ base: '1', md: '3 / span 2' }}>
					<Card px="20px" py="20px">
						<Flex align="center" justify="space-between" mb="12px">
							<Text fontSize="xl" fontWeight="700">General Statistics</Text>
						</Flex>

						<Stack spacing={5}>
							{stats.map((s) => {
								const isPositive = s.growth && s.growth.startsWith('+');
								const arrow = s.status === 'normal'
									? <Icon as={MdArrowForward} color={s.status === 'normal' ? 'orange.400' : isPositive ? 'green.500' : 'red.500'} w='18px' h='18px' />
									: (isPositive ? <Icon as={MdArrowUpward} color={s.status === 'concerned' ? 'red.500' : 'green.500'} w='18px' h='18px' /> : <Icon as={MdArrowDownward} color='red.500' w='18px' h='18px' />);

								const pillColor = s.status === 'good' ? 'green.500' : s.status === 'normal' ? 'orange.400' : 'red.500';

								const endContent = (
									<Stack spacing={1} align='end'>
										<Text fontSize='xs' color='gray.400'>Last 24 hours</Text>
										<Flex align='center' gap={2}>
											{arrow}
											<Text fontSize='lg' fontWeight='800' color={s.status === 'concerned' ? 'red.500' : s.status === 'normal' ? 'orange.400' : 'green.500'}>{s.growth}</Text>
										</Flex>
										<Box mt='4px' bg={pillColor} color='white' px='10px' py='2px' borderRadius='12px' fontSize='xs' fontWeight='700' textAlign='center'>
											{s.status === 'good' ? 'GOOD' : s.status === 'normal' ? 'NORMAL' : 'CONCERNED'}
										</Box>
									</Stack>
								);

								return (
									<Box key={s.name} bg={statBoxBg} borderRadius='12px' px={6} py={5} boxShadow={statBoxShadow}>
										<MiniStatistics
											startContent={null}
											name={s.name}
											value={<Text color='purple.500' fontSize={{ base: '2xl', md: '3xl' }} fontWeight='800'>{s.value}</Text>}
											growth={null}
											reverse
											endContent={endContent}
										/>
									</Box>
								);
							})}
						</Stack>
					</Card>
				</Box>
			</SimpleGrid>
		</Box>
	);
}
