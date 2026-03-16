# NEXTZEN  — The Future of Automated Commerce

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/AWS_EC2-FF9900?style=for-the-badge&logo=amazonec2&logoColor=white" />
  <img src="https://img.shields.io/badge/AWS_S3-569A31?style=for-the-badge&logo=amazons3&logoColor=white" />
  <img src="https://img.shields.io/badge/CloudFront-8C4FFF?style=for-the-badge&logo=amazoncloudwatch&logoColor=white" />
  <img src="https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white" />
  <img src="https://img.shields.io/badge/Let's_Encrypt-003A70?style=for-the-badge&logo=letsencrypt&logoColor=white" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
</p>

**NEXTZEN** is a high-performance, enterprise-grade e-commerce ecosystem. It isn't just a store; it's a fully automated retail engine combining the **MERN Stack** with a custom **DevOps Pipeline** and a **Context-Aware AI Styling Concierge**.

---

## 🤖 Featured Innovation: AI Style Concierge
NEXTZEN integrates a proprietary **Product-Specific AI Assistant** that bridges the gap between digital shopping and a personal stylist experience.

### Key AI Functionalities:
- **Deep Product Contextualization**: The AI is directly integrated with the MongoDB product schema, fetching real-time data on stock levels, variant details, active offers, and pricing — eliminating hallucinations entirely.
- **Intelligent Style Advisory**: Analyzes user intent to deliver contextual fashion guidance — suggesting complementary items (e.g., *"What shoes pair well with this Pegador Hoodie?"*) and inclusive, skin-tone-aware styling recommendations based on current inventory.
- **Hybrid LLM Architecture**: Employs **Google Gemini 1.5 Flash** as the primary engine for lightning-fast creative responses, with an automatic failover to **Groq (Llama 3.3 70B Versatile)** for uninterrupted service during rate-limit events.
- **Automated Query Resolution**: Handles the majority of repetitive customer queries — *"Is this available in XL?"*, *"What's the price after discount?"* — instantly and accurately, significantly reducing administrative overhead.

---

## 🏗️ Infrastructure & Deployment Architecture
Unlike standard portfolio projects, NEXTZEN is architected with a production-grade cloud infrastructure spanning multiple AWS services, custom DNS, reverse proxying, and automated CI/CD.

### ☁️ AWS S3 — Static Asset Storage
- A general-purpose S3 bucket (`nextzen-assets`) was created in the **Asia Pacific (Mumbai)** region to store large static assets like background videos.
- Media files are organized inside a `videos/` folder. Public access was initially enabled with a bucket policy for read access.
- Offloading assets to S3 keeps the frontend build lightweight and improves loading performance on Vercel.

### 🌐 AWS CloudFront — CDN Distribution
- A **CloudFront distribution** was configured with the S3 bucket as the origin and `/videos` as the origin path.
- Videos were **compressed using FFmpeg** before upload to reduce file size and improve streaming performance.
- CloudFront caches video files at global **edge locations**, delivering content from the nearest CDN server.
- **Origin Access Control (OAC)** was enabled so media is served exclusively through CloudFront while keeping the S3 bucket private.
- The frontend uses CloudFront domain URLs to stream videos efficiently with faster load times.

### 🐳 Docker — Backend Containerization
- The backend is containerized using a lightweight `node:20-alpine` base image for minimal container size.
- Production dependencies are installed via `npm ci --omit=dev` to ensure a clean, reproducible build.
- The container exposes **port 5000** for the Express server, with environment variables injected at runtime via `.env`.
- The containerized setup guarantees environment parity from local development to AWS EC2 deployment.

### ⚡ CI/CD Pipeline — GitHub Actions
- A fully integrated **GitHub Actions** workflow triggers on every push to the `production` branch.
- The pipeline automatically builds a new Docker image, pushes it to **Docker Hub**, and deploys it to a live **AWS EC2** instance via secure SSH — achieving **zero-touch deployments**.

### 🌍 Domain & DNS — Hostinger
- A **split-subdomain architecture** was implemented using **Hostinger DNS** for clear separation of concerns:
  - `nextzen.mubashiir.in` → **Frontend** (pointed to Vercel via A/CNAME records)
  - `api.mubashiir.in` → **Backend** (pointed to AWS EC2 Elastic IP)
- This separation enables independent scaling and cleaner SSL certificate management.

### 🔁 Nginx — Reverse Proxy
- **Nginx** was deployed on the EC2 instance as a reverse proxy in front of the Dockerized backend.
- Nginx listens on standard web ports (**80** and **443**), forwarding requests for `api.mubashiir.in` to the internal Docker container on port 5000.
- This hides the backend port from the public internet and provides header optimization and request logging.

### 🔒 SSL/TLS — Certbot & Let's Encrypt
- Automated **SSL/TLS certificates** were issued for the backend subdomain using **Certbot** with the **Let's Encrypt** authority.
- Nginx enforces a global **HTTP → HTTPS redirect**, ensuring all traffic is encrypted in transit.
- Sensitive data (login credentials, payment tokens) are protected end-to-end between the Vercel frontend and the AWS backend.

### 🛡️ CORS & Cookie Security
- A strict **CORS policy** on the Express backend allows requests only from the production frontend domain.
- **JWT authentication** uses **HttpOnly**, **Secure**, and **SameSite=None** cookies, enabling the Vercel frontend (`nextzen.mubashiir.in`) to securely transmit credentials to the AWS backend (`api.mubashiir.in`).
- This configuration protects against **CSRF** and **XSS** attacks in the multi-domain environment.

### 📦 Additional Cloud Services
- **Cloudinary**: Cloud-based image storage, transformation, and optimization for product imagery.
- **Vercel Edge Network**: Frontend deployed on Vercel's global CDN for sub-second page loads and automatic SSL.

---

## 🛠️ Tech Stack & Implementation Details

### Frontend — The Visual Experience
| Technology | Purpose |
| :--- | :--- |
| **React 19** | Core UI library with latest concurrent features |
| **Vite** | Next-generation build tool for instant HMR |
| **Redux Toolkit** | Predictable, centralized application state |
| **TanStack Query v5** | Robust server-state synchronization & caching |
| **Tailwind CSS** | Utility-first styling for rapid, consistent UI |
| **Framer Motion** | High-end, physics-based UI animations |
| **Recharts** | Data visualization for admin analytics dashboards |
| **Axios** | HTTP client with custom interceptor middleware |

### Backend — The Logic Engine
| Technology | Purpose |
| :--- | :--- |
| **Node.js** | Asynchronous runtime for high-concurrency APIs |
| **Express.js v5** | Modular routing and middleware pipeline |
| **MongoDB & Mongoose** | Flexible document storage with schema validation |
| **Passport.js** | Google OAuth 2.0 social authentication strategy |
| **JWT** | Dual-token (Access/Refresh) rotation security |
| **Bcrypt** | Password hashing with adaptive salt-rounds |
| **Winston & Morgan** | Structured request logging and error auditing |
| **Express Rate Limit** | API abuse prevention and DDoS mitigation |

### AI & Services
| Technology | Purpose |
| :--- | :--- |
| **Google Generative AI** | Primary LLM for the Style Concierge chatbot |
| **Groq SDK** | Fallback LLM (Llama 3.3 70B) for resilience |
| **Razorpay SDK** | Payment gateway (UPI, Cards, Netbanking) |
| **Cloudinary** | Cloud-based image storage and optimization |
| **Nodemailer** | Automated transactional emails (OTP, receipts) |

### DevOps & Infrastructure
| Technology | Purpose |
| :--- | :--- |
| **AWS EC2** | Cloud compute instance for backend hosting |
| **AWS S3** | Static asset storage (background videos) |
| **AWS CloudFront** | CDN distribution with OAC for edge caching |
| **Docker** | Backend containerization (`node:20-alpine`) |
| **GitHub Actions** | CI/CD pipeline (Build → Docker Hub → EC2) |
| **Nginx** | Reverse proxy on EC2 (ports 80/443 → 5000) |
| **Certbot / Let's Encrypt** | Automated SSL/TLS certificate provisioning |
| **FFmpeg** | Video compression before S3 upload |
| **Hostinger DNS** | Custom domain & split-subdomain routing |
| **Vercel** | Frontend edge deployment with global CDN |

---

## 💎 Advanced Feature Set

### 🛍️ Customer-Facing Capabilities
- **Multi-Dimensional Product Discovery**: Advanced filtering by price range, brand, color, category, and real-time size availability with instant search.
- **Interactive Product Experience**: Multi-image galleries with color variant switching, dynamic stock indicators, and live offer calculations.
- **Integrated Wallet System**: A fully functional in-app financial ledger supporting direct payments, automated refund credits, and balance tracking via a dedicated Wallet API.
- **Referral Rewards Engine**: An automated growth system that credits **₹100** to the referrer and **₹50** to the new user upon successful sign-up, driving organic acquisition.
- **Smart Checkout Flow**: Multi-address management, real-time coupon validation, tax calculation, and seamless Razorpay payment handoff.
- **Order Lifecycle Management**: Visual order tracking with status progression (Placed → Shipped → Delivered), item-level return requests, and automated PDF invoice generation via **jsPDF**.

### 🛡️ Administrative Control Panel
- **Business Intelligence Dashboard**: Real-time visualizations of sales revenue, order volume, top-performing categories, and growth trends powered by **Recharts**.
- **Granular Inventory Control**: Unified management interface for products with complex variant matrices (sizes, colors, stock counts, and pricing per variant).
- **Promotion & Discount Engine**: Create and manage percentage/fixed-value offers at the product or category level, alongside expiration-based coupon codes with usage limits.
- **Order Operations Center**: Dedicated interfaces for managing the full order lifecycle, processing return/cancellation requests, and updating shipment statuses.
- **Customer Moderation**: User account management with block/unblock capabilities and activity oversight.
- **Sales Reporting Module**: Generate downloadable sales reports in **PDF** and **Excel (XLSX)** formats with custom date-range filters for accounting and compliance.

---

## 📁 Repository Structure
```
NEXTZEN/
├── client/                     # React Frontend (Vite)
│   ├── src/
│   │   ├── api/                # Axios interceptors & API service layer
│   │   ├── components/         # Reusable UI components (User & Admin)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/
│   │   │   ├── admin/          # Admin dashboard, products, orders, reports
│   │   │   └── user/           # Home, shop, cart, checkout, profile
│   │   ├── routes/             # Route guards (Auth, Protected, Admin)
│   │   ├── store/              # Redux Toolkit slices (auth, cart, etc.)
│   │   └── utils/              # Helper functions & formatters
│   ├── tailwind.config.js
│   └── vercel.json             # Vercel deployment configuration
│
├── server/                     # Node.js / Express Backend
│   ├── src/
│   │   ├── config/             # Database connection & Passport strategies
│   │   ├── middlewares/        # Auth, validation, logging middleware
│   │   ├── modules/
│   │   │   ├── admin/          # Admin business logic
│   │   │   │   ├── adminCore/            # Admin auth & session
│   │   │   │   ├── productManagement/    # Products & variants CRUD
│   │   │   │   ├── orderManagement/      # Order lifecycle operations
│   │   │   │   ├── couponManagement/     # Coupon CRUD & validation
│   │   │   │   ├── offerManagement/      # Offer engine logic
│   │   │   │   ├── brandManagement/      # Brand CRUD
│   │   │   │   ├── categorieManagement/  # Category CRUD
│   │   │   │   ├── userManagement/       # Customer moderation
│   │   │   │   └── dashboard/            # Analytics & sales reports
│   │   │   └── user/           # User business logic
│   │   │       ├── userCore/             # User auth & session
│   │   │       ├── cart/                 # Cart operations
│   │   │       ├── order/                # Order placement & tracking
│   │   │       ├── payment/              # Razorpay integration
│   │   │       ├── wallet/               # Wallet & referral system
│   │   │       ├── chatbot/              # AI Style Concierge service
│   │   │       ├── Wishlist/             # Wishlist management
│   │   │       ├── profile/              # Profile & password management
│   │   │       ├── address/              # Address book CRUD
│   │   │       ├── googleAuth/           # OAuth callback handlers
│   │   │       ├── productListing/       # Public product queries
│   │   │       ├── category/             # Public category listing
│   │   │       └── brand/                # Public brand listing
│   │   ├── utils/              # Error handlers, helpers, loggers
│   │   └── validators/         # Express-validator schemas
│   └── Dockerfile              # Production container configuration
│
└── .github/
    └── workflows/
        └── deploy.yml          # CI/CD: Build → Docker Hub → AWS EC2
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js** v18.0.0 or higher
- **MongoDB** Atlas Cluster or local instance
- **NPM** or **PNPM** package manager

### 1. Clone the Repository
```bash
git clone https://github.com/mubashirofcl/nextzen.git
cd nextzen
```

### 2. Install Dependencies
```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install
```

### 3. Configure Environment Variables

**Server** (`/server/.env`)
```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_string
FRONTEND_URL=http://localhost:5173

JWT_SECRET=your_jwt_signing_key
JWT_REFRESH_SECRET=your_refresh_token_key

GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_client_secret

GEMINI_API_KEY=your_google_gemini_api_key
GROQ_API_KEY=your_groq_api_key

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

**Client** (`/client/.env`)
```env
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 4. Run the Application
```bash
# Start the Backend (from /server) — runs on port 5000
npm run dev

# Start the Frontend (from /client) — runs on port 5173
npm run dev
```

### 5. Docker Deployment (Production)
```bash
# Build and run the backend container
cd server
docker build -t nextzen-server .
docker run -p 5000:5000 --env-file .env nextzen-server
```

---

<p align="center">
  <b>NEXTZEN</b> — Redefining Digital Commerce through AI and Automation.<br/>
  Developed by <a href="https://github.com/mubashirofcl">Mubashir Palapadiyan</a>
</p>
