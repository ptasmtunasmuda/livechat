# 💬 LiveChat Application

Real-time chat application built with Laravel backend and Vue.js frontend.

## ✨ Features

- 🔐 User authentication with Laravel Sanctum
- 💬 Real-time messaging
- 🏠 Multiple chat rooms
- 👥 User presence (online/offline status)
- 📎 File attachments support
- 🔍 Message search
- 📱 Responsive design
- 🎨 Modern UI with Tailwind CSS

## 🛠️ Tech Stack

### Backend
- **Laravel 12** - PHP framework
- **Laravel Sanctum** - API authentication
- **MySQL** - Database
- **Reverb** - WebSocket server (optional)

### Frontend
- **Vue.js 3** - JavaScript framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Pinia** - State management
- **Axios** - HTTP client

## 🚀 Installation

### Prerequisites
- PHP 8.2+
- Composer
- Node.js 18+
- MySQL
- Git

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/ptasmtunasmuda/livechat.git
   cd livechat
   ```

2. **Install PHP dependencies**
   ```bash
   composer install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

4. **Database configuration**
   
   Edit `.env` file:
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=livechat
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   ```

5. **Run migrations**
   ```bash
   php artisan migrate
   ```

6. **Create storage symlink**
   ```bash
   php artisan storage:link
   ```

### Frontend Setup

1. **Install Node.js dependencies**
   ```bash
   npm install
   ```

2. **Build assets for development**
   ```bash
   npm run dev
   ```

### Running the Application

1. **Start Laravel server**
   ```bash
   php artisan serve
   ```

2. **Start Vite dev server (in another terminal)**
   ```bash
   npm run dev
   ```

3. **Access the application**
   - Frontend: `http://localhost:5173` (or port shown by Vite)
   - Backend API: `http://localhost:8000`

## 📝 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user

### Chat Rooms
- `GET /api/rooms` - Get user's rooms
- `POST /api/rooms` - Create new room
- `POST /api/rooms/{room}/join` - Join room
- `POST /api/rooms/{room}/leave` - Leave room

### Messages
- `GET /api/rooms/{room}/messages` - Get room messages
- `POST /api/rooms/{room}/messages` - Send message
- `PUT /api/messages/{message}` - Edit message
- `DELETE /api/messages/{message}` - Delete message

## 🔧 Configuration

### Environment Variables

Key environment variables in `.env`:

```env
# App
APP_NAME=LiveChat
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173

# Database
DB_CONNECTION=mysql
DB_DATABASE=livechat

# Sanctum
SANCTUM_STATEFUL_DOMAINS=localhost,localhost:3000,localhost:5173,127.0.0.1,127.0.0.1:8000

# Broadcasting (optional)
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=your_app_id
REVERB_APP_KEY=your_app_key
REVERB_APP_SECRET=your_app_secret
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is open-sourced software licensed under the [MIT license](LICENSE).

## 🐛 Issues & Support

If you encounter any issues or need support, please [create an issue](https://github.com/ptasmtunasmuda/livechat/issues) on GitHub.

## 📚 Documentation

For more detailed documentation, please refer to:
- [Laravel Documentation](https://laravel.com/docs)
- [Vue.js Documentation](https://vuejs.org/guide/)
- [Laravel Sanctum Documentation](https://laravel.com/docs/sanctum)

---

Made with ❤️ by [prassaaa](https://github.com/ptasmtunasmuda)
