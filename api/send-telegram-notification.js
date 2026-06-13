import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const botToken = process.env.TELEGRAM_BOT_TOKEN;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { cat_id, sender_name, sender_contact, message_text } = req.body;

  if (!cat_id || !sender_name || !sender_contact || !message_text) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error: missing Supabase credentials' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Получаем telegram_chat_id для этого объявления
    const { data: cat, error: dbError } = await supabase
      .from('cats')
      .select('telegram_chat_id, breed')
      .eq('id', cat_id)
      .single();

    if (dbError) {
      console.warn('Ошибка БД при поиске chat_id:', dbError);
      return res.status(200).json({ success: false, reason: 'Listing not found or DB error' });
    }

    if (!cat || !cat.telegram_chat_id) {
      // Бот не привязан к этому объявлению, но сообщение все равно сохранилось в БД
      return res.status(200).json({ success: false, reason: 'No Telegram chat linked' });
    }

    // Собираем текст сообщения для Telegram
    const formattedMsg = `🔔 *Новое сообщение по вашему объявлению на КотоПоиске!*\n\n*Текст:* «${message_text}»\n\n*Отправитель:* ${sender_name}\n*Контакты для связи:* ${sender_contact}\n\n_Пожалуйста, свяжитесь с отправителем напрямую для уточнения деталей._`;

    // Отправляем запрос к Telegram API
    const sendRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: cat.telegram_chat_id,
        text: formattedMsg,
        parse_mode: 'Markdown'
      })
    });

    if (sendRes.ok) {
      return res.status(200).json({ success: true });
    } else {
      const errText = await sendRes.text();
      console.warn('Ошибка Telegram API при отправке сообщения:', errText);
      return res.status(200).json({ success: false, reason: 'Telegram API failure' });
    }
  } catch (err) {
    console.error('Ошибка при отправке уведомления в Telegram:', err);
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
}
