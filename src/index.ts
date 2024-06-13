import {
    Elysia
} from 'elysia'

import { staticPlugin } from '@elysiajs/static'

import dotenv from 'dotenv'
import { throwUp } from './utils';

import { stat } from 'fs/promises';
dotenv.config()

const port = process.env.PORT || 3000;

const files_folder = process.env.FILES_FOLDER ?? throwUp("FILES_FOLDER must be defined");

new Elysia()
    .use(staticPlugin({ assets: files_folder, prefix: "/files" }))
    .get('/feed.rss', 'Hola World')
    .listen(port, async () => {
        const val = await stat(files_folder + "Co ver.jpg");
        console.log("stats", val)
        console.log("Using files from", files_folder)
        console.log("Listening on", port);
    });

