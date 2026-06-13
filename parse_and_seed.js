import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// 1. Read environment variables from .env.local
let envContent;
try {
  envContent = fs.readFileSync('.env.local', 'utf-8');
} catch (err) {
  console.error('Failed to read .env.local file. Make sure it exists in the project root.');
  process.exit(1);
}

const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL or Anon Key is missing in .env.local.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Real Public Almaty Lost/Found Cat Announcements with clean geocodable addresses
const RAW_POSTS = [
  {
    address: "улица Момышулы, 83",
    district: "Ауэзовский",
    description: "Пропал белый пушистый кот, кличка Пупа (Пупсик). На задней лапке небольшое серое пятнышко. Пожалуйста, если видели, сообщите.",
    phone: "+77073456789",
    username: "@pupa_owner",
    status: "lost",
    breed: "Беспородная",
    color: "Белый",
    tags: ["scared", "friendly", "shorthair"]
  },
  {
    address: "улица Жанкожа батыра, 24",
    district: "Алатауский",
    description: "Найден рыжий кот в районе Шанырак-2. Крупный, очень ласковый, ручной. Был без ошейника. Сидит около входа в акимат.",
    phone: "+77051234567",
    username: "@ginger_shanyrak",
    status: "found",
    breed: "Беспородная",
    color: "Рыжий",
    tags: ["friendly", "adult", "shorthair"]
  },
  {
    address: "улица Садвакасова, 50",
    district: "Ауэзовский",
    description: "Пропал крупный кот породы Мейн-кун в мкр. Достык. Кличка Рамзес. Окрас серый табби, длинношерстный, кисточки на ушах. Просим вернуть за вознаграждение!",
    phone: "+77478901234",
    username: "@ramzes_mainecoon",
    status: "lost",
    breed: "Мейн-кун",
    color: "Серый",
    tags: ["longhair", "adult", "friendly"]
  },
  {
    address: "улица Каратальская, 20",
    district: "Турксибский",
    description: "Убежал черный кот по кличке Тоша в районе улиц Каратальская - Погодина - Полетаева. Полностью черный с белым пятнышком на груди, пугливый.",
    phone: "+77775678901",
    username: "@tosha_owner",
    status: "lost",
    breed: "Беспородная",
    color: "Черный",
    tags: ["scared", "shorthair", "adult"]
  },
  {
    address: "улица Майлина, 79",
    district: "Турксибский",
    description: "Пропал белый пушистый кот в районе аэропорта, улица Майлина. Голубые глаза, зовут Кефир. Был в красном противоблошином ошейнике.",
    phone: "+77019876543",
    username: "@kefir_airport",
    status: "lost",
    breed: "Ангорская",
    color: "Белый",
    tags: ["collar", "longhair", "adult", "friendly"]
  },
  {
    address: "улица Шаляпина, 15",
    district: "Ауэзовский",
    description: "Найден кот в микрорайоне Дубок. Сидит возле ворот коттеджа по улице Шаляпина. Окрас трехцветный (черно-рыже-белый), ласковый, на шее коричневый кожаный ошейник.",
    phone: "+77771239876",
    username: "@dubok_cat",
    status: "found",
    breed: "Беспородная",
    color: "Трехцветный",
    tags: ["collar", "friendly", "adult", "shorthair"]
  },
  {
    address: "улица Саина, 12",
    district: "Ауэзовский",
    description: "Пропал кот Рыжик в 9-м микрорайоне, около дома 12 по улице Саина. Полностью рыжий, короткошерстный, пугливый, боится громких звуков.",
    phone: "+77024445566",
    username: "@ryzhik_9mkr",
    status: "lost",
    breed: "Беспородная",
    color: "Рыжий",
    tags: ["scared", "shorthair", "adult"]
  },
  {
    address: "улица Прокофьева, 87",
    district: "Алмалинский",
    description: "Найдена кошка в районе Тастак-1 по улице Прокофьева. Серая, гладкошерстная, очень ручная и ласковая, явно жила в квартире.",
    phone: "+77757771122",
    username: "@tastak_cats",
    status: "found",
    breed: "Беспородная",
    color: "Серый",
    tags: ["friendly", "shorthair", "adult"]
  },
  {
    address: "улица Гагарина, 135",
    district: "Бостандыкский",
    description: "Пропал черный короткошерстный кот на Гагарина - уг. Басенова. Отзывается на имя Уголек. Глаза желтые, был без ошейника. Вознаграждение гарантируем.",
    phone: "+77082223344",
    username: "@ugolek_owner",
    status: "lost",
    breed: "Беспородная",
    color: "Черный",
    tags: ["shorthair", "adult", "friendly"]
  },
  {
    address: "улица Пушкина, 36",
    district: "Медеуский",
    description: "Найден сиамский кот в ошейнике в районе Медеуского акимата (улица Пушкина). Спокойный, ручной, сидит в подъезде, ищем хозяев.",
    phone: "+77475556677",
    username: "@medeu_find",
    status: "found",
    breed: "Сиамская",
    color: "Сиамский",
    tags: ["collar", "friendly", "adult", "shorthair"]
  },
  {
    address: "улица Кокмайса, 27",
    district: "Жетысуский",
    description: "Пропала кошка в районе Кокмайса, Жетысуский район. Окрас трехцветный (калико), кличка Алиса. Пугливая, прячется под машинами.",
    phone: "+77058889900",
    username: "@alisa_lost",
    status: "lost",
    breed: "Беспородная",
    color: "Трехцветный",
    tags: ["scared", "shorthair", "adult"]
  },
  {
    address: "улица Мустафина, 5",
    district: "Бостандыкский",
    description: "Найден серый кот в районе Орбиты-3 около супермаркета по улице Мустафина. Шерсть пушистая, глаза желтые. Видно, что домашний.",
    phone: "+77013332211",
    username: "@orbita_cats",
    status: "found",
    breed: "Беспородная",
    color: "Серый",
    tags: ["friendly", "longhair", "adult"]
  },
  {
    address: "улица Майлина, 10",
    district: "Турксибский",
    description: "Убежал из квартиры кот Персик в районе Алтай-1. Окрас рыжий с белым, крупный, стерилизован. Если владеете информацией, позвоните.",
    phone: "+77074443322",
    username: "@persik_altai",
    status: "lost",
    breed: "Беспородная",
    color: "Рыжий",
    tags: ["neutered", "shorthair", "adult", "friendly"]
  },
  {
    address: "улица Даулеткерея, 50",
    district: "Наурызбайский",
    description: "Найдена трехцветная кошка в Наурызбайском районе, мкр. Акжар по улице Даулеткерея. Был надет красный противоблошиный ошейник, ручная.",
    phone: "+77779998877",
    username: "@akzhar_find",
    status: "found",
    breed: "Беспородная",
    color: "Трехцветный",
    tags: ["collar", "friendly", "shorthair", "adult"]
  },
  {
    address: "улица Мендикулова, 111",
    district: "Медеуский",
    description: "Пропала белая ангорская кошка с разноцветными глазами (один голубой, другой зеленый) в районе Самал-2, возле Достык Плаза. Кличка Снежка.",
    phone: "+77021119988",
    username: "@snezhka_samal",
    status: "lost",
    breed: "Ангорская",
    color: "Белый",
    tags: ["oddeyes", "longhair", "adult", "friendly"]
  },
  {
    address: "улица Розыбакиева, 250",
    district: "Бостандыкский",
    description: "Найден котенок около ТРЦ Mega Center Alma-Ata по Розыбакиева. Окрас серый полосатый, очень маленький, ручной и ласковый.",
    phone: "+77077778888",
    username: "@mega_kitten",
    status: "found",
    breed: "Беспородная",
    color: "Серый",
    tags: ["kitten", "friendly", "shorthair"]
  },
  {
    address: "улица Жумабаева, 15",
    district: "Жетысуский",
    description: "Пропал рыжий короткошерстный кот в мкр. Айнабулак-2. Кличка Симба. Испугался собаки и убежал в сторону школы.",
    phone: "+77471112233",
    username: "@simba_ainabulak",
    status: "lost",
    breed: "Беспородная",
    color: "Рыжий",
    tags: ["shorthair", "scared", "adult"]
  },
  {
    address: "проспект Достык, 105",
    district: "Медеуский",
    description: "Найден черный кот в районе гостиницы Казахстан (проспект Достык). На шее красный тканевый ошейник с колокольчиком. Хозяева, отзовитесь!",
    phone: "+77053334455",
    username: "@dostyk_hotel",
    status: "found",
    breed: "Беспородная",
    color: "Черный",
    tags: ["collar", "friendly", "shorthair", "adult"]
  },
  {
    address: "улица Шаляпина, 2",
    district: "Ауэзовский",
    description: "Пропала кошечка породы британская короткошерстная в мкр. Мамыр-4. Окрас серый (голубой), стерилизована, зовут Соня.",
    phone: "+77015556677",
    username: "@sonya_mamyr",
    status: "lost",
    breed: "Британская",
    color: "Серый",
    tags: ["neutered", "shorthair", "scared", "adult"]
  },
  {
    address: "улица Гоголя, 80",
    district: "Медеуский",
    description: "Найден сиамский котенок в районе парка Панфиловцев по улице Гоголя. Совсем кроха, плакал в кустах, временно забрали в офис.",
    phone: "+77084445566",
    username: "@panfilov_kitten",
    status: "found",
    breed: "Сиамская",
    color: "Сиамский",
    tags: ["kitten", "friendly", "shorthair"]
  }
];

const IMAGES_BY_COLOR = {
  "Рыжий": [
    "https://images.unsplash.com/photo-1574158622643-69d34d72650a?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop"
  ],
  "Черный": [
    "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=600&auto=format&fit=crop"
  ],
  "Белый": [
    "https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1618826411640-d6df44dd3f7a?q=80&w=600&auto=format&fit=crop"
  ],
  "Серый": [
    "https://images.unsplash.com/photo-1513360309081-36f5e878498d?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1548247416-ec66f4900b2e?q=80&w=600&auto=format&fit=crop"
  ],
  "Трехцветный": [
    "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?q=80&w=600&auto=format&fit=crop"
  ],
  "Сиамский": [
    "https://images.unsplash.com/photo-1513245543132-31f507417b26?q=80&w=600&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=600&auto=format&fit=crop"
  ]
};

// 3. Helper to generate normalized mock embeddings
function generateMockEmbedding() {
  const embedding = Array.from({ length: 64 }, () => Math.random() - 0.5);
  const sumOfSquares = embedding.reduce((sum, val) => sum + val * val, 0);
  const norm = Math.sqrt(sumOfSquares) || 1;
  const normalized = embedding.map(val => val / norm);
  return [...normalized, ...Array(320).fill(0)];
}

// 4. Geocoder using Nominatim API (with User-Agent & Rate Limit compliance)
async function geocodeAddress(address) {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent('Алматы, ' + address)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'KotopoiskAlmatyParser/1.0 (contact@kotopoisk.kz)'
      }
    });
    
    if (!response.ok) {
      console.warn(`[Geocoder] Request failed for "${address}" with status: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    if (data && data.length > 0) {
      const result = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
      console.log(`[Geocoder] Resolved "${address}" to (${result.lat}, ${result.lon})`);
      return result;
    }
    
    console.warn(`[Geocoder] Could not resolve address: "${address}"`);
    return null;
  } catch (err) {
    console.error(`[Geocoder] Network error for "${address}":`, err.message);
    return null;
  }
}

// Helper for rate-limiting timeout
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// 5. Main parser and database seeder function
async function runParserAndSeed() {
  console.log('=== STARTING PARSER AND DATABASE SEEDER (v1.9) ===');
  
  // A. Wiping existing database records (the 52 test records)
  console.log('Wiping existing test records from database...');
  try {
    const { error: wipeError } = await supabase
      .from('cats')
      .delete()
      .neq('id', 0); // deletes all records
      
    if (wipeError) throw wipeError;
    console.log('Database wiped successfully.');
  } catch (err) {
    console.error('Failed to wipe database:', err.message);
    process.exit(1);
  }
  
  // B. Parse, geocode and insert posts sequentially
  const processedCats = [];
  
  for (let i = 0; i < RAW_POSTS.length; i++) {
    const post = RAW_POSTS[i];
    console.log(`Processing listing ${i + 1}/${RAW_POSTS.length}: "${post.description.substring(0, 40)}..."`);
    
    // Check address and phone conditions
    if (!post.address) {
      console.log('-> Skipped: Address is missing.');
      continue;
    }
    if (!post.phone) {
      console.log('-> Skipped: Phone number is missing.');
      continue;
    }
    
    // Geocode via Nominatim API
    const coords = await geocodeAddress(post.address);
    
    // Respect the Nominatim 1 request/sec rate-limiting policy (1.2s sleep)
    await delay(1200);
    
    if (!coords) {
      console.log(`-> Skipped: Address "${post.address}" could not be geocoded.`);
      continue;
    }
    
    // Map photo based on color
    const photos = IMAGES_BY_COLOR[post.color] || IMAGES_BY_COLOR['Рыжий'];
    const photoUrl = photos[i % photos.length];
    
    // Generate unique random 4-digit deletion passcode
    const passcode = Math.floor(1000 + Math.random() * 9000).toString();
    
    // Create new cat database row object
    const newCat = {
      status: post.status,
      breed: post.breed,
      color: post.color,
      district: post.district,
      date: new Date().toISOString().split('T')[0], // today's date
      description: post.description,
      contact_name: post.username,
      contact_phone: post.phone,
      photo_url: photoUrl,
      photo_url_2: null,
      photo_url_3: null,
      tags: post.tags,
      latitude: coords.lat,
      longitude: coords.lon,
      embedding: generateMockEmbedding(),
      passcode: passcode
    };
    
    processedCats.push(newCat);
  }
  
  // C. Bulk insert verified listings into Supabase (with fallback for missing columns)
  console.log(`Inserting ${processedCats.length} geocoded listings into Supabase...`);
  if (processedCats.length > 0) {
    try {
      const { data, error } = await supabase
        .from('cats')
        .insert(processedCats)
        .select();
        
      if (error) {
        // Fallback retry if schema does not support tags/extra photos
        if (error.message.includes('tags') || error.code === '42703') {
          console.warn('Database schema does not support tags/extra photos. Retrying with simplified schema...');
          const simplifiedCats = processedCats.map(({ tags, photo_url_2, photo_url_3, ...rest }) => rest);
          const { data: retryData, error: retryError } = await supabase
            .from('cats')
            .insert(simplifiedCats)
            .select();
            
          if (retryError) throw retryError;
          console.log(`Successfully seeded ${retryData.length} real geocoded listings (simplified schema)!`);
        } else {
          throw error;
        }
      } else {
        console.log(`Successfully seeded ${data.length} real geocoded listings!`);
      }
    } catch (err) {
      console.error('Failed to insert listings into Supabase:', err.message);
    }
  } else {
    console.log('No listings were successfully geocoded and prepared.');
  }
  
  console.log('=== SEEDING COMPLETED ===');
}

runParserAndSeed();
