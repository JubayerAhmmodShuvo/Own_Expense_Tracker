# Expense Tracker

A modern, full-stack expense tracking application built with Next.js, TypeScript, Prisma, and PostgreSQL. Track your daily expenses and income with beautiful analytics and insights.

## Features

- 🔐 **Secure Authentication** - User registration and login with NextAuth.js
- 💰 **Expense & Income Tracking** - Add, edit, and delete transactions
- 📊 **Visual Analytics** - Beautiful charts and graphs using Recharts
- 🏷️ **Category Management** - Organize expenses with custom categories
- 📅 **Time-based Filtering** - Filter by day, week, month, quarter, or year
- 📱 **Responsive Design** - Works perfectly on desktop and mobile
- 🔒 **Data Security** - Encrypted passwords and secure data handling

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **Charts**: Recharts
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

## Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd expense-tracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/expense_tracker?schema=public"

   # NextAuth.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"

   # App Configuration
   NODE_ENV="development"
   ```

4. **Set up the database**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run database migrations
   npx prisma db push
   ```

5. **Start the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Setup

### PostgreSQL Setup

1. **Install PostgreSQL** (if not already installed)

   - macOS: `brew install postgresql`
   - Ubuntu: `sudo apt-get install postgresql postgresql-contrib`
   - Windows: Download from [postgresql.org](https://www.postgresql.org/download/)

2. **Create a database**

   ```sql
   CREATE DATABASE expense_tracker;
   ```

3. **Update your DATABASE_URL** in `.env.local` with your PostgreSQL credentials

### Database Schema

The application uses the following main entities:

- **Users** - User accounts with authentication
- **Categories** - Expense categories (Food, Transportation, etc.)
- **Expenses** - Individual expense records
- **Incomes** - Income records

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth.js endpoints

### Data Management

- `GET/POST /api/expenses` - Get/create expenses
- `GET/POST /api/incomes` - Get/create incomes
- `GET/POST /api/categories` - Get/create categories
- `GET /api/analytics` - Get analytics data

## Project Structure

```
src/
├── app/
│   ├── api/                 # API routes
│   ├── auth/                # Authentication pages
│   ├── dashboard/           # Main dashboard
│   └── globals.css          # Global styles
├── components/              # Reusable components
├── lib/                     # Utilities and configurations
└── prisma/                  # Database schema
```

## Features in Detail

### Dashboard

- Overview cards showing total income, expenses, and net income
- Interactive charts for expense categories and daily trends
- Recent transactions list
- Period filtering (day, week, month, quarter, year)

### Expense Management

- Add expenses with amount, description, date, and category
- Visual category indicators with colors
- Delete expenses with confirmation
- Form validation with error handling

### Income Management

- Add income with amount, source, description, and date
- Track different income sources
- Delete income records

### Analytics

- Pie chart showing expenses by category
- Line chart showing daily income vs expenses
- Summary statistics
- Time-based filtering

## Security Features

- **Password Hashing** - Uses bcryptjs for secure password storage
- **Session Management** - Secure JWT-based sessions with NextAuth.js
- **Input Validation** - Zod schema validation for all inputs
- **SQL Injection Protection** - Prisma ORM prevents SQL injection
- **CSRF Protection** - Built-in CSRF protection with NextAuth.js

## Deployment

### Vercel (Recommended)

1. **Push to GitHub**
2. **Connect to Vercel**
3. **Add environment variables** in Vercel dashboard
4. **Deploy**

### Other Platforms

The app can be deployed to any platform that supports Next.js:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Mobile App

This web application is designed to be mobile-responsive and can be easily extended to a React Native mobile app using the same API endpoints.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support or questions, please open an issue in the GitHub repository.

---

Built with ❤️ using Next.js, TypeScript, and modern web technologies.
# Own_Expense_Tracker
