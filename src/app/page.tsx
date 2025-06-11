import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Image from "next/image";

export default async function Home() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  } else {
    redirect('/login')
  }
}
