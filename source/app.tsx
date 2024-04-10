import {TextInput} from '@inkjs/ui';
import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';
import {
	Box,
	Text,
	useApp,
	useFocus,
	useFocusManager,
	useInput,
	useStdout,
} from 'ink';
import React, {Dispatch, SetStateAction, useEffect, useState} from 'react';
import {db} from './db/index.js';
import {Task} from '@prisma/client';

type Props = {
	name: string | undefined;
};

export default function App({}: Props) {
	const app = useApp();
	const {stdout} = useStdout();
	const [screenHeight, setScreenHeight] = useState(stdout.rows);
	const [newTask, setNewTask] = useState('');
	const {data, status} = useQuery({
		queryKey: ['Tasks'],
		queryFn: () => db.task.findMany(),
	});
	const [isAdding, setIsAdding] = useState(false);
	const {enableFocus, focusNext, focusPrevious} = useFocusManager();

	useEffect(() => {
		stdout.addListener('resize', () => {
			setScreenHeight(stdout.rows);
		});
		enableFocus();
	}, []);

	useInput((input, key) => {
		if (isAdding && key.escape) setIsAdding(false);
		if (isAdding) return;
		if (input == 'q') app.exit();
		if (input == 'j') focusNext();
		if (input == 'k') focusPrevious();
		if (input == 'a') setIsAdding(true);
	});

	return (
		<Box flexDirection="column" height={screenHeight}>
			<Box justifyContent="center">
				<Text underline>Tasks</Text>
			</Box>
			{status == 'success' && data.length ? (
				data.map((task, i) => (
					<Item task={task} autoFocus={i == 0} isAdding={isAdding} />
				))
			) : (
				<Box justifyContent="center" marginTop={4}>
					{status == 'pending' ? (
						<Text dimColor>Loading...</Text>
					) : status == 'error' ? (
						<Text color={'red'}>Something went wrong.</Text>
					) : (
						<Text dimColor>No Tasks</Text>
					)}
				</Box>
			)}

			{isAdding && (
				<AddDialog
					{...{newTask, setNewTask, onSave: () => setIsAdding(false)}}
				/>
			)}
		</Box>
	);
}

const AddDialog = ({
	newTask,
	setNewTask,
	onSave,
}: {
	newTask: string;
	setNewTask: Dispatch<SetStateAction<string>>;
	onSave: (t: Task) => void;
}) => {
	const {stdout} = useStdout();
	const client = useQueryClient();

	const createMutation = useMutation({
		mutationFn: (title: string) =>
			db.task.create({
				data: {title},
			}),
		onSuccess(newTask) {
			client.setQueryData(['Tasks'], (p: Task[]) => [...p, newTask]);
			onSave(newTask);
		},
	});
	useInput((_, key) => {
		if (key.return) {
			createMutation.mutate(newTask);
			setNewTask('');
		}
	});

	return (
		<Box
			position="absolute"
			borderColor={'#009990'}
			borderStyle={'single'}
			alignSelf="center"
			flexDirection="column"
			alignItems="center"
			gap={1}
			minWidth={Math.min(stdout.columns / 2, 200)}
		>
			<Text color="#888888">Add New Task</Text>
			<TextInput defaultValue={newTask} onChange={setNewTask} />
		</Box>
	);
};

const Item = ({
	task,
	autoFocus,
	isAdding,
}: {
	task: Task;
	isAdding: boolean;
	autoFocus?: boolean;
}) => {
	const {stdout} = useStdout();
	const client = useQueryClient();
	const [isEditting, setIsEditting] = useState(false);
	const {isFocused} = useFocus({autoFocus});
	const [taskTitle, setTaskTitle] = useState(task.title);
	const delMutation = useMutation({
		mutationFn: () => db.task.delete({where: {id: task.id}}),
		onSuccess: async () => {
			client.setQueryData(['Tasks'], (p: Task[]) =>
				p.filter(t => t.id != task.id),
			);
		},
	});
	const updateMutation = useMutation({
		mutationFn: async (status: string) =>
			db.task.update({
				where: {id: task.id},
				data: {
					status,
				},
			}),
		onSuccess: async (_, status) => {
			client.setQueryData(['Tasks'], (p: Task[]) =>
				p.map(t => (t.id == task.id ? {...t, status} : t)),
			);
		},
	});

	useInput((input, key) => {
		if (!isFocused || isAdding) return;
		if (isEditting && key.escape) setIsEditting(false);
		if (isAdding && key.return) {
			setTaskTitle('');
			setIsEditting(false);
		}
		if (isEditting) return;
		if (input == 'e') setIsEditting(true);
		if (input == 'd') delMutation.mutate();
		if (input == ' ') {
			updateMutation.mutate('completed');
		}
	});

	const severityDict = {
		1: 'low',
		2: 'middle',
		3: 'high',
		4: 'very high',
	} as Record<number, string>;

	return (
		<Box>
			<Text color={isFocused ? `green` : ''}>
				<Text>
					{' ' +
						String.fromCharCode(
							task.status == 'completed' ? 0x25a3 : 0x25a2,
						)}{' '}
					{task.title}
				</Text>
				<Text>{task.priority && severityDict[task.priority]}</Text>
				<Text>{task.urgency && severityDict[task.urgency]}</Text>
			</Text>
			{isEditting && (
				<Box
					position="absolute"
					borderColor={'#009990'}
					borderStyle={'single'}
					alignSelf="center"
					flexDirection="column"
					alignItems="center"
					gap={1}
					minWidth={Math.min(stdout.columns / 2, 200)}
				>
					<Text color="#888888">Add New Task</Text>
					<TextInput defaultValue={taskTitle} onChange={setTaskTitle} />
				</Box>
			)}
		</Box>
	);
};
