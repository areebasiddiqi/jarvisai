'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/providers/AuthProvider'
import { useRouter } from 'next/navigation'
import { createSupabaseClient } from '@/lib/supabase'
import { 
  Bot, 
  Wallet, 
  TrendingUp, 
  Users, 
  ArrowUpRight, 
  ArrowDownLeft,
  Eye,
  Send,
  Coins,
  Gift,
  History,
  Settings,
  LogOut,
  MessageCircle
} from 'lucide-react'
import Link from 'next/link'

interface Profile {
  id: string
  full_name: string
  referral_code: string
  total_jarvis_tokens: number
  main_wallet_balance: number
  fund_wallet_balance: number
}

interface InvestmentPlan {
  id: string
  plan_type: 'A' | 'B' | 'C'
  investment_amount: number
  daily_percentage: number
  jarvis_tokens_earned: number
  total_profit_earned: number
  is_active: boolean
  created_at: string
}

export default function DashboardPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [plans, setPlans] = useState<InvestmentPlan[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchUserData()
    }
  }, [user])

  const fetchUserData = async () => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (profileError) throw profileError
      setProfile(profileData)

      // Fetch investment plans
      const { data: plansData, error: plansError } = await supabase
        .from('investment_plans')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)

      if (plansError) throw plansError
      setPlans(plansData || [])

    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading || loadingData) {
    return (
      <div className="min-h-screen jarvis-gradient flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const totalInvestment = plans.reduce((sum, plan) => sum + plan.investment_amount, 0)
  const totalProfits = plans.reduce((sum, plan) => sum + plan.total_profit_earned, 0)

  return (
    <div className="min-h-screen jarvis-gradient">
      {/* Header */}
      <header className="border-b border-white/20 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-white" />
              <span className="text-2xl font-bold text-white">Jarvis AI</span>
            </div>
            <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
              Big Day 2024
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-white text-right">
              <p className="text-sm text-gray-300">Welcome back</p>
              <p className="font-semibold">{profile.full_name}</p>
              <p className="text-xs text-blue-300">User ID: {profile.referral_code}</p>
            </div>
            <div className="flex items-center space-x-2">
              <button className="p-2 text-white hover:bg-white/10 rounded-full">
                <Send className="h-5 w-5" />
              </button>
              <button className="p-2 text-white hover:bg-white/10 rounded-full">
                <MessageCircle className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4">
        {/* Total Income Card */}
        <div className="jarvis-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-bold text-white">${profile.main_wallet_balance.toFixed(2)}</h2>
              <p className="text-gray-300">Total Income</p>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <Bot className="h-8 w-8 text-white" />
                <span className="text-xl font-bold text-white">Jarvis AI</span>
              </div>
              <div className="bg-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold mt-2">
                Big Day 2024
              </div>
            </div>
          </div>
        </div>

        {/* Staking Notice */}
        <div className="bg-blue-600/20 border border-blue-500 rounded-lg p-4 mb-6 overflow-hidden">
          <div className="whitespace-nowrap animate-marquee">
            <p className="text-white inline-block"> Staking has started from $50 • Earn daily profits with BSC integration • Referral commissions up to 10 levels •</p>
          </div>
        </div>

        {/* Wallet Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div className="jarvis-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Main Wallet</h3>
                  <p className="text-gray-300 text-sm">${profile.main_wallet_balance.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="jarvis-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Fund Wallet</h3>
                  <p className="text-gray-300 text-sm">${profile.fund_wallet_balance.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Jarvis Tokens Card */}
        <div className="jarvis-card rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Coins className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Jarvis Tokens</h3>
                <p className="text-2xl font-bold text-yellow-400">{profile.total_jarvis_tokens.toLocaleString()} JRV</p>
                <button className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-semibold mt-2">
                  BUY JRV
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Link href="/dashboard/deposit" className="jarvis-card rounded-2xl p-6 text-center hover:scale-105 transition-transform">
            <ArrowUpRight className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <p className="text-white font-semibold">Deposit</p>
          </Link>

          <Link href="/dashboard/invest" className="jarvis-card rounded-2xl p-6 text-center hover:scale-105 transition-transform">
            <TrendingUp className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <p className="text-white font-semibold">Invest</p>
          </Link>

          <Link href="/dashboard/transfer" className="jarvis-card rounded-2xl p-6 text-center hover:scale-105 transition-transform">
            <Send className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <p className="text-white font-semibold">Transfer</p>
          </Link>

          <Link href="/dashboard/withdraw" className="jarvis-card rounded-2xl p-6 text-center hover:scale-105 transition-transform">
            <ArrowDownLeft className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-white font-semibold">Withdraw</p>
          </Link>

          <Link href="/dashboard/staking" className="jarvis-card rounded-2xl p-6 text-center hover:scale-105 transition-transform">
            <Coins className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-white font-semibold">Staking</p>
          </Link>

          <Link href="/dashboard/bnx-staking" className="jarvis-card rounded-2xl p-6 text-center hover:scale-105 transition-transform">
            <Coins className="h-8 w-8 text-orange-400 mx-auto mb-2" />
            <p className="text-white font-semibold">JRV Staking</p>
          </Link>

          <Link href="/dashboard/referral" className="jarvis-card rounded-2xl p-6 text-center hover:scale-105 transition-transform">
            <Users className="h-8 w-8 text-pink-400 mx-auto mb-2" />
            <p className="text-white font-semibold">Refer Link</p>
          </Link>
        </div>

        {/* Income Tracking */}
        <div className="space-y-4 mb-6">
          <div className="jarvis-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Coins className="h-6 w-6 text-yellow-400" />
              <div>
                <p className="text-white font-semibold">Sign Up Token</p>
                <button className="text-blue-400 text-sm">VIEW</button>
              </div>
            </div>
            <p className="text-white font-bold">100 JRV</p>
          </div>

          <div className="jarvis-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Coins className="h-6 w-6 text-yellow-400" />
              <div>
                <p className="text-white font-semibold">JRV Referral Token</p>
                <button className="text-blue-400 text-sm">VIEW</button>
              </div>
            </div>
            <p className="text-white font-bold">0 JRV</p>
          </div>

          <div className="jarvis-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrendingUp className="h-6 w-6 text-green-400" />
              <div>
                <p className="text-white font-semibold">Trade Income</p>
                <button className="text-blue-400 text-sm">VIEW</button>
              </div>
            </div>
            <p className="text-white font-bold">${totalProfits.toFixed(2)}</p>
          </div>

          <div className="jarvis-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-purple-400" />
              <div>
                <p className="text-white font-semibold">Level Income</p>
                <button className="text-blue-400 text-sm">VIEW</button>
              </div>
            </div>
            <p className="text-white font-bold">$0</p>
          </div>

          <div className="jarvis-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Gift className="h-6 w-6 text-pink-400" />
              <div>
                <p className="text-white font-semibold">Reward Income</p>
                <button className="text-blue-400 text-sm">VIEW</button>
              </div>
            </div>
            <p className="text-white font-bold">$0</p>
          </div>

          <div className="jarvis-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Coins className="h-6 w-6 text-blue-400" />
              <div>
                <p className="text-white font-semibold">Staking Income</p>
                <button className="text-blue-400 text-sm">VIEW</button>
              </div>
            </div>
            <p className="text-white font-bold">$0</p>
          </div>

          <div className="jarvis-card rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Users className="h-6 w-6 text-orange-400" />
              <div>
                <p className="text-white font-semibold">Staking Referral Income</p>
                <button className="text-blue-400 text-sm">VIEW</button>
              </div>
            </div>
            <p className="text-white font-bold">$0</p>
          </div>
        </div>

        {/* Team & Investment Info */}
        <div className="jarvis-card rounded-2xl p-6 mb-6">
          <h3 className="text-white font-bold text-lg mb-4">Team & Investment Info</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-300 text-sm">My Investment</p>
                <p className="text-2xl font-bold text-white">${totalInvestment.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-300 text-sm">My Referrals</p>
                <p className="text-2xl font-bold text-white">0</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-gray-300 text-sm">Team Investment</p>
                <p className="text-2xl font-bold text-white">$0</p>
              </div>
              <div className="space-y-2">
                <div className="text-center">
                  <p className="text-gray-300 text-sm">Staking Progress</p>
                  <p className="text-2xl font-bold text-white">$0</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-300 text-sm">Jarvis Staking</p>
                  <p className="text-2xl font-bold text-white">0 JRV</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-blue-600 border-t border-blue-500">
        <div className="grid grid-cols-5 text-center">
          <Link href="/dashboard" className="p-4 text-white">
            <TrendingUp className="h-6 w-6 mx-auto mb-1" />
            <span className="text-xs">Home</span>
          </Link>
          <Link href="/dashboard/staking" className="p-4 text-white">
            <Coins className="h-6 w-6 mx-auto mb-1" />
            <span className="text-xs">Staking</span>
          </Link>
          <Link href="/dashboard/bnx-staking" className="p-4 text-white bg-blue-700 rounded-t-2xl">
            <Coins className="h-6 w-6 mx-auto mb-1" />
            <span className="text-xs">JRV Staking</span>
          </Link>
          <Link href="/dashboard/profile" className="p-4 text-white">
            <Settings className="h-6 w-6 mx-auto mb-1" />
            <span className="text-xs">Profile</span>
          </Link>
          <button onClick={handleSignOut} className="p-4 text-white">
            <LogOut className="h-6 w-6 mx-auto mb-1" />
            <span className="text-xs">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
