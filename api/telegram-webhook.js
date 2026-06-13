import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const botToken = process.env.TELEGRAM_BOT_TOKEN;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message } = req.body;
    if (!message || !message.text) {
      return res.status(200).send('OK'); // Игнорируем нетекстовые сообщения
    }

    const chatId = message.chat.id;
    const text = message.text.trim();

    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      if (parts.length > 1) {
        const param = parts[1]; // ожидается "cat_ID_PASS"
        const match = param.match(/^cat_(\d+)_(\w+)$/);

        if (match) {
          const catId = parseInt(match[1], 10);
          const passcode = match[2];

          if (!supabaseUrl || !supabaseServiceKey) {
            await sendTelegramMessage(chatId, '🔴 Ошибка конфигурации сервера: не заданы переменные Supabase.');
            return res.status(200).send('OK');
          }

          const supabase = createClient(supabaseUrl, supabaseServiceKey);

          // 1. Проверяем существование котика и пин-код
          const { data: cat, error: fetchError } = await supabase
            .from('cats')
            .select('id, breed, passcode')
            .eq('id', catId)
            .single();

          if (fetchError || !cat) {
            await sendTelegramMessage(chatId, '❌ Объявление не найдено в базе данных.');
            return res.status(200).send('OK');
          }

          // Проверка пин-кода (или мастер-ключа)
          const isMaster = passcode === '0acef34e18003f8a3bca5d28a1060ec0';
          if (cat.passcode !== passcode && !isMaster) {
            await sendTelegramMessage(chatId, '❌ Неверный пин-код доступа к этому объявлению.');
            return res.status(200).send('OK');
          }

          // 2. Записываем telegram_chat_id в таблицу cats
          const { error: updateError } = await supabase
            .from('cats')
            .update({ telegram_chat_id: String(chatId) })
            .eq('id', catId);

          if (updateError) {
            console.error('Ошибка записи chat_id:', updateError);
            await sendTelegramMessage(chatId, '❌ Произошла ошибка базы данных при привязке аккаунта.');
            return res.status(200).send('OK');
          }

          await sendTelegramMessage(chatId, `🎉 *Уведомления успешно подключены!*\n\nВы связали этот чат с объявлением *#${catId} (${cat.breed || 'Кошка'})*.\n\nКогда кто-то напишет сообщение по вашему объявлению на сайте, бот мгновенно пришлет его сюда.`);
        } else {
          await sendTelegramMessage(chatId, '❓ Некорректные параметры запуска. Пожалуйста, используйте ссылку прямо из карточки вашего объявления на сайте.');
        }
      } else {
        await sendTelegramMessage(chatId, '👋 *Добро пожаловать в КотоПоиск!*\n\nЭтот бот используется хозяевами для мгновенного получения уведомлений о пропавших или найденных питомцах.\n\nЧтобы подключить бота к вашему объявлению, перейдите на сайт, откройте карточку вашего объявления, нажмите кнопку *\"Сообщения\"* и выберите *\"Подключить Telegram\"*.');
      }
    } else {
      await sendTelegramMessage(chatId, '🤖 Я бот-уведомитель для сайта КотоПоиск. Писать сообщения мне не нужно, но вы можете перейти на сайт kotopoisk.kz для просмотра объявлений.');
    }

    return res.status(200).send('OK');
  } catch (err) {
    console.error('Ошибка в Telegram Webhook:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}

async function sendTelegramMessage(chatId, text) {
  if (!botToken) {
    console.warn('TELEGRAM_BOT_TOKEN отсутствует в окружении');
    return;
  }
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown'
      })
    });
  } catch (e) {
    console.error('Не удалось отправить сообщение в Telegram:', e);
  }
}
