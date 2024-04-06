import {
    Box,
    Text,
    useApp,
    useFocus,
    useFocusManager,
    useInput,
    useStdout,
} from 'ink';
import TextInput from 'ink-text-input';
import React, { useEffect, useState } from 'react';

type Props = {
	name: string | undefined;
};

type Task = {
	id: string;
	title: string;
	description?: string;
	createdAt: Date;
	completed: boolean;
	priority: 'low' | 'middle' | 'high';
	urgency: 'low' | 'middle' | 'high';
};

export default function App({}: Props) {
	const app = useApp();
	const {stdout} = useStdout();
	const [newTask, setNewTask] = useState('');
	const [tasks, setTasks] = useState<Task[]>([]);
	const [isAdding, setIsAdding] = useState(false);
	const {enableFocus, focusNext, focusPrevious} = useFocusManager();

	useEffect(() => enableFocus(), []);

	useInput((input, key) => {
		if (isAdding && key.escape) setIsAdding(false);
		if (isAdding && key.return) {
			setIsAdding(false);
			setTasks(p => [
				...p,
				{
					id: '' + Date.now(),
					title: newTask,
					createdAt: new Date(),
					priority: 'middle',
					urgency: 'middle',
					completed: false,
				},
			]);
			setNewTask('');
		}
		if (isAdding) return;
		if (input === 'q') app.exit();
		if (input == 'j') focusNext();
		if (input == 'k') focusPrevious();
		if (input == 'a') setIsAdding(true);
	});

	return (
		<Box flexDirection="column" height={stdout.rows}>
			<Box justifyContent="center">
				<Text underline>Tasks</Text>
			</Box>
			{tasks.length ? (
				tasks.map((task, i) => (
					<Item
						task={task}
						autoFocus={i == 0}
						isAdding={isAdding}
						onDelete={() => {
							setTasks(p => p.filter(pt => pt.id != task.id));
						}}
						onChange={t => setTasks(p => p.map(pt => (pt.id == t.id ? t : pt)))}
					/>
				))
			) : (
				<Box justifyContent="center" marginTop={4}>
					<Text dimColor>No Tasks</Text>
				</Box>
			)}

			{isAdding && (
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
					<TextInput value={newTask} onChange={setNewTask} />
				</Box>
			)}
		</Box>
	);
}

const Item = ({
	task,
	autoFocus,
	onDelete,
	onChange,
	isAdding,
}: {
	task: Task;
	isAdding: boolean;
	autoFocus?: boolean;
	onDelete: () => void;
	onChange: (t: Task) => void;
}) => {
	const {stdout} = useStdout();
	const [isEditting, setIsEditting] = useState(false);
	const {isFocused} = useFocus({autoFocus, id: task.id});
	const [taskTitle, setTaskTitle] = useState(task.title);

	useInput((input, key) => {
		if (!isFocused || isAdding ) return;
		if (isEditting && key.escape) setIsEditting(false);
		if (isAdding && key.return) {
			onChange({...task, title: taskTitle});
			setTaskTitle('');
			setIsEditting(false);
		}
		if ( isEditting) return;
		if (input == 'e') setIsEditting(true);
		if (input == 'd') onDelete();
		if (input == ' ') onChange({...task, completed: !task.completed});
	});

	return (
		<Box>
			<Text color={isFocused ? `green` : ''}>
				<Text>
					{' ' + String.fromCharCode(task.completed ? 0x25a3 : 0x25a2)}{' '}
					{task.title}
				</Text>
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
					<TextInput value={taskTitle} onChange={setTaskTitle} />
				</Box>
			)}
		</Box>
	);
};
