const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// REST API 키는 카카오 디벨로퍼스 '내 애플리케이션' 요약 정보에서 확인할 수 있습니다.
const kakaoRestApiKey = process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

if (!kakaoRestApiKey) {
  console.error('Missing NEXT_PUBLIC_KAKAO_REST_API_KEY in .env.local');
  console.error('카카오 디벨로퍼스에서 REST API 키를 복사하여 .env.local에 추가해주세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getKakaoCoordinates(query) {
  try {
    const response = await fetch(`https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`, {
      headers: {
        Authorization: `KakaoAK ${kakaoRestApiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Kakao API error: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.documents && data.documents.length > 0) {
      // 가장 첫 번째 검색 결과의 좌표 반환
      return {
        lat: parseFloat(data.documents[0].y), // 위도
        lng: parseFloat(data.documents[0].x)  // 경도
      };
    }
    return null;
  } catch (err) {
    console.error(`Failed to fetch coordinates for ${query}:`, err);
    return null;
  }
}

async function updateCoordinates() {
  console.log('1. 기존 사우나 데이터를 불러옵니다...');
  const { data: saunas, error: fetchError } = await supabase
    .from('saunas')
    .select('*');

  if (fetchError || !saunas) {
    console.error('Failed to fetch saunas:', fetchError);
    return;
  }

  for (const sauna of saunas) {
    console.log(`\n2. 카카오 API로 '${sauna.name}'의 실제 위치를 검색합니다...`);
    const coords = await getKakaoCoordinates(sauna.name);
    
    if (coords) {
      console.log(`=> 찾았습니다! 기존 좌표 (${sauna.latitude}, ${sauna.longitude}) -> 새 좌표 (${coords.lat}, ${coords.lng})`);
      
      // Supabase 업데이트
      const { error: updateError } = await supabase
        .from('saunas')
        .update({ latitude: coords.lat, longitude: coords.lng })
        .eq('id', sauna.id);
        
      if (updateError) {
        console.error(`업데이트 실패 (${sauna.name}):`, updateError.message);
        // RLS 문제일 가능성이 높으므로 안내
        if (updateError.message.includes('row-level security')) {
          console.log(`\n[주의] Supabase RLS 정책 때문에 수정이 차단되었습니다.`);
          console.log(`Supabase SQL Editor에서 아래 코드를 실행하여 업데이트 권한을 추가해주세요:`);
          console.log(`create policy "사우나 정보 수정 누구나 가능" on public.saunas for update using (true);\n`);
        }
      } else {
        console.log(`=> 업데이트 완료!`);
      }
    } else {
      console.log(`=> 카카오 지도에서 '${sauna.name}' 결과를 찾을 수 없습니다.`);
    }
  }
  
  console.log('\n모든 작업이 완료되었습니다!');
}

updateCoordinates();
