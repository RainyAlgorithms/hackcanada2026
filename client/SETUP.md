# HomeWay - Setup Guide

## Overview
HomeWay is an AI-powered home buying platform with 3D map visualization, mortgage calculator, and budget planner.

## Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account
- Mapbox account

## Environment Setup

1. **Create `.env.local` file** in the client directory:

```bash
cp .env.local.example .env.local
```

2. **Add your API keys** to `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Mapbox Configuration
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
```

### Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Create a new project or use existing one
3. Go to Project Settings > API
4. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon/public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Getting Mapbox Token

1. Go to [mapbox.com](https://mapbox.com)
2. Sign up or log in
3. Go to Account > Access Tokens
4. Create a new token or copy existing public token
5. Paste into `NEXT_PUBLIC_MAPBOX_TOKEN`

## Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  annual_income NUMERIC,
  monthly_spending NUMERIC,
  city TEXT,
  price_min NUMERIC,
  price_max NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can read their own data
CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Create policy: Users can insert their own data
CREATE POLICY "Users can insert own data"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create policy: Users can update their own data
CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Routes

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/mapview` | 3D interactive property map |
| `/mortgage-calculator` | Mortgage payment calculator |
| `/Budget-planner` | Personal budget planner |
| `/auth/callback` | OAuth callback handler |
| `/auth/error` | Auth error page |

## Features

### 🗺️ MapView
- **3D Mapbox Integration**: Tilted 3D buildings view
- **Property Markers**: Animated markers showing prices
- **Listings Data**: Reads from `/public/listings.json`
- **Filtering**: Filter by city and price range
- **Property Cards**: Detailed property information on selection
- **Responsive**: Mobile-friendly sidebar

### 🔐 Authentication
- **Supabase Auth**: Email/password authentication
- **User Profiles**: Store user preferences and financial data
- **Protected Routes**: Navbar shows based on auth status
- **Onboarding**: New user financial profile setup

### 💰 Budget Planner
- Multi-step budget wizard
- Income & expense tracking
- Savings goals
- PDF export functionality

### 🏦 Mortgage Calculator
- Monthly payment estimation
- Down payment calculator
- Interest rate scenarios
- Loan term comparison

## Project Structure

```
client/
├── app/
│   ├── mapview/page.tsx          # 3D Map view
│   ├── mortgage-calculator/page.tsx
│   ├── Budget-planner/page.tsx
│   ├── auth/
│   │   ├── callback/route.ts     # OAuth callback
│   │   └── error/page.tsx        # Auth error page
│   ├── data/
│   │   └── landing-data.ts       # Landing page content
│   ├── styles/
│   │   └── landing.css           # Landing page styles
│   ├── layout.tsx
│   ├── page.tsx                  # Landing page
│   └── globals.css
├── components/
│   ├── icons.tsx                 # Icon components
│   └── Navbar.tsx                # Navigation bar
├── lib/
│   └── supabase/
│       ├── client.ts             # Browser client
│       └── server.ts             # Server client
├── public/
│   └── listings.json             # Property data
└── .env.local.example
```

## Customization

### Adding New Properties

Edit `/public/listings.json`:

```json
{
  "data": {
    "properties": [
      {
        "property_id": "unique_id",
        "list_price": 500000,
        "address": {
          "street_number": "123",
          "street": "Main St",
          "city": "Toronto",
          "state_code": "ON",
          "postal_code": "M1A 1A1",
          "latitude": 43.6532,
          "longitude": -79.3832
        },
        "description": {
          "beds": 3,
          "baths": 2,
          "sqft_living": 1500
        }
      }
    ]
  }
}
```

### Styling

- Landing page: `app/styles/landing.css`
- Global styles: `app/globals.css`
- Component-specific: Inline styles or Tailwind classes

## Troubleshooting

### Map Not Loading
- Check `NEXT_PUBLIC_MAPBOX_TOKEN` is set correctly
- Verify token has appropriate permissions
- Check browser console for errors

### Auth Not Working
- Verify Supabase URL and anon key
- Check Supabase dashboard for auth providers enabled
- Ensure RLS policies are created

### Build Errors
```bash
# Clear cache and reinstall
rm -rf .next node_modules package-lock.json
npm install
npm run dev
```

## Support

For issues or questions, check:
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js)
