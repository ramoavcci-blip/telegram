import { Telegraf, session, Scenes, Markup } from 'telegraf';
import { prisma } from '../index';
import { applicationWizard } from './scenes';

const token = process.env.TELEGRAM_BOT_TOKEN;

export const bot = new Telegraf<Scenes.WizardContext>(token || 'DUMMY_TOKEN');

export async function setupBot() {
  if (!token || token === 'YOUR_BOT_TOKEN_HERE') {
    console.warn('TELEGRAM_BOT_TOKEN is not set correctly. Bot will not start.');
    return;
  }

  const stage = new Scenes.Stage<Scenes.WizardContext>([applicationWizard as any]);
  
  bot.use(session());
  bot.use(stage.middleware());

  bot.start(async (ctx) => {
    // Get welcome text from settings
    const welcomeSetting = await prisma.settings.findUnique({ where: { key: 'bot_welcome_text' }});
    const welcomeText = welcomeSetting?.value || 'Merhabalar! Adaylık botuna hoş geldiniz.';

    const applyBtnSetting = await prisma.settings.findUnique({ where: { key: 'bot_apply_button' }});
    const applyText = applyBtnSetting?.value || 'Adaylık Başvurusu Yap';

    const voteBtnSetting = await prisma.settings.findUnique({ where: { key: 'bot_vote_button' }});
    const voteText = voteBtnSetting?.value || 'Oy Ver';

    const kb = Markup.inlineKeyboard([
      [Markup.button.callback(applyText, 'APPLY_CANDIDATE')],
      [Markup.button.callback(voteText, 'VOTE_CANDIDATE')]
    ]);

    await ctx.reply(welcomeText, kb);
  });

  bot.action('APPLY_CANDIDATE', async (ctx) => {
    const isApplicationOpen = await prisma.settings.findUnique({ where: { key: 'application_is_open' }});
    if (isApplicationOpen?.value === 'false') {
      return ctx.reply('Şu anda adaylık başvuruları kapalıdır.');
    }

    const tgId = String(ctx.from?.id);
    const existing = await prisma.candidate.findUnique({ where: { telegramId: tgId } });
    if (existing) {
      return ctx.reply('Zaten bir başvurunuz veya adaylığınız bulunmaktadır.');
    }
    
    await ctx.answerCbQuery();
    await ctx.scene.enter('application_wizard');
  });

  bot.action('VOTE_CANDIDATE', async (ctx) => {
    // Logic for voting
    let activeElection = await prisma.election.findFirst({ where: { status: 'ACTIVE' } });
    if (!activeElection) {
      // Create a default election automatically
      activeElection = await prisma.election.create({
        data: {
          title: 'Genel Yönetici Oylaması',
          status: 'ACTIVE',
          votesPerUser: 1,
          canChangeVote: false,
          isSecret: false
        }
      });
    }

    const tgId = String(ctx.from?.id);
    const existingVote = await prisma.vote.findFirst({
        where: { electionId: activeElection.id, voterTgId: tgId }
    });
    
    if (existingVote && !activeElection.canChangeVote) {
        return ctx.reply('Bu oylamada zaten oy kullandınız.');
    }

    const approvedCandidates = await prisma.candidate.findMany({
        where: { status: 'APPROVED', isHidden: false }
    });

    if (approvedCandidates.length === 0) {
        return ctx.reply('Oylama için henüz aday belirlenmemiş.');
    }

    const buttons = approvedCandidates.map(c => [Markup.button.callback(c.displayName, `VOTE_${c.id}`)]);
    
    await ctx.reply(`Lütfen desteklediğiniz adayı seçin:\n\nSistem: ${activeElection.title}`, Markup.inlineKeyboard(buttons));
    await ctx.answerCbQuery();
  });

  bot.action(/^VOTE_(\d+)$/, async (ctx) => {
    const candidateId = Number(ctx.match[1]);
    const tgId = String(ctx.from?.id);

    let activeElection = await prisma.election.findFirst({ where: { status: 'ACTIVE' } });
    if (!activeElection) {
      activeElection = await prisma.election.create({
        data: {
          title: 'Genel Yönetici Oylaması',
          status: 'ACTIVE',
          votesPerUser: 1,
          canChangeVote: false,
          isSecret: false
        }
      });
    }

    // Check if voting for self
    const candidate = await prisma.candidate.findUnique({ where: { id: candidateId }});
    if (candidate && candidate.telegramId === tgId) {
      const allowSelfVote = await prisma.settings.findUnique({ where: { key: 'allow_self_voting' } });
      if (allowSelfVote?.value !== 'true') {
        return ctx.reply('Kendinize oy vermenize sistem tarafından izin verilmemektedir.');
      }
    }

    const existingVote = await prisma.vote.findFirst({
        where: { electionId: activeElection.id, voterTgId: tgId }
    });

    if (existingVote) {
        if (!activeElection.canChangeVote) {
            return ctx.reply('Zaten oy kullandınız.');
        } else {
            // update vote
            await prisma.vote.update({
                where: { id: existingVote.id },
                data: { candidateId }
            });
            return ctx.reply('Oyunuz başarıyla değiştirildi.');
        }
    }

    await prisma.vote.create({
        data: {
            electionId: activeElection.id,
            candidateId,
            voterTgId: tgId,
        }
    });

    await ctx.reply('Oyunuz başarıyla kaydedildi! Teşekkür ederiz.');
    await ctx.answerCbQuery();
  });

  bot.launch();
  console.log('Telegram bot started.');
  
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}
