const { createClient } = require('@supabase/supabase-js')

async function testDuplicatesAPI() {
  try {
    // Test with direct Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    console.log('Testing Supabase connection...')
    
    const { data, error } = await supabase.rpc('find_issue_duplicates', {
      lat: 17.415252,
      lng: 78.50176,
      query_text: 'test 5 test 5 just for demo',
      radius_m: 300,
      min_similarity: 0.2
    })
    
    console.log('Result:', { data, error })
    
  } catch (err) {
    console.error('Test error:', err)
  }
}

testDuplicatesAPI()
