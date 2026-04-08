// decide-web/src/components/ui/index.ts
// Single import point for all base UI components.
// Every file in the project imports from '@/components/ui'
// rather than from individual component files.

export { Button }   from './Button'
export { Badge }    from './Badge'
export { Card }     from './Card'
export { Input }    from './Input'
export { Slider }   from './Slider'
export { Modal }    from './Modal'
export { Tooltip }  from './Tooltip'
export {
  Skeleton,
  PhoneCardSkeleton,
  ResultCardSkeleton,
  CompareRowSkeleton,
  CompareTableSkeleton,
  PhoneGridSkeleton,
}                   from './Skeleton'
export { Spinner }  from './Spinner'
export { Divider }  from './Divider'