# ConnectHub Backend

This repository contains the backend for **ConnectHub**, a full-stack chat application. The backend is built with **Node.js** and **MongoDB** to support secure user authentication, real-time messaging, and database storage for chat data.

## Features

- **User Authentication**: Secure login and registration using JWT.
- **Real-time Messaging**: Supports real-time, bidirectional communication using Socket.IO.
- **Database Storage**: MongoDB for storing user data, messages, and chat histories.
- **RESTful API**: Well-defined endpoints for frontend integration.
- **Scalable and Lightweight**: Built with Node.js and Express for efficiency.

## Tech Stack

- **Node.js**: JavaScript runtime for server-side development.
- **Express**: Web framework for handling routing and middleware.
- **MongoDB**: NoSQL database for data storage.
- **Socket.IO**: Real-time communication library.
- **JWT**: JSON Web Tokens for authentication.

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/connecthub-backend.git
   cd connecthub-backend

2. **Install dependencies**:
   ```bash
   npm install

3.**Set up environment variables**:
  Create a .env file in the root directory with the help of sampleEnv provided.  

4. **Run the application**:
   ```bash
   node app.js
   
## Usage

-**Start the Backend:** Ensure that the ConnectHub(This Repo) is running.<br />
-**Access the Frontend:** Open your browser at http://localhost:5173 to use the chat application.
