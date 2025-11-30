# Vercel Deployment Guide

## Quick Deploy Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

3. **Import Project**:
   - Click "Add New Project"
   - Select your `PersonalFinanceTracker` repository
   - Click "Import"

4. **Configure Project**:
   - **Framework Preset**: Vite (should auto-detect)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (auto-filled)
   - **Output Directory**: `dist` (auto-filled)
   - **Install Command**: `npm install --legacy-peer-deps` (important!)

5. **Add Environment Variables**:
   Click "Environment Variables" and add:
   - `VITE_SUPABASE_URL` = Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon key

6. **Deploy**:
   - Click "Deploy"
   - Wait for build to complete (~2-3 minutes)
   - Your app will be live at `your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   vercel
   ```

4. **Add Environment Variables**:
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

5. **Redeploy with env vars**:
   ```bash
   vercel --prod
   ```

## Important Notes

### Environment Variables
- Make sure to add both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel dashboard
- These are available in your Supabase project settings → API

### Build Settings
- **Install Command**: `npm install --legacy-peer-deps` (required due to react-currency-formatter peer dependency)
- **Build Command**: `npm run build` (default for Vite)
- **Output Directory**: `dist` (default for Vite)

### Custom Domain (Optional)
1. Go to your project settings in Vercel
2. Click "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

## Post-Deployment Checklist

- [ ] Environment variables added
- [ ] Build completes successfully
- [ ] App loads without errors
- [ ] Supabase connection works
- [ ] Can create accounts
- [ ] Can create transactions
- [ ] Charts display correctly

## Troubleshooting

### Build Fails
- Check that `npm install --legacy-peer-deps` is set in Install Command
- Verify all dependencies are in package.json

### Environment Variables Not Working
- Make sure variable names start with `VITE_`
- Redeploy after adding environment variables
- Check Vercel logs for errors

### Supabase Connection Issues
- Verify environment variables are correct
- Check Supabase project is active
- Ensure RLS policies allow operations (if enabled)

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test locally with `npm run build && npm run preview`
