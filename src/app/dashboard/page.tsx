import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase.auth.getSession()

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <LogoutButton />
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Anmeldedaten
              </h2>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Benutzer-ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">
                    {user.id}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">E-Mail</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.email || 'Nicht verfügbar'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Telefon</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.phone || 'Nicht verfügbar'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">E-Mail bestätigt</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.email_confirmed_at 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.email_confirmed_at ? 'Bestätigt' : 'Nicht bestätigt'}
                    </span>
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Erstellt am</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.created_at ? new Date(user.created_at).toLocaleString('de-DE') : 'Nicht verfügbar'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Letztes Update</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.updated_at ? new Date(user.updated_at).toLocaleString('de-DE') : 'Nicht verfügbar'}
                  </dd>
                </div>
              </div>

              {user.user_metadata && Object.keys(user.user_metadata).length > 0 && (
                <div className="mt-6">
                  <dt className="text-sm font-medium text-gray-500 mb-2">Benutzer-Metadaten</dt>
                  <dd className="text-sm text-gray-900">
                    <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                      {JSON.stringify(user.user_metadata, null, 2)}
                    </pre>
                  </dd>
                </div>
              )}

              {user.app_metadata && Object.keys(user.app_metadata).length > 0 && (
                <div className="mt-6">
                  <dt className="text-sm font-medium text-gray-500 mb-2">App-Metadaten</dt>
                  <dd className="text-sm text-gray-900">
                    <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                      {JSON.stringify(user.app_metadata, null, 2)}
                    </pre>
                  </dd>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 