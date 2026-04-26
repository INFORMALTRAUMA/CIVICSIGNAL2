import { NextResponse } from "next/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient()
    
    // Test basic connection
    const { data: issues, error: issuesError } = await supabase
      .from('issues')
      .select('id, title, description, location')
      .limit(5)
    
    if (issuesError) {
      return NextResponse.json({ 
        error: "Failed to fetch issues", 
        details: issuesError 
      }, { status: 500 })
    }
    
    // Test if location data exists
    const { data: locationTest, error: locationError } = await supabase
      .from('issues')
      .select('id, location')
      .not('location', 'is', null)
      .limit(3)
    
    return NextResponse.json({ 
      issues: issues,
      locationTest: locationTest,
      issuesError: issuesError,
      locationError: locationError
    })
  } catch (err) {
    return NextResponse.json({ 
      error: "Test failed", 
      details: String(err) 
    }, { status: 500 })
  }
}
