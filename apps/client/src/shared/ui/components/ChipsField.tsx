'use client';

import { Button } from '@repo/ui/components/button';
import React from 'react';
import { BrandChip } from './form/BrandChip';
import { Field } from './form/Field';
import { FIELD_CONTROL } from './form/fieldClasses';

interface ChipsFieldProps {
  id: string;
  label: string;
  /** Helper text below the field, when it needs explaining. */
  help?: React.ReactNode;
  values: string[];
  onChange: (values: string[]) => void;
  /** Name of the add button: two chip fields in the same form cannot both
   *  share a bare "Agregar". */
  addLabel: string;
  placeholder?: string;
  className?: string;
}

/**
 * Editable list of short texts as chips, with the add row below
 * (`.add-inline-row` in the prototype). Used by the Unit modal's Positions and
 * Entra Aliases.
 */
export function ChipsField({
  id,
  label,
  help,
  values,
  onChange,
  addLabel,
  placeholder,
  className,
}: ChipsFieldProps): React.JSX.Element {
  const [input, setInput] = React.useState('');

  function add(): void {
    const value = input.trim();
    if (value && !values.includes(value)) {
      onChange([...values, value]);
    }
    setInput('');
  }

  return (
    <Field help={help} className={className} htmlFor={id} label={label}>
      {values.length > 0 ? (
        <div className="mb-1 flex flex-wrap">
          {values.map((value) => (
            <BrandChip
              key={value}
              label={value}
              onRemove={() =>
                onChange(values.filter((actual) => actual !== value))
              }
            />
          ))}
        </div>
      ) : (
        <p className="mb-2 text-[12px] text-gray-400">
          Aún no hay nada agregado
        </p>
      )}

      <div className="flex gap-2">
        <input
          className={FIELD_CONTROL}
          id={id}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          value={input}
        />
        <Button
          aria-label={addLabel}
          onClick={add}
          size="sm"
          type="button"
          variant="outline"
        >
          Agregar
        </Button>
      </div>
    </Field>
  );
}
