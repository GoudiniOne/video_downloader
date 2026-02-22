import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Check } from 'lucide-react';

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
        className="fixed inset-0 z-50 flex items-center justify-center p-5"
        style={{ backgroundColor: 'rgba(6, 6, 14, 0.9)', backdropFilter: 'blur(16px)' }}
      >
        <div className="noise-overlay" />

        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="glass-card-elevated max-w-md w-full p-10 rounded-3xl relative"
        >
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center mb-6 accent-glow">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-xl font-bold text-white mb-3">Условия использования</h2>
            <p className="text-sm text-gray-500 font-light">
              Пожалуйста, ознакомьтесь перед использованием
            </p>
          </div>

          <div className="space-y-3.5 mb-10">
            {[
              'Скачивание вашего собственного контента',
              'Контент с открытой лицензией',
              'Контент, на скачивание которого у вас есть права',
            ].map((text, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-white/3 border border-white/5"
              >
                <div className="w-7 h-7 rounded-md accent-gradient flex items-center justify-center flex-shrink-0">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-sm text-gray-300 font-light">{text}</span>
              </motion.div>
            ))}
          </div>

          <p className="text-xs text-gray-600 text-center mb-8 font-light leading-relaxed">
            Вы несёте полную ответственность за соблюдение авторских прав и условий использования платформ.
          </p>

          <label className="flex items-center gap-3.5 mb-8 cursor-pointer group justify-center">
            <div className="relative">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="sr-only"
              />
              <div
                className={`w-6 h-6 rounded-md border transition-all duration-300 flex items-center justify-center ${
                  checked
                    ? 'accent-gradient border-transparent accent-glow'
                    : 'border-gray-600 group-hover:border-violet-400'
                }`}
              >
                {checked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  >
                    <Check className="w-3 h-3 text-white" />
                  </motion.div>
                )}
              </div>
            </div>
            <span className="text-sm text-gray-400 select-none group-hover:text-gray-300 transition-colors">
              Я принимаю условия использования
            </span>
          </label>

          <motion.button
            whileHover={{ scale: checked ? 1.02 : 1 }}
            whileTap={{ scale: checked ? 0.98 : 1 }}
            onClick={onAccept}
            disabled={!checked}
            className={`w-full py-[18px] rounded-xl font-semibold text-sm transition-all duration-500 ${
              checked
                ? 'accent-gradient text-white accent-glow-strong'
                : 'bg-white/5 text-gray-600 cursor-not-allowed'
            }`}
          >
            Продолжить
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
