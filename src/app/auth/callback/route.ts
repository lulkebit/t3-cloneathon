import { createClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/chat'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Create a more robust redirect URL
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'
      
      let redirectUrl: string
      if (isLocalEnv) {
        redirectUrl = `${origin}${next}`
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`
      } else {
        redirectUrl = `${origin}${next}`
      }
      
      // Add a small delay to ensure session is properly set
      const response = NextResponse.redirect(redirectUrl)
      
      // Ensure cookies are properly set for the redirect
      response.headers.set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate')
      
      return response
    } else {
      console.error('Auth callback error:', error)
    }
  }

  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
} 