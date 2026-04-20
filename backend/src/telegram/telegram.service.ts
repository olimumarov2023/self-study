import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Telegraf, Markup } from 'telegraf';
import { randomBytes } from 'crypto';

import { PrismaService } from '../prisma/prisma.service.js';
import { BoardService } from '../board/board.service.js';

import {
  ACTION_LABELS,
  CALLBACK_PREFIX,
  STATUS_EMOJI,
  TASHKENT_OFFSET_HOURS,
  type TelegramActionStatus,
} from './telegram.constants.js';

import type { LearnStatus } from '@prisma/client';

interface DailyBoardItem {
  id: string;
  title: string;
  status: LearnStatus;
  rank: number;
  category?: { name: string; color: string | null } | null;
}

const LINK_TOKEN_TTL_MS = 15 * 60 * 1000;

@Injectable()
export class TelegramService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramService.name);
  private bot: Telegraf | null = null;
  private botUsername: string | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly boardService: BoardService,
  ) {}

  async onModuleInit() {
    const token = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!token) {
      this.logger.warn(
        'TELEGRAM_BOT_TOKEN not set — Telegram bot disabled.',
      );
      return;
    }

    this.bot = new Telegraf(token);
    this.registerHandlers(this.bot);

    try {
      const me = await this.bot.telegram.getMe();
      this.botUsername = me.username ?? null;
      this.logger.log(`Telegram bot @${me.username} connected.`);

      // Launch in long-polling mode. Non-blocking.
      void this.bot.launch().catch((err) => {
        this.logger.error('Telegram bot crashed', err);
      });
    } catch (err) {
      this.logger.error('Failed to initialise Telegram bot', err);
      this.bot = null;
    }
  }

  async onModuleDestroy() {
    if (this.bot) {
      this.bot.stop('SIGTERM');
      this.bot = null;
    }
  }

  isEnabled(): boolean {
    return this.bot !== null;
  }

  getBotUsername(): string | null {
    return this.botUsername;
  }

  /** Generates a short-lived link token the user pastes/clicks into the bot. */
  async createLinkToken(userId: string): Promise<string> {
    const token = randomBytes(8).toString('hex');
    const expiresAt = new Date(Date.now() + LINK_TOKEN_TTL_MS);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        telegramLinkToken: token,
        telegramLinkTokenExpiresAt: expiresAt,
      },
    });

    return token;
  }

  async unlink(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        telegramChatId: null,
        telegramLinkToken: null,
        telegramLinkTokenExpiresAt: null,
      },
    });
  }

  async getLinkStatus(
    userId: string,
  ): Promise<{ linked: boolean; botUsername: string | null }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { telegramChatId: true },
    });
    return {
      linked: Boolean(user?.telegramChatId),
      botUsername: this.botUsername,
    };
  }

  /**
   * Builds and sends today's TODO list to the user's Telegram chat.
   * Returns the Telegram message id (for editing later) or null on failure.
   */
  async sendTodayDigest(userId: string, chatId: string): Promise<void> {
    if (!this.bot) return;

    const date = todayInTashkent();
    const board = await this.boardService.getByDate(userId, date);

    const allItems: DailyBoardItem[] = [];
    for (const status of Object.keys(board.columns)) {
      const items = board.columns[status] as DailyBoardItem[] | undefined;
      if (items) allItems.push(...items);
    }

    allItems.sort((a, b) => a.rank - b.rank);

    if (allItems.length === 0) {
      await this.bot.telegram.sendMessage(
        chatId,
        `📭 No items planned for today (${date}).`,
      );
      return;
    }

    const { text, keyboard } = buildDigest(date, allItems);
    await this.bot.telegram.sendMessage(chatId, text, {
      parse_mode: 'HTML',
      reply_markup: keyboard,
    });
  }

  /**
   * Finds all users with a linked chat and sends each their digest.
   * Called by TelegramScheduler.
   */
  async sendDailyDigestsToAllUsers(): Promise<void> {
    if (!this.bot) return;

    const users = await this.prisma.user.findMany({
      where: { telegramChatId: { not: null } },
      select: { id: true, telegramChatId: true },
    });

    for (const user of users) {
      if (!user.telegramChatId) continue;
      try {
        await this.sendTodayDigest(user.id, user.telegramChatId);
      } catch (err) {
        this.logger.error(
          `Failed to send digest to user ${user.id}`,
          err,
        );
      }
    }
  }

  private registerHandlers(bot: Telegraf) {
    bot.start(async (ctx) => {
      const token =
        typeof ctx.startPayload === 'string' ? ctx.startPayload.trim() : '';

      if (!token) {
        await ctx.reply(
          'Hi! To link your Self Study account, open the Settings page in the app and tap "Link Telegram".',
        );
        return;
      }

      const user = await this.prisma.user.findFirst({
        where: { telegramLinkToken: token },
      });

      if (
        !user ||
        !user.telegramLinkTokenExpiresAt ||
        user.telegramLinkTokenExpiresAt.getTime() < Date.now()
      ) {
        await ctx.reply(
          '⚠️ This link is invalid or expired. Please generate a new one from the Settings page.',
        );
        return;
      }

      const chatId = String(ctx.chat.id);

      // Clear any other user previously bound to this chat.
      await this.prisma.user.updateMany({
        where: {
          telegramChatId: chatId,
          NOT: { id: user.id },
        },
        data: { telegramChatId: null },
      });

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          telegramChatId: chatId,
          telegramLinkToken: null,
          telegramLinkTokenExpiresAt: null,
        },
      });

      await ctx.reply(
        '✅ Linked! You will receive your TODO list daily at 00:00 (UTC+5). Send /today to get it now.',
      );
    });

    bot.command('today', async (ctx) => {
      const chatId = String(ctx.chat.id);
      const user = await this.prisma.user.findFirst({
        where: { telegramChatId: chatId },
      });

      if (!user) {
        await ctx.reply(
          '⚠️ This chat is not linked. Open Settings in the app and tap "Link Telegram".',
        );
        return;
      }

      await this.sendTodayDigest(user.id, chatId);
    });

    bot.command('unlink', async (ctx) => {
      const chatId = String(ctx.chat.id);
      const user = await this.prisma.user.findFirst({
        where: { telegramChatId: chatId },
      });

      if (!user) {
        await ctx.reply('This chat is not linked.');
        return;
      }

      await this.unlink(user.id);
      await ctx.reply('🔓 Unlinked. You can re-link anytime from Settings.');
    });

    bot.on('callback_query', async (ctx) => {
      const query = ctx.callbackQuery;
      if (!('data' in query) || typeof query.data !== 'string') {
        await ctx.answerCbQuery();
        return;
      }

      const parsed = parseCallbackData(query.data);
      if (!parsed) {
        await ctx.answerCbQuery('Unknown action');
        return;
      }

      const chatId = String(ctx.chat?.id ?? '');
      const user = await this.prisma.user.findFirst({
        where: { telegramChatId: chatId },
      });

      if (!user) {
        await ctx.answerCbQuery('Chat not linked');
        return;
      }

      try {
        await this.boardService.drag(user.id, {
          learningItemId: parsed.itemId,
          date: parsed.date,
          newStatus: parsed.newStatus,
        });
      } catch (err) {
        this.logger.error('Failed to update status from Telegram', err);
        await ctx.answerCbQuery('❌ Failed to update');
        return;
      }

      // Re-fetch and re-render the digest message.
      const board = await this.boardService.getByDate(user.id, parsed.date);
      const allItems: DailyBoardItem[] = [];
      for (const status of Object.keys(board.columns)) {
        const items = board.columns[status] as DailyBoardItem[] | undefined;
        if (items) allItems.push(...items);
      }
      allItems.sort((a, b) => a.rank - b.rank);

      const { text, keyboard } = buildDigest(parsed.date, allItems);

      try {
        await ctx.editMessageText(text, {
          parse_mode: 'HTML',
          reply_markup: keyboard,
        });
      } catch {
        // "message is not modified" or expired — ignore.
      }

      await ctx.answerCbQuery(
        `${STATUS_EMOJI[parsed.newStatus]} ${ACTION_LABELS[parsed.newStatus]}`,
      );
    });
  }
}

/** Returns today's date in UTC+5 as YYYY-MM-DD. */
function todayInTashkent(): string {
  const nowUtc = Date.now();
  const tashkent = new Date(nowUtc + TASHKENT_OFFSET_HOURS * 3_600_000);
  const yyyy = tashkent.getUTCFullYear();
  const mm = String(tashkent.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(tashkent.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function buildDigest(date: string, items: DailyBoardItem[]) {
  const lines: string[] = [`<b>📋 Today — ${date}</b>`, ''];
  const buttonRows: ReturnType<typeof Markup.button.callback>[][] = [];

  items.forEach((item, idx) => {
    const emoji = STATUS_EMOJI[item.status] ?? '•';
    const title = escapeHtml(item.title);
    const category = item.category
      ? ` <i>· ${escapeHtml(item.category.name)}</i>`
      : '';
    lines.push(`${idx + 1}. ${emoji} ${title}${category}`);

    const itemBtn = (action: TelegramActionStatus, emoji: string) =>
      Markup.button.callback(
        emoji,
        buildCallbackData(item.id, date, action),
      );

    buttonRows.push([
      itemBtn('IN_PROGRESS', `${idx + 1} ▶️`),
      itemBtn('LEARNED', `${idx + 1} ✅`),
      itemBtn('NEEDS_REVISION', `${idx + 1} 🔁`),
    ]);
  });

  lines.push('');
  lines.push('<i>Tap a button to update status.</i>');

  const markup = Markup.inlineKeyboard(buttonRows);

  return {
    text: lines.join('\n'),
    keyboard: markup.reply_markup,
  };
}

/**
 * Callback data must stay under 64 bytes.
 * Format: stat:<first12OfItemId>:<YYYY-MM-DD>:<S>
 * where S is 'I' | 'L' | 'R'.
 * We use a short item id prefix because ObjectIds are 24 hex chars; we resolve
 * the full id by re-querying the board for this date.
 */
const SHORT_STATUS: Record<TelegramActionStatus, string> = {
  IN_PROGRESS: 'I',
  LEARNED: 'L',
  NEEDS_REVISION: 'R',
};
const SHORT_STATUS_REV: Record<string, TelegramActionStatus> = {
  I: 'IN_PROGRESS',
  L: 'LEARNED',
  R: 'NEEDS_REVISION',
};

function buildCallbackData(
  itemId: string,
  date: string,
  status: TelegramActionStatus,
): string {
  return [CALLBACK_PREFIX, itemId, date, SHORT_STATUS[status]].join(':');
}

function parseCallbackData(
  data: string,
): { itemId: string; date: string; newStatus: TelegramActionStatus } | null {
  const [prefix, itemId, date, s] = data.split(':');
  if (prefix !== CALLBACK_PREFIX || !itemId || !date || !s) return null;
  const newStatus = SHORT_STATUS_REV[s];
  if (!newStatus) return null;
  return { itemId, date, newStatus };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
