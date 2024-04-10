#!/usr/bin/env node
import {config} from 'dotenv';
import {render} from 'ink';
import meow from 'meow';
import React from 'react';
import App from './app.js';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';

const cli = meow(
	`
	Usage
	  $ todo-cli

	Options
		--name  Your name

	Examples
	  $ todo-cli --name=Jane
	  Hello, Jane
`,
	{
		importMeta: import.meta,
		flags: {
			name: {
				type: 'string',
			},
		},
	},
);

config();

const enterAltScreenCommand = '\x1b[?1049h';
const leaveAltScreenCommand = '\x1b[?1049l';
process.stdout.write(enterAltScreenCommand);
process.on('exit', () => {
	process.stdout.write(leaveAltScreenCommand);
});

const queryClient = new QueryClient();

render(
	<QueryClientProvider client={queryClient}>
		<App name={cli.flags.name} />
	</QueryClientProvider>,
);
