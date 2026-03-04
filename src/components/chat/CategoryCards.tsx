'use client'

import { motion } from 'framer-motion'

import { HoverEffect } from '@/components/ui/aceternity/card-hover-effect'
import type { CategoryOption } from '@/lib/types'

interface CategoryCardsProps {
  categories: CategoryOption[]
  onSelect: (categoryId: string) => void
  disabled: boolean
}

export function CategoryCards({ categories, onSelect, disabled }: CategoryCardsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
      className="px-5 py-2"
    >
      <div className="ml-[42px]">
        <HoverEffect
          items={categories.map(c => ({
            id: c.id,
            icon: c.icon,
            title: c.title,
            description: c.description,
            count: c.count,
          }))}
          onSelect={onSelect}
          disabled={disabled}
        />
      </div>
    </motion.div>
  )
}
