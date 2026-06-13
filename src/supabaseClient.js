import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const getSessionId = () => {
  try {
    let sid = sessionStorage.getItem('kotopoisk_session_id');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      sessionStorage.setItem('kotopoisk_session_id', sid);
    }
    return sid;
  } catch (e) {
    return 'session_unknown';
  }
};

export const logEvent = async (eventType, pagePath = '', metadata = {}) => {
  try {
    const { error } = await supabase.from('analytics').insert([{
      event_type: eventType,
      page_path: pagePath,
      session_id: getSessionId(),
      metadata: metadata
    }]);
    if (error) {
      console.warn('Analytics logging failed:', error.message);
    }
  } catch (err) {
    console.warn('Analytics logging failed:', err);
  }
};
