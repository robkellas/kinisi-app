# Kinisi App Documentation

## 🚀 Project Overview

This is an Amplify Gen 2 application with Next.js, featuring user authentication and a todo management system with modern styling and dark/light mode support.

## 🏗️ Architecture

### Frontend
- **Next.js 14** with App Router
- **React 18** with TypeScript
- **Tailwind CSS 3.4.17** for styling
- **Amplify UI React** for authentication components
- **Dark/Light Mode** support with system preference detection

### Backend
- **AWS Amplify Gen 2** with TypeScript
- **Cognito User Pools** for authentication
- **GraphQL API** with user-based authorization
- **DynamoDB** for data storage

## 📁 Project Structure

```
kinisi-app/
├── amplify/
│   ├── auth/resource.ts          # Authentication configuration
│   ├── data/resource.ts          # Data model and authorization
│   └── backend.ts                # Backend configuration
├── app/
│   ├── globals.css               # Tailwind CSS and custom styles
│   ├── layout.tsx                # Root layout with theme support
│   └── page.tsx                  # Main todo application
├── components/
│   ├── ThemeContext.tsx          # Theme management context
│   └── ThemeProvider.tsx         # Theme provider component
├── docs/                         # Project documentation
├── tailwind.config.js            # Tailwind CSS configuration
├── postcss.config.js             # PostCSS configuration
└── package.json                  # Dependencies and scripts
```

## 🎨 Styling & Theme System

### Tailwind CSS Setup
- **Version**: 3.4.17 (stable version, avoids latest version issues)
- **PostCSS**: 8.5.6
- **Dark Mode**: Class-based (`dark:` prefix)
- **Custom CSS Variables**: For consistent theming

### Theme Features
- **Light/Dark/Auto** modes
- **System preference detection**
- **Local storage persistence**
- **Smooth transitions**
- **Custom animations** (spin-smooth, pulse-subtle)

### CSS Files
- **`app/globals.css`**: Tailwind directives, CSS variables, custom animations
- **`components/ThemeProvider.tsx`**: Theme switching logic
- **`components/ThemeContext.tsx`**: React context for theme management

## 🔐 Authentication & Authorization

### User Authentication
- **Cognito User Pools** with email-based login
- **User isolation**: Each user only sees their own todos
- **Automatic user association**: No manual user ID management needed

### Data Authorization
- **Model**: `Todo` with `content` field
- **Authorization**: `allow.owner()` - users can only access their own todos
- **Default Mode**: `userPool` (requires authentication)

### Security Benefits
- ✅ **User isolation** - users can't see other users' todos
- ✅ **Authentication required** - must be logged in to access data
- ✅ **No public access** - removes security risks of API keys
- ✅ **Automatic filtering** - queries automatically filter by user

## 🚀 Development

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start with browser tools (if needed)
npm run dev:with-browser-tools
```

### Backend Development
```bash
# Start local sandbox
npx ampx sandbox

# Deploy to staging
npx ampx pipeline-deploy --branch staging
```

## 📦 Dependencies

### Production
- `@aws-amplify/ui-react`: ^6.13.0
- `aws-amplify`: ^6.6.6
- `next`: ^14.2.33
- `react`: ^18
- `react-dom`: ^18

### Development
- `@aws-amplify/backend`: ^1.5.1
- `@aws-amplify/backend-cli`: ^1.3.0
- `tailwindcss`: ^3.4.17
- `postcss`: ^8.5.6
- `autoprefixer`: ^10.4.21

## 🚀 Deployment

### Automatic Deployment
When you push to main, the CI/CD pipeline will:
1. **Detect changes** in backend configuration
2. **Automatically deploy** updated backend
3. **Update** `amplify_outputs.json` with new configuration
4. **Apply** new authorization rules

### Important Deployment Considerations

#### ⚠️ Data Migration
- **Existing todos** created with old API key authorization become inaccessible
- **New todos** will use user-based authorization
- This is expected behavior when switching from public to user-based auth

#### ⚠️ User Experience
- Users will need to **sign in** to see their todos
- **Previous todos** (if any) created before the change won't be visible
- This is actually a security improvement!

#### ⚠️ Deployment Time
- Deployment typically takes **2-5 minutes**
- App will be **temporarily unavailable** during update
- Monitor deployment logs for progress

## 🔧 Configuration Files

### Tailwind CSS
```javascript
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
      },
    },
  },
}
```

### PostCSS
```javascript
// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### Next.js
```javascript
// next.config.js
const nextConfig = {
  experimental: {
    esmExternals: 'loose'
  }
}
```

## 🎯 Key Features

### Todo Management
- **Create** new todos with user input
- **Real-time updates** with Amplify subscriptions
- **User isolation** - only see your own todos
- **Responsive design** with modern UI

### Theme System
- **Light/Dark/Auto** modes
- **System preference detection**
- **Smooth transitions**
- **Custom animations**

### Authentication
- **Email-based login** with Cognito
- **Secure user sessions**
- **Automatic sign-out** functionality
- **User profile management**

## 🐛 Troubleshooting

### CSS Not Loading
- Ensure `app/globals.css` is imported in `layout.tsx`
- Check that `postcss.config.js` is in the root directory
- Verify Tailwind CSS version is 3.4.17
- Restart development server after configuration changes

### Authentication Issues
- Verify `amplify_outputs.json` is up to date
- Check that user pool is properly configured
- Ensure authorization rules are correctly set

### Deployment Issues
- Monitor CI/CD pipeline logs
- Check for CDK version mismatches
- Verify all dependencies are properly installed

## 📚 Additional Resources

- [Amplify Gen 2 Documentation](https://docs.amplify.aws/gen2/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [AWS Amplify UI React](https://ui.docs.amplify.aws/react)

## 🤝 Contributing

1. Make changes to the codebase
2. Test locally with `npm run dev`
3. Test backend changes with `npx ampx sandbox`
4. Commit and push to main
5. Monitor deployment in CI/CD pipeline

## 📝 Notes

- **CSS Files**: Should be in `app/` directory, NOT in `public/`
- **Theme Storage**: Uses `kinisi_theme` key in localStorage
- **User Data**: Automatically associated with authenticated user
- **Security**: All data access requires authentication
