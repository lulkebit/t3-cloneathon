'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Loader2 } from 'lucide-react'

interface LogoutButtonProps {
  className?: string
}

export function LogoutButton({ className = '' }: LogoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleLogout = async () => {
    setIsLoading(true)
    try {
      // Create a form and submit it to logout
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = '/api/auth/logout'
      document.body.appendChild(form)
      form.submit()
    } catch (error) {
      console.error('Logout error:', error)
      setIsLoading(false)
    }
  }

  return (
    <motion.button
      onClick={handleLogout}
      disabled={isLoading}
      className={`btn-ghost flex items-center gap-3 px-4 py-3 w-full text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      whileHover={{ scale: 1.02, x: 4 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div
        animate={isLoading ? { rotate: 360 } : { rotate: 0 }}
        transition={isLoading ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
      >
        {isLoading ? <Loader2 size={18} /> : <LogOut size={18} />}
      </motion.div>
      
      <span>{isLoading ? 'Logging out...' : 'Logout'}</span>
    </motion.button>
  )
} 