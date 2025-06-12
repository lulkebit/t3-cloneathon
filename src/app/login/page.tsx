'use client'

import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { createClient } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const {
      data: { subscription },
    } =     supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/chat')
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth, router])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Melde dich in deinem Konto an
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Oder erstelle ein neues Konto
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#2563eb',
                    brandAccent: '#1d4ed8',
                  },
                },
              },
            }}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'E-Mail-Adresse',
                  password_label: 'Passwort',
                  email_input_placeholder: 'Deine E-Mail-Adresse',
                  password_input_placeholder: 'Dein Passwort',
                  button_label: 'Anmelden',
                  loading_button_label: 'Wird angemeldet...',
                  social_provider_text: 'Mit {{provider}} anmelden',
                  link_text: 'Hast du bereits ein Konto? Anmelden',
                },
                sign_up: {
                  email_label: 'E-Mail-Adresse',
                  password_label: 'Passwort',
                  email_input_placeholder: 'Deine E-Mail-Adresse',
                  password_input_placeholder: 'Dein Passwort',
                  button_label: 'Registrieren',
                  loading_button_label: 'Wird registriert...',
                  social_provider_text: 'Mit {{provider}} registrieren',
                  link_text: 'Hast du noch kein Konto? Registrieren',
                  confirmation_text: 'Prüfe deine E-Mails für den Bestätigungslink',
                },
                forgotten_password: {
                  email_label: 'E-Mail-Adresse',
                  password_label: 'Passwort',
                  email_input_placeholder: 'Deine E-Mail-Adresse',
                  button_label: 'Passwort zurücksetzen',
                  loading_button_label: 'Sende E-Mail...',
                  link_text: 'Passwort vergessen?',
                  confirmation_text: 'Prüfe deine E-Mails für den Link zum Zurücksetzen',
                },
              },
            }}
            providers={['google', 'github']}
            redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/chat` : '/chat'}
          />
        </div>
      </div>
    </div>
  )
} 