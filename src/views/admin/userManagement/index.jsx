import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	Avatar,
	Box,
	Flex,
	Input,
	Button,
	SimpleGrid,
	Stack,
	Text,
	Badge,
	useColorModeValue,
	Icon,
	useDisclosure,
	Modal,
	ModalOverlay,
	ModalContent,
	ModalHeader,
	ModalBody,
	ModalFooter,
	ModalCloseButton,
	FormControl,
	FormLabel,
	Center,
	VStack,
	HStack,
} from '@chakra-ui/react';
import { MdAdd, MdSearch, MdUploadFile, MdArrowUpward, MdArrowDownward, MdArrowForward } from 'react-icons/md';

import Card from 'components/card/Card.js';
import MiniStatistics from 'components/card/MiniStatistics';
import IconBox from 'components/icons/IconBox';

import avatar1 from 'assets/img/avatars/avatar1.png';
import avatar2 from 'assets/img/avatars/avatar2.png';
import avatar3 from 'assets/img/avatars/avatar3.png';
import avatar4 from 'assets/img/avatars/avatar4.png';
import avatar5 from 'assets/img/avatars/avatar5.png';

export default function UserManagement() {
	const boxBg = useColorModeValue('secondaryGray.300', 'whiteAlpha.100');
	const brandColor = useColorModeValue('brand.500', 'white');
	const statBoxBg = useColorModeValue('white', 'gray.800');
	const statBoxShadow = useColorModeValue('0px 10px 20px rgba(2,6,23,0.08)', 'none');

	const navigate = useNavigate();
	const { isOpen, onOpen, onClose } = useDisclosure();

	// form state for create user modal
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [avatarFile, setAvatarFile] = useState(null);
	const [avatarPreview, setAvatarPreview] = useState(null);

	const handleFileChange = (e) => {
		const file = e.target.files && e.target.files[0];
		if (file) {
			setAvatarFile(file);
			const reader = new FileReader();
			reader.onload = (ev) => setAvatarPreview(ev.target.result);
			reader.readAsDataURL(file);
		}
	};

	const handleCreate = () => {
		// create a temporary user object and add to list
		const newUser = {
			username: username || `user${Date.now()}`,
			avatar: avatarPreview || null,
			status: 'Online',
			// default new users are Learners
			role: 'Learner',
			name: '',
			job: '',
			email,
		};

		setUsers((prev) => [newUser, ...prev]);

		// reset and close
		setUsername('');
		setEmail('');
		setPassword('');
		setConfirmPassword('');
		setAvatarFile(null);
		setAvatarPreview(null);
		onClose();
	};

	// Local fallback users. The real API will only provide `username` and `status`.
	const initialUsers = [
		{ username: 'maddison_c21', avatar: avatar1, status: 'Online', name: 'Maddison C', job: 'UX Designer' },
		{ username: 'karl.will02', avatar: avatar2, status: 'Online', name: 'Karl Will', job: 'Frontend Dev' },
		{ username: 'andreea.1z', avatar: avatar3, status: 'Offline', name: 'Andreea Z', job: 'Illustrator' },
		{ username: 'abraham47.y', avatar: avatar4, status: 'Online', name: 'Abraham Y', job: 'Product Manager' },
		{ username: 'simmnple.web', avatar: avatar5, status: 'Offline', name: 'Simmmple', job: 'Brand' },
	];

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
				const res = await fetch('/api/admin/users');
				if (!mounted) return;
				if (res.ok) {
					const data = await res.json();
					// Expecting an array of user objects: { username, status, avatar?, role? }
					// Normalize roles to only 'Admin' or 'Learner'
					if (Array.isArray(data) && data.length) {
						const mapped = data.map((u) => ({
							username: u.username,
							avatar: u.avatar || null,
							status: u.status || 'Offline',
							name: u.name || undefined,
							job: u.job || undefined,
							role: u.role && String(u.role).toLowerCase() === 'admin' ? 'Admin' : 'Learner',
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

	// Statistics will be provided by an API endpoint in the future.
	// For now we use default values; when the backend is ready
	// this component will fetch `/api/admin/user-stats` and replace them.
	const [stats, setStats] = useState([
		{ name: 'Total Users', value: '20K', growth: '+7.9%', status: 'good' },
		{ name: 'New Users', value: '936', growth: '+3.4%', status: 'normal' },
		{ name: 'Deleted Users', value: '581', growth: '+12.8%', status: 'concerned' },
	]);

	useEffect(() => {
		let mounted = true;
		async function loadStats() {
			try {
				const res = await fetch('/api/admin/user-stats');
				if (!mounted) return;
				if (res.ok) {
					const data = await res.json();
					// Expecting an array of stats like the default above
					if (Array.isArray(data)) setStats(data);
				}
			} catch (err) {
				// Endpoint not available yet — keep defaults
			}
		}

		loadStats();
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
							<Text fontSize="xl" fontWeight="700">
								Users
							</Text>
							<Button leftIcon={<MdAdd />} colorScheme="brand" size="sm" onClick={onOpen}>
								Add
							</Button>
						</Flex>

						<Flex align="center" gap={3} mb={6}>
							<Icon as={MdSearch} w="20px" h="20px" color="gray.400" />
							<Input
								placeholder="Search user"
								variant="unstyled"
								value={query}
								onChange={(e) => setQuery(e.target.value)}
							/>
						</Flex>

						<Stack spacing={5}>
							{filteredUsers.length > 0 ? (
								filteredUsers.map((u) => (
									<Flex
										key={u.username}
										align="center"
										justify="space-between"
										cursor="pointer"
										onClick={() =>
											navigate('/admin/user-management/profile', {
												state: {
													user: {
														banner: null,
														avatar: u.avatar || null,
														name: u.name || u.username,
														job: u.job || '',
														role: u.role || 'Learner',
														status: u.status || 'Offline',
													},
												},
											})
										}
									>
										<Flex align="center" gap={4}>
											<Avatar src={u.avatar} name={u.username} boxSize="56px" />
											<Box>
												<Text fontWeight={700}>{u.username}</Text>
												<Text fontSize="sm" color="gray.500">{u.name || ''}</Text>
											</Box>
										</Flex>

										<Box>
											<Badge
												colorScheme={u.status === 'Online' ? 'green' : 'gray'}
												variant="subtle"
											>
												{u.status}
											</Badge>
										</Box>
									</Flex>
								))
							) : (
								<Text color="gray.500" px="6px">No users found</Text>
							)}
						</Stack>
					</Card>
				</Box>

				{/* Create User Modal */}
				<Modal isOpen={isOpen} onClose={onClose} isCentered>
					<ModalOverlay />
					<ModalContent borderRadius="16px" maxW="420px">
						<ModalHeader pt="24px" pb="6px">Create User</ModalHeader>
						<ModalCloseButton />
						<ModalBody pb={6}>
							<VStack spacing={4} align="stretch">
								<FormControl>
									<FormLabel color="gray.500">Username</FormLabel>
									<Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="" />
								</FormControl>

								<FormControl>
									<FormLabel color="gray.500">Email Address</FormLabel>
									<Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="" />
								</FormControl>

								<FormControl>
									<FormLabel color="gray.500">Password</FormLabel>
									<Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="" />
								</FormControl>

								<FormControl>
									<FormLabel color="gray.500">Password</FormLabel>
									<Input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="" />
								</FormControl>

								<FormControl>
									<FormLabel color="gray.500">Avatar (Optional)</FormLabel>
									<Center p={4} borderRadius="8px" bgGradient="linear(to-b, whiteAlpha.800, whiteAlpha.600)" border="1px dashed" borderColor="gray.200">
										<VStack>
											<Box>
												<input id="avatar-file" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
												<label htmlFor="avatar-file">
													<Center flexDir="column" cursor="pointer">
														<Icon as={MdUploadFile} w="36px" h="36px" color="brand.500" />
														<Text color="brand.500" fontWeight="700" mt={2}>Upload Files</Text>
														<Text fontSize="xs" color="gray.400">PNG, JPG and GIF files are allowed</Text>
													</Center>
												</label>
											</Box>
											{avatarPreview && (
												<HStack>
													<Avatar src={avatarPreview} />
													<Text fontSize="sm">{avatarFile && avatarFile.name}</Text>
												</HStack>
											)}
										</VStack>
									</Center>
								</FormControl>
							</VStack>
						</ModalBody>

						<ModalFooter pb="24px">
							<Button colorScheme="brand" w="full" onClick={handleCreate}>Create</Button>
						</ModalFooter>
					</ModalContent>
				</Modal>

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
