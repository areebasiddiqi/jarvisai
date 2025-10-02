import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import BSCService from '@/lib/bsc-service'

const BSC_CONFIG = {
  rpcUrl: process.env.BSC_RPC_URL || "https://bsc-dataseed1.binance.org/",
  contractAddress: process.env.PAYMENT_CONTRACT_ADDRESS || "",
  usdtContractAddress: process.env.USDT_CONTRACT_ADDRESS || "0x55d398326f99059fF775485246999027B3197955",
  adminFeeWallet: process.env.ADMIN_FEE_WALLET || "",
  globalAdminWallet: process.env.GLOBAL_ADMIN_WALLET || "",
  privateKey: process.env.BSC_PRIVATE_KEY || ""
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, walletAddress } = await request.json()

    if (!amount || !walletAddress) {
      return NextResponse.json({ error: 'Amount and wallet address are required' }, { status: 400 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    const withdrawAmount = parseFloat(amount)
    const userBalance = parseFloat(profile.main_wallet_balance.toString())

    // Verify user has sufficient balance
    if (withdrawAmount > userBalance) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Calculate withdrawal fee (10%)
    const withdrawalFee = withdrawAmount * 0.10
    const netAmount = withdrawAmount - withdrawalFee

    console.log("Creating withdrawal request:", {
      requestedAmount: withdrawAmount,
      withdrawalFee,
      netAmount,
      userId: user.id,
      toAddress: walletAddress
    })

    // Use the database function to create withdrawal request
    const { data: transactionId, error: withdrawalError } = await supabase
      .rpc('create_withdrawal_request', {
        p_user_id: user.id,
        p_amount: withdrawAmount,
        p_fee: withdrawalFee,
        p_net_amount: netAmount,
        p_bsc_address: walletAddress
      })

    if (withdrawalError) {
      console.error('Error creating withdrawal request:', withdrawalError)
      return NextResponse.json({ error: withdrawalError.message || 'Failed to create withdrawal request' }, { status: 500 })
    }

    console.log("Withdrawal request created successfully - awaiting admin approval")

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted successfully. Please wait for admin approval.",
      requestedAmount: withdrawAmount,
      netAmount,
      withdrawalFee,
      status: "pending",
      transactionId: withdrawalTransaction.id
    })

  } catch (error: any) {
    console.error("Error creating withdrawal request:", error)
    return NextResponse.json({ error: error.message || "Failed to create withdrawal request" }, { status: 500 })
  }
}

// Admin endpoint to approve withdrawals
export async function PUT(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin role check here
    // For now, any authenticated user can approve (should be restricted to admins)

    const { transactionId, approve, walletAddress } = await request.json()

    if (!transactionId || approve === undefined) {
      return NextResponse.json({ error: 'Transaction ID and approval status are required' }, { status: 400 })
    }

    // Get the withdrawal transaction
    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .eq('transaction_type', 'withdrawal')
      .eq('status', 'pending')
      .single()

    if (txError || !transaction) {
      return NextResponse.json({ error: 'Withdrawal transaction not found' }, { status: 404 })
    }

    if (approve) {
      // Process the withdrawal using BSC service
      try {
        const bscService = new BSCService(BSC_CONFIG)
        const txHash = await bscService.processWithdrawal(
          walletAddress || transaction.description.match(/to (\w+)/)?.[1] || '',
          transaction.net_amount.toString()
        )

        // Update transaction status to completed
        await supabase
          .from('transactions')
          .update({
            status: 'completed',
            reference_id: txHash,
            description: `${transaction.description} - Completed: ${txHash}`
          })
          .eq('id', transactionId)

        return NextResponse.json({
          success: true,
          message: "Withdrawal approved and processed",
          txHash
        })

      } catch (error: any) {
        console.error('Error processing withdrawal:', error)
        
        // Use database function to handle failed withdrawal
        const { error: approvalError } = await supabase
          .rpc('process_withdrawal_approval', {
            p_transaction_id: transactionId,
            p_approve: false,
            p_blockchain_tx_hash: null
          })

        return NextResponse.json({ error: `Withdrawal processing failed: ${error.message}` }, { status: 500 })
      }
    } else {
      // Use database function to reject withdrawal
      const { error: rejectionError } = await supabase
        .rpc('process_withdrawal_approval', {
          p_transaction_id: transactionId,
          p_approve: false,
          p_blockchain_tx_hash: null
        })

      if (rejectionError) {
        console.error('Error rejecting withdrawal:', rejectionError)
        return NextResponse.json({ error: 'Failed to reject withdrawal' }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Withdrawal rejected and amount refunded"
      })
    }

  } catch (error: any) {
    console.error("Error processing withdrawal approval:", error)
    return NextResponse.json({ error: error.message || "Failed to process withdrawal approval" }, { status: 500 })
  }
}
