#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';
import {config} from 'dotenv';

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

render(<App name={cli.flags.name} />);
