import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestConnection() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)

  const testConnection = async () => {
    try {
      setStatus('loading')
      setError(null)
      
      // Test the connection by getting the current user
      const { data, error } = await supabase
        .from('ouvriers')
        .select('*')
      
      if (error) throw error
      
      // Try to create the workers table if it doesn't exist
      const { error: createError } = await supabase.rpc('create_workers_table')
      
      if (createError) {
        console.error('Error creating table:', createError)
        // If RPC fails, try direct SQL (requires more permissions)
        const { error: sqlError } = await supabase
          .from('ouvriers')
          .select('count(*)')
          .limit(0)
          
        if (sqlError && sqlError.code === '42P01') {
          // Table doesn't exist, try to create it
          console.log('Table does not exist, creating...')
          const { error: createTableError } = await supabase
            .from('ouvriers')
            .insert([{ first_name: 'Test', last_name: 'User', rfid_id: 'test123' }]) // This will fail but help us see the exact error
            .select()
            
          console.error('Create table result:', createTableError)
        }
      }
      
      setStatus('success')
    } catch (err) {
      console.error('Connection test error:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      setStatus('error')
    }
  }

  useEffect(() => {
    testConnection()
  }, [])

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Supabase Connection Test</CardTitle>
          <CardDescription>Testing connection to Supabase and database setup</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>Status: </strong>
              <span className={
                status === 'success' ? 'text-green-500' :
                status === 'error' ? 'text-red-500' :
                'text-yellow-500'
              }>
                {status === 'loading' ? 'Testing connection...' :
                 status === 'success' ? 'Connected successfully' :
                 'Connection failed'}
              </span>
            </div>
            
            {error && (
              <div className="text-red-500">
                <strong>Error: </strong>
                {error}
              </div>
            )}
            
            <Button 
              onClick={testConnection}
              disabled={status === 'loading'}
            >
              Test Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 