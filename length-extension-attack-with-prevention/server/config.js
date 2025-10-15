import "dotenv/config";

const SECRET_KEY = process.env.SECRET_KEY || 'your-super-secret-key';

export {
  SECRET_KEY,
};