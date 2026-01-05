import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield } from 'lucide-react';

interface DisclaimerModalProps {
  onAccept: () => void;
}

export function DisclaimerModal({ onAccept }: DisclaimerModalProps) {
  const [checked, setChecked] = useState(false);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(8px)' }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="glass-card max-w-lg w-full p-8 rounded-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 rounded-xl bg-amber-500/20">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Важное уведомление</h2>
          </div>

          <div className="space-y-4 mb-8 text-gray-300">
            <p>Данный сервис предназначен исключительно для скачивания:</p>
            <ul className="space-y-2 ml-4">
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Вашего собственного контента</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Контента с открытой лицензией</span>
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span>Контента, на скачивание которого у вас есть права</span>
              </li>
            </ul>
            <p className="text-sm text-gray-400 mt-4">
              Вы несёте полную ответственность за соблюдение авторских прав и условий использования платформ.
            </p>
          </div>

          <label className="flex items-center gap-3 mb-6 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-6 h-6 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                  checked
                    ? 'bg-cyan-500 border-cyan-500'
                    : 'border-gray-500 group-hover:border-cyan-400'
                }`}
              >
                {checked && (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-4 h-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </motion.svg>
                )}
              </div>
            </div>
            <span className="text-gray-300 select-none">Я понимаю и принимаю условия использования</span>
          </label>

          <motion.button
            whileHover={{ scale: checked ? 1.02 : 1 }}
            whileTap={{ scale: checked ? 0.98 : 1 }}
            onClick={onAccept}
            disabled={!checked}
            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
              checked
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Принять и продолжить
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


