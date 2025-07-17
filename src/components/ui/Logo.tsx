import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Compass } from 'lucide-react';

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <motion.div
        whileHover={{ rotate: 180 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-brand-500 to-blue-500 p-2 rounded-xl"
      >
        <Compass className="h-6 w-6 text-white" />
      </motion.div>
      <div className="flex items-baseline">
        <span className="text-2xl font-black bg-gradient-to-r from-brand-600 to-blue-600 bg-clip-text text-transparent">
          iPEC
        </span>
        <span className="text-lg font-medium ml-2 text-gray-700">
          Coach Connect
        </span>
      </div>
    </Link>
  );
}