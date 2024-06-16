import Stream from '@elysiajs/stream';
import { readdir, stat } from 'fs/promises';

import { parse as parsePath } from 'path';

export type GenerateOptions = {
  baseFs: string;
  baseUrl: string;
  prefixUrl: string;
};
type ChannelItem = {
  title: string;
  url: string;
  length: number;
  guid: string;
  pubDate: string;
};

type Channel = {
  title: string;
  base_url: string;
  description: string;
  language: 'en-US' | 'de-DE' | 'en-GB';
  items: ChannelItem[];
};

export async function generateFeed(options: GenerateOptions) {
  const files = await readdir(options.baseFs);

  const channelsAsync = files.map(authorName =>
    generateAuthorChannels(options, authorName),
  );
  const channelsByAuthor = await Promise.all(channelsAsync);

  const channels = channelsByAuthor.flat();

  return Promise.resolve(`<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
${channels.map(serializeChannel).join('\n')}
</rss>`);
}

async function generateAuthorChannels(
  options: GenerateOptions,
  author: string,
) {
  const books = await readdir(`${options.baseFs}/${author}`);

  return await Promise.all(
    books.map(book => generateBookChannel(options, author, book)),
  );
}

async function generateBookChannel(
  options: GenerateOptions,
  author: string,
  bookName: string,
): Promise<Channel> {
  const items = await generateBookItems(options, author, bookName);
  return Promise.resolve({
    title: bookName,
    base_url: options.baseUrl,
    description: `${bookName} by ${author}`,
    language: 'de-DE',
    items,
  });
}

async function generateBookItems(
  options: GenerateOptions,
  author: string,
  bookName: string,
): Promise<ChannelItem[]> {
  const bookFsPath = `${options.baseFs}/${author}/${bookName}`;
  const files = await readdir(bookFsPath);

  const chapters = files.filter(item => item.match(/^\d\d \-.*\.mp3$/));

  const asyncItems = chapters.map(async item => {
    const filePath = `${bookFsPath}/${item}`;
    const fileInfo = await stat(filePath);

    const pubDate = fileInfo.ctime.toUTCString();
    const path = parsePath(item);

    const fileName = path.name;
    const [_chapter, title] = fileName.split('-', 2);

    const url = encodeURI(
      `${options.baseUrl}/${options.prefixUrl}/${author}/${bookName}/${item}`,
    );
    return Promise.resolve({
      title: title.trim(),
      url,
      length: fileInfo.size,
      guid: filePath,
      pubDate,
    });
  });

  return await Promise.all(asyncItems);
}

function serializeChannel({
  title,
  base_url,
  description,
  language,
  items,
}: Channel): string {
  return `
 <channel>
  <title>${title}</title>
  <link>${base_url}</link>
  <description>${description}</description>
  <language>${language}</language>
  ${items.map(serializeChannelItems).join('\n')}
</channel>
`;
}

function serializeChannelItems({
  title,
  url,
  length,
  pubDate,
}: ChannelItem): string {
  return `<item>
    <title>${title}</title>
    <enclosure url="${url}" length="${length}" type="audio/mpeg" />
    <guid>${url}</guid>
    <pubDate>${pubDate}</pubDate>
  </item>`;
}
