const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const sampleSaunas = [
  {
    name: '우장산불가마사우나',
    address: '서울특별시 강서구 강서로 242, 지하 1층 101~102호 (화곡동)',
    latitude: 37.5492,
    longitude: 126.8455,
    sauna_rooms: [
      { type: '건식', gender: 'male', temp: 106, capacity: 15, has_tv: true, has_auto_loyly: false },
      { type: '건식', gender: 'female', temp: 98, capacity: 12, has_tv: true, has_auto_loyly: false },
      { type: '습식', gender: 'both', temp: 77, capacity: 8, has_tv: false, has_auto_loyly: false }
    ],
    cold_baths: [
      { gender: 'male', temp: 22, capacity: 6, is_groundwater: false, depth: 70 },
      { gender: 'female', temp: 24, capacity: 5, is_groundwater: false, depth: 70 }
    ],
    resting_area: {
      indoor_seats: 5,
      outdoor_seats: 0,
      infinity_chairs: 0,
      deck_chairs: 0
    },
    amenities: {
      towel: true,
      shampoo: false,
      body_wash: false,
      hair_dryer: true
    },
    rules: {
      tattoo_allowed: false,
      female_allowed: true,
      male_allowed: true
    },
    kr_specific: {
      has_jjimjilbang: true,
      sesin_price_male: 20000,
      sesin_price_female: 25000,
      food: ['식혜', '구운계란', '매실차']
    },
    pricing: {
      adult_day: 10000,
      adult_night: 12000,
      child: 8000
    },
    business_hours: '00:00 - 24:00 (연중무휴)',
    contact: '02-2601-0000',
    parking: true
  },
  {
    name: '수금 24시사우나찜질방',
    address: '서울특별시 강서구 화곡로18길 24 뉴타워아파트 지하 1층',
    latitude: 37.5407,
    longitude: 126.8361,
    sauna_rooms: [
      { type: '건식', gender: 'both', temp: 108, capacity: 12, has_tv: true, has_auto_loyly: false },
      { type: '건식', gender: 'both', temp: 66, capacity: 10, has_tv: true, has_auto_loyly: false }
    ],
    cold_baths: [
      { gender: 'both', temp: 18, capacity: 5, is_groundwater: true, depth: 70 }
    ],
    resting_area: {
      indoor_seats: 8,
      outdoor_seats: 0,
      infinity_chairs: 0,
      deck_chairs: 0
    },
    amenities: {
      towel: true,
      shampoo: false,
      body_wash: false,
      hair_dryer: true
    },
    rules: {
      tattoo_allowed: false,
      female_allowed: true,
      male_allowed: true
    },
    kr_specific: {
      has_jjimjilbang: true,
      sesin_price_male: 18000,
      sesin_price_female: 23000,
      food: ['식혜', '미역국', '제육덮밥', '구운계란']
    },
    pricing: {
      adult_day: 11000,
      adult_night: 13000,
      child: 7000
    },
    business_hours: '00:00 - 24:00 (연중무휴)',
    contact: '02-2691-0000',
    parking: true
  }
];

async function seed() {
  console.log('Seeding saunas...');

  const { data, error } = await supabase
    .from('saunas')
    .insert(sampleSaunas)
    .select();

  if (error) {
    console.error('Error seeding saunas:', error);
  } else {
    console.log('Successfully added saunas:', data.map(s => s.name));
  }
}

seed();
