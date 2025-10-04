import { NextRequest, NextResponse } from 'next/server'
import { distributeProfits } from '@/lib/profit-distribution'

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from a cron service or has the correct secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'jarvis-ai-cron-secret'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Cron job triggered profit distribution at:', new Date().toISOString())

    // Run profit distribution
    await distributeProfits()

    return NextResponse.json({
      success: true,
      message: 'Daily profit distribution completed',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error in cron profit distribution:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to distribute profits' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // Same as GET for flexibility with different cron services
  return GET(request)
}
