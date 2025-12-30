#  Lost & Found Platform For VIT Pune

<div align="center">

[![Next.js](https://img.shields.io/badge/Next.js-16.1.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19.2.3-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-LTS-339933?style=for-the-badge&logo=node.js)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0.0-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com)
[![Firebase](https://img.shields.io/badge/Firebase-12.7.0-FFA726?style=for-the-badge&logo=firebase)](https://firebase.google.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

**A comprehensive platform for reporting, tracking, and discovering lost and found items in your community.**

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Configuration](#-configuration) • [Usage](#-usage) • [Admin Setup](#-admin-setup) • [Contributing](#-contributing)

</div>

---

##  Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Environment Configuration](#-environment-configuration)
- [Usage](#-usage)
- [Admin Setup](#-admin-setup)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Contributing](#-contributing)
- [Support](#-support)

---

##  About

Lost & Found is a full-stack web application designed to help communities connect lost items with their owners. Users can post about lost items, browse found items, and contact each other to recover belongings. Administrators have access to a comprehensive dashboard for managing users, verifying requests, and viewing platform statistics.

---

##  Features

###  User Features

-  **Authentication**

  - Email/Password registration and login
  - Google OAuth integration
  - Secure session management with Firebase

-  **Item Posting**

  - Create lost item announcements
  - Post found items
  - Add descriptions and images (with Cloudinary integration)
  - Real-time image compression for optimal performance

-  **Discovery**

  - Browse all lost and found items
  - View top performers in the community
  - Search and filter functionality
  - User profiles with achievement badges

-  **User Dashboard**
  - View posted announcements and requests
  - Track item status
  - View personal achievements and statistics
  - Edit profile information

###  Admin Features

-  **Comprehensive Dashboard**

  - Real-time platform statistics
  - User management and verification
  - Unverified request queue
  - Analytics with charts and visualizations

-  **User Management**

  - View all registered users
  - Verify user accounts
  - Manage user permissions
  - Account status tracking

-  **Request Verification**
  - Review pending lost/found requests
  - Approve or reject submissions
  - Prevent spam and inappropriate content

###  Security

- Separate authentication systems for users and admins
- Admin creation secret key protection
- Input validation with Zod schemas
- Password encryption with bcryptjs
- Protected API routes
- Role-based access control

---

## Tech Stack

### Frontend

- **Framework**: Next.js 16.1.0 (React 19)
- **Styling**: Tailwind CSS 4 with custom animations
- **Form Management**: React Hook Form with Zod validation
- **UI Components**: Radix UI (accessible component primitives)
- **State Management**: React Context API
- **Icons**: Lucide React & React Icons
- **Animations**: Framer Motion, Embla Carousel
- **Charts**: Recharts for data visualization
- **Notifications**: React Hot Toast, React Toastify

### Backend

- **Runtime**: Node.js with Express (via Next.js API Routes)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Firebase Admin SDK, Firebase Web SDK
- **Email**: Nodemailer for transactional emails
- **Image Processing**: Cloudinary CDN, Browser Image Compression
- **Encryption**: bcryptjs for password hashing

### Dev Tools

- **Linting**: ESLint 9
- **Build Tool**: Next.js built-in bundler
- **CSS Processing**: PostCSS 4 with Tailwind CSS

---

##  Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v18.0.0 or higher ([Download](https://nodejs.org))
- **npm** or **yarn**: Comes with Node.js
- **MongoDB**: v7.0.0 or higher ([Get Started](https://www.mongodb.com/try/download/community))
- **Git**: For cloning the repository ([Download](https://git-scm.com))

### Accounts Required

- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) - Cloud MongoDB (or local MongoDB instance)
- [Firebase Project](https://console.firebase.google.com) - For authentication
- [Cloudinary Account](https://cloudinary.com) - For image hosting
- [Google OAuth Credentials](https://console.developers.google.com) - For Google Sign-In

---

##  Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/lnf.git
cd lnf
```

### 2. Install Dependencies

Using npm:

```bash
npm install
```

Or using yarn:

```bash
yarn install
```

### 3. Create Environment Variables

Create a `.env.local` file in the root directory and add your configuration:

```bash
cp .env.example .env.local  # If .env.example exists, copy it
# OR create manually
touch .env.local
```

---

##  Environment Configuration

Create a `.env.local` file in the root directory with the following variables:

### Firebase Configuration

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
```

### MongoDB Configuration

```env
MONGODB_URI=:YOUR_MONGO_DB_CONNECTION_STRING
```

### Firebase Admin Configuration

```env
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PROJECT_ID=your_firebase_project_id
```

### Cloudinary Configuration

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### Admin Configuration

```env
ADMIN_CREATION_SECRET=SuperSecretAdminKey
ADMIN_LOGIN_SECRET=SuperSecretAdminLoginKey
```

### Email Configuration (Nodemailer)

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

---

##  Usage

### Development Server

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The page automatically updates as you edit files.

### Production Build

Build for production:

```bash
npm run build
npm start
```

### Linting

Check for code issues:

```bash
npm run lint
```



#### Create an Admin Account

1. Navigate to `/register` page
2. Scroll to the **Admin Registration** section (red background)
3. Fill in the admin form:
   - Admin Name
   - Admin Email
   - Admin Password (minimum 8 characters)
   - Admin Creation Secret (from `.env.local`)
4. Click **Create Admin**

#### Login as Admin

1. Go to `/login` page
2. Use the **Admin Login** form (right side)
3. Enter:
   - Admin Email
   - Admin Password
   - Admin Secret
4. Access the admin dashboard at `/admin`

#### Admin Dashboard Features

- **Dashboard**: View statistics and overview
- **Users**: Manage user accounts and verification
- **Unverified Requests**: Review and approve/reject submissions
- **Analytics**: View charts and performance metrics

---

##  Project Structure

```
lnf/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── admin/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── login/
│   │   └── register/
│   ├── admin/                    # Admin dashboard
│   │   ├── page.jsx
│   │   ├── users/
│   │   └── unverified-requests/
│   ├── api/                      # API routes
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── items/
│   │   ├── user/
│   │   └── top-performers/
│   ├── user/                     # User pages
│   │   ├── all-found-announcements/
│   │   ├── all-lost-requests/
│   │   ├── [userid]/
│   │   ├── top-performers/
│   │   └── new-lost-request/
│   ├── Components/               # Page components
│   ├── layout.jsx                # Root layout
│   ├── provider.jsx              # Context providers
│   └── globals.css               # Global styles
├── components/
│   └── ui/                       # Reusable UI components
├── context/
│   └── AuthContext.jsx           # Authentication context
├── lib/                          # Utility functions
│   ├── authErrors.js
│   ├── cloudinary.js
│   ├── dbConnect.js
│   ├── firebase.js
│   ├── firebaseAdmin.js
│   ├── utils.js
│   └── validationSchemas.js
├── model/                        # MongoDB schemas
│   ├── user.js
│   ├── admin.js
│   └── item.js
├── actions/                      # Server actions
│   ├── login.js
│   ├── signup.js
│   ├── logout.js
│   └── googleSignin.js
├── public/                       # Static assets
├── .env.local                    # Environment variables (create this)
├── next.config.mjs               # Next.js configuration
├── tailwind.config.js            # Tailwind CSS configuration
├── jsconfig.json                 # JavaScript configuration
└── package.json                  # Dependencies
```

---

##  API Documentation

### Authentication Endpoints

#### User Authentication

- `POST /api/auth/signin` - Firebase user sign-in
- `POST /api/auth/signup` - Firebase user registration
- `POST /api/auth/logout` - User logout

#### Admin Authentication

- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/register` - Admin registration

### Item Endpoints

- `GET /api/items/lost` - Get all lost items
- `GET /api/items/found` - Get all found items
- `POST /api/items/lost` - Create lost item request
- `POST /api/items/found` - Create found item announcement
- `GET /api/items/[itemId]` - Get item details

### User Endpoints

- `GET /api/user` - Get current user
- `GET /api/user/[userId]` - Get user profile
- `PUT /api/user/[userId]` - Update user profile

### Admin Endpoints

- `GET /api/admin/stats` - Get platform statistics
- `GET /api/admin/users` - Get all users
- `GET /api/admin/verification` - Get unverified requests

---

##  Environment Variables Reference

| Variable                       | Description                   | Required |
| ------------------------------ | ----------------------------- | -------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API Key              | ✅       |
| `MONGODB_URI`                  | MongoDB connection string     | ✅       |
| `CLOUDINARY_CLOUD_NAME`        | Cloudinary cloud name         | ✅       |
| `ADMIN_CREATION_SECRET`        | Secret for admin registration | ✅       |
| `EMAIL_USER`                   | Email for notifications       | ❌       |
| `EMAIL_PASSWORD`               | Email app password            | ❌       |

---

##  Contributing

We welcome contributions! Please follow these steps:

1. **Fork the Repository**

   ```bash
   git clone https://github.com/yourusername/lnf.git
   ```

2. **Create a Feature Branch**

   ```bash
   git checkout -b feature/AmazingFeature
   ```

3. **Commit Your Changes**

   ```bash
   git commit -m 'Add some AmazingFeature'
   ```

4. **Push to the Branch**

   ```bash
   git push origin feature/AmazingFeature
   ```

5. **Open a Pull Request**

### Coding Standards

- Follow the existing code style
- Use meaningful commit messages
- Test your changes locally
- Update documentation as needed

---

##  Troubleshooting

### Common Issues

**Issue: MongoDB connection fails**

- Verify `MONGODB_URI` is correct
- Check MongoDB is running
- Ensure IP whitelist includes your machine

**Issue: Firebase authentication not working**

- Verify Firebase credentials in `.env.local`
- Check Firebase project settings
- Enable Sign-in methods in Firebase Console

**Issue: Images not uploading**

- Verify Cloudinary credentials
- Check file size limits
- Ensure proper CORS configuration

**Issue: Admin login not working**

- Verify `ADMIN_CREATION_SECRET` matches
- Check admin account was created successfully
- Clear browser cache and try again

---

##  Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Admin Setup Guide](./ADMIN_SETUP.md)

---



##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---


## Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components from [ShadCN UI](https://www.radix-ui.com)
- Styling with [Tailwind CSS](https://tailwindcss.com)
- Database by [MongoDB](https://www.mongodb.com)
- Authentication by [Firebase](https://firebase.google.com)

---

<div align="center">

**[⬆ Back to top](#-lostfound-platform)**

Made with ❤️ by Durgaprasad

</div>
