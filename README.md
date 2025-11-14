# POS Payment System

A complete Point of Sale payment processing system with Stripe integration. Built with React (frontend) and Node.js/Express (backend).

## Features

- 💳 Accept payments via Stripe Payment Intents
- 📧 Customer email and name collection
- 💰 Dynamic amount entry
- ✅ Form validation
- 🎨 Mobile-responsive UI with Tailwind CSS
- 🔒 Secure payment processing
- 🧪 Test mode ready (uses Stripe test keys)

## Project Structure

```
pos-payment-system/
├── backend/              # Node.js/Express server
│   ├── server.js        # Main server file
│   ├── package.json     # Backend dependencies
│   └── .env             # Environment variables (Stripe keys)
├── frontend/            # React application
│   ├── src/
│   │   ├── App.jsx      # Main payment form component
│   │   ├── main.jsx     # React entry point
│   │   └── index.css    # Tailwind styles
│   ├── index.html       # HTML template
│   ├── package.json     # Frontend dependencies
│   ├── vite.config.js   # Vite configuration
│   ├── tailwind.config.js
│   └── postcss.config.js
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Stripe account (test mode keys)

### Backend Setup

1. Navigate to the backend folder:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Stripe secret key:
   ```
   STRIPE_SECRET_KEY=sk_test_your_key_here
   PORT=3001
   ```

4. Start the backend server:
   ```bash
   npm start
   ```

   The server will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

   The app will open on `http://localhost:5173`

## Testing

Use Stripe's test card numbers:

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **Requires authentication**: 4000 0025 0000 3155

Use any future expiry date, any 3-digit CVC, and any ZIP code.

## Deployment

### Backend (Vercel/Heroku/Railway)

1. Deploy the `backend` folder to your hosting service
2. Set environment variables:
   - `STRIPE_SECRET_KEY`
   - `PORT` (optional, defaults to 3001)

### Frontend (Vercel/Netlify)

1. Deploy the `frontend` folder
2. Update `BACKEND_URL` in `src/App.jsx` with your deployed backend URL

## Security Notes

- ⚠️ **Never commit `.env` files to git**
- The `.gitignore` file is already configured to exclude sensitive files
- Always use environment variables for API keys in production
- Current keys are for **test mode only** - switch to live keys for production

## Future Enhancements

- [ ] Customer profiles and saved payment methods
- [ ] Admin dashboard for viewing payments
- [ ] Receipt generation and email notifications
- [ ] Multiple payment methods (Apple Pay, Google Pay, ACH)
- [ ] Mobile app (React Native)
- [ ] Payment history and reporting
- [ ] Refund processing
- [ ] Multi-currency support

## Tech Stack

**Frontend:**
- React 18
- Vite
- Tailwind CSS
- Stripe.js
- Lucide React (icons)

**Backend:**
- Node.js
- Express
- Stripe Node SDK
- CORS
- dotenv

## Support

For issues or questions:
- Stripe Documentation: https://stripe.com/docs
- React Documentation: https://react.dev
- Vite Documentation: https://vitejs.dev

## License

ISC
