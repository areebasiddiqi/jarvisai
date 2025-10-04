# Profit Distribution System

## Overview
The Jarvis Staking platform includes an automated profit distribution system that distributes hourly profits to users based on their active investment plans.

## How It Works

### Profit Calculation
- **Daily Rate**: Each investment plan has a daily percentage (Plan A: 2%, Plan B: 4%, Plan C: 5%)
- **Hourly Rate**: Daily rate divided by 24 hours
- **Profit Amount**: `Investment Amount × (Daily Percentage / 100) / 24`

### Distribution Process
1. **Fetches Active Plans**: Gets all active investment plans from the database
2. **Calculates Profits**: Computes hourly profit for each plan
3. **Updates Balances**: Adds profits to users' main wallet balances
4. **Creates Transactions**: Records profit transactions for audit trail
5. **Updates Plan Totals**: Tracks total profits earned per investment plan

## Current Status ⚠️

### ✅ What's Working:
- Profit distribution logic is implemented
- Database tables are created (`profit_distributions`)
- Manual trigger via admin dashboard
- API endpoints for profit distribution

### ❌ What's Missing:
- **Automated hourly execution** - The system is not currently running automatically

## Setting Up Automated Distribution

### Option 1: External Cron Service (Recommended)
Use a service like **cron-job.org** or **EasyCron** to call the API endpoint every hour:

**Endpoint**: `https://your-domain.com/api/cron/distribute-profits`
**Method**: GET or POST
**Headers**: `Authorization: Bearer YOUR_CRON_SECRET`
**Schedule**: Every hour (0 * * * *)

### Option 2: Server-Side Cron (Linux/Unix)
Add to your server's crontab:
```bash
0 * * * * curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://your-domain.com/api/cron/distribute-profits
```

### Option 3: Vercel Cron Jobs
If deployed on Vercel, add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/distribute-profits",
      "schedule": "0 * * * *"
    }
  ]
}
```

## Environment Variables
Add to your `.env` file:
```
CRON_SECRET=your-secure-cron-secret-here
```

## Manual Testing

### Via Admin Dashboard:
1. Login as admin
2. Go to `/admin`
3. Click "Distribute Profits" button

### Via API:
```bash
curl -X POST https://your-domain.com/api/admin/distribute-profits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN"
```

## Database Tables

### profit_distributions
- `id`: UUID primary key
- `plan_id`: Reference to investment plan
- `user_id`: Reference to user
- `profit_amount`: Amount distributed
- `distribution_date`: Date of distribution
- `created_at`: Timestamp

## Monitoring

### Check Distribution Status:
- Admin dashboard shows recent distributions
- API endpoint: `GET /api/admin/distribute-profits`
- Database query: `SELECT * FROM profit_distributions ORDER BY created_at DESC`

### Logs:
- Check server logs for distribution messages
- Each distribution logs user updates and amounts

## Security

### API Protection:
- Admin endpoints require admin privileges
- Cron endpoint requires secret token
- All operations are logged

### Data Integrity:
- Prevents duplicate distributions for the same day
- Validates user balances before updates
- Creates audit trail via transactions table

## Troubleshooting

### Common Issues:
1. **No distributions happening**: Check if cron job is set up correctly
2. **Duplicate distributions**: System prevents this automatically
3. **Balance not updating**: Check transaction logs and error messages

### Debug Steps:
1. Check admin dashboard for recent distributions
2. Verify investment plans are marked as `is_active = true`
3. Check server logs for error messages
4. Manually trigger distribution to test

## Next Steps

To fully activate the system:
1. Set up external cron service or server cron job
2. Add CRON_SECRET to environment variables
3. Test the automated distribution
4. Monitor logs and user balances

The system is ready to distribute profits every hour once the automated trigger is configured! 🚀
