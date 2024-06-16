import { Elysia } from 'elysia';
import { staticPlugin } from '@elysiajs/static';
import dotenv from 'dotenv';

import { throwUp } from './utils';
import { generateFeed } from './generateFeed';

dotenv.config();

const port = process.env.PORT ?? 3000;

const assets =
  process.env.FILES_FOLDER ?? throwUp('FILES_FOLDER must be defined');

const prefix = 'files';
new Elysia()
  .use(
    staticPlugin({
      enableDecodeURI: true,
      assets,
      prefix: `/${prefix}`,
      alwaysStatic: false,
      staticLimit: 0,
    }),
  )
  .onRequest(req => {
    console.info('Request', req.request.url);
  })
  .onResponse(resp => {
    console.info('Response', resp.request.url);
  })
  .onError(e => {
    console.error('Error occurred', e);
  })
  .get('/feed.xml', () =>
    generateFeed({
      baseUrl: 'https://folderrs.wulfinger.duckdns.org',
      baseFs: assets,
      prefixUrl: prefix,
    }),
  )
  .get('/', ({ redirect }) => {
    return redirect('/feed.xml');
  })
  .get('/feed.rss', ({ redirect }) => {
    return redirect('/feed.xml');
  })
  .listen(port, props => {
    console.log('Using files from', assets);
    console.log('Listening on', props.url.href);
  });
