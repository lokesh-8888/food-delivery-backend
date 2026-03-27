# Food Delivery Backend

A comprehensive food delivery backend API built with Node.js, Express, MongoDB, and Socket.io.

## 🚀 Features

- **Authentication & Authorization** - JWT-based auth with role-based access control
- **User Management** - Profile management, order placement, order tracking
- **Restaurant Management** - Restaurant CRUD, menu management, order processing
- **Delivery Agent Management** - Availability management, order assignment, location tracking
- **Admin Panel** - User management, restaurant approval, dashboard statistics
- **Payment Integration** - Razorpay integration with webhooks
- **Real-time Communication** - Socket.io for live order tracking
- **Background Jobs** - Automated cleanup and maintenance tasks
- **Enterprise Logging** - Winston logging with Sentry integration
- **Security Features** - Rate limiting, input sanitization, helmet security

## 🛠 Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io
- **Payment**: Razorpay
- **Logging**: Winston + Sentry
- **Background Jobs**: node-cron
- **Security**: Helmet, CORS, Rate Limiting, Input Sanitization

## 📋 Prerequisites

- Node.js 16+ 
- MongoDB 5.0+
- npm or yarn

## 🚀 Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd food-delivery-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following environment variables:
   ```env
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/foodDB
   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   SENTRY_DSN=your_sentry_dsn
   ```

4. **Start the server**
   ```bash
   # Development mode with hot reload
   npm run dev
   
   # Production mode
   npm start
   ```

## 📊 API Endpoints

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| POST | `/logout` | User logout | Yes |
| GET | `/me` | Get current user profile | Yes |

### User (`/api/v1/user`)
| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/profile` | Get user profile | Yes |
| PUT | `/profile` | Update user profile | Yes |
| GET | `/restaurants` | Get restaurants list | Yes |
| GET | `/restaurants/:id/menu` | Get restaurant menu | Yes |
| POST | `/orders` | Place new order | Yes |
| GET | `/orders` | Get order history | Yes |
| GET | `/orders/:id` | Track specific order | Yes |
| DELETE | `/orders/:id` | Cancel order | Yes |
| POST | `/reviews` | Submit review | Yes |

### Restaurant (`/api/v1/restaurant`)
| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| POST | `/` | Create restaurant | Yes |
| PUT | `/` | Update restaurant | Yes |
| PUT | `/status` | Toggle open/closed | Yes |
| POST | `/menu` | Add menu item | Yes |
| PUT | `/menu/:itemId` | Update menu item | Yes |
| DELETE | `/menu/:itemId` | Delete menu item | Yes |
| GET | `/orders` | Get restaurant orders | Yes |
| PUT | `/orders/:id/status` | Update order status | Yes |

### Delivery (`/api/v1/delivery`)
| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/profile` | Get agent profile | Yes |
| PUT | `/availability` | Toggle availability | Yes |
| GET | `/orders` | Get assigned orders | Yes |
| PUT | `/orders/:id/status` | Update order status | Yes |
| PUT | `/location` | Update location | Yes |

### Admin (`/api/v1/admin`)
| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| GET | `/users` | Get all users | Yes |
| PUT | `/users/:id/status` | Toggle user status | Yes |
| GET | `/restaurants` | Get all restaurants | Yes |
| PUT | `/restaurants/:id/approve` | Approve restaurant | Yes |
| GET | `/orders` | Get all orders | Yes |
| GET | `/delivery-agents` | Get delivery agents | Yes |
| GET | `/stats` | Get dashboard stats | Yes |

### Payment (`/api/v1/payment`)
| Method | Endpoint | Description | Auth Required |
|---------|----------|-------------|---------------|
| POST | `/create-order` | Create Razorpay order | Yes |
| POST | `/verify` | Verify payment | Yes |
| POST | `/webhook` | Razorpay webhook | No |
| POST | `/refund/:orderId` | Refund payment | Yes |

## 🔧 Development

### Running Tests
```bash
# Run all tests
npm test

# Run Phase 7 validation tests
npm run test:phase7
```

### Code Quality
```bash
# Run ESLint
npm run lint
```

### Environment Variables
| Variable | Description | Required |
|----------|-------------|-----------|
| `PORT` | Server port | Yes |
| `MONGO_URI` | MongoDB connection string | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `JWT_EXPIRES_IN` | Token expiration time | Yes |
| `NODE_ENV` | Environment (development/production) | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `RAZORPAY_KEY_ID` | Razorpay API key | Yes |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key | Yes |
| `RAZORPAY_WEBHOOK_SECRET` | Webhook secret | Yes |
| `SENTRY_DSN` | Sentry error tracking DSN | Optional |

## 🚀 Deployment

### Railway Deployment
1. **Push to GitHub**
2. **Connect Railway to your repository**
3. **Set Environment Variables** in Railway dashboard
4. **Deploy** - Railway will automatically detect the Procfile

### Render Deployment
1. **Push to GitHub**
2. **Connect Render to your repository**
3. **Set Environment Variables** in Render dashboard
4. **Deploy** - Render will automatically detect the Procfile

### Manual Deployment
```bash
# Set production environment
export NODE_ENV=production

# Start production server
npm start
```

## 📝 Project Structure

```
food-delivery-backend/
├── src/
│   ├── config/          # Database, logger, Razorpay config
│   ├── middlewares/      # Auth, role, logging middleware
│   ├── models/          # Mongoose models
│   ├── modules/         # Route handlers by feature
│   │   ├── auth/        # Authentication routes
│   │   ├── user/        # User management
│   │   ├── restaurant/  # Restaurant management
│   │   ├── delivery/    # Delivery management
│   │   ├── payment/     # Payment processing
│   │   └── admin/       # Admin panel
│   ├── socket/          # Socket.io setup
│   ├── utils/           # Helper utilities
│   └── jobs/           # Background jobs
├── tests/               # Test files
├── logs/                # Log files
├── .env.example          # Environment template
├── Procfile             # Deployment configuration
├── package.json         # Dependencies and scripts
└── server.js            # Application entry point
```

## 🔐 Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - 100 requests per 15 minutes
- **Input Sanitization** - Prevent NoSQL injection
- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with salt rounds
- **Role-based Access** - User, Restaurant, Delivery, Admin roles

## 📊 Real-time Features

- **Order Status Updates** - Live order tracking
- **Restaurant Notifications** - New order alerts
- **Delivery Agent Location** - Real-time location tracking
- **Agent Assignment** - Automatic order assignment

## 🔄 Background Jobs

- **Order Cleanup** - Auto-cancel stale orders (5 minutes)
- **Agent Recovery** - Free stuck delivery agents (10 minutes)

## 📝 Logging & Monitoring

- **Winston Logging** - Structured JSON logging
- **Sentry Integration** - Error tracking and monitoring
- **Request Logging** - HTTP request/response logging
- **Error Handling** - Comprehensive error management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support and questions, please open an issue on the GitHub repository.
