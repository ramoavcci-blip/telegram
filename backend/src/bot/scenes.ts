import { Scenes } from 'telegraf';
import { prisma } from '../index';

interface WizardState {
  displayName?: string;
  age?: number;
  reason?: string;
  experience?: string;
  activeTime?: string;
  extraInfo?: string;
}

export const applicationWizard = new Scenes.WizardScene(
  'application_wizard',
  async (ctx) => {
    ctx.scene.session.state = {} as WizardState;
    await ctx.reply('Adaylık başvurusuna hoş geldiniz! İptal etmek için /cancel yazabilirsiniz.\n\nLütfen gerçek/görünen adınızı girin:');
    return ctx.wizard.next();
  },
  async (ctx) => {
    if ('text' in ctx.message! && ctx.message.text === '/cancel') {
        await ctx.reply('Başvuru iptal edildi.');
        return ctx.scene.leave();
    }
    const state = ctx.scene.session.state as WizardState;
    state.displayName = 'text' in ctx.message! ? ctx.message.text : '';
    await ctx.reply('Yaşınız kaçtır? (Sadece rakam giriniz)');
    return ctx.wizard.next();
  },
  async (ctx) => {
    if ('text' in ctx.message! && ctx.message.text === '/cancel') {
        await ctx.reply('Başvuru iptal edildi.');
        return ctx.scene.leave();
    }
    const state = ctx.scene.session.state as WizardState;
    const age = parseInt('text' in ctx.message! ? ctx.message.text : '0', 10);
    if (isNaN(age)) {
        await ctx.reply('Lütfen geçerli bir yaş giriniz.');
        return;
    }
    state.age = age;
    await ctx.reply('Neden yönetici (admin) olmak istiyorsunuz?');
    return ctx.wizard.next();
  },
  async (ctx) => {
    if ('text' in ctx.message! && ctx.message.text === '/cancel') {
        await ctx.reply('Başvuru iptal edildi.');
        return ctx.scene.leave();
    }
    const state = ctx.scene.session.state as WizardState;
    state.reason = 'text' in ctx.message! ? ctx.message.text : '';
    await ctx.reply('Daha önce herhangi bir grupta veya projede yöneticilik deneyiminiz oldu mu? (Kısaca bahsedin)');
    return ctx.wizard.next();
  },
  async (ctx) => {
    if ('text' in ctx.message! && ctx.message.text === '/cancel') {
        await ctx.reply('Başvuru iptal edildi.');
        return ctx.scene.leave();
    }
    const state = ctx.scene.session.state as WizardState;
    state.experience = 'text' in ctx.message! ? ctx.message.text : '';
    await ctx.reply('Günlük ortalama ne kadar süre aktif olabilirsiniz?');
    return ctx.wizard.next();
  },
  async (ctx) => {
    if ('text' in ctx.message! && ctx.message.text === '/cancel') {
        await ctx.reply('Başvuru iptal edildi.');
        return ctx.scene.leave();
    }
    const state = ctx.scene.session.state as WizardState;
    state.activeTime = 'text' in ctx.message! ? ctx.message.text : '';
    await ctx.reply('Eklemek istediğiniz başka bir açıklama var mı? (Yoksa "Yok" yazabilirsiniz)');
    return ctx.wizard.next();
  },
  async (ctx) => {
    if ('text' in ctx.message! && ctx.message.text === '/cancel') {
        await ctx.reply('Başvuru iptal edildi.');
        return ctx.scene.leave();
    }
    const state = ctx.scene.session.state as WizardState;
    state.extraInfo = 'text' in ctx.message! ? ctx.message.text : '';
    
    // Save to DB
    const tgId = String(ctx.from?.id);
    const username = ctx.from?.username;

    // Check if auto_approve is on
    const autoApproveSetting = await prisma.settings.findUnique({ where: { key: 'auto_approve_applications' }});
    const isAutoApprove = autoApproveSetting?.value === 'true';
    const finalStatus = isAutoApprove ? 'APPROVED' : 'PENDING';

    try {
        const candidate = await prisma.candidate.create({
            data: {
                telegramId: tgId,
                username,
                displayName: state.displayName || 'Unknown',
                age: state.age,
                reason: state.reason,
                experience: state.experience,
                activeTime: state.activeTime,
                extraInfo: state.extraInfo,
                status: finalStatus
            }
        });

        await prisma.application.create({
            data: {
                candidateId: candidate.id,
                status: finalStatus
            }
        });

        if (isAutoApprove) {
            await ctx.reply('Başvurunuz alındı ve otomatik olarak onaylandı! Oylama menüsünden profilinize erişilebilir.');
        } else {
            await ctx.reply('Başvurunuz başarıyla alındı! Yönetim inceledikten sonra bilgilendirileceksiniz.');
        }
    } catch (e) {
        console.error(e);
        await ctx.reply('Başvurunuz kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
    }

    return ctx.scene.leave();
  }
);
