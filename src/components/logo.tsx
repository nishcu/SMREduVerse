'use client';

import { GraduationCap } from 'lucide-react';
import type { SVGProps } from 'react';
import { motion } from 'framer-motion';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <div className="flex items-center gap-2" {...props}>
        <motion.div
          animate={{
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <GraduationCap className="h-6 w-6 text-primary" />
        </motion.div>
        <h1 className="text-lg font-headline font-semibold text-primary">GenZeerr</h1>
    </div>
  );
}
