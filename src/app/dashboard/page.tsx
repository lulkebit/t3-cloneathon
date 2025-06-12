import { createClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'


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
            </div>
            
            <div className="border-t border-gray-200 pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Login Information
              </h2>
              
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">User ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">
                    {user.id}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.email || 'Not available'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.phone || 'Not available'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email Confirmed</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.email_confirmed_at 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.email_confirmed_at ? 'Confirmed' : 'Not confirmed'}
                    </span>
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created At</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.created_at ? new Date(user.created_at).toLocaleString('en-US') : 'Not available'}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {user.updated_at ? new Date(user.updated_at).toLocaleString('en-US') : 'Not available'}
                  </dd>
                </div>
              </div>

              {user.user_metadata && Object.keys(user.user_metadata).length > 0 && (
                <div className="mt-6">
                  <dt className="text-sm font-medium text-gray-500 mb-2">User Metadata</dt>
                  <dd className="text-sm text-gray-900">
                    <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto">
                      {JSON.stringify(user.user_metadata, null, 2)}
                    </pre>
                  </dd>
                </div>
              )}

              {user.app_metadata && Object.keys(user.app_metadata).length > 0 && (
                <div className="mt-6">
                  <dt className="text-sm font-medium text-gray-500 mb-2">App Metadata</dt>
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