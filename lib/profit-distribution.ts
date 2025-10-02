import { supabaseAdmin } from './supabase-server'

export async function distributeProfits() {
  try {
    console.log('Starting profit distribution...')

    // Get all active investment plans
    const { data: plans, error: plansError } = await supabaseAdmin
      .from('investment_plans')
      .select(`
        id,
        user_id,
        plan_type,
        investment_amount,
        daily_percentage,
        created_at,
        profiles!inner(id)
      `)
      .eq('is_active', true)

    if (plansError) {
      console.error('Error fetching plans:', plansError)
      return
    }

    if (!plans || plans.length === 0) {
      console.log('No active investment plans found')
      return
    }

    const today = new Date().toISOString().split('T')[0]
    const profitDistributions = []
    const userUpdates = new Map()

    for (const plan of plans) {
      // Check if profit already distributed today
      const { data: existingDistribution } = await supabaseAdmin
        .from('profit_distributions')
        .select('id')
        .eq('plan_id', plan.id)
        .eq('distribution_date', today)
        .single()

      if (existingDistribution) {
        console.log(`Profit already distributed today for plan ${plan.id}`)
        continue
      }

      // Calculate daily profit (divide by 24 for hourly distribution)
      const dailyProfitRate = plan.daily_percentage / 100
      const hourlyProfitRate = dailyProfitRate / 24
      const profitAmount = plan.investment_amount * hourlyProfitRate

      // Add to profit distributions
      profitDistributions.push({
        plan_id: plan.id,
        user_id: plan.user_id,
        profit_amount: profitAmount,
        distribution_date: today
      })

      // Accumulate user updates
      if (userUpdates.has(plan.user_id)) {
        userUpdates.set(plan.user_id, userUpdates.get(plan.user_id) + profitAmount)
      } else {
        userUpdates.set(plan.user_id, profitAmount)
      }

      console.log(`Calculated profit for plan ${plan.id}: $${profitAmount.toFixed(8)}`)
    }

    if (profitDistributions.length === 0) {
      console.log('No new profits to distribute')
      return
    }

    // Insert profit distributions
    const { error: distributionError } = await supabaseAdmin
      .from('profit_distributions')
      .insert(profitDistributions)

    if (distributionError) {
      console.error('Error inserting profit distributions:', distributionError)
      return
    }

    // Update user balances and plan totals
    for (const [userId, totalProfit] of userUpdates) {
      // Update user main wallet balance
      const { error: walletError } = await supabaseAdmin
        .from('profiles')
        .update({
          main_wallet_balance: supabaseAdmin.raw(`main_wallet_balance + ${totalProfit}`)
        })
        .eq('id', userId)

      if (walletError) {
        console.error(`Error updating wallet for user ${userId}:`, walletError)
        continue
      }

      // Create profit transaction
      const { error: transactionError } = await supabaseAdmin
        .from('transactions')
        .insert({
          user_id: userId,
          transaction_type: 'profit',
          amount: totalProfit,
          net_amount: totalProfit,
          status: 'completed',
          description: 'Hourly profit distribution'
        })

      if (transactionError) {
        console.error(`Error creating transaction for user ${userId}:`, transactionError)
      }

      console.log(`Updated wallet for user ${userId}: +$${totalProfit.toFixed(8)}`)
    }

    // Update investment plans total profit earned
    for (const distribution of profitDistributions) {
      const { error: planUpdateError } = await supabaseAdmin
        .from('investment_plans')
        .update({
          total_profit_earned: supabaseAdmin.raw(`total_profit_earned + ${distribution.profit_amount}`)
        })
        .eq('id', distribution.plan_id)

      if (planUpdateError) {
        console.error(`Error updating plan ${distribution.plan_id}:`, planUpdateError)
      }
    }

    console.log(`Successfully distributed profits to ${userUpdates.size} users`)
    console.log(`Total distributions: ${profitDistributions.length}`)

  } catch (error) {
    console.error('Error in profit distribution:', error)
  }
}

// Function to run profit distribution every hour
export function startProfitDistribution() {
  console.log('Starting automated profit distribution system...')
  
  // Run immediately
  distributeProfits()
  
  // Then run every hour
  setInterval(() => {
    distributeProfits()
  }, 60 * 60 * 1000) // 1 hour in milliseconds
}

// Manual trigger function for testing
export async function triggerProfitDistribution() {
  console.log('Manually triggering profit distribution...')
  await distributeProfits()
}
