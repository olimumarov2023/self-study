import { useState, useRef, useEffect } from 'react';

import { Input } from '@/components/ui/input';

interface InlineInputProps {
  placeholder?: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  autoFocus?: boolean;
  className?: string;
}

export function InlineInput({
  placeholder = 'Type and press Enter...',
  onSubmit,
  onCancel,
  autoFocus = true,
  className,
}: InlineInputProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) {
      inputRef.current?.focus();
    }
  }, [autoFocus]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = value.trim();
      if (trimmed) {
        onSubmit(trimmed);
        setValue('');
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  }

  function handleBlur() {
    // Small delay so clicking the submit button still works
    setTimeout(() => {
      onCancel();
    }, 150);
  }

  return (
    <Input
      ref={inputRef}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
}
